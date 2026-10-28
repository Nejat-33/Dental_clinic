from ai_service import classify_message

messages = [
    "Can someone check my tooth tomorrow?",
    "What treatments do you provide?",
    "When do you open?",
    "Where is your clinic?",
    "Selam, hello!",
]

for message in messages:
    result = classify_message(message)
    print(f"Message: {message}")
    print(f"AI intent: {result['intent']}")
    print()