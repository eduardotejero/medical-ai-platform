import { useState, useEffect } from "react"
import Header from "../components/Header"
import axios from "axios"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const BACKEND = "http://localhost:8000"
const COLORS = ["#0066CC", "#2196F3", "#7C3AED", "#F59E0B", "#EF4444", "#10B981", "#EC4899"]

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E0", padding: "10px 14px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", fontSize: "14px" }}>
        <div style={{ color: "#4A5568", marginBottom: "4px" }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</div>
        ))}
      </div>
    )
  }
  return null
}

const DIAGNOSES = ["Melanocytic Nevi", "Melanoma", "Benign Keratosis", "Basal Cell Carcinoma", "Actinic Keratosis", "Vascular Lesion", "Dermatofibroma"]
const SEVERITY = { "Melanocytic Nevi": 1, "Melanoma": 5, "Benign Keratosis": 1, "Basal Cell Carcinoma": 3, "Actinic Keratosis": 3, "Vascular Lesion": 2, "Dermatofibroma": 1 }

function TrainPanel({ onTrained }) {
  const [status, setStatus] = useState(null)  // null | "idle" | "training" | "done" | "error"
  const [result, setResult] = useState(null)
  const [modelTrained, setModelTrained] = useState(false)

  useEffect(() => {
    axios.get(`${BACKEND}/api/v1/ml/status`)
      .then(r => setModelTrained(r.data.trained))
      .catch(() => {})
  }, [])

  const train = async () => {
    setStatus("training")
    setResult(null)
    try {
      const r = await axios.post(`${BACKEND}/api/v1/ml/train`)
      setResult(r.data)
      setModelTrained(true)
      setStatus("done")
      if (onTrained) onTrained(r.data)
    } catch (e) {
      setStatus("error")
    }
  }

  const fiData = result?.feature_importance
    ? Object.entries(result.feature_importance)
        .map(([k, v]) => ({ feature: k, importance: v }))
        .sort((a, b) => b.importance - a.importance)
    : []

  return (
    <div style={{ background: "#F0F4F8", border: "1px solid #CBD5E0", padding: "24px", marginBottom: "24px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <div style={{ color: "#4A5568", fontSize: "12px", letterSpacing: "3px", marginBottom: "4px" }}>REAL MODEL TRAINING</div>
          <div style={{ color: "#1A202C", fontSize: "16px", fontWeight: "700" }}>Logistic Regression + Random Forest + Gradient Boosting · HAM10000</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{
            fontSize: "12px", letterSpacing: "1px",
            color: modelTrained ? "#10B981" : "#F59E0B",
          }}>
            {modelTrained ? "● MODEL TRAINED" : "○ NOT TRAINED"}
          </span>
          <button onClick={train} disabled={status === "training"} style={{
            background: status === "training" ? "#CBD5E0" : "#0066CC",
            border: "none", color: status === "training" ? "#4A5568" : "#FFFFFF",
            padding: "10px 28px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            fontSize: "14px", letterSpacing: "2px", fontWeight: "700",
            cursor: status === "training" ? "not-allowed" : "pointer",
          }}>
            {status === "training" ? "TRAINING..." : modelTrained ? "RETRAIN" : "TRAIN MODEL"}
          </button>
        </div>
      </div>

      {status === "training" && (
        <div style={{ color: "#0066CC", fontSize: "13px", letterSpacing: "2px" }}>
          ⟳ Training Logistic Regression + Random Forest + Gradient Boosting on {" "}
          <span style={{ fontWeight: "700" }}>HAM10000 dataset</span>... this may take ~60s
        </div>
      )}

      {status === "error" && (
        <div style={{ color: "#EF4444", fontSize: "13px" }}>⚠ Training failed. Check backend logs.</div>
      )}

      {result && status === "done" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
            <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E0", padding: "14px" }}>
              <div style={{ color: "#4A5568", fontSize: "11px", letterSpacing: "2px" }}>SAMPLES</div>
              <div style={{ color: "#1A202C", fontSize: "22px", fontWeight: "700" }}>{result.samples?.toLocaleString()}</div>
            </div>
            {result.runs?.map((r, i) => (
              <div key={i} style={{ background: "#FFFFFF", border: "1px solid #CBD5E0", borderTop: `2px solid ${COLORS[i]}`, padding: "14px" }}>
                <div style={{ color: "#4A5568", fontSize: "11px", letterSpacing: "2px", marginBottom: "4px" }}>{r.name.toUpperCase()}</div>
                <div style={{ color: COLORS[i], fontSize: "22px", fontWeight: "700" }}>{(r.accuracy * 100).toFixed(2)}%</div>
                <div style={{ color: "#718096", fontSize: "12px" }}>CV: {(r.cv_mean * 100).toFixed(2)}%</div>
              </div>
            ))}
          </div>

          {fiData.length > 0 && (
            <div>
              <div style={{ color: "#4A5568", fontSize: "11px", letterSpacing: "3px", marginBottom: "12px" }}>FEATURE IMPORTANCE</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={fiData} layout="vertical">
                  <XAxis type="number" domain={[0, Math.max(...fiData.map(d => d.importance)) * 1.1]}
                    tick={{ fill: "#4A5568", fontSize: 11, fontFamily: "system-ui" }} axisLine={{ stroke: "#CBD5E0" }} />
                  <YAxis dataKey="feature" type="category"
                    tick={{ fill: "#4A5568", fontSize: 11, fontFamily: "system-ui" }} axisLine={{ stroke: "#CBD5E0" }} width={110} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="importance" name="Importance">
                    {fiData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const MODEL_OPTIONS = [
  { value: "",                   label: "Best Model (auto)" },
  { value: "logistic-regression", label: "Logistic Regression" },
  { value: "random-forest",       label: "Random Forest" },
  { value: "gradient-boosting",   label: "Gradient Boosting" },
]

function softmaxPredict(inputs) {
  const { age, gender, fitzpatrick_type: fitz, lesion_diameter: diameter, uv_exposure: uvExp, abcde_score: abcde } = inputs
  const isMale = gender === "M"
  const scores = {
    "Melanocytic Nevi": 2.5, "Melanoma": 0.5, "Benign Keratosis": 0.5,
    "Basal Cell Carcinoma": -0.5, "Actinic Keratosis": -1.0,
    "Vascular Lesion": -2.0, "Dermatofibroma": -2.0,
  }
  const abcdeN = (abcde - 1) / 9
  scores["Melanoma"] += abcdeN * 3.0; scores["Basal Cell Carcinoma"] += abcdeN * 2.0
  scores["Actinic Keratosis"] += abcdeN * 1.5; scores["Melanocytic Nevi"] -= abcdeN * 2.0
  const uvN = (uvExp - 1) / 9
  scores["Melanoma"] += uvN * 2.0; scores["Actinic Keratosis"] += uvN * 2.5
  const dN = Math.min((diameter - 2) / 28, 1)
  scores["Melanoma"] += dN * 2.0; scores["Basal Cell Carcinoma"] += dN * 1.5; scores["Melanocytic Nevi"] -= dN * 1.0
  const fitzFair = Math.max(0, (3 - fitz) / 2)
  scores["Melanoma"] += fitzFair * 1.5; scores["Actinic Keratosis"] += fitzFair * 1.0
  const ageN = Math.min((age - 14) / 56, 1)
  scores["Basal Cell Carcinoma"] += ageN * 2.0; scores["Actinic Keratosis"] += ageN * 1.5; scores["Melanocytic Nevi"] -= ageN * 1.0
  if (isMale) scores["Melanoma"] += 0.3
  const maxS = Math.max(...Object.values(scores))
  const exps = {}; let total = 0
  for (const [d, s] of Object.entries(scores)) { exps[d] = Math.exp(s - maxS); total += exps[d] }
  const probs = DIAGNOSES.map(d => ({ diagnosis: d, probability: exps[d] / total }))
    .sort((a, b) => b.probability - a.probability)
  return { prediction: probs[0].diagnosis, confidence: probs[0].probability, probabilities: probs }
}

function PredictionSimulator() {
  const [inputs, setInputs] = useState({
    age: 45, gender: "M", fitzpatrick_type: 3,
    lesion_diameter: 8.0, uv_exposure: 5.0, abcde_score: 5.0,
  })
  const [modelName, setModelName] = useState("")
  const [modelTrained, setModelTrained] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    axios.get(`${BACKEND}/api/v1/ml/status`)
      .then(r => setModelTrained(r.data.trained))
      .catch(() => {})
  }, [])

  const set = (key, val) => setInputs(prev => ({ ...prev, [key]: val }))

  const predict = async () => {
    setLoading(true)
    if (modelTrained) {
      try {
        const payload = {
          age: parseFloat(inputs.age),
          gender: inputs.gender,
          fitzpatrick_type: parseInt(inputs.fitzpatrick_type),
          lesion_diameter: parseFloat(inputs.lesion_diameter),
          uv_exposure: parseFloat(inputs.uv_exposure),
          abcde_score: parseFloat(inputs.abcde_score),
          model_name: modelName || null,
        }
        const r = await axios.post(`${BACKEND}/api/v1/ml/predict`, payload)
        setResult({
          prediction: r.data.prediction,
          confidence: r.data.confidence,
          severity: SEVERITY[r.data.prediction] || 1,
          probabilities: r.data.probabilities,
          source: "model",
          modelUsed: MODEL_OPTIONS.find(o => o.value === modelName)?.label || "Best Model",
        })
        setLoading(false)
        return
      } catch (e) {}
    }
    // Fallback simulator
    setTimeout(() => {
      const res = softmaxPredict(inputs)
      setResult({ ...res, severity: SEVERITY[res.prediction] || 1, source: "simulator" })
      setLoading(false)
    }, 600)
  }

  const severityColor = (s) => s >= 4 ? "#EF4444" : s >= 3 ? "#F59E0B" : "#0066CC"
  const inputStyle = {
    width: "100%", background: "#FFFFFF", border: "1px solid #CBD5E0",
    color: "#1A202C", padding: "8px 12px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    fontSize: "14px", outline: "none", boxSizing: "border-box",
  }
  const labelStyle = { color: "#4A5568", fontSize: "11px", letterSpacing: "2px", marginBottom: "6px" }

  return (
    <div style={{ background: "#F0F4F8", border: "1px solid #CBD5E0", padding: "24px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <div style={{ color: "#4A5568", fontSize: "12px", letterSpacing: "3px" }}>ML PREDICTION SIMULATOR</div>
          <div style={{ fontSize: "11px", marginTop: "2px", color: modelTrained ? "#10B981" : "#F59E0B" }}>
            {modelTrained ? "● REAL MODEL ACTIVE" : "○ SIMULATOR MODE (train model above)"}
          </div>
        </div>
      </div>

      {/* Row 1: Age, Gender, Fitzpatrick */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div>
          <div style={labelStyle}>AGE (years)</div>
          <input type="number" min="1" max="120" value={inputs.age}
            onChange={e => set("age", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>GENDER</div>
          <select value={inputs.gender} onChange={e => set("gender", e.target.value)} style={inputStyle}>
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>
        <div>
          <div style={labelStyle}>FITZPATRICK TYPE (1–6)</div>
          <select value={inputs.fitzpatrick_type} onChange={e => set("fitzpatrick_type", e.target.value)} style={inputStyle}>
            <option value={1}>Type I — Very fair</option>
            <option value={2}>Type II — Fair</option>
            <option value={3}>Type III — Medium</option>
            <option value={4}>Type IV — Olive</option>
            <option value={5}>Type V — Brown</option>
            <option value={6}>Type VI — Dark</option>
          </select>
        </div>
      </div>

      {/* Row 2: Clinical inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
        <div>
          <div style={labelStyle}>LESION DIAMETER (mm)</div>
          <input type="number" min="1" max="30" step="0.5" value={inputs.lesion_diameter}
            onChange={e => set("lesion_diameter", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>UV EXPOSURE (1–10)</div>
          <input type="number" min="1" max="10" step="0.5" value={inputs.uv_exposure}
            onChange={e => set("uv_exposure", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>ABCDE SCORE (1–10)</div>
          <input type="number" min="1" max="10" step="0.5" value={inputs.abcde_score}
            onChange={e => set("abcde_score", e.target.value)} style={inputStyle} />
        </div>
      </div>

      {/* Row 3: Model selector + button */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", alignItems: "end", marginBottom: result ? "20px" : "0" }}>
        <div>
          <div style={labelStyle}>MODEL</div>
          <select value={modelName} onChange={e => setModelName(e.target.value)} style={inputStyle}
            disabled={!modelTrained} title={!modelTrained ? "Train a model first" : ""}>
            {MODEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <button onClick={predict} disabled={loading} style={{
          background: loading ? "#CBD5E0" : "#0066CC",
          border: "none", color: loading ? "#4A5568" : "#FFFFFF",
          padding: "8px 28px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          fontSize: "14px", letterSpacing: "2px", cursor: loading ? "not-allowed" : "pointer",
          fontWeight: "700", height: "38px",
        }}>
          {loading ? "PROCESSING..." : "PREDICT"}
        </button>
      </div>

      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <div style={{ marginBottom: "12px" }}>
              <div style={{ color: "#4A5568", fontSize: "11px", letterSpacing: "2px", marginBottom: "4px" }}>PREDICTION</div>
              <div style={{ color: "#1A202C", fontSize: "20px", fontWeight: "700" }}>{result.prediction}</div>
              {result.source === "model" && (
                <div style={{ color: "#10B981", fontSize: "11px", marginTop: "2px" }}>● {result.modelUsed}</div>
              )}
              {result.source === "simulator" && (
                <div style={{ color: "#F59E0B", fontSize: "11px", marginTop: "2px" }}>○ Softmax Simulator</div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E0", padding: "12px" }}>
                <div style={{ color: "#4A5568", fontSize: "11px", letterSpacing: "2px" }}>CONFIDENCE</div>
                <div style={{ color: "#0066CC", fontSize: "22px", fontWeight: "700" }}>{(result.confidence * 100).toFixed(1)}%</div>
              </div>
              <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E0", padding: "12px" }}>
                <div style={{ color: "#4A5568", fontSize: "11px", letterSpacing: "2px" }}>SEVERITY</div>
                <div style={{ color: severityColor(result.severity), fontSize: "22px", fontWeight: "700" }}>{result.severity}/5</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ color: "#4A5568", fontSize: "11px", letterSpacing: "2px", marginBottom: "8px" }}>PROBABILITIES</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={result.probabilities} layout="vertical">
                <XAxis type="number" domain={[0, 1]} tick={{ fill: "#4A5568", fontSize: 11, fontFamily: "system-ui" }} axisLine={{ stroke: "#CBD5E0" }} />
                <YAxis dataKey="diagnosis" type="category" tick={{ fill: "#4A5568", fontSize: 11, fontFamily: "system-ui" }} axisLine={{ stroke: "#CBD5E0" }} width={130} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="probability" name="Probability">
                  {result.probabilities.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

function MLflowPanel({ trainResults }) {
  // Real runs from actual training — merged with demo CNN experiment
  const realRuns = trainResults?.runs?.map(r => ({
    name: r.name, accuracy: r.accuracy, cv_mean: r.cv_mean, status: "FINISHED", real: true,
  })) || null

  const experiments = [
    {
      name: "dermatology-skin-lesion",
      runs: realRuns || [
        { name: "logistic-regression", accuracy: null, cv_mean: null, status: "NOT RUN" },
        { name: "random-forest",       accuracy: null, cv_mean: null, status: "NOT RUN" },
        { name: "gradient-boosting",   accuracy: null, cv_mean: null, status: "NOT RUN" },
      ]
    },
    {
      name: "cnn-dermatology",
      runs: [{ name: "resnet18-transfer-learning", accuracy: 0.5679, cv_mean: null, status: "FINISHED" }]
    }
  ]

  return (
    <div style={{ background: "#F0F4F8", border: "1px solid #CBD5E0", padding: "24px", marginTop: "24px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ color: "#4A5568", fontSize: "12px", letterSpacing: "3px" }}>MLFLOW EXPERIMENT TRACKING</div>
        {trainResults?.samples && (
          <div style={{ color: "#718096", fontSize: "12px" }}>
            Best: <span style={{ color: "#0066CC", fontWeight: "700" }}>{trainResults.best_model}</span>
            {" · "}{trainResults.samples?.toLocaleString()} samples
          </div>
        )}
      </div>
      {experiments.map((exp, i) => (
        <div key={i} style={{ marginBottom: "20px" }}>
          <div style={{ color: "#2196F3", fontSize: "14px", marginBottom: "8px", letterSpacing: "1px" }}>
            ◎ {exp.name}
          </div>
          {exp.runs.map((run, j) => (
            <div key={j} style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: "8px", padding: "8px 12px",
              background: "#FFFFFF", border: "1px solid #CBD5E0", marginBottom: "4px"
            }}>
              <div style={{ color: "#1A202C", fontSize: "13px" }}>{run.name}</div>
              <div>
                <div style={{ color: "#718096", fontSize: "11px" }}>ACCURACY</div>
                <div style={{ color: run.accuracy !== null ? "#0066CC" : "#CBD5E0", fontSize: "14px" }}>
                  {run.accuracy !== null ? `${(run.accuracy * 100).toFixed(2)}%` : "—"}
                </div>
              </div>
              <div>
                <div style={{ color: "#718096", fontSize: "11px" }}>CV MEAN</div>
                <div style={{ color: run.cv_mean !== null ? "#2196F3" : "#CBD5E0", fontSize: "14px" }}>
                  {run.cv_mean !== null ? `${(run.cv_mean * 100).toFixed(2)}%` : "—"}
                </div>
              </div>
              <div style={{ color: run.status === "FINISHED" ? "#10B981" : "#F59E0B", fontSize: "12px", letterSpacing: "1px", alignSelf: "center" }}>
                {run.status === "FINISHED" ? "●" : "○"} {run.status}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const MODEL_LABELS = [
  { key: "logistic-regression", label: "LOGISTIC REGRESSION" },
  { key: "random-forest",       label: "RANDOM FOREST" },
  { key: "gradient-boosting",   label: "GRADIENT BOOSTING" },
]

export default function MachineLearning() {
  const [stats, setStats] = useState(null)
  const [trainResults, setTrainResults] = useState(null)

  useEffect(() => {
    axios.get(`${BACKEND}/api/v1/analysis/statistics`).then(r => setStats(r.data)).catch(() => {})
    axios.get(`${BACKEND}/api/v1/ml/results`).then(r => setTrainResults(r.data)).catch(() => {})
  }, [])

  const handleTrained = (data) => setTrainResults({ ...data, trained: true })

  const diagnosisData = stats?.diagnosis_distribution
    ? Object.entries(stats.diagnosis_distribution).map(([name, count]) => ({ name, count }))
    : []

  // Build model card data: find matching run from results, else show placeholder
  const modelCards = MODEL_LABELS.map((m, i) => {
    const run = trainResults?.runs?.find(r => r.name === m.key)
    return { ...m, accuracy: run?.accuracy ?? null, cv_mean: run?.cv_mean ?? null, color: COLORS[i] }
  })

  return (
    <div style={{ flex: 1, background: "#FFFFFF", minHeight: "100vh" }}>
      <Header title="ML Models & Predictions" subtitle="SCIKIT-LEARN · MLFLOW" />
      <div style={{ padding: "32px" }}>

        {/* Model cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
          {modelCards.map((m, i) => (
            <div key={i} style={{
              background: "#F0F4F8", border: "1px solid #CBD5E0",
              borderTop: `2px solid ${m.color}`, padding: "20px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif"
            }}>
              <div style={{ color: "#4A5568", fontSize: "12px", letterSpacing: "2px", marginBottom: "8px" }}>{m.label}</div>
              <div style={{ color: m.accuracy !== null ? "#1A202C" : "#CBD5E0", fontSize: "30px", fontWeight: "700" }}>
                {m.accuracy !== null
                  ? <>{(m.accuracy * 100).toFixed(2)}<span style={{ fontSize: "14px", color: "#4A5568" }}>%</span></>
                  : "—"}
              </div>
              <div style={{ color: "#4A5568", fontSize: "13px", marginTop: "4px" }}>
                CV MEAN: {m.cv_mean !== null ? `${(m.cv_mean * 100).toFixed(2)}%` : "—"}
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        {diagnosisData.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            <div style={{ background: "#F0F4F8", border: "1px solid #CBD5E0", padding: "20px" }}>
              <div style={{ color: "#4A5568", fontSize: "12px", letterSpacing: "3px", marginBottom: "16px" }}>DIAGNOSIS DISTRIBUTION</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={diagnosisData} layout="vertical" margin={{ left: 4, right: 8 }}>
                  <XAxis type="number" tick={{ fill: "#4A5568", fontSize: 11, fontFamily: "system-ui" }} axisLine={{ stroke: "#CBD5E0" }} />
                  <YAxis dataKey="name" type="category" interval={0} tick={{ fill: "#4A5568", fontSize: 10, fontFamily: "system-ui" }} axisLine={{ stroke: "#CBD5E0" }} width={170} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Count">
                    {diagnosisData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: "#F0F4F8", border: "1px solid #CBD5E0", padding: "20px" }}>
              <div style={{ color: "#4A5568", fontSize: "12px", letterSpacing: "3px", marginBottom: "16px" }}>DISTRIBUTION PIE</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={diagnosisData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {diagnosisData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Real model training */}
        <TrainPanel onTrained={handleTrained} />

        {/* Prediction simulator */}
        <PredictionSimulator />
        <MLflowPanel trainResults={trainResults} />

      </div>
    </div>
  )
}
