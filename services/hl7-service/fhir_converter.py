from fhir.resources.patient import Patient
from fhir.resources.observation import Observation
from fhir.resources.bundle import Bundle, BundleEntry
from fhir.resources.humanname import HumanName
from fhir.resources.identifier import Identifier
from fhir.resources.codeableconcept import CodeableConcept
from fhir.resources.coding import Coding
from fhir.resources.quantity import Quantity
from fhir.resources.reference import Reference
import json

def hl7_to_fhir_patient(patient_data: dict) -> dict:
    raw_id = patient_data.get("id", "").split("^")[0]
    raw_name = patient_data.get("name", "").split("^")
    family = raw_name[0] if len(raw_name) > 0 else "Unknown"
    given = raw_name[1] if len(raw_name) > 1 else ""
    gender_map = {"M": "male", "F": "female", "U": "unknown"}
    gender = gender_map.get(patient_data.get("gender", "U"), "unknown")
    dob = patient_data.get("dob", "")
    if len(dob) == 8:
        dob = f"{dob[:4]}-{dob[4:6]}-{dob[6:8]}"

    patient = {
        "resourceType": "Patient",
        "id": raw_id,
        "identifier": [{"system": "urn:hospital:patients", "value": raw_id}],
        "name": [{"family": family, "given": [given]}],
        "gender": gender,
        "birthDate": dob
    }
    return patient

def hl7_to_fhir_observations(observations: list, patient_id: str) -> list:
    fhir_observations = []
    for i, obs in enumerate(observations):
        code_parts = obs.get("code", "").split("^")
        code = code_parts[0]
        display = code_parts[1] if len(code_parts) > 1 else code
        try:
            value = float(obs.get("value", 0))
        except ValueError:
            value = 0.0

        fhir_obs = {
            "resourceType": "Observation",
            "id": f"obs-{patient_id}-{i}",
            "status": "final",
            "code": {
                "coding": [{"system": "http://loinc.org", "code": code, "display": display}],
                "text": display
            },
            "subject": {"reference": f"Patient/{patient_id}"},
            "valueQuantity": {
                "value": value,
                "unit": obs.get("units", ""),
                "system": "http://unitsofmeasure.org"
            },
            "interpretation": [{"coding": [{"code": obs.get("abnormal_flag", "N")}]}]
        }
        fhir_observations.append(fhir_obs)
    return fhir_observations

def hl7_to_fhir_bundle(parsed_message: dict) -> dict:
    entries = []
    patient_id = "unknown"

    if "patient" in parsed_message:
        patient_id = parsed_message["patient"].get("id", "unknown").split("^")[0]
        patient = hl7_to_fhir_patient(parsed_message["patient"])
        entries.append({"resource": patient})

    if "observations" in parsed_message:
        observations = hl7_to_fhir_observations(parsed_message["observations"], patient_id)
        for obs in observations:
            entries.append({"resource": obs})

    bundle = {
        "resourceType": "Bundle",
        "id": parsed_message.get("message_id", "bundle-1"),
        "type": "collection",
        "entry": entries
    }
    return bundle