
from ai_service import generate_answer

clinic_context = """
Opening hours:
Monday-Friday: 8:00 AM to 5:00 PM.
Saturday: 8:00 AM to 1:00 PM.
Sunday: Closed.

Services:
- Dental Crowns: Restorative treatment for damaged or weakened teeth.
- Dental Filling: Treatment for cavities and tooth decay.
- General Dentistry: Comprehensive dental care.
- Root Canal Treatment: Treatment for infected or damaged teeth.
- Teeth Cleaning: Professional dental cleaning.
- Teeth Whitening: Professional cosmetic whitening.

Prices: Not provided.
Exact clinic address: Not provided.
Live appointment availability: Must be checked through the clinic API.
"""

questions = [
    "What is a dental filling?",
    "My tooth hurts. What should I do?",
    "How much does teeth whitening cost?",
]

for question in questions:
    print(f"\nPatient: {question}")

    try:
        print("Bot:", generate_answer(question, clinic_context))
    except Exception as exc:
        print("AI request failed:", exc)
