import { useState } from "react";
import { Client } from "@gradio/client";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from "recharts";

// =========================
// COLORS
// =========================
const COLORS = {
  red: "#e74c3c",
  green: "#27ae60",
  blue: "#2980b9",
  dark: "#1a1a2e",
  card: "#16213e",
  border: "#0f3460",
  text: "#e0e0e0",
  muted: "#8892a4",
  accent: "#e74c3c",
};

// =========================
// METRIC CARD
// =========================
function MetricCard({ label, value, color }) {
  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderRadius: "12px",
      padding: "20px",
      textAlign: "center",
      flex: 1,
      minWidth: "120px",
    }}>
      <div style={{ color: color || COLORS.accent, fontSize: "28px", fontWeight: "bold" }}>
        {value}
      </div>
      <div style={{ color: COLORS.muted, fontSize: "12px", marginTop: "6px", letterSpacing: "1px" }}>
        {label}
      </div>
    </div>
  );
}

// =========================
// STEP INDICATOR
// =========================
function StepBar({ step }) {
  const steps = ["Connect", "Upload", "Run GSO", "Done"];
  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px" }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            background: i < step ? COLORS.green : i === step ? COLORS.accent : COLORS.border,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", color: "white", fontWeight: "bold",
            transition: "background 0.3s"
          }}>
            {i < step ? "✓" : i + 1}
          </div>
          <span style={{ color: i <= step ? COLORS.text : COLORS.muted, fontSize: "13px" }}>{s}</span>
          {i < steps.length - 1 && (
            <div style={{
              width: "30px", height: "2px",
              background: i < step ? COLORS.green : COLORS.border
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// =========================
// CSV DOWNLOAD
// =========================
function downloadCSV(results) {
  if (!results || !results.headers || !results.data) return;
  const rows = [results.headers.join(",")];
  results.data.forEach(row => {
    rows.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","));
  });
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "gso_fault_predictions.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// =========================
// MAIN APP
// =========================
function App() {

  const [trainFile, setTrainFile] = useState(null);
  const [trainFileName, setTrainFileName] = useState("");
  const [predictFile, setPredictFile] = useState(null);
  const [predictFileName, setPredictFileName] = useState("");

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const [results, setResults] = useState(null);
  const [summary, setSummary] = useState("");
  const [metrics, setMetrics] = useState(null);
  const [faultStats, setFaultStats] = useState(null);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [mode, setMode] = useState("");

  const [error, setError] = useState("");
  const [model, setModel] = useState("QDA");
  const [iterations, setIterations] = useState(10);

  // =========================
  // PARSE SUMMARY
  // =========================
  const parseSummary = (text) => {
    const acc = text.match(/Accuracy\s*:\s*([\d.]+)%/)?.[1];
    const prec = text.match(/Precision\s*:\s*([\d.]+)/)?.[1];
    const rec = text.match(/Recall\s*:\s*([\d.]+)/)?.[1];
    const f1 = text.match(/F1-Score\s*:\s*([\d.]+)/)?.[1];
    const faulty = text.match(/Faulty\s*:\s*(\d+)/)?.[1];
    const notFaulty = text.match(/Not Faulty\s*:\s*(\d+)/)?.[1];
    const featLine = text.match(/Features Used\s*:\s*(.+)/)?.[1];
    const modeMatch = text.match(/\[(.+?)\]/)?.[1];

    if (acc) setMetrics({
      acc: parseFloat(acc).toFixed(1),
      prec: parseFloat(prec).toFixed(3),
      rec: parseFloat(rec).toFixed(3),
      f1: parseFloat(f1).toFixed(3),
    });

    if (faulty && notFaulty) setFaultStats({
      faulty: parseInt(faulty),
      notFaulty: parseInt(notFaulty),
    });

    if (featLine) {
      setSelectedFeatures(featLine.split(",").map(f => f.trim()).filter(Boolean));
    }

    if (modeMatch) setMode(modeMatch);
  };

  // =========================
  // FILE HANDLERS
  // =========================
  const handleTrainFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["csv", "xls", "xlsx"].includes(ext)) {
      setError("❌ Please upload CSV/XLS/XLSX file.");
      return;
    }
    setTrainFile(f);
    setTrainFileName(f.name);
    setError("");
    setResults(null);
    setSummary("");
    setMetrics(null);
    setFaultStats(null);
  };

  const handlePredictFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["csv", "xls", "xlsx"].includes(ext)) {
      setError("❌ Please upload CSV/XLS/XLSX file.");
      return;
    }
    setPredictFile(f);
    setPredictFileName(f.name);
    setError("");
  };

  // =========================
  // PREDICT
  // =========================
  const handlePredict = async () => {
    if (!trainFile) {
      setError("❌ Please upload training dataset first.");
      return;
    }

    setLoading(true);
    setStep(0);
    setError("");
    setResults(null);
    setSummary("");
    setMetrics(null);
    setFaultStats(null);

    try {

      setStep(1); // Connect
      const client = await Client.connect("Akshat-22-Mohit/gso-fault-predictor");

      setStep(2); // Upload + Run GSO
      const response = await client.predict("/predict_faults", [
        trainFile,
        predictFile || null,
        model,
        iterations,
      ]);

      setStep(3); // Done
      console.log("Response:", response);

      const output = response.data;

      if (output && output.length >= 2) {
        setResults(output[0]);
        setSummary(output[1]);
        parseSummary(output[1]);
      } else {
        throw new Error("Invalid response format");
      }

    } catch (err) {
      console.error(err);
      setError("❌ " + (err.message || "Prediction failed"));
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // CHART DATA
  // =========================
  const pieData = faultStats ? [
    { name: "Faulty", value: faultStats.faulty },
    { name: "Not Faulty", value: faultStats.notFaulty },
  ] : [];

  const barData = metrics ? [
    { name: "Accuracy", value: parseFloat(metrics.acc) },
    { name: "Precision", value: parseFloat((metrics.prec * 100).toFixed(1)) },
    { name: "Recall", value: parseFloat((metrics.rec * 100).toFixed(1)) },
    { name: "F1-Score", value: parseFloat((metrics.f1 * 100).toFixed(1)) },
  ] : [];

  // =========================
  // RENDER
  // =========================
  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.dark,
      color: COLORS.text,
      fontFamily: "'Segoe UI', sans-serif",
      padding: "30px 20px",
    }}>

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* HEADER */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "8px" }}>
            <span style={{ fontSize: "36px" }}>🐍</span>
            <h1 style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: "700",
              color: COLORS.text,
              letterSpacing: "-0.5px"
            }}>
              GSO Fault Predictor
            </h1>
            {mode && (
              <span style={{
                background: mode === "Validation Mode" ? "#2980b9" : COLORS.green,
                color: "white",
                fontSize: "11px",
                padding: "4px 10px",
                borderRadius: "20px",
                fontWeight: "600",
                letterSpacing: "0.5px"
              }}>
                {mode}
              </span>
            )}
          </div>
          <p style={{ color: COLORS.muted, margin: 0, fontSize: "14px" }}>
            GSO-based software fault prediction — upload historical data to train, optionally upload new modules to predict.
          </p>
        </div>

        {/* UPLOAD SECTION */}
        <div style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "16px",
          padding: "28px",
          marginBottom: "20px",
        }}>

          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "24px" }}>

            {/* TRAINING FILE */}
            <div style={{ flex: 1, minWidth: "260px" }}>
              <div style={{
                fontSize: "11px", letterSpacing: "2px",
                color: COLORS.muted, marginBottom: "10px", fontWeight: "600"
              }}>
                📚 TRAINING DATASET (REQUIRED)
              </div>
              <label style={{
                display: "block",
                border: `2px dashed ${trainFile ? COLORS.green : COLORS.border}`,
                borderRadius: "12px",
                padding: "20px",
                textAlign: "center",
                cursor: "pointer",
                background: trainFile ? "rgba(39,174,96,0.05)" : "rgba(255,255,255,0.02)",
                transition: "all 0.2s",
              }}>
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handleTrainFile}
                  style={{ display: "none" }}
                />
                {trainFile ? (
                  <div>
                    <div style={{ fontSize: "24px", marginBottom: "6px" }}>✅</div>
                    <div style={{ color: COLORS.green, fontSize: "13px", fontWeight: "600" }}>
                      {trainFileName}
                    </div>
                    <div style={{ color: COLORS.muted, fontSize: "11px", marginTop: "4px" }}>
                      Click to change
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>📂</div>
                    <div style={{ color: COLORS.muted, fontSize: "13px" }}>
                      Upload labeled training CSV
                    </div>
                    <div style={{ color: COLORS.border, fontSize: "11px", marginTop: "4px" }}>
                      CSV · XLS · XLSX
                    </div>
                  </div>
                )}
              </label>
            </div>

            {/* PREDICT FILE */}
            <div style={{ flex: 1, minWidth: "260px" }}>
              <div style={{
                fontSize: "11px", letterSpacing: "2px",
                color: COLORS.muted, marginBottom: "10px", fontWeight: "600"
              }}>
                🔮 NEW MODULES TO PREDICT (OPTIONAL)
              </div>
              <label style={{
                display: "block",
                border: `2px dashed ${predictFile ? "#8e44ad" : COLORS.border}`,
                borderRadius: "12px",
                padding: "20px",
                textAlign: "center",
                cursor: "pointer",
                background: predictFile ? "rgba(142,68,173,0.05)" : "rgba(255,255,255,0.02)",
                transition: "all 0.2s",
              }}>
                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={handlePredictFile}
                  style={{ display: "none" }}
                />
                {predictFile ? (
                  <div>
                    <div style={{ fontSize: "24px", marginBottom: "6px" }}>🔮</div>
                    <div style={{ color: "#8e44ad", fontSize: "13px", fontWeight: "600" }}>
                      {predictFileName}
                    </div>
                    <div style={{ color: COLORS.muted, fontSize: "11px", marginTop: "4px" }}>
                      Click to change
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>🔮</div>
                    <div style={{ color: COLORS.muted, fontSize: "13px" }}>
                      Upload unlabeled modules
                    </div>
                    <div style={{ color: COLORS.border, fontSize: "11px", marginTop: "4px" }}>
                      Skip to validate on training data
                    </div>
                  </div>
                )}
              </label>
            </div>

          </div>

          {/* CONTROLS */}
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "center" }}>

            <div>
              <div style={{ fontSize: "11px", letterSpacing: "1.5px", color: COLORS.muted, marginBottom: "8px" }}>
                🤖 CLASSIFIER
              </div>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{
                  background: COLORS.dark,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.text,
                  padding: "10px 16px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <option value="QDA">QDA — Quadratic Discriminant</option>
                <option value="KNN">KNN — K-Nearest Neighbors</option>
                <option value="NB">NB — Naive Bayes</option>
                <option value="RF">RF — Random Forest</option>
              </select>
            </div>

            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ fontSize: "11px", letterSpacing: "1.5px", color: COLORS.muted, marginBottom: "8px" }}>
                ⚙️ GSO ITERATIONS: <span style={{ color: COLORS.accent }}>{iterations}</span>
              </div>
              <input
                type="range" min="5" max="30" step="5"
                value={iterations}
                onChange={(e) => setIterations(Number(e.target.value))}
                style={{ width: "100%", accentColor: COLORS.accent }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", color: COLORS.muted, fontSize: "11px" }}>
                <span>5 (faster)</span>
                <span>30 (better)</span>
              </div>
            </div>

          </div>

        </div>

        {/* ERROR */}
        {error && (
          <div style={{
            background: "rgba(231,76,60,0.1)",
            border: "1px solid rgba(231,76,60,0.3)",
            borderRadius: "10px",
            padding: "14px 18px",
            marginBottom: "20px",
            color: "#e74c3c",
            fontSize: "14px",
          }}>
            {error}
          </div>
        )}

        {/* RUN BUTTON */}
        <button
          onClick={handlePredict}
          disabled={loading || !trainFile}
          style={{
            width: "100%",
            padding: "18px",
            background: loading || !trainFile
              ? COLORS.border
              : `linear-gradient(135deg, ${COLORS.accent}, #c0392b)`,
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "18px",
            fontWeight: "700",
            cursor: loading || !trainFile ? "not-allowed" : "pointer",
            marginBottom: "28px",
            letterSpacing: "0.5px",
            transition: "all 0.2s",
          }}
        >
          {loading ? "⏳ Running GSO + Predicting..." : "🔍 Run GSO + Predict"}
        </button>

        {/* STEP BAR — shown when loading */}
        {loading && <StepBar step={step} />}

        {/* =====================
            RESULTS SECTION
        ===================== */}
        {metrics && (
          <div>

            {/* METRIC CARDS */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
              <MetricCard label="ACCURACY" value={`${metrics.acc}%`} color={COLORS.green} />
              <MetricCard label="PRECISION" value={metrics.prec} color={COLORS.blue} />
              <MetricCard label="RECALL" value={metrics.rec} color="#e67e22" />
              <MetricCard label="F1-SCORE" value={metrics.f1} color="#8e44ad" />
              {faultStats && (
                <>
                  <MetricCard label="FAULTY" value={faultStats.faulty} color={COLORS.red} />
                  <MetricCard label="NOT FAULTY" value={faultStats.notFaulty} color={COLORS.green} />
                </>
              )}
            </div>

            {/* CHARTS ROW */}
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "24px" }}>

              {/* PIE CHART */}
              {faultStats && (
                <div style={{
                  background: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "16px",
                  padding: "20px",
                  flex: "1",
                  minWidth: "260px",
                }}>
                  <div style={{ fontSize: "13px", color: COLORS.muted, marginBottom: "12px", fontWeight: "600" }}>
                    🔴 FAULT DISTRIBUTION
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        <Cell fill={COLORS.red} />
                        <Cell fill={COLORS.green} />
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}
                        labelStyle={{ color: COLORS.text }}
                      />
                      <Legend wrapperStyle={{ color: COLORS.text, fontSize: "12px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* BAR CHART */}
              <div style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "16px",
                padding: "20px",
                flex: "2",
                minWidth: "300px",
              }}>
                <div style={{ fontSize: "13px", color: COLORS.muted, marginBottom: "12px", fontWeight: "600" }}>
                  🎯 MODEL PERFORMANCE (%)
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} barSize={36}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                    <XAxis dataKey="name" tick={{ fill: COLORS.muted, fontSize: 12 }} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: COLORS.muted, fontSize: 12 }} axisLine={false} />
                    <Tooltip
                      contentStyle={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: "8px" }}
                      labelStyle={{ color: COLORS.text }}
                      formatter={(v) => [`${v}%`]}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {barData.map((_, i) => (
                        <Cell key={i} fill={[COLORS.green, COLORS.blue, "#e67e22", "#8e44ad"][i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </div>

            {/* SELECTED FEATURES */}
            {selectedFeatures.length > 0 && (
              <div style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "24px",
              }}>
                <div style={{ fontSize: "13px", color: COLORS.muted, marginBottom: "12px", fontWeight: "600" }}>
                  🧬 GSO SELECTED FEATURES (top 5 shown)
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {selectedFeatures.map((f, i) => (
                    <span key={i} style={{
                      background: "rgba(231,76,60,0.1)",
                      border: "1px solid rgba(231,76,60,0.3)",
                      color: COLORS.accent,
                      padding: "6px 14px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* FULL SUMMARY */}
            <div style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "24px",
            }}>
              <div style={{ fontSize: "13px", color: COLORS.muted, marginBottom: "12px", fontWeight: "600" }}>
                📋 FULL SUMMARY
              </div>
              <pre style={{
                whiteSpace: "pre-wrap",
                fontFamily: "'Courier New', monospace",
                fontSize: "13px",
                color: COLORS.text,
                margin: 0,
                lineHeight: "1.7",
              }}>
                {summary}
              </pre>
            </div>

            {/* PREDICTIONS TABLE */}
            {results && results.data && results.headers && (
              <div style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "24px",
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                  gap: "12px",
                }}>
                  <div style={{ fontSize: "13px", color: COLORS.muted, fontWeight: "600" }}>
                    📊 MODULE-WISE PREDICTIONS (showing first 50)
                  </div>
                  <button
                    onClick={() => downloadCSV(results)}
                    style={{
                      background: "rgba(39,174,96,0.1)",
                      border: "1px solid rgba(39,174,96,0.3)",
                      color: COLORS.green,
                      padding: "8px 18px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    ⬇ Download Full CSV
                  </button>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr>
                        {results.headers.map((h, i) => (
                          <th key={i} style={{
                            padding: "10px 12px",
                            textAlign: "left",
                            color: COLORS.muted,
                            fontSize: "11px",
                            letterSpacing: "1px",
                            fontWeight: "600",
                            borderBottom: `1px solid ${COLORS.border}`,
                            whiteSpace: "nowrap",
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.data.slice(0, 50).map((row, ri) => {
                        const isFaulty = row[row.length - 1] === "FAULTY";
                        return (
                          <tr key={ri} style={{
                            background: isFaulty
                              ? "rgba(231,76,60,0.07)"
                              : ri % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                          }}>
                            {row.map((cell, ci) => {
                              const isLabel = ci === row.length - 1;
                              return (
                                <td key={ci} style={{
                                  padding: "9px 12px",
                                  borderBottom: `1px solid rgba(15,52,96,0.5)`,
                                  color: isLabel
                                    ? (cell === "FAULTY" ? COLORS.red : COLORS.green)
                                    : COLORS.text,
                                  fontWeight: isLabel ? "700" : "400",
                                  whiteSpace: "nowrap",
                                }}>
                                  {isLabel ? (cell === "FAULTY" ? "🔴 FAULTY" : "🟢 NOT FAULTY") : String(cell)}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* FOOTER */}
        <div style={{ textAlign: "center", color: COLORS.muted, fontSize: "12px", marginTop: "40px" }}>
          Algorithm: Glider Snake Optimization (GSO) &nbsp;·&nbsp; Models: QDA · KNN · NB · RF
        </div>

      </div>
    </div>
  );
}

export default App;