# import os
# import google.generativeai as genai
# from flask import Flask, request, jsonify, send_from_directory
# from dotenv import load_dotenv

# # --- Configuration ---
# load_dotenv()
# app = Flask(__name__)

# api_key = os.getenv("GEMINI_API_KEY")
# if not api_key:
#     raise ValueError("GEMINI_API_KEY not found in .env file. Please add it.")

# genai.configure(api_key=api_key)

# # --- Load Rules File ---
# try:
#     with open("bp-rules.txt", "r") as f:
#         RULES_DOCUMENT = f.read()
# except FileNotFoundError:
#     raise FileNotFoundError("bp-rules.txt not found in the directory. Please add it.")


# # --- Model 1: Medication Classifier ---
# classification_model = genai.GenerativeModel(
#     'gemini-2.5-flash-preview-09-2025',
#     system_instruction="""
# You are a medical text classifier. Your job is to read a text input and identify which of the following categories are mentioned:
# - CCB (Calcium Channel Blockers, e.g., Amlodipine, Nifedipine, Benidipine, Cilnidipine)
# - RASI (RAS Inhibitors, e.g., Telmisartan, Ramipril, Losartan, Olmesartan, Enalapril)
# - Diuretics (e.g., Hydrochlorothiazide, Chlorthalidone, Torsemide, Furosemide)
# - BB (Beta-Blockers, e.g., Metoprolol, Atenolol, Bisoprolol, Nebivolol, Carvedilol)
# - MRA (Mineralocorticoid receptor antagonists, e.g., Spironolactone, Eplerenone)
# - AB (Alpha-Blockers, e.g., Prazosin)
# - CA (Central Agonists, e.g., Clonidine, Methyldopa)
# Respond ONLY with a comma-separated list of the matching category abbreviations.
# Example input: "Patient is on metoprolol and ramipril"
# Example output: "BB,RASI"
# Example input: "amlodipine"
# Example output: "CCB"
# If no categories match, return an empty string.
# """
# )


# # --- Model 2: Treatment Recommender ---
# recommendation_model = genai.GenerativeModel(
#     'gemini-2.5-flash-preview-09-2025',
#     system_instruction="""
# You are an expert clinical support system. Your ONLY task is to analyze a patient's situation
# and find the single best matching rule from the "Hypertension Treatment Rules" document provided.

# Follow these strict rules:
# 1. If "Patient has CKD: Yes", use the rules from "Part 2: CKD Patient Hypertension Treatment Rules".
# 2. If "Patient has CKD: No", use the rules from "Part 1: General Hypertension Treatment Rules (Riders)".
# 3. If "Current Medications: None", treat as "New Patient" and use rules with "Patient Status: New".
# 4. Otherwise, treat as "Existing Patient" and match using listed medications.
# 5. Respond ONLY with:
#    THEN (Action): <Action text>
#    RECOMMENDATION (Output): <Recommendation text>
# 6. If no rule matches, respond exactly with: N/A
# 7. Never add any other explanation or text besides the rule or N/A.
# """
# )


# # --- Helper Functions ---

# def get_htn_grade(systolic, diastolic):
#     """Determine HTN grade from BP readings."""
#     if systolic >= 180 or diastolic >= 110:
#         return "Gr III"
#     if (160 <= systolic <= 179) or (100 <= diastolic <= 109):
#         return "Gr II"
#     if (140 <= systolic <= 159) or (90 <= diastolic <= 99):
#         return "Gr I"
#     return "Below Grade I (Normal/Elevated/Stage 1)"


# def classify_medications(med_text):
#     """Classify medication free text."""
#     if not med_text or not med_text.strip():
#         return []

#     normalized = med_text.strip().lower()
#     # ✅ handle 'none' variants directly
#     if normalized in ["none", "no", "nil", "nothing", "na", "n/a", "none given", "none currently", "no meds"]:
#         return []

