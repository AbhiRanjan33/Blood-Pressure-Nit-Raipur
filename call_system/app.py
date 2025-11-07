# app.py
from flask import Flask, request, jsonify
from twilio.rest import Client
import os
from dotenv import load_dotenv
import concurrent.futures
import croniter
import threading
import time
from datetime import datetime

load_dotenv()

app = Flask(__name__)

client = Client(os.getenv("TWILIO_SID"), os.getenv("TWILIO_TOKEN"))
TWILIO_PHONE = os.getenv("TWILIO_PHONE")

# Store active reminders
reminders = {}

def make_call(to_number, message):
    try:
        call = client.calls.create(
            twiml=f'<Response><Say voice="alice" language="hi-IN">{message}</Say></Response>',
            to=to_number,
            from_=TWILIO_PHONE
        )
        print(f"Call to {to_number}: {call.sid}")
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

    message = f"EMERGENCY! {patient_name} needs urgent help! BP: {bp}. Please rush!"

    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = [executor.submit(make_call, num, message) for num in numbers]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]

    return jsonify({"success": True, "results": results})

@app.route("/set-reminder", methods=["POST"])
def set_reminder():
    data = request.json
    clerkId = data.get("clerkId")
    phone = data.get("phone")
    enabled = data.get("enabled", False)

    if not clerkId or not phone:
        return jsonify({"error": "Invalid data"}), 400

    if enabled:
        reminders[clerkId] = phone
    else:
        reminders.pop(clerkId, None)

    return jsonify({"success": True})

# Background scheduler
def start_scheduler():
    while True:
        now = datetime.now()
        # 8:00 AM and 8:00 PM IST
        for hour in [1, 20]:
            schedule = f"0 {hour} * * *"
            cron = croniter.croniter(schedule, now)
            next_run = cron.get_next(datetime)

            if now.hour == next_run.hour and now.minute == next_run.minute:
                message = "नमस्ते! कृपया अपना ब्लड प्रेशर अभी चेक करें। स्वस्थ रहें!"
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    futures = [executor.submit(make_call, phone, message) for phone in reminders.values()]
                    [f.result() for f in futures]
                time.sleep(60)  # Avoid double call
        time.sleep(30)

# Start scheduler in background
threading.Thread(target=start_scheduler, daemon=True).start()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)