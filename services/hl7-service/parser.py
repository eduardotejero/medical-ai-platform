import hl7
from datetime import datetime

SAMPLE_MESSAGES = [
    "MSH|^~\&|HIS|HOSPITAL|LAB|SYSTEM|20240115120000||ORU^R01|MSG001|P|2.5\rPID|1||PT-0001^^^HOSPITAL^MR||Doe^John^A||19850315|M|||123 Main St^^Madrid^28001^ESP\rOBR|1|ORD001|RPT001|CBC^Complete Blood Count|||20240115110000\rOBX|1|NM|WBC^White Blood Cell Count||7.5|10*3/uL|4.5-11.0|N|||F\rOBX|2|NM|RBC^Red Blood Cell Count||4.8|10*6/uL|4.5-5.9|N|||F\rOBX|3|NM|HGB^Hemoglobin||14.2|g/dL|13.5-17.5|N|||F",
    "MSH|^~\&|HIS|HOSPITAL|LAB|SYSTEM|20240115130000||ORU^R01|MSG002|P|2.5\rPID|1||PT-0002^^^HOSPITAL^MR||Smith^Jane^B||19920820|F|||456 Oak Ave^^Barcelona^08001^ESP\rOBR|1|ORD002|RPT002|DERM^Dermatology Panel|||20240115120000\rOBX|1|NM|IGE^IgE Total||284.3|IU/mL|0-100|H|||F\rOBX|2|NM|EOS^Eosinophils||8.2|%|1-4|H|||F\rOBX|3|NM|TEWL^Trans-Epidermal Water Loss||32.1|g/m2h|<15|H|||F",
    "MSH|^~\&|HIS|HOSPITAL|ADT|SYSTEM|20240115140000||ADT^A01|MSG003|P|2.5\rPID|1||PT-0003^^^HOSPITAL^MR||Garcia^Maria^C||19780605|F|||789 Pine Rd^^Pamplona^31001^ESP\rPV1|1|I|DERM^101^A|||ATT001^Martinez^Carlos|||DERM||||ADM|||||V001\rDG1|1||L20^Atopic Dermatitis^ICD10||20240115|A"
]

def parse_message(raw: str) -> dict:
    msg = hl7.parse(raw)
    msh = msg.segment('MSH')
    message_type = str(msh[9])
    message_id = str(msh[10])
    timestamp = str(msh[7])

    result = {
        "message_id": message_id,
        "message_type": message_type,
        "timestamp": timestamp,
        "segments": {},
        "raw": raw
    }

    for segment in msg:
        seg_name = str(segment[0])
        if seg_name not in result["segments"]:
            result["segments"][seg_name] = []
        fields = [str(f) for f in segment]
        result["segments"][seg_name].append(fields)

    # Extract patient info if PID present
    try:
        pid = msg.segment('PID')
        result["patient"] = {
            "id": str(pid[3]),
            "name": str(pid[5]),
            "dob": str(pid[7]),
            "gender": str(pid[8])
        }
    except Exception:
        pass

    # Extract observations if OBX present
    try:
        observations = []
        for segment in msg:
            if str(segment[0]) == 'OBX':
                observations.append({
                    "value_type": str(segment[2]),
                    "code": str(segment[3]),
                    "value": str(segment[5]),
                    "units": str(segment[6]),
                    "reference_range": str(segment[7]),
                    "abnormal_flag": str(segment[8])
                })
        if observations:
            result["observations"] = observations
    except Exception:
        pass

    return result

def get_sample_messages() -> list:
    return [parse_message(msg) for msg in SAMPLE_MESSAGES]