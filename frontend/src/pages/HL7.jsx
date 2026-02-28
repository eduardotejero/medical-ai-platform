import { useState, useEffect } from "react"
import Header from "../components/Header"
import axios from "axios"

const HL7_URL = "http://localhost:8002"

function MessageCard({ msg, onClick, selected }) {
  const typeColor = msg.message_type?.startsWith("ORU") ? "#00d4aa" : "#4a9eff"
  return (
    <div onClick={() => onClick(msg)} style={{
      padding: "12px 20px",
      borderBottom: "1px solid #1a2535",
      cursor: "pointer",
      background: selected ? "#0f1f35" : "transparent",
      borderLeft: selected ? `2px solid ${typeColor}` : "2px solid transparent",
      fontFamily: "monospace",
      transition: "all 0.15s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ color: typeColor, fontSize: "11px", fontWeight: "700" }}>{msg.message_type}</span>
        <span style={{ color: "#2a4a6a", fontSize: "9px" }}>#{msg.id}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: msg.processed ? "#00d4aa" : "#ffaa00", fontSize: "9px", letterSpacing: "1px" }}>
          {msg.processed ? "● PROCESSED" : "○ PENDING"}
        </span>
        <span style={{ color: "#2a4a6a", fontSize: "9px" }}>
          {msg.received_at ? new Date(msg.received_at).toLocaleTimeString() : "—"}
        </span>
      </div>
    </div>
  )
}

export default function HL7() {
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState(null)
  const [parsed, setParsed] = useState(null)
  const [fhir, setFhir] = useState(null)
  const [tab, setTab] = useState("parsed")
  const [loading, setLoading] = useState(false)

  const fetchMessages = () => {
    axios.get(`${HL7_URL}/messages`)
      .then(r => setMessages(r.data))
      .catch(() => {})
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [])

  const selectMessage = async (msg) => {
    setSelected(msg)
    setParsed(null)
    setFhir(null)
    setLoading(true)
    try {
      const [parsedRes, fhirRes] = await Promise.all([
        axios.post(`${HL7_URL}/parse`, { raw_message: msg.raw_message }),
        axios.post(`${HL7_URL}/convert/fhir`, { raw_message: msg.raw_message })
      ])
      setParsed(parsedRes.data)
      setFhir(fhirRes.data)
    } catch (e) {}
    setLoading(false)
  }

  const simulate = async () => {
    await axios.post(`${HL7_URL}/simulate`)
    fetchMessages()
  }

  const typeColor = (t) => t?.startsWith("ORU") ? "#00d4aa" : "#4a9eff"

  const oru = messages.filter(m => m.message_type?.startsWith("ORU")).length
  const adt = messages.filter(m => m.message_type?.startsWith("ADT")).length

  return (
    <div style={{ flex: 1, background: "#060a14", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header title="HL7 / FHIR Pipeline" subtitle="MIRTH CONNECT · FHIR R4 · AWS LAMBDA" />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", padding: "24px 32px 0" }}>
        {[
          { label: "TOTAL MESSAGES", value: messages.length, color: "#e8f0fe" },
          { label: "ORU^R01", value: oru, color: "#00d4aa" },
          { label: "ADT^A01", value: adt, color: "#4a9eff" },
          { label: "PROCESSED", value: messages.filter(m => m.processed).length, color: "#aa44ff" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: "#0a0e1a", border: "1px solid #1a2535", padding: "16px", fontFamily: "monospace" }}>
            <div style={{ color: "#4a6a8a", fontSize: "8px", letterSpacing: "2px", marginBottom: "6px" }}>{label}</div>
            <div style={{ color, fontSize: "24px", fontWeight: "700" }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flex: 1, padding: "24px 32px", gap: "24px" }}>

        {/* Message list */}
        <div style={{ width: "300px", background: "#0a0e1a", border: "1px solid #1a2535", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #1a2535", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px" }}>MESSAGE FEED</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={simulate} style={{
                background: "#00d4aa", border: "none", color: "#060a14",
                padding: "4px 10px", fontFamily: "monospace", fontSize: "9px",
                letterSpacing: "1px", cursor: "pointer", fontWeight: "700"
              }}>+ SIMULATE</button>
              <button onClick={fetchMessages} style={{
                background: "transparent", border: "1px solid #1a2535", color: "#4a6a8a",
                padding: "4px 10px", fontFamily: "monospace", fontSize: "9px", cursor: "pointer"
              }}>↻</button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", maxHeight: "500px" }}>
            {messages.length === 0 ? (
              <div style={{ padding: "24px", color: "#2a4a6a", fontFamily: "monospace", fontSize: "10px", letterSpacing: "2px", textAlign: "center" }}>
                NO MESSAGES<br />CLICK SIMULATE
              </div>
            ) : messages.map(m => (
              <MessageCard key={m.id} msg={m} onClick={selectMessage} selected={selected?.id === m.id} />
            ))}
          </div>
        </div>

        {/* Detail */}
        <div style={{ flex: 1 }}>
          {!selected ? (
            <div style={{
              height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid #1a2535", color: "#2a4a6a", fontFamily: "monospace",
              fontSize: "11px", letterSpacing: "2px"
            }}>
              SELECT A MESSAGE
            </div>
          ) : loading ? (
            <div style={{
              height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid #1a2535", color: "#00d4aa", fontFamily: "monospace",
              fontSize: "11px", letterSpacing: "2px"
            }}>
              PARSING...
            </div>
          ) : (
            <div style={{ background: "#0a0e1a", border: "1px solid #1a2535", height: "100%" }}>
              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid #1a2535" }}>
                {["parsed", "fhir", "raw"].map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{
                    padding: "12px 20px", background: "transparent",
                    border: "none", borderBottom: tab === t ? "2px solid #00d4aa" : "2px solid transparent",
                    color: tab === t ? "#00d4aa" : "#4a6a8a",
                    fontFamily: "monospace", fontSize: "10px", letterSpacing: "2px", cursor: "pointer"
                  }}>{t.toUpperCase()}</button>
                ))}
                <div style={{ flex: 1, padding: "12px 20px", textAlign: "right" }}>
                  <span style={{ color: typeColor(selected.message_type), fontSize: "10px", fontFamily: "monospace" }}>
                    {selected.message_type}
                  </span>
                </div>
              </div>

              <div style={{ padding: "20px", overflowY: "auto", maxHeight: "500px" }}>
                {tab === "parsed" && parsed && (
                  <div style={{ fontFamily: "monospace" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                      {[
                        { label: "MESSAGE ID", value: parsed.message_id },
                        { label: "TYPE", value: parsed.message_type },
                        { label: "TIMESTAMP", value: parsed.timestamp },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: "#060a14", border: "1px solid #1a2535", padding: "10px" }}>
                          <div style={{ color: "#2a4a6a", fontSize: "8px", letterSpacing: "2px" }}>{label}</div>
                          <div style={{ color: "#e8f0fe", fontSize: "12px" }}>{value}</div>
                        </div>
                      ))}
                    </div>
                    {parsed.patient && (
                      <div style={{ marginBottom: "16px" }}>
                        <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px", marginBottom: "8px" }}>PATIENT</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                          {Object.entries(parsed.patient).map(([k, v]) => (
                            <div key={k} style={{ background: "#060a14", border: "1px solid #1a2535", padding: "8px" }}>
                              <div style={{ color: "#2a4a6a", fontSize: "8px", letterSpacing: "1px" }}>{k.toUpperCase()}</div>
                              <div style={{ color: "#00d4aa", fontSize: "10px" }}>{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {parsed.observations && (
                      <div>
                        <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px", marginBottom: "8px" }}>OBSERVATIONS</div>
                        {parsed.observations.map((obs, i) => (
                          <div key={i} style={{
                            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
                            gap: "8px", padding: "8px", marginBottom: "4px",
                            background: "#060a14", border: "1px solid #1a2535"
                          }}>
                            <div style={{ color: "#e8f0fe", fontSize: "10px" }}>{obs.code}</div>
                            <div style={{ color: "#00d4aa", fontSize: "10px" }}>{obs.value} {obs.units}</div>
                            <div style={{ color: "#4a6a8a", fontSize: "9px" }}>{obs.reference_range}</div>
                            <div style={{ color: obs.abnormal_flag === "H" ? "#ff4444" : obs.abnormal_flag === "L" ? "#ffaa00" : "#00d4aa", fontSize: "10px" }}>
                              {obs.abnormal_flag}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {tab === "fhir" && fhir && (
                  <div style={{ fontFamily: "monospace" }}>
                    <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px", marginBottom: "12px" }}>
                      FHIR R4 BUNDLE — {fhir.entry?.length} RESOURCES
                    </div>
                    {fhir.entry?.map((entry, i) => (
                      <div key={i} style={{ marginBottom: "8px", background: "#060a14", border: "1px solid #1a2535", padding: "12px" }}>
                        <div style={{ color: "#4a9eff", fontSize: "10px", marginBottom: "6px" }}>
                          {entry.resource.resourceType} — {entry.resource.id}
                        </div>
                        <pre style={{ color: "#4a6a8a", fontSize: "9px", margin: 0, whiteSpace: "pre-wrap" }}>
                          {JSON.stringify(entry.resource, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}

                {tab === "raw" && (
                  <pre style={{ color: "#4a6a8a", fontSize: "10px", fontFamily: "monospace", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                    {selected.raw_message?.replace(/\r/g, "\n")}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}