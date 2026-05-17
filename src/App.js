import { useState } from "react";
import { Client, handle_file } from "@gradio/client";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from "recharts";
import "./App.css";

const ACCENT = "#00c896";
const DANGER = "#ff4d6d";
const WARN = "#f59e0b";
const INFO = "#3b82f6";
const BG = "#f0f4f8";
const CARD = "#ffffff";
const TEXT = "#1e293b";
const MUTED = "#94a3b8";

function StatBox({ label, value, color }) {
  return (
    <div style={{
      background: CARD,
      borderRadius: "12px",
      padding: "20px 24px",
      flex: 1,
      borderLeft: `4px solid ${color}`,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    }}>
      <div style={{ color: MUTED, fontSize: "11px", fontWeight: "600",
        letterSpacing: "1px", marginBottom: "6px" }}>{label}</div>
      <div style={{ color: TEXT, fontSize: "28px", fontWeight: "800" }}>{value}</div>
    </div>
  );
}

function Tag({ name }) {
  return (
    <span style={{
      background: "#f0fdf4",
      border: "1px solid #bbf7d0",
      color: "#15803d",
      padding: "3px 10px",
      borderRadius: "6px",
      fontSize: "11px",
      fontFamily: "monospace",
      margin: "3px",
      display: "inline-block",
    }}>{name}</span>
  );
}

