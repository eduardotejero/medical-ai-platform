import streamlit as st
import requests
import json
import plotly.express as px
import plotly.graph_objects as go
from PIL import Image
import io
import os

# API_URL = "http://localhost:8001
API_URL = os.getenv("API_URL", "http://localhost:8001")

st.set_page_config(
    page_title="Medical AI — CV Dashboard",
    page_icon="🔬",
    layout="wide"
)

st.title("🔬 Medical AI Platform — Computer Vision Dashboard")
st.markdown("---")

# Sidebar
st.sidebar.title("Navigation")
page = st.sidebar.radio("Select", ["Image Analysis", "S3 Image Gallery"])

if page == "Image Analysis":
    st.subheader("Upload Dermatology Image for Analysis")

    uploaded_file = st.file_uploader("Choose an image", type=["jpg", "jpeg", "png"])

    if uploaded_file:
        col1, col2 = st.columns(2)

        with col1:
            st.image(uploaded_file, caption="Uploaded Image", use_container_width=True)

        with col2:
            with st.spinner("Analyzing..."):
                response = requests.post(
                    f"{API_URL}/analyze",
                    files={"file": (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type)}
                )

        if response.status_code == 200:
                result = response.json()

                # Classification
                clf = result["classification"]
                st.metric("Diagnosis", clf["diagnosis"])
                st.metric("Confidence", f"{clf['confidence']:.2%}")

                # Probabilities chart
                probs = clf["probabilities"]
                fig = px.bar(
                    x=list(probs.values()),
                    y=list(probs.keys()),
                    orientation='h',
                    color=list(probs.values()),
                    color_continuous_scale='RdYlGn_r',
                    title="Diagnosis Probabilities"
                )
                fig.update_layout(showlegend=False, coloraxis_showscale=False)
                st.plotly_chart(fig, use_container_width=True)

                # Image stats
                st.markdown("---")
                st.subheader("Image Statistics")
                stats = result["image_stats"]
                col1, col2, col3 = st.columns(3)
                col1.metric("Mean R", f"{stats['mean_r']:.3f}")
                col2.metric("Mean G", f"{stats['mean_g']:.3f}")
                col3.metric("Mean B", f"{stats['mean_b']:.3f}")

                col1, col2, col3 = st.columns(3)
                col1.metric("Std R", f"{stats['std_r']:.3f}")
                col2.metric("Std G", f"{stats['std_g']:.3f}")
                col3.metric("Std B", f"{stats['std_b']:.3f}")

                st.metric("Contrast", f"{stats['contrast']:.2f}")

                # S3 info
                st.markdown("---")
                st.subheader("Storage")
                st.success(f"Image saved to S3: `{result['s3_image']}`")
                st.success(f"Result saved to S3: `{result['s3_result']}`")

                # Detections
                st.markdown("---")
                st.subheader("YOLO Detections")
                det = result["detections"]
                if det["total"] > 0:
                    for d in det["detections"]:
                        st.write(f"- {d['class']}: {d['confidence']:.2%}")
                else:
                    st.info("No objects detected by YOLO")

        # Image stats
        st.markdown("---")
        st.subheader("Image Statistics")
        stats = result["image_stats"]
        col1, col2, col3 = st.columns(3)
        col1.metric("Mean R", f"{stats['mean_r']:.3f}")
        col2.metric("Mean G", f"{stats['mean_g']:.3f}")
        col3.metric("Mean B", f"{stats['mean_b']:.3f}")

        col1, col2, col3 = st.columns(3)
        col1.metric("Std R", f"{stats['std_r']:.3f}")
        col2.metric("Std G", f"{stats['std_g']:.3f}")
        col3.metric("Std B", f"{stats['std_b']:.3f}")

        st.metric("Contrast", f"{stats['contrast']:.2f}")

        # S3 info
        st.markdown("---")
        st.subheader("Storage")
        st.success(f"Image saved to S3: `{result['s3_image']}`")
        st.success(f"Result saved to S3: `{result['s3_result']}`")

        # Detections
        st.markdown("---")
        st.subheader("YOLO Detections")
        det = result["detections"]
        if det["total"] > 0:
            for d in det["detections"]:
                st.write(f"- {d['class']}: {d['confidence']:.2%}")
        else:
            st.info("No objects detected by YOLO")

    else:
        st.info("Upload a dermatology image to start analysis")

elif page == "S3 Image Gallery":
    st.subheader("Images stored in AWS S3")
    response = requests.get(f"{API_URL}/images")
    if response.status_code == 200:
        images = response.json()["images"]
        if images:
            st.write(f"Total images: {len(images)}")
            for img_key in images:
                st.write(f"- `{img_key}`")
        else:
            st.info("No images in S3 yet")