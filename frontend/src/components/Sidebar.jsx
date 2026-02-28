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
      background: "#F0F4F8",
      borderRight: "1px solid #CBD5E0",
      display: "flex",
      flexDirection: "column",
      padding: "0",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Logo */}
      <div style={{
        padding: "24px 20px",
        borderBottom: "1px solid #CBD5E0",
      }}>
        <div style={{ color: "#0066CC", fontSize: "13px", letterSpacing: "3px", marginBottom: "4px" }}>
          MEDICAL AI
        </div>
        <div style={{ color: "#1A202C", fontSize: "18px", fontWeight: "700", letterSpacing: "1px" }}>
          PLATFORM
        </div>
        <div style={{ color: "#718096", fontSize: "12px", letterSpacing: "2px", marginTop: "4px" }}>
          v2.0 — DEMO ONLY
        </div>
      </div>

      {/* Status */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid #CBD5E0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "#0066CC",
            boxShadow: "0 0 6px #0066CC",
            animation: "pulse 2s infinite"
          }} />
          <span style={{ color: "#0066CC", fontSize: "12px", letterSpacing: "2px" }}>SYSTEMS ONLINE</span>
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
              background: active ? "#E8EEF4" : "transparent",
              border: "none",
              borderLeft: active ? "2px solid #0066CC" : "2px solid transparent",
              color: active ? "#0066CC" : "#4A5568",
              fontSize: "14px",
              letterSpacing: "2px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s",
            }}>
              <span style={{ fontSize: "16px" }}>{item.icon}</span>
              {item.label.toUpperCase()}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid #CBD5E0" }}>
        <div style={{ color: "#718096", fontSize: "11px", letterSpacing: "1px", lineHeight: "1.6" }}>
          ⚠ NOT FOR CLINICAL USE<br />
          PORTFOLIO DEMO ONLY
        </div>
      </div>
    </aside>
  )
}
