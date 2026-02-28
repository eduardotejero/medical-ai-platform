import { useState, useEffect } from "react"
import Header from "../components/Header"
import axios from "axios"

const BACKEND = "http://localhost:8000"
const CV = "http://localhost:8001"
const HL7 = "http://localhost:8002"

function StatCard({ label, value, unit, color = "#00d4aa", status }) {
  return (
    <div style={{
      background: "#0a0e1a",
      border: "1px solid #1a2535",
      borderTop: `2px solid ${color}`,
      padding: "20px",
      fontFamily: "monospace",
    }}>
      <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px", marginBottom: "12px" }}>{label}</div>
      <div style={{ color: "#e8f0fe", fontSize: "28px", fontWeight: "700" }}>
        {value} <span style={{ fontSize: "12px", color: "#4a6a8a" }}>{unit}</span>
      </div>
      {status && (
        <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: color }} />
          <span style={{ color, fontSize: "9px", letterSpacing: "2px" }}>{status}</span>
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

  const color = status === "online" ? "#00d4aa" : status === "offline" ? "#ff4444" : "#ffaa00"

  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 0",
      borderBottom: "1px solid #1a2535",
      fontFamily: "monospace",
    }}>
      <div>
        <div style={{ color: "#e8f0fe", fontSize: "12px" }}>{name}</div>
        <div style={{ color: "#2a4a6a", fontSize: "9px" }}>:{port}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: color,
          boxShadow: status === "online" ? `0 0 6px ${color}` : "none"
        }} />
        <span style={{ color, fontSize: "9px", letterSpacing: "2px" }}>{status.toUpperCase()}</span>
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
    <div style={{ flex: 1, background: "#060a14", minHeight: "100vh" }}>
      <Header title="System Overview" subtitle="MEDICAL AI PLATFORM" />
      <div style={{ padding: "32px" }}>

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          <StatCard label="PATIENTS LOADED" value={patients} unit="records" color="#00d4aa" status="HAM10000 DATASET" />
          <StatCard label="HL7 MESSAGES" value={messages} unit="msgs" color="#4a9eff" status="PROCESSED" />
          <StatCard label="ML MODELS" value={3} unit="models" color="#aa44ff" status="TRAINED" />
          <StatCard label="CV PIPELINE" value="ACTIVE" unit="" color="#ffaa00" status="RESNET18 + YOLO" />
        </div>

        {/* Services */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div style={{
            background: "#0a0e1a",
            border: "1px solid #1a2535",
            padding: "20px",
          }}>
            <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px", marginBottom: "16px" }}>
              SERVICE STATUS
            </div>
            <ServiceStatus name="Backend API" url={BACKEND} port="8000" />
            <ServiceStatus name="CV Service" url={CV} port="8001" />
            <ServiceStatus name="HL7 Service" url={HL7} port="8002" />
          </div>

          <div style={{
            background: "#0a0e1a",
            border: "1px solid #1a2535",
            padding: "20px",
          }}>
            <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px", marginBottom: "16px" }}>
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
                borderBottom: "1px solid #1a2535",
                color: "#4a6a8a",
                fontSize: "11px",
                fontFamily: "monospace",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <span style={{ color: "#00d4aa" }}>›</span> {item}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}