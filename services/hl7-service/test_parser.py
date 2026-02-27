from parser import parse_message, get_sample_messages, SAMPLE_MESSAGES

print("=== Testing HL7 Parser ===\n")

for i, raw in enumerate(SAMPLE_MESSAGES):
    result = parse_message(raw)
    print(f"Message {i+1}:")
    print(f"  ID: {result['message_id']}")
    print(f"  Type: {result['message_type']}")
    print(f"  Timestamp: {result['timestamp']}")
    if 'patient' in result:
        print(f"  Patient: {result['patient']}")
    if 'observations' in result:
        print(f"  Observations: {len(result['observations'])}")
        for obs in result['observations']:
            print(f"    - {obs['code']}: {obs['value']} {obs['units']} [{obs['abnormal_flag']}]")
    print()

print("Parser OK")