#     try:
#         response = classification_model.generate_content(med_text)
#         if not response or not hasattr(response, "text"):
#             return []
#         api_response = response.text.strip()
#         if not api_response:
#             return []
#         return [s.strip().upper() for s in api_response.split(',') if s.strip()]
#     except Exception as e:
#         print(f"Error in medication classification: {e}")
#         return []  # Treat as no meds if model fails


# def get_recommendation(inputs, htn_grade, classified_meds):
#     """Ask Gemini for recommendation based on patient details."""
#     medication_list = ', '.join(classified_meds) if classified_meds else 'None'
#     patient_status = "Existing Patient" if classified_meds else "New Patient"

#     user_query = f"""
# Patient Details:
# - Patient Age: {inputs.get('age')}
# - Blood Pressure: {inputs.get('systolic')}/{inputs.get('diastolic')} mmHg
# - Calculated HTN Grade: {htn_grade}
# - Patient has CKD: {'Yes' if inputs.get('hasCKD') else 'No'}
# - Patient Status: {patient_status}
# - Current Medications: {medication_list}

# RULES DOCUMENT:
# ---
# {RULES_DOCUMENT}
# ---
# """
#     try:
#         response = recommendation_model.generate_content(user_query)
#         result = response.text.strip() if response and response.text else "N/A"
#         return result if result else "N/A"
#     except Exception as e:
#         print(f"Error in recommendation generation: {e}")
#         raise RuntimeError(f"Failed to get recommendation: {e}")


# # --- Flask Routes ---

# @app.route("/")
# def serve_index():
#     return send_from_directory('.', 'index.html')


# @app.route("/get-recommendation", methods=["POST"])
# def handle_recommendation():
#     try:
#         inputs = request.json
#         if not all(k in inputs for k in ['age', 'systolic', 'diastolic']):
#             return jsonify({"error": "Missing required fields (age, systolic, diastolic)."}), 400

#         htn_grade = get_htn_grade(inputs['systolic'], inputs['diastolic'])
#         classified_meds = classify_medications(inputs.get('medicationsText', ''))
#         recommendation = get_recommendation(inputs, htn_grade, classified_meds)
#         return jsonify({"recommendation": recommendation})

#     except RuntimeError as e:
#         return jsonify({"error": str(e)}), 500
#     except Exception as e:
#         return jsonify({"error": f"Unexpected server error: {e}"}), 500


# if __name__ == "__main__":
#     app.run(debug=True, port=5000)


import os
import google.generativeai as genai
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv

# --- Configuration ---
load_dotenv()
app = Flask(__name__)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("❌ GEMINI_API_KEY not found in .env file. Please add it.")

genai.configure(api_key=api_key)

# --- Load Rules File ---
try:
    with open("bp-rules.txt", "r", encoding="utf-8") as f:
        RULES_DOCUMENT = f.read()
except FileNotFoundError:
    raise FileNotFoundError("❌ bp-rules.txt not found in directory. Please add it.")


# --- Model 1: Medication Classifier ---
classification_model = genai.GenerativeModel(
    "gemini-2.5-flash-preview-09-2025",
    system_instruction="""
You are a medical text classifier. Your job is to read a text input and identify which of the following categories are mentioned:
- CCB (Calcium Channel Blockers, e.g., Amlodipine, Nifedipine, Benidipine, Cilnidipine)
- RASI (RAS Inhibitors, e.g., Telmisartan, Ramipril, Losartan, Olmesartan, Enalapril)
- Diuretics (e.g., Hydrochlorothiazide, Chlorthalidone, Torsemide, Furosemide)
- BB (Beta-Blockers, e.g., Metoprolol, Atenolol, Bisoprolol, Nebivolol, Carvedilol)
- MRA (Mineralocorticoid receptor antagonists, e.g., Spironolactone, Eplerenone)
- AB (Alpha-Blockers, e.g., Prazosin)
- CA (Central Agonists, e.g., Clonidine, Methyldopa)
Respond ONLY with a comma-separated list of the matching category abbreviations.
Example input: "Patient is on metoprolol and ramipril"
Example output: "BB,RASI"
Example input: "amlodipine"
Example output: "CCB"
If no categories match, return an empty string.
"""
)

