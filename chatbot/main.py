
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo
from uuid import uuid4
import re
import json
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from fastapi.middleware.cors import CORSMiddleware
from ai_service import classify_message
import asyncio
from ai_service import classify_message, generate_answer


TZ = ZoneInfo("Africa/Addis_Ababa")


class Settings(BaseSettings):
    express_api_url: str = "http://127.0.0.1:4000/api"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
app = FastAPI(title="Dental Clinic Chatbot API", version="0.4.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary development storage. Use Redis or a database for production.
sessions: dict[str, dict] = {}


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    channel: str = "website"
    session_id: str | None = None


class ChatResponse(BaseModel):
    reply: str
    channel: str
    session_id: str


async def api_get(path: str, params: dict | None = None):
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            f"{settings.express_api_url.rstrip('/')}/{path.lstrip('/')}",
            params=params,
        )
        response.raise_for_status()
        return response.json()


async def api_post(path: str, payload: dict):
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            f"{settings.express_api_url.rstrip('/')}/{path.lstrip('/')}",
            json=payload,
        )
        response.raise_for_status()
        return response.json()


def unwrap_services(data) -> list[dict]:
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        if isinstance(data.get("services"), list):
            return data["services"]
        if isinstance(data.get("data"), list):
            return data["data"]
        if isinstance(data.get("data"), dict):
            return data["data"].get("services", [])
    return []


def local_time(slot: dict) -> datetime:
    value = slot["time"].replace("Z", "+00:00")
    return datetime.fromisoformat(value).astimezone(TZ)


def show_time(slot: dict) -> str:
    return local_time(slot).strftime("%I:%M %p").lstrip("0")


def parse_date(message: str) -> date | None:
    text = message.casefold().strip()
    today = datetime.now(TZ).date()

    if text == "today":
        return today
    if text == "tomorrow":
        return today + timedelta(days=1)

    match = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", text)
    if match:
        try
            return date.fromisoformat(match.group(1))
        except ValueError:
            return None

    return None


def match_service(message: str, services: list[dict]):
    text = message.casefold().strip()

    # Allow selecting a numbered service.
    if text.isdigit():
        index = int(text) - 1
        if 0 <= index < len(services):
            return services[index]

    for service in services:
        name = service.get("name", "")
        if name and name.casefold() in text:
            return service

    return None


def match_slot(message: str, slots: list[dict]):
    text = message.casefold().strip()
    text = re.sub(r"\s+", " ", text)

    # Match the exact time format shown by the chatbot, e.g. 8:00 AM.
    for slot in slots:
        displayed = show_time(slot).casefold()
        if text == displayed:
            return slot

    # Also accept 24-hour input such as 08:00 or 14:30.
    match = re.fullmatch(r"(\d{1,2}):(\d{2})", text)
    if match:
        hour, minute = map(int, match.groups())
        for slot in slots:
            local = local_time(slot)
            if local.hour == hour and local.minute == minute:
                return slot

    return None


def start_booking(session: dict) -> str:
    session.clear()
    session["step"] = "service"
    return "I'd be happy to help you book an appointment. Let me load our services."


async def booking_reply(message: str, session: dict) -> str:
    text = message.strip()
    step = session.get("step")

    if text.casefold() in {"cancel", "cancel booking", "start over", "restart"}:
        session.clear()
        return "Your booking conversation has been cancelled. Say 'book appointment' to start again."

    if step == "service":
        services = await api_get("/services")
        services = unwrap_services(services)

        if not services:
            return "I couldn't find the clinic's services right now. Please try again later."

        selected = match_service(text, services)
        if selected:
            session["service"] = selected
            session["step"] = "date"
            return (
                f"You selected {selected['name']}. "
                "What date would you prefer? Enter YYYY-MM-DD, or say 'tomorrow'."
            )

        lines = ["Please choose a service by its number or name:"]
        for i, service in enumerate(services, 1):
            lines.append(f"{i}. {service['name']} — {service.get('shortDescription', '')}")
        return "\n".join(lines)

    if step == "date":
        chosen_date = parse_date(text)
        if not chosen_date:
            return "Please enter a date as YYYY-MM-DD, or say 'today' or 'tomorrow'."

        try:
            result = await api_get(
                "/appointments/availability",
                {"date": chosen_date.isoformat()},
            )
        except (httpx.HTTPError, ValueError):
            return "I couldn't check availability right now. Please try again shortly."

        available = [s for s in result.get("slots", []) if s.get("available")]

        if not available:
            return (
                f"I couldn't find available appointments for {chosen_date.isoformat()}. "
                "Please enter another date."
            )

        session["date"] = chosen_date.isoformat()
        session["slots"] = available
        session["step"] = "time"

        lines = [f"Available times for {chosen_date.isoformat()} (Ethiopia time):"]
        for slot in available:
            lines.append(f"- {show_time(slot)}")
        lines.append("Which time would you like? Enter one of the times shown.")
        return "\n".join(lines)

    if step == "time":
        slot = match_slot(text, session.get("slots", []))
        if not slot:
            return "Please choose one of the available times listed above, such as 8:00 AM."

        session["appointmentDate"] = local_time(slot).isoformat()
        session["step"] = "name"
        return "What is the patient's full name?"

    if step == "name":
        if len(text) < 2 or len(text) > 100:
            return "Please enter a name between 2 and 100 characters."

        session["patientName"] = text
        session["step"] = "phone"
        return "What phone number can the clinic use to contact you?"

    if step == "phone":
        session["phone"] = text
        service = session["service"]
        session["step"] = "confirm"

        return (
            "Please review your appointment request:\n"
            f"- Service: {service['name']}\n"
            f"- Date: {session['date']}\n"
            f"- Time: {datetime.fromisoformat(session['appointmentDate']).strftime('%I:%M %p').lstrip('0')} Ethiopia time\n"
            f"- Patient: {session['patientName']}\n"
            f"- Phone: {session['phone']}\n\n"
            "Should I submit this booking? Reply yes or no."
        )

    if step == "confirm":
        if text.casefold() in {"no", "n", "not now"}:
            session.clear()
            return "No appointment has been submitted. Say 'book appointment' if you'd like to start again."

        if text.casefold() not in {"yes", "y", "confirm", "confirm booking"}:
            return "Please reply 'yes' to submit the booking or 'no' to cancel."

        service = session["service"]
        payload = {
            "patientName": session["patientName"],
            "phone": session["phone"],
            "serviceId": service["id"],
            "appointmentDate": session["appointmentDate"],
        }

        try:
            result = await api_post("/appointments", payload)
        except httpx.HTTPStatusError as exc:
            # The Express backend remains the source of truth for validation.
            try:
                detail = exc.response.json().get("message") or exc.response.json().get("detail")
            except ValueError:
                detail = None

            return (
                f"The clinic could not confirm this booking: {detail or 'the requested slot may no longer be available'}. "
                "Please say 'book appointment' to try again."
            )
        except (httpx.HTTPError, ValueError):
            return "I couldn't reach the booking system. No confirmation was received; please try again."

        appointment_id = result.get("id", "")
        status = result.get("status", "submitted")
        appointment_time = result.get("appointmentDate", session["appointmentDate"])

        session.clear()
        return (
            "Your appointment request was submitted successfully!\n"
            f"- Service: {result.get('service', {}).get('name', service['name'])}\n"
            f"- Date and time: {appointment_time}\n"
            f"- Status: {status}\n"
            f"- Reference: {appointment_id}\n\n"
            "Please keep your reference for follow-up."
        )

    return start_booking(session)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "dental-chatbot"}


