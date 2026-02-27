import streamlit as st
import requests
import json
import plotly.express as px
import pandas as pd
import os

API_URL = os.getenv("API_URL", "http://localhost:8002")

st.set_page_config(
    page_title="Medical AI — HL7 Dashboard",
    page_icon="🏥",
    layout="wide"
)

st.title("🔌 Medical AI Platform — HL7/FHIR Dashboard")
st.warning("⚠️ DISCLAIMER: This platform is a technical portfolio demonstration only. It is NOT a certified medical device and must NOT be used for clinical diagnosis or medical decision-making.")
st.markdown("---")

page = st.sidebar.radio("Navigation", ["Live Feed", "Parse HL7", "FHIR Converter", "Lambda Processor"])

if page == "Live Feed":
    st.subheader("HL7 Message Feed")

    col1, col2 = st.columns([2, 1])
    with col2:
        if st.button("Load Sample Messages"):
            response = requests.post(f"{API_URL}/simulate")
            if response.status_code == 200:
                st.success(f"Inserted {response.json()['inserted']} messages")

    response = requests.get(f"{API_URL}/messages")
    if response.status_code == 200:
        messages = response.json()
        if messages:
            df = pd.DataFrame(messages)
            st.metric("Total Messages", len(df))

            type_counts = df['message_type'].value_counts().reset_index()
            type_counts.columns = ['type', 'count']
            fig = px.bar(type_counts, x='type', y='count', color='type', title="Messages by Type")
            st.plotly_chart(fig, use_container_width=True)

            st.dataframe(df[['id', 'message_type', 'processed', 'received_at']], use_container_width=True)
        else:
            st.info("No messages yet. Click 'Load Sample Messages'")

elif page == "Parse HL7":
    st.subheader("HL7 v2 Message Parser")

    sample = "MSH|^~\\&|HIS|HOSPITAL|LAB|SYSTEM|20240115120000||ORU^R01|MSG001|P|2.5\rPID|1||PT-0001^^^HOSPITAL^MR||Doe^John^A||19850315|M|||123 Main St^^Madrid^28001^ESP\rOBX|1|NM|WBC^White Blood Cell Count||7.5|10*3/uL|4.5-11.0|N|||F"

    raw_message = st.text_area("Paste HL7 message", value=sample, height=150)

    if st.button("Parse"):
        response = requests.post(f"{API_URL}/parse", json={"raw_message": raw_message})
        if response.status_code == 200:
            result = response.json()
            st.subheader("Parsed Result")
            col1, col2 = st.columns(2)
            col1.metric("Message ID", result.get("message_id", "-"))
            col2.metric("Message Type", result.get("message_type", "-"))

            if "patient" in result:
                st.subheader("Patient")
                st.json(result["patient"])

            if "observations" in result:
                st.subheader("Observations")
                df_obs = pd.DataFrame(result["observations"])
                st.dataframe(df_obs, use_container_width=True)

elif page == "FHIR Converter":
    st.subheader("HL7 v2 → FHIR R4 Converter")

    sample = "MSH|^~\\&|HIS|HOSPITAL|LAB|SYSTEM|20240115120000||ORU^R01|MSG001|P|2.5\rPID|1||PT-0001^^^HOSPITAL^MR||Doe^John^A||19850315|M|||123 Main St^^Madrid^28001^ESP\rOBX|1|NM|IGE^IgE Total||284.3|IU/mL|0-100|H|||F\rOBX|2|NM|EOS^Eosinophils||8.2|%|1-4|H|||F"

    raw_message = st.text_area("Paste HL7 message", value=sample, height=150)

    if st.button("Convert to FHIR"):
        response = requests.post(f"{API_URL}/convert/fhir", json={"raw_message": raw_message})
        if response.status_code == 200:
            bundle = response.json()
            st.metric("Resources in Bundle", len(bundle["entry"]))
            for entry in bundle["entry"]:
                r = entry["resource"]
                with st.expander(f"{r['resourceType']} — {r.get('id', '')}"):
                    st.json(r)

elif page == "Lambda Processor":
    st.subheader("AWS Lambda HL7 Processor")

    sample = "MSH|^~\\&|HIS|HOSPITAL|LAB|SYSTEM|20240115120000||ORU^R01|MSG001|P|2.5\rPID|1||PT-0001^^^HOSPITAL^MR||Doe^John^A||19850315|M"

    raw_message = st.text_area("Paste HL7 message", value=sample, height=100)

    if st.button("Process with Lambda"):
        response = requests.post(f"{API_URL}/lambda/process", json={"raw_message": raw_message})
        if response.status_code == 200:
            result = response.json()
            if "error" in result:
                st.error(result["error"])
            else:
                col1, col2, col3 = st.columns(3)
                col1.metric("Processed", str(result.get("processed", False)))
                col2.metric("Message Type", result.get("message_type", "-"))
                col3.metric("Segments", result.get("segments", 0))
                st.success(f"Source: {result.get('source', '-')}")