# --- Model 2: Treatment Recommender ---
recommendation_model = genai.GenerativeModel(
    "gemini-2.5-flash-preview-09-2025",
    system_instruction="""
You are an expert clinical support system. Your ONLY task is to analyze a patient's situation
and find the single best matching rule from the "Hypertension Treatment Rules" document provided.

Follow these strict rules:
1. If "Patient has CKD: Yes", use the rules from "Part 2: CKD Patient Hypertension Treatment Rules".
2. If "Patient has CKD: No", use the rules from "Part 1: General Hypertension Treatment Rules (Riders)".
3. If "Current Medications: None", treat as "New Patient" and use rules with "Patient Status: New".
4. Otherwise, treat as "Existing Patient" and match using listed medications.
5. Respond ONLY with:
   THEN (Action): <Action text>
   RECOMMENDATION (Output): <Recommendation text>
6. If no rule matches, respond exactly with: N/A
7. Never add any other explanation or text besides the rule or N/A.
"""
)


# --- Helper Functions ---
def get_htn_grade(systolic, diastolic):
    """Determine HTN grade from BP readings."""
    if systolic >= 180 or diastolic >= 110:
        return "Gr III"
    if (160 <= systolic <= 179) or (100 <= diastolic <= 109):
        return "Gr II"
    if (140 <= systolic <= 159) or (90 <= diastolic <= 99):
        return "Gr I"
    return "Below Grade I (Normal/Elevated/Stage 1)"


def classify_medications(med_text):
    """Classify medication free text."""
    if not med_text or not med_text.strip():
        return []

    normalized = med_text.strip().lower()
    if normalized in ["none", "no", "nil", "nothing", "na", "n/a", "none given", "none currently", "no meds"]:
        return []

    try:
        response = classification_model.generate_content(med_text)
        if not response or not hasattr(response, "text"):
            return []
        api_response = response.text.strip()
        if not api_response:
            return []
        return [s.strip().upper() for s in api_response.split(",") if s.strip()]
    except Exception as e:
        print(f"⚠️ Error in medication classification: {e}")
        return []


def get_recommendation(inputs, htn_grade, classified_meds):
    """Ask Gemini for recommendation based on patient details."""
    medication_list = ", ".join(classified_meds) if classified_meds else "None"
    patient_status = "Existing Patient" if classified_meds else "New Patient"

    user_query = f"""
Patient Details:
- Patient Age: {inputs.get('age')}
- Blood Pressure: {inputs.get('systolic')}/{inputs.get('diastolic')} mmHg
- Calculated HTN Grade: {htn_grade}
- Patient has CKD: {'Yes' if inputs.get('hasCKD') else 'No'}
- Patient Status: {patient_status}
- Current Medications: {medication_list}

RULES DOCUMENT:
---
{RULES_DOCUMENT}
---
"""
    try:
        response = recommendation_model.generate_content(user_query)
        result = response.text.strip() if response and response.text else "N/A"
        return result if result else "N/A"
    except Exception as e:
        print(f"⚠️ Error in recommendation generation: {e}")
        raise RuntimeError(f"Failed to get recommendation: {e}")


# --- Flask Routes ---
@app.route("/")
def serve_index():
    return send_from_directory(".", "index.html")


@app.route("/get-recommendation", methods=["POST"])
def handle_recommendation():
    try:
        inputs = request.json
        if not all(k in inputs for k in ["age", "systolic", "diastolic"]):
            return jsonify({"error": "Missing required fields (age, systolic, diastolic)."}), 400

        htn_grade = get_htn_grade(inputs["systolic"], inputs["diastolic"])
        classified_meds = classify_medications(inputs.get("medicationsText", ""))
        recommendation = get_recommendation(inputs, htn_grade, classified_meds)
        return jsonify({
            "htn_grade": htn_grade,
            "classified_medications": classified_meds,
            "recommendation": recommendation
        })

    except RuntimeError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected server error: {e}"}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