@app.get("/services")
async def services():
    try:
        return {"services": unwrap_services(await api_get("/services"))}
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="Could not retrieve clinic services.") from exc


@app.get("/availability")
async def availability(clinic_date: date = Query(alias="date")):
    try:
        return await api_get(
            "/appointments/availability",
            {"date": clinic_date.isoformat()},
        )
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(status_code=502, detail="Could not retrieve appointment availability.") from exc


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    session_id = request.session_id or str(uuid4())
    session = sessions.setdefault(session_id, {})
    message = request.message.strip()
    text = message.casefold()

    try:
        try:
            result = await asyncio.to_thread(
                classify_message, message
            )
            intent = result["intent"]
        except Exception as exc:
            print(f"Gemini classification failed: {exc}")
            intent = None

        # These questions should not interrupt an active booking.
        if intent == "greeting" or (
            intent is None
            and any(word in text for word in ("hello", "hi", "hey", "selam"))
        ):
            reply = (
                "Hello! Welcome to our dental clinic. "
                "I can explain our services or help you book an appointment."
            )

        elif intent == "ask_hours":
            reply = (
                "Our clinic hours are Monday–Friday, 8:00 AM–5:00 PM, "
                "and Saturday, 8:00 AM–1:00 PM. We are closed on Sunday."
            )

        elif intent == "ask_location":
            reply = "Please contact the clinic for its exact location."

        elif intent == "ask_prices" or (
            intent is None
            and any(word in text for word in ("price", "cost", "fee"))
        ):
            reply = (
                "Please contact the clinic to confirm current prices "
                "for your treatment."
            )

        elif intent == "ask_services" or (
            intent is None
            and any(
                word in text
                for word in ("services", "treatments", "what do you offer")
            )
        ):
            data = unwrap_services(await api_get("/services"))
            reply = (
                "\n".join(
                    ["Here are our dental services:"]
                    + [
                        f"- {s['name']}: {s.get('shortDescription', '')}"
                        for s in data
                    ]
                )
                if data
                else "I couldn't retrieve the clinic's services right now."
            )

        # Continue collecting booking details after answering side questions.
        elif session.get("step"):
            reply = await booking_reply(message, session)

        elif intent == "book_appointment" or (
            intent is None
            and any(
                word in text
                for word in ("book", "appointment", "booking", "see a dentist")
            )
        ):
            session["step"] = "service"
            reply = await booking_reply("", session)

        
        
        
        elif intent == "general_question":
             knowledge_path = Path(__file__).with_name("clinic_knowledge.json")

             with knowledge_path.open("r", encoding="utf-8") as file:
                  clinic_knowledge = json.load(file)

             services = unwrap_services(await api_get("/services"))

             clinic_knowledge["services"] = [
                  {
                   "name": service["name"],
                   "description": service.get(
                   "shortDescription",
                   "Description unavailable"
                      ),
                   "duration_minutes": service.get("duration")
                  }
                  for service in services
             ]

             clinic_context = json.dumps(
                 clinic_knowledge,
                 ensure_ascii=False,
                 indent=2
             )

             reply = await asyncio.to_thread(
                 generate_answer,
                 message,
                 clinic_context
            )


    except (httpx.HTTPError, ValueError) as exc:
        print(f"Chat request failed: {exc}")
        reply = (
            "I'm having trouble reaching the clinic system right now. "
            "Please try again shortly."
        )

    return ChatResponse(
        reply=reply,
        channel=request.channel,
        session_id=session_id,
    )
