import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from scipy import stats
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://medicalai:medicalai123@localhost:5432/medicalai")

st.set_page_config(
    page_title="Medical AI Platform",
    page_icon="🏥",
    layout="wide"
)

@st.cache_data
def load_data():
    engine = create_engine(DATABASE_URL)
    df_patients = pd.read_sql("SELECT * FROM patients", engine)
    df_diagnoses = pd.read_sql("SELECT * FROM diagnoses", engine)
    df = pd.merge(df_patients, df_diagnoses, left_on='id', right_on='patient_id')
    return df

df = load_data()

st.title("🏥 Medical AI Platform — Dermatology Dashboard")
st.markdown("---")
st.warning("⚠️ DISCLAIMER: This platform is a technical portfolio demonstration only. It is NOT a certified medical device and must NOT be used for clinical diagnosis or medical decision-making.")


# KPIs
col1, col2, col3, col4 = st.columns(4)
col1.metric("Total Patients", len(df))
col2.metric("Diagnoses", df['diagnosis'].nunique())
col3.metric("Avg Severity", f"{df['severity'].mean():.2f}")
col4.metric("Avg Confidence", f"{df['confidence'].mean():.2%}")

st.markdown("---")

# Diagnosis distribution
col1, col2 = st.columns(2)

with col1:
    st.subheader("Diagnosis Distribution")
    dx_counts = df['diagnosis'].value_counts().reset_index()
    dx_counts.columns = ['diagnosis', 'count']
    fig = px.bar(dx_counts, x='diagnosis', y='count', color='diagnosis')
    fig.update_layout(showlegend=False, xaxis_tickangle=-45)
    st.plotly_chart(fig, use_container_width=True)

with col2:
    st.subheader("Severity by Diagnosis")
    fig = px.box(df, x='diagnosis', y='severity', color='diagnosis')
    fig.update_layout(showlegend=False, xaxis_tickangle=-45)
    st.plotly_chart(fig, use_container_width=True)

# Statistical analysis
st.markdown("---")
st.subheader("Statistical Analysis")

col1, col2 = st.columns(2)

with col1:
    st.subheader("Severity Distribution")
    fig = px.histogram(df, x='severity', nbins=5, color_discrete_sequence=['#636EFA'])
    st.plotly_chart(fig, use_container_width=True)

with col2:
    st.subheader("Confidence Distribution")
    fig = px.histogram(df, x='confidence', nbins=20, color_discrete_sequence=['#EF553B'])
    st.plotly_chart(fig, use_container_width=True)

# ANOVA
st.markdown("---")
st.subheader("ANOVA — Severity across Diagnoses")
groups = [group['severity'].values for _, group in df.groupby('diagnosis')]
f_stat, p_value = stats.f_oneway(*groups)

col1, col2 = st.columns(2)
col1.metric("F-statistic", f"{f_stat:.2f}")
col2.metric("P-value", f"{p_value:.6f}")

if p_value < 0.05:
    st.success("Significant differences between diagnoses (p < 0.05)")

# Severity heatmap by diagnosis
st.markdown("---")
st.subheader("Diagnosis Summary Table")
summary = df.groupby('diagnosis').agg(
    count=('id_x', 'count'),
    mean_severity=('severity', 'mean'),
    mean_confidence=('confidence', 'mean')
).reset_index()
summary['mean_severity'] = summary['mean_severity'].round(2)
summary['mean_confidence'] = summary['mean_confidence'].round(4)
st.dataframe(summary, use_container_width=True)

# Patient explorer
st.markdown("---")
st.subheader("Patient Explorer")
selected_dx = st.selectbox("Filter by diagnosis", ['All'] + sorted(df['diagnosis'].unique().tolist()))
if selected_dx != 'All':
    filtered = df[df['diagnosis'] == selected_dx]
else:
    filtered = df
st.dataframe(filtered[['patient_code', 'diagnosis', 'severity', 'confidence']].head(100), use_container_width=True)