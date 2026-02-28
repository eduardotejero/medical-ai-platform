export default function Header({ title, subtitle }) {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19)

  return (
    <header style={{
      padding: "20px 32px",
      borderBottom: "1px solid #1a2535",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontFamily: "'Courier New', monospace",
    }}>
      <div>
        <div style={{ color: "#00d4aa", fontSize: "9px", letterSpacing: "3px", marginBottom: "4px" }}>
          {subtitle}
        </div>
        <h1 style={{ color: "#e8f0fe", fontSize: "20px", fontWeight: "700", margin: 0, letterSpacing: "1px" }}>
          {title}
        </h1>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ color: "#2a4a6a", fontSize: "9px", letterSpacing: "2px" }}>TIMESTAMP</div>
        <div style={{ color: "#4a6a8a", fontSize: "11px", fontFamily: "monospace" }}>{now} UTC</div>
      </div>
    </header>
  )
}