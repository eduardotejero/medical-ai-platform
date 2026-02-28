import { useState, useEffect } from "react"
import Header from "../components/Header"
import axios from "axios"

const BACKEND = "http://localhost:8000"

function PatientRow({ patient, onClick, selected }) {
  return (
    <div onClick={() => onClick(patient)} style={{
      display: "grid",
      gridTemplateColumns: "80px 1fr 60px 80px 120px",
      padding: "12px 20px",
      borderBottom: "1px solid #CBD5E0",
      cursor: "pointer",
      background: selected ? "#E8EEF4" : "transparent",
      borderLeft: selected ? "2px solid #0066CC" : "2px solid transparent",
      transition: "all 0.15s",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ color: "#0066CC", fontSize: "14px" }}>#{patient.id}</div>
      <div style={{ color: "#1A202C", fontSize: "14px" }}>{patient.patient_code}</div>
      <div style={{ color: "#4A5568", fontSize: "14px" }}>{patient.age || "—"}</div>
      <div style={{ color: "#4A5568", fontSize: "14px" }}>{patient.gender || "—"}</div>
      <div style={{ color: "#718096", fontSize: "13px" }}>
        {patient.created_at ? new Date(patient.created_at).toLocaleDateString() : "—"}
      </div>
    </div>
  )
}

function PatientDetail({ patient }) {
  const [clinical, setClinical] = useState([])

  useEffect(() => {
    if (!patient) return
    axios.get(`${BACKEND}/api/v1/clinical/${patient.id}`)
      .then(r => setClinical(r.data))
      .catch(() => setClinical([]))
  }, [patient])

  if (!patient) return (
    <div style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      color: "#718096", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", fontSize: "14px", letterSpacing: "2px"
    }}>
      SELECT A PATIENT
    </div>
  )

  return (
    <div style={{ flex: 1, padding: "24px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ color: "#0066CC", fontSize: "12px", letterSpacing: "3px", marginBottom: "4px" }}>
        PATIENT RECORD
      </div>
      <div style={{ color: "#1A202C", fontSize: "22px", fontWeight: "700", marginBottom: "24px" }}>
        {patient.patient_code}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        {[
          { label: "ID", value: patient.id },
          { label: "CODE", value: patient.patient_code },
          { label: "AGE", value: patient.age || "—" },
          { label: "GENDER", value: patient.gender || "—" },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: "#F0F4F8",
            border: "1px solid #CBD5E0",
            padding: "12px",
          }}>
            <div style={{ color: "#4A5568", fontSize: "11px", letterSpacing: "2px", marginBottom: "4px" }}>{label}</div>
            <div style={{ color: "#1A202C", fontSize: "16px" }}>{value}</div>
          </div>
        ))}
      </div>

      {clinical.length > 0 && (
        <div>
          <div style={{ color: "#4A5568", fontSize: "12px", letterSpacing: "3px", marginBottom: "12px" }}>
            CLINICAL DATA
          </div>
          {clinical.map((c, i) => (
            <div key={i} style={{
              background: "#F0F4F8",
              border: "1px solid #CBD5E0",
              padding: "12px",
              marginBottom: "8px",
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px"
            }}>
              {[
                { label: "IgE", value: c.ige_total },
                { label: "EOS", value: c.eosinophils },
                { label: "pH", value: c.skin_ph },
                { label: "TEWL", value: c.tewl },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ color: "#4A5568", fontSize: "11px", letterSpacing: "2px" }}>{label}</div>
                  <div style={{ color: "#0066CC", fontSize: "16px" }}>{value || "—"}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Patients() {
  const [patients, setPatients] = useState([])
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  useEffect(() => {
    axios.get(`${BACKEND}/api/v1/patients/?limit=500`)
      .then(r => setPatients(r.data))
      .catch(() => {})
  }, [])

  const filtered = patients.filter(p =>
    p.patient_code.toLowerCase().includes(search.toLowerCase())
  )
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div style={{ flex: 1, background: "#FFFFFF", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header title="Patient Registry" subtitle="HAM10000 DATASET" />
      <div style={{ display: "flex", flex: 1 }}>
        {/* List */}
        <div style={{ width: "55%", borderRight: "1px solid #CBD5E0", display: "flex", flexDirection: "column" }}>
          {/* Search */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #CBD5E0" }}>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              placeholder="SEARCH BY CODE..."
              style={{
                width: "100%",
                background: "#F0F4F8",
                border: "1px solid #CBD5E0",
                color: "#1A202C",
                padding: "8px 12px",
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                fontSize: "14px",
                letterSpacing: "1px",
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "80px 1fr 60px 80px 120px",
            padding: "8px 20px",
            borderBottom: "1px solid #CBD5E0",
          }}>
            {["ID", "CODE", "AGE", "GENDER", "CREATED"].map(h => (
              <div key={h} style={{ color: "#718096", fontSize: "11px", letterSpacing: "2px" }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          <div style={{ flex: 1, overflowY: "auto", maxHeight: "calc(100vh - 260px)" }}>
            {paged.map(p => (
              <PatientRow key={p.id} patient={p} onClick={setSelected} selected={selected?.id === p.id} />
            ))}
          </div>

          {/* Pagination */}
          <div style={{
            padding: "12px 20px",
            borderTop: "1px solid #CBD5E0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
          }}>
            <span style={{ color: "#4A5568", fontSize: "13px" }}>
              {filtered.length} RECORDS — PAGE {page + 1}/{Math.ceil(filtered.length / PAGE_SIZE)}
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{
                background: "transparent", border: "1px solid #CBD5E0", color: "#4A5568",
                padding: "4px 12px", cursor: "pointer", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", fontSize: "13px"
              }}>PREV</button>
              <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= filtered.length} style={{
                background: "transparent", border: "1px solid #CBD5E0", color: "#4A5568",
                padding: "4px 12px", cursor: "pointer", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", fontSize: "13px"
              }}>NEXT</button>
            </div>
          </div>
        </div>

        {/* Detail */}
        <PatientDetail patient={selected} />
      </div>
    </div>
  )
}
