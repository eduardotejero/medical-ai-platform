import { useState, useEffect } from "react"
import Header from "../components/Header"
import axios from "axios"

const BACKEND = "http://localhost:8000"
const CV = "http://localhost:8001"
const HL7 = "http://localhost:8002"

function StatCard({ label, value, unit, color = "#0066CC", status }) {
  return (
    <div style={{
      background: "#F0F4F8",
      border: "1px solid #CBD5E0",
      borderTop: `2px solid ${color}`,
      padding: "20px",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ color: "#4A5568", fontSize: "12px", letterSpacing: "3px", marginBottom: "12px" }}>{label}</div>
      <div style={{ color: "#1A202C", fontSize: "30px", fontWeight: "700" }}>
        {value} <span style={{ fontSize: "14px", color: "#4A5568" }}>{unit}</span>
      </div>
      {status && (
        <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: color }} />
          <span style={{ color, fontSize: "12px", letterSpacing: "2px" }}>{status}</span>
        </div>
      )}
    </div>
  )
}

function ServiceStatus({ name, url, port }) {
  const [status, setStatus] = useState("checking")

  useEffect(() => {
    axios.get(`${url}/health`, { timeout: 3000 })
      .then(() => setStatus("online"))
      .catch(() => setStatus("offline"))
  }, [url])

  const color = status === "online" ? "#0066CC" : status === "offline" ? "#EF4444" : "#F59E0B"

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 0",
      borderBottom: "1px solid #CBD5E0",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <div>
        <div style={{ color: "#1A202C", fontSize: "14px" }}>{name}</div>
        <div style={{ color: "#718096", fontSize: "12px" }}>:{port}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: color,
          boxShadow: status === "online" ? `0 0 6px ${color}` : "none"
        }} />
        <span style={{ color, fontSize: "12px", letterSpacing: "2px" }}>{status.toUpperCase()}</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [patients, setPatients] = useState(0)
  const [messages, setMessages] = useState(0)

  useEffect(() => {
    axios.get(`${BACKEND}/api/v1/patients/`)
      .then(r => setPatients(r.data.length))
      .catch(() => {})
    axios.get(`${HL7}/messages`)
      .then(r => setMessages(r.data.length))
      .catch(() => {})
  }, [])

  return (
    <div style={{ flex: 1, background: "#FFFFFF", minHeight: "100vh" }}>
      <Header title="System Overview" subtitle="MEDICAL AI PLATFORM" />
      <div style={{ padding: "32px" }}>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          <StatCard label="PATIENTS LOADED" value={patients} unit="records" color="#0066CC" status="HAM10000 DATASET" />
          <StatCard label="HL7 MESSAGES" value={messages} unit="msgs" color="#2196F3" status="PROCESSED" />
          <StatCard label="ML MODELS" value={3} unit="models" color="#7C3AED" status="TRAINED" />
          <StatCard label="CV PIPELINE" value="ACTIVE" unit="" color="#F59E0B" status="RESNET18 + YOLO" />
        </div>

        {/* Services */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{
            background: "#F0F4F8",
            border: "1px solid #CBD5E0",
            padding: "20px",
          }}>
            <div style={{ color: "#4A5568", fontSize: "12px", letterSpacing: "3px", marginBottom: "16px" }}>
              SERVICE STATUS
            </div>
            <ServiceStatus name="Backend API" url={BACKEND} port="8000" />
            <ServiceStatus name="CV Service" url={CV} port="8001" />
            <ServiceStatus name="HL7 Service" url={HL7} port="8002" />
          </div>

          <div style={{
            background: "#F0F4F8",
            border: "1px solid #CBD5E0",
            padding: "20px",
          }}>
            <div style={{ color: "#4A5568", fontSize: "12px", letterSpacing: "3px", marginBottom: "16px" }}>
              TECH STACK
            </div>
            {[
              "Python 3.11 · FastAPI · SQLAlchemy",
              "PyTorch · ResNet18 · YOLOv8",
              "python-hl7 · FHIR R4 · MIRTH",
              "PostgreSQL · Redis · MLflow",
              "AWS S3 · Lambda · Docker",
            ].map((item, i) => (
              <div key={i} style={{
                padding: "8px 0",
                borderBottom: "1px solid #CBD5E0",
                color: "#4A5568",
                fontSize: "14px",
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <span style={{ color: "#0066CC" }}>›</span> {item}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
