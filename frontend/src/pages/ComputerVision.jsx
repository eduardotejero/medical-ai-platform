import { useState } from "react"
import Header from "../components/Header"
import axios from "axios"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

const CV = "http://localhost:8001"
const COLORS = ["#ff4444", "#ffaa00", "#00d4aa", "#4a9eff", "#aa44ff", "#44ffaa", "#ff44aa"]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#0a0e1a", border: "1px solid #1a2535", padding: "10px 14px", fontFamily: "monospace", fontSize: "11px" }}>
        <div style={{ color: "#4a6a8a", marginBottom: "4px" }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color }}>{(p.value * 100).toFixed(2)}%</div>
        ))}
      </div>
    )
  }
  return null
}

export default function ComputerVision() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError(null)
  }

  const analyze = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await axios.post(`${CV}/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      setResult(response.data)
    } catch (e) {
      setError("CV Service unavailable — make sure it's running on port 8001")
    }
    setLoading(false)
  }

  const severityColor = (diagnosis) => {
    const high = ["Melanoma"]
    const med = ["Basal Cell Carcinoma", "Actinic Keratosis"]
    if (high.includes(diagnosis)) return "#ff4444"
    if (med.includes(diagnosis)) return "#ffaa00"
    return "#00d4aa"
  }

  const probData = result
    ? Object.entries(result.classification.probabilities).map(([name, prob]) => ({ name: name.slice(0, 16), prob }))
    : []

  return (
    <div style={{ flex: 1, background: "#060a14", minHeight: "100vh" }}>
      <Header title="Computer Vision Pipeline" subtitle="RESNET18 · YOLOV8 · OPENCV" />
      <div style={{ padding: "32px" }}>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

          {/* Upload */}
          <div>
            <div style={{ background: "#0a0e1a", border: "1px solid #1a2535", padding: "24px", marginBottom: "16px" }}>
              <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px", marginBottom: "16px" }}>IMAGE UPLOAD</div>

              <label style={{
                display: "block", border: "1px dashed #1a2535", padding: "24px",
                textAlign: "center", cursor: "pointer", marginBottom: "16px",
                transition: "border-color 0.2s"
              }}>
                <input type="file" accept=".jpg,.jpeg,.png" onChange={handleFile} style={{ display: "none" }} />
                <div style={{ color: "#00d4aa", fontSize: "24px", marginBottom: "8px" }}>◫</div>
                <div style={{ color: "#4a6a8a", fontSize: "11px", fontFamily: "monospace", letterSpacing: "1px" }}>
                  {file ? file.name : "CLICK TO SELECT IMAGE (JPG/PNG)"}
                </div>
              </label>

              {preview && (
                <img src={preview} alt="preview" style={{
                  width: "100%", maxHeight: "250px", objectFit: "contain",
                  border: "1px solid #1a2535", marginBottom: "16px"
                }} />
              )}

              <button onClick={analyze} disabled={!file || loading} style={{
                width: "100%", background: !file || loading ? "#1a2535" : "#00d4aa",
                border: "none", color: !file || loading ? "#4a6a8a" : "#060a14",
                padding: "12px", fontFamily: "monospace", fontSize: "11px",
                letterSpacing: "3px", cursor: !file || loading ? "not-allowed" : "pointer",
                fontWeight: "700"
              }}>
                {loading ? "ANALYZING..." : "ANALYZE IMAGE"}
              </button>

              {error && (
                <div style={{ color: "#ff4444", fontSize: "10px", fontFamily: "monospace", marginTop: "12px", letterSpacing: "1px" }}>
                  ⚠ {error}
                </div>
              )}
            </div>

            {/* Image stats */}
            {result?.image_stats && (
              <div style={{ background: "#0a0e1a", border: "1px solid #1a2535", padding: "20px", fontFamily: "monospace" }}>
                <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px", marginBottom: "16px" }}>IMAGE STATISTICS</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  {[
                    { label: "MEAN R", value: result.image_stats.mean_r?.toFixed(3) },
                    { label: "MEAN G", value: result.image_stats.mean_g?.toFixed(3) },
                    { label: "MEAN B", value: result.image_stats.mean_b?.toFixed(3) },
                    { label: "STD R", value: result.image_stats.std_r?.toFixed(3) },
                    { label: "STD G", value: result.image_stats.std_g?.toFixed(3) },
                    { label: "CONTRAST", value: result.image_stats.contrast?.toFixed(2) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: "#060a14", border: "1px solid #1a2535", padding: "10px" }}>
                      <div style={{ color: "#2a4a6a", fontSize: "8px", letterSpacing: "2px" }}>{label}</div>
                      <div style={{ color: "#00d4aa", fontSize: "14px" }}>{value || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div>
            {result ? (
              <>
                {/* Diagnosis */}
                <div style={{ background: "#0a0e1a", border: "1px solid #1a2535", borderTop: `2px solid ${severityColor(result.classification.diagnosis)}`, padding: "24px", marginBottom: "16px", fontFamily: "monospace" }}>
                  <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px", marginBottom: "8px" }}>DIAGNOSIS</div>
                  <div style={{ color: "#e8f0fe", fontSize: "22px", fontWeight: "700", marginBottom: "16px" }}>
                    {result.classification.diagnosis}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ background: "#060a14", border: "1px solid #1a2535", padding: "12px" }}>
                      <div style={{ color: "#4a6a8a", fontSize: "8px", letterSpacing: "2px" }}>CONFIDENCE</div>
                      <div style={{ color: severityColor(result.classification.diagnosis), fontSize: "22px", fontWeight: "700" }}>
                        {(result.classification.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div style={{ background: "#060a14", border: "1px solid #1a2535", padding: "12px" }}>
                      <div style={{ color: "#4a6a8a", fontSize: "8px", letterSpacing: "2px" }}>DETECTIONS</div>
                      <div style={{ color: "#4a9eff", fontSize: "22px", fontWeight: "700" }}>
                        {result.detections?.total || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Probabilities chart */}
                <div style={{ background: "#0a0e1a", border: "1px solid #1a2535", padding: "20px", marginBottom: "16px" }}>
                  <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px", marginBottom: "16px" }}>DIAGNOSIS PROBABILITIES</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={probData} layout="vertical">
                      <XAxis type="number" domain={[0, 1]} tick={{ fill: "#4a6a8a", fontSize: 9, fontFamily: "monospace" }} axisLine={{ stroke: "#1a2535" }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: "#4a6a8a", fontSize: 9, fontFamily: "monospace" }} axisLine={{ stroke: "#1a2535" }} width={120} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="prob" name="Probability">
                        {probData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* S3 */}
                {result.s3_image && (
                  <div style={{ background: "#0a0e1a", border: "1px solid #1a2535", padding: "16px", fontFamily: "monospace" }}>
                    <div style={{ color: "#4a6a8a", fontSize: "9px", letterSpacing: "3px", marginBottom: "8px" }}>AWS S3 STORAGE</div>
                    <div style={{ color: "#00d4aa", fontSize: "10px" }}>✓ {result.s3_image}</div>
                    <div style={{ color: "#00d4aa", fontSize: "10px", marginTop: "4px" }}>✓ {result.s3_result}</div>
                  </div>
                )}
              </>
            ) : (
              <div style={{
                height: "400px", display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid #1a2535", color: "#2a4a6a", fontFamily: "monospace",
                fontSize: "11px", letterSpacing: "2px"
              }}>
                UPLOAD AN IMAGE TO ANALYZE
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}