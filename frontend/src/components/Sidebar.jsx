import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"

const NAV_ITEMS = [
  { path: "/", label: "Overview", icon: "⬡" },
  { path: "/patients", label: "Patients", icon: "◈" },
  { path: "/ml", label: "ML Models", icon: "◎" },
  { path: "/cv", label: "Computer Vision", icon: "◫" },
  { path: "/hl7", label: "HL7 / FHIR", icon: "⬢" },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <aside style={{
      width: "220px",
      minHeight: "100vh",
      background: "#0a0e1a",
      borderRight: "1px solid #1a2535",
      display: "flex",
      flexDirection: "column",
      padding: "0",
      fontFamily: "'Courier New', monospace",
    }}>
      {/* Logo */}
      <div style={{
        padding: "24px 20px",
        borderBottom: "1px solid #1a2535",
      }}>
        <div style={{ color: "#00d4aa", fontSize: "10px", letterSpacing: "3px", marginBottom: "4px" }}>
          MEDICAL AI
        </div>
        <div style={{ color: "#fff", fontSize: "16px", fontWeight: "700", letterSpacing: "1px" }}>
          PLATFORM
        </div>
        <div style={{ color: "#2a4a6a", fontSize: "9px", letterSpacing: "2px", marginTop: "4px" }}>
          v2.0 — DEMO ONLY
        </div>
      </div>

      {/* Status */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid #1a2535" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "#00d4aa",
            boxShadow: "0 0 6px #00d4aa",
            animation: "pulse 2s infinite"
          }} />
          <span style={{ color: "#00d4aa", fontSize: "9px", letterSpacing: "2px" }}>SYSTEMS ONLINE</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 0" }}>
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.path
          return (
            <button key={item.path} onClick={() => navigate(item.path)} style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 20px",
              background: active ? "#0f1f35" : "transparent",
              border: "none",
              borderLeft: active ? "2px solid #00d4aa" : "2px solid transparent",
              color: active ? "#00d4aa" : "#4a6a8a",
              fontSize: "11px",
              letterSpacing: "2px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: "14px" }}>{item.icon}</span>
              {item.label.toUpperCase()}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid #1a2535" }}>
        <div style={{ color: "#2a4a6a", fontSize: "8px", letterSpacing: "1px", lineHeight: "1.6" }}>
          ⚠ NOT FOR CLINICAL USE<br />
          PORTFOLIO DEMO ONLY
        </div>
      </div>
    </aside>
  )
}