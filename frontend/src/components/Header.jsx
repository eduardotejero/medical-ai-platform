export default function Header({ title, subtitle }) {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19)

  return (
    <header style={{
      padding: "20px 32px",
      borderBottom: "1px solid #CBD5E0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      background: "#FFFFFF",
    }}>
      <div>
        <div style={{ color: "#0066CC", fontSize: "12px", letterSpacing: "3px", marginBottom: "4px" }}>
          {subtitle}
        </div>
        <h1 style={{ color: "#1A202C", fontSize: "22px", fontWeight: "700", margin: 0, letterSpacing: "1px" }}>
          {title}
        </h1>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ color: "#718096", fontSize: "12px", letterSpacing: "2px" }}>TIMESTAMP</div>
        <div style={{ color: "#4A5568", fontSize: "14px", fontFamily: "monospace" }}>{now} UTC</div>
      </div>
    </header>
  )
}
