import os

from dotenv import load_dotenv
from google import genai

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
model = os.getenv("GEMINI_MODEL", "gemini-flash-latest")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is missing from .env")

client = genai.Client(api_key=api_key)

response = client.models.generate_content(
    model=model,
    contents=(
        "You are testing a dental clinic chatbot. "
        "In one sentence, explain what a dental filling is."
    ),
)

print("Gemini response:")
print(response.text)

client.close()