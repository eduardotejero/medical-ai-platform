import json
from parser import SAMPLE_MESSAGES, parse_message
from fhir_converter import hl7_to_fhir_bundle

print("=== Testing HL7 to FHIR Conversion ===\n")

for i, raw in enumerate(SAMPLE_MESSAGES):
    parsed = parse_message(raw)
    bundle = hl7_to_fhir_bundle(parsed)
    print(f"Message {i+1} — {parsed['message_type']}:")
    print(f"  Bundle ID: {bundle['id']}")
    print(f"  Resources: {len(bundle['entry'])}")
    for entry in bundle['entry']:
        r = entry['resource']
        print(f"  - {r['resourceType']}: {r.get('id', '')}")
    print()

print("FHIR conversion OK")