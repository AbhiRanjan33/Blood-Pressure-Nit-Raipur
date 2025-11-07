# import os
# from twilio.rest import Client
# from dotenv import load_dotenv

# load_dotenv()

# # Twilio credentials
# ACCOUNT_SID = os.getenv("TWILIO_SID")
# AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
# TWILIO_PHONE = os.getenv("TWILIO_PHONE")

# client = Client(ACCOUNT_SID, AUTH_TOKEN)

# # ====== Send SMS Reminder ======
# def send_sms(to_number, message):
#     client.messages.create(
#         body=message,
#         from_=TWILIO_PHONE,
#         to=to_number
#     )
#     print(f"✅ SMS sent to {to_number}: {message}")

# # ====== Make Call Reminder ======
# def make_call(to_number, message):
#     call = client.calls.create(
#         twiml=f'<Response><Say>{message}</Say></Response>',
#         to=to_number,
#         from_=TWILIO_PHONE
#     )
#     print(f"📞 Call initiated to {to_number}: {message}")

# # ====== Run Reminder Immediately ======
# def schedule_reminder():
#     phone = "+918287305782"  # recipient phone number
#     message = "Hello! This is your reminder to check your BP and update your vitals."
#     make_call(phone, message)

# # 🔥 Run instantly
# schedule_reminder()


# call_system/app.py
from flask import Flask, request, jsonify
from twilio.rest import Client
import os
from dotenv import load_dotenv
import concurrent.futures

load_dotenv()

app = Flask(__name__)

client = Client(os.getenv("TWILIO_SID"), os.getenv("TWILIO_TOKEN"))
TWILIO_PHONE = os.getenv("TWILIO_PHONE")

def make_call(to_number, message):
    try:
        call = client.calls.create(
            twiml=f'<Response><Say voice="alice" language="hi-IN">{message}</Say></Response>',
            to=to_number,
            from_=TWILIO_PHONE
        )
        print(f"Call initiated to {to_number}: {call.sid}")
        return {"success": True, "sid": call.sid}
    except Exception as e:
        print(f"Call failed: {e}")
        return {"success": False, "error": str(e)}

@app.route("/sos", methods=["POST"])
def sos():
    data = request.json
    numbers = data.get("numbers", [])
    patient_name = data.get("name", "Patient")
    bp = data.get("bp", "Unknown")

    if not numbers:
        return jsonify({"error": "No numbers"}), 400

    message = f"EMERGENCY! {patient_name} needs urgent help! Blood pressure is {bp}. Location: Check app. Please rush!"

    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = [executor.submit(make_call, num, message) for num in numbers]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]

    return jsonify({"success": True, "results": results})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