export default function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [predictFile, setPredictFile] = useState(null);
  const [predictFileName, setPredictFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [model, setModel] = useState("RF");
  const [iterations, setIterations] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [metrics, setMetrics] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [faultStats, setFaultStats] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setFileName(f.name);
    setError("");
    setMetrics(null);
    setPredictions([]);
    setSelectedFeatures([]);
    setFaultStats(null);
  };

  const parseSummary = (summaryText, tableData) => {
    const getVal = (label) => {
      const regex = new RegExp(`${label}\\s*:\\s*([\\d.]+%?)`);
      const match = summaryText.match(regex);
      return match ? match[1] : "0";
    };

    const acc = parseFloat(getVal("Accuracy")) || 0;
    const f1 = parseFloat(getVal("F1-Score")) || 0;
    const prec = parseFloat(getVal("Precision")) || 0;
    const rec = parseFloat(getVal("Recall")) || 0;
    const faulty = parseInt(getVal("Faulty")) || 0;
    const notFaulty = parseInt(getVal("Not Faulty")) || 0;
    const faultRate = parseFloat(getVal("Fault Rate")) || 0;

    const featMatch = summaryText.match(/Features Used\s*:\s*([^\n]+)/);
    const feats = featMatch
      ? featMatch[1].trim().split(",").map(f => f.trim()).filter(Boolean)
      : [];

    const redMatch = summaryText.match(/Reduction\s*:\s*([\d.]+)%/);
    const reduction = redMatch ? redMatch[1] : "N/A";

    const selMatch = summaryText.match(/Selected Features\s*:\s*(\d+)\s*\/\s*(\d+)/);
    const selCount = selMatch ? selMatch[1] : "?";
    const totalCount = selMatch ? selMatch[2] : "?";

    setMetrics({
      accuracy: acc.toFixed(1),
      f1: f1.toFixed(3),
      precision: prec.toFixed(3),
      recall: rec.toFixed(3),
      reduction,
      selCount,
      totalCount,
      barData: [
        { name: "Accuracy", value: +(acc / 100).toFixed(3) },
        { name: "F1", value: +f1.toFixed(3) },
        { name: "Precision", value: +prec.toFixed(3) },
        { name: "Recall", value: +rec.toFixed(3) },
      ]
    });

    setSelectedFeatures(feats);
    setFaultStats({
      faulty, notFaulty, faultRate,
      pieData: [
        { name: "Fault-prone", value: faulty },
        { name: "Safe", value: notFaulty },
      ]
    });

    if (tableData?.data && tableData?.headers) {
      const faultCol = tableData.headers.findIndex(h =>
        h.toLowerCase().includes("fault")
      );
      setPredictions(tableData.data.map((row, i) => ({
        module: `Module ${i + 1}`,
        raw: faultCol >= 0 ? row[faultCol] : "N/A",
        isFaulty: faultCol >= 0 && row[faultCol].includes("FAULTY"),
      })));
    }
  };

  const handlePredict = async () => {
    if (!file) { setError("Upload a training dataset first."); return; }
    setLoading(true);
    setError("");
    setMetrics(null);
    setPredictions([]);
    setSelectedFeatures([]);
    setFaultStats(null);

    try {
      const client = await Client.connect("Akshat-22-Mohit/gso-fault-predictor");
      const response = await client.predict("/predict_faults", {
        csv_file: handle_file(file),
        model_choice: model,
        iterations: iterations,
      });
      const output = response.data;
      if (!output || output.length < 2) throw new Error("Invalid response");
      parseSummary(output[1], output[0]);
    } catch (err) {
      setError(err.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const filtered = predictions.filter(p =>
    p.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.isFaulty ? "fault" : "safe").includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ background: BG, minHeight: "100vh",
      fontFamily: "'Inter', 'Segoe UI', sans-serif", color: TEXT }}>

      {/* HEADER */}
      <div style={{
        background: "#0f172a",
        padding: "0 40px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>🐍</span>
          <span style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>
            GSO Fault Predictor
          </span>
          <span style={{
            background: ACCENT + "22",
            color: ACCENT,
            fontSize: "10px",
            padding: "2px 8px",
            borderRadius: "4px",
            fontWeight: "700",
            letterSpacing: "1px",
          }}>BETA</span>
        </div>
        <div style={{ color: "#475569", fontSize: "12px" }}>
          Glider Snake Optimization · Software Fault Detection
        </div>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 60px)" }}>

        {/* SIDEBAR */}
        <div style={{
          width: "280px",
          minWidth: "280px",
          background: CARD,
          borderRight: "1px solid #e2e8f0",
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          overflowY: "auto",
        }}>

          <div style={{ fontSize: "11px", color: MUTED,
            fontWeight: "700", letterSpacing: "1px" }}>CONFIGURATION</div>

          {/* TRAINING FILE */}
          <div>
            <div style={{ fontSize: "12px", fontWeight: "600",
              color: TEXT, marginBottom: "8px" }}>Training Dataset *</div>
            <label style={{
              display: "block",
              border: `2px dashed ${file ? ACCENT : "#e2e8f0"}`,
              borderRadius: "10px",
              padding: "16px",
              textAlign: "center",
              cursor: "pointer",
              background: file ? "#f0fdf4" : "#fafafa",
              transition: "all 0.2s",
            }}>
              <input type="file" style={{ display: "none" }} onChange={handleFileChange} />
              <div style={{ fontSize: "24px", marginBottom: "6px" }}>
                {file ? "✅" : "📄"}
              </div>
              <div style={{ fontSize: "12px", color: file ? "#15803d" : MUTED }}>
                {fileName || "Click to upload CSV/XLS/XLSX"}
              </div>
            </label>
          </div>

          {/* OPTIONAL PREDICT FILE */}
          <div>
            <div style={{ fontSize: "12px", fontWeight: "600",
              color: TEXT, marginBottom: "4px" }}>New Modules
              <span style={{ color: MUTED, fontWeight: "400" }}> (optional)</span>
            </div>
            <div style={{ fontSize: "11px", color: MUTED, marginBottom: "8px" }}>
              Upload unlabeled modules for real prediction
            </div>
            <label style={{
              display: "block",
              border: `2px dashed ${predictFile ? INFO : "#e2e8f0"}`,
              borderRadius: "10px",
              padding: "12px",
              textAlign: "center",
              cursor: "pointer",
              background: predictFile ? "#eff6ff" : "#fafafa",
            }}>
              <input type="file" style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) { setPredictFile(f); setPredictFileName(f.name); }
                }} />
              <div style={{ fontSize: "12px", color: predictFile ? "#1d4ed8" : MUTED }}>
                {predictFileName || "Upload prediction target"}
              </div>
            </label>
          </div>

          {/* CLASSIFIER */}
          <div>
            <div style={{ fontSize: "12px", fontWeight: "600",
              color: TEXT, marginBottom: "8px" }}>Classifier</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              {[
                { key: "RF", label: "Random Forest" },
                { key: "QDA", label: "QDA" },
                { key: "KNN", label: "KNN" },
                { key: "NB", label: "Naive Bayes" },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setModel(key)}
                  style={{
                    padding: "10px 8px",
                    borderRadius: "8px",
                    border: model === key
                      ? `2px solid ${ACCENT}`
                      : "1px solid #e2e8f0",
                    background: model === key ? "#f0fdf4" : "white",
                    color: model === key ? "#15803d" : TEXT,
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: model === key ? "700" : "400",
                    transition: "all 0.15s",
                  }}>
                  {key}
                </button>
              ))}
            </div>
          </div>

          {/* ITERATIONS */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between",
              marginBottom: "8px" }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: TEXT }}>
                GSO Iterations
              </div>
              <div style={{ fontSize: "14px", fontWeight: "800", color: ACCENT }}>
                {iterations}
              </div>
            </div>
            <input type="range" min="5" max="30" step="5"
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              style={{ width: "100%", accentColor: ACCENT }} />
            <div style={{ display: "flex", justifyContent: "space-between",
              fontSize: "10px", color: MUTED, marginTop: "4px" }}>
              <span>Faster</span>
              <span>More accurate</span>
            </div>
          </div>

          {/* RUN */}
          <button onClick={handlePredict} disabled={loading || !file}
            style={{
              padding: "14px",
              borderRadius: "10px",
              border: "none",
              background: loading || !file ? "#e2e8f0" : "#0f172a",
              color: loading || !file ? MUTED : "white",
              fontWeight: "700",
              fontSize: "14px",
              cursor: loading || !file ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}>
            {loading ? "⏳ Scanning..." : "▶ Run GSO Scan"}
          </button>

          {error && (
            <div style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "10px 12px",
              color: DANGER,
              fontSize: "12px",
            }}>⚠ {error}</div>
          )}
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, padding: "28px", overflowY: "auto" }}>

          {/* EMPTY STATE */}
          {!metrics && !loading && (
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              height: "70%", gap: "16px",
            }}>
              <div style={{ fontSize: "64px" }}>🔍</div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: "#334155" }}>
                No analysis yet
              </div>
              <div style={{ color: MUTED, fontSize: "14px", textAlign: "center",
                maxWidth: "400px", lineHeight: "1.6" }}>
                Upload a software metrics CSV and run the GSO scan to detect
                fault-prone modules automatically.
              </div>
              <div style={{
                background: CARD, border: "1px solid #e2e8f0",
                borderRadius: "10px", padding: "16px 24px",
                fontSize: "12px", color: MUTED, lineHeight: "1.8",
              }}>
                <b style={{ color: TEXT }}>Supported datasets:</b> NASA MDP (CM1, JM1,
                KC1, MW1, PC1–PC5...) and any custom software metrics CSV
              </div>
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div style={{
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              height: "70%", gap: "16px",
            }}>
              <div style={{ fontSize: "48px" }}>⚙️</div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: TEXT }}>
                GSO Feature Selection Running...
              </div>
              <div style={{ color: MUTED }}>Typically 30–60 seconds</div>
              <div style={{
                width: "300px", height: "4px",
                background: "#e2e8f0", borderRadius: "2px", overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", width: "60%",
                  background: ACCENT, borderRadius: "2px",
                  animation: "none",
                }} />
              </div>
            </div>
          )}

          {/* RESULTS */}
          {metrics && !loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* TOP STATS */}
              <div style={{ display: "flex", gap: "12px" }}>
                <StatBox label="ACCURACY" value={`${metrics.accuracy}%`} color={ACCENT} />
                <StatBox label="F1 SCORE" value={metrics.f1} color={INFO} />
                <StatBox label="PRECISION" value={metrics.precision} color={WARN} />
                <StatBox label="RECALL" value={metrics.recall} color={DANGER} />
              </div>

              {/* CHARTS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

                {/* PIE */}
                {faultStats && (
                  <div style={{
                    background: CARD, borderRadius: "14px",
                    padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}>
                    <div style={{ fontWeight: "700", marginBottom: "4px" }}>
                      Fault Distribution
                    </div>
                    <div style={{ color: MUTED, fontSize: "12px", marginBottom: "16px" }}>
                      {faultStats.faulty} fault-prone · {faultStats.notFaulty} safe modules
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={faultStats.pieData}
                          cx="50%" cy="50%"
                          innerRadius={55} outerRadius={80}
                          dataKey="value">
                          <Cell fill={DANGER} />
                          <Cell fill={ACCENT} />
                        </Pie>
                        <Tooltip />
                        <Legend formatter={(v) => (
                          <span style={{ color: TEXT, fontSize: "12px" }}>{v}</span>
                        )} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* BAR */}
                <div style={{
                  background: CARD, borderRadius: "14px",
                  padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}>
                  <div style={{ fontWeight: "700", marginBottom: "4px" }}>
                    Model Performance
                  </div>
                  <div style={{ color: MUTED, fontSize: "12px", marginBottom: "16px" }}>
                    Classifier: {model}
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={metrics.barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: MUTED }} />
                      <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: MUTED }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {metrics.barData.map((_, i) => (
                          <Cell key={i}
                            fill={[ACCENT, INFO, WARN, DANGER][i]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* FEATURES */}
              {selectedFeatures.length > 0 && (
                <div style={{
                  background: CARD, borderRadius: "14px",
                  padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontWeight: "700" }}>GSO Selected Features</div>
                      <div style={{ color: MUTED, fontSize: "12px" }}>
                        {metrics.selCount} of {metrics.totalCount} features · {metrics.reduction}% reduction
                      </div>
                    </div>
                    <div style={{
                      background: "#f0fdf4", color: "#15803d",
                      padding: "4px 12px", borderRadius: "6px",
                      fontSize: "12px", fontWeight: "600",
                    }}>
                      {metrics.reduction}% reduced
                    </div>
                  </div>
                  <div>
                    {selectedFeatures.map((f, i) => <Tag key={i} name={f} />)}
                  </div>
                </div>
              )}

              {/* PREDICTIONS TABLE */}
              {predictions.length > 0 && (
                <div style={{
                  background: CARD, borderRadius: "14px",
                  padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: "16px" }}>
                    <div>
                      <div style={{ fontWeight: "700" }}>Module Scan Results</div>
                      <div style={{ color: MUTED, fontSize: "12px" }}>
                        {faultStats?.faulty} fault-prone out of {predictions.length} modules
                      </div>
                    </div>
                    <input
                      placeholder="Search modules..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        border: "1px solid #e2e8f0", borderRadius: "8px",
                        padding: "8px 12px", fontSize: "13px",
                        outline: "none", width: "180px", color: TEXT,
                        background: "#fafafa",
                      }} />
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["Module", "Status", "Risk Level"].map(h => (
                          <th key={h} style={{
                            padding: "10px 14px", textAlign: "left",
                            fontSize: "11px", fontWeight: "700",
                            color: MUTED, letterSpacing: "0.5px",
                            borderBottom: "1px solid #e2e8f0",
                          }}>{h.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((p, i) => (
                        <tr key={i} style={{
                          borderBottom: "1px solid #f1f5f9",
                        }}>
                          <td style={{ padding: "12px 14px",
                            fontSize: "13px", color: "#334155",
                            fontFamily: "monospace" }}>
                            {p.module}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{
                              background: p.isFaulty ? "#fef2f2" : "#f0fdf4",
                              color: p.isFaulty ? DANGER : "#15803d",
                              border: `1px solid ${p.isFaulty ? "#fecaca" : "#bbf7d0"}`,
                              padding: "3px 10px",
                              borderRadius: "5px",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}>
                              {p.isFaulty ? "⚠ Fault-prone" : "✓ Safe"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px",
                            fontSize: "13px",
                            color: p.isFaulty ? DANGER : ACCENT,
                            fontWeight: "600" }}>
                            {p.isFaulty ? "HIGH" : "LOW"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SCAN LOG */}
              <div style={{
                background: "#0f172a", borderRadius: "14px",
                padding: "20px", fontFamily: "monospace",
              }}>
                <div style={{ color: ACCENT, fontSize: "11px",
                  letterSpacing: "1px", marginBottom: "12px" }}>
                  $ SCAN LOG
                </div>
                {[
                  `algorithm   = GSO (Glider Snake Optimization)`,
                  `classifier  = ${model}`,
                  `accuracy    = ${metrics.accuracy}%`,
                  `precision   = ${metrics.precision}`,
                  `recall      = ${metrics.recall}`,
                  `f1_score    = ${metrics.f1}`,
                  `modules     = ${predictions.length}`,
                  `features    = ${metrics.selCount}/${metrics.totalCount} selected`,
                  `reduction   = ${metrics.reduction}%`,
                  `status      = SCAN COMPLETE ✓`,
                ].map((line, i) => (
                  <div key={i} style={{
                    color: "#94a3b8", fontSize: "12px",
                    lineHeight: "2", display: "flex", gap: "8px",
                  }}>
                    <span style={{ color: "#475569" }}>›</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}