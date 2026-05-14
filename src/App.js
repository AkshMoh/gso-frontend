import { useState } from "react";
import { Client, handle_file } from "@gradio/client";
import "./App.css";

function App() {

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");
  const [model, setModel] = useState("QDA");
  const [iterations, setIterations] = useState(10);

  // =========================
  // FILE UPLOAD
  // =========================

  const handleFileChange = (e) => {

    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    const allowedExtensions = [
      "csv",
      "xls",
      "xlsx"
    ];

    const extension = selectedFile.name
      .split(".")
      .pop()
      .toLowerCase();

    if (!allowedExtensions.includes(extension)) {

      setError(
        "❌ Please upload CSV/XLS/XLSX file."
      );

      return;
    }

    setFile(selectedFile);

    setFileName(selectedFile.name);

    setError("");

    setResults(null);

    setSummary("");
  };

  // =========================
  // PREDICT
  // =========================

  const handlePredict = async () => {

    if (!file) {

      setError(
        "❌ Please upload dataset first."
      );

      return;
    }

    setLoading(true);

    setError("");

    setResults(null);

    setSummary("");

    try {

      const client = await Client.connect(
        "Akshat-22-Mohit/gso-fault-predictor"
      );

      const response = await client.predict(
        "/predict_faults",
        {
          csv_file: handle_file(file),
          model_choice: model,
          iterations: iterations,
        }
      );

      console.log(response);

      const output = response.data;

      if (output && output.length >= 2) {

        setResults(output[0]);

        setSummary(output[1]);

      } else {

        throw new Error(
          "Invalid response format"
        );
      }

    } catch (err) {

      console.error(err);

      setError(
        "❌ " +
        (
          err.message ||
          "Prediction failed"
        )
      );

    } finally {

      setLoading(false);
    }
  };

  return (

    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0f172a, #111827, #1e293b)",
        color: "white",
        padding: "40px",
        fontFamily: "Poppins, sans-serif"
      }}
    >

      {/* HEADER */}

      <div
        style={{
          textAlign: "center",
          marginBottom: "40px"
        }}
      >

        <h1
          style={{
            fontSize: "52px",
            marginBottom: "10px",
            fontWeight: "800",
            background:
              "linear-gradient(to right, #38bdf8, #818cf8, #c084fc)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}
        >
          🐍 GSO Fault Predictor
        </h1>

        <p
          style={{
            fontSize: "18px",
            color: "#cbd5e1"
          }}
        >
          AI-powered Software Fault Prediction using
          Glider Snake Optimization
        </p>

      </div>

      {/* MAIN CARD */}

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(14px)",
          borderRadius: "24px",
          padding: "35px",
          boxShadow:
            "0 8px 32px rgba(0,0,0,0.4)",
          border:
            "1px solid rgba(255,255,255,0.08)"
        }}
      >

        {/* UPLOAD SECTION */}

        <div
          style={{
            marginBottom: "35px"
          }}
        >

          <h2
            style={{
              marginBottom: "20px",
              color: "#f8fafc"
            }}
          >
            📂 Upload Dataset
          </h2>

          <div
            style={{
              border:
                "2px dashed rgba(255,255,255,0.25)",
              borderRadius: "18px",
              padding: "35px",
              textAlign: "center",
              background:
                "rgba(255,255,255,0.03)"
            }}
          >

            <input
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileChange}
              style={{
                marginBottom: "20px",
                color: "white"
              }}
            />
<p
  style={{
    color: "#cd2aca",
    marginBottom: "15px"
  }}
>
  {results?.data?.length
    ? `Showing ${results.data.length} modules`
    : "Supported formats: CSV / XLS / XLSX"}
</p>
           
            

          </div>

          {fileName && (

            <div
              style={{
                marginTop: "18px",
                padding: "14px",
                background:
                  "rgba(34,197,94,0.12)",
                border:
                  "1px solid rgba(34,197,94,0.35)",
                borderRadius: "14px",
                color: "#4ade80",
                fontWeight: "600"
              }}
            >
              ✅ Selected File:
              {" "}
              {fileName}
            </div>
          )}

        </div>

        {/* OPTIONS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr",
            gap: "25px",
            marginBottom: "35px"
          }}
        >

          {/* MODEL */}

          <div
            style={{
              background:
                "rgba(255,255,255,0.04)",
              padding: "24px",
              borderRadius: "18px"
            }}
          >

            <h3
              style={{
                marginBottom: "15px"
              }}
            >
              🤖 Classifier
            </h3>

            <select
              value={model}
              onChange={(e) =>
                setModel(e.target.value)
              }
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                background: "#111827",
                color: "white",
                fontSize: "16px"
              }}
            >

              <option value="QDA">
                QDA
              </option>

              <option value="KNN">
                KNN
              </option>

              <option value="NB">
                Naive Bayes
              </option>

              <option value="RF">
                Random Forest
              </option>

            </select>

          </div>

          {/* ITERATIONS */}

          <div
            style={{
              background:
                "rgba(255,255,255,0.04)",
              padding: "24px",
              borderRadius: "18px"
            }}
          >

            <h3
              style={{
                marginBottom: "15px"
              }}
            >
              ⚙️ GSO Iterations
            </h3>

            <h1
              style={{
                color: "#38bdf8",
                marginTop: "0"
              }}
            >
              {iterations}
            </h1>

            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={iterations}
              onChange={(e) =>
                setIterations(
                  Number(e.target.value)
                )
              }
              style={{
                width: "100%"
              }}
            />

          </div>

        </div>

        {/* BUTTON */}

        <button
          onClick={handlePredict}
          disabled={loading || !file}
          style={{
            width: "100%",
            padding: "18px",
            background:
              loading
                ? "#475569"
                : "linear-gradient(to right, #06b6d4, #8b5cf6)",
            color: "white",
            border: "none",
            borderRadius: "18px",
            fontSize: "22px",
            fontWeight: "700",
            cursor:
              loading
                ? "not-allowed"
                : "pointer",
            transition: "0.3s",
            boxShadow:
              "0 8px 24px rgba(139,92,246,0.4)"
          }}
        >

          {loading
            ? "⏳ Running GSO..."
            : "🚀 Run GSO + Predict"}

        </button>

        {/* ERROR */}

        {error && (

          <div
            style={{
              marginTop: "30px",
              background:
                "rgba(239,68,68,0.12)",
              border:
                "1px solid rgba(239,68,68,0.35)",
              padding: "18px",
              borderRadius: "16px",
              color: "#f87171",
              fontWeight: "600"
            }}
          >
            {error}
          </div>
        )}

        {/* SUMMARY */}

        {summary && (

          <div
            style={{
              marginTop: "30px",
              background:
                "rgba(255,255,255,0.04)",
              padding: "24px",
              borderRadius: "18px"
            }}
          >

            <h2
              style={{
                marginBottom: "18px"
              }}
            >
              📋 Summary & Metrics
            </h2>

            <pre
              style={{
                whiteSpace: "pre-wrap",
                color: "#e2e8f0",
                lineHeight: "1.7",
                fontSize: "14px"
              }}
            >
              {summary}
            </pre>

          </div>
        )}

        {/* RESULTS */}

        {results &&
          results.data &&
          results.headers && (

          <div
            style={{
              marginTop: "35px",
              overflowX: "auto"
            }}
          >

            <h2
              style={{
                marginBottom: "20px"
              }}
            >
              📊 Predictions
            </h2>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                overflow: "hidden",
                borderRadius: "16px"
              }}
            >

              <thead>

                <tr
                  style={{
                    background:
                      "linear-gradient(to right, #06b6d4, #8b5cf6)"
                  }}
                >

                  {results.headers.map(
                    (header, index) => (

                    <th
                      key={index}
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        color: "white"
                      }}
                    >
                      {header}
                    </th>

                  ))}

                </tr>

              </thead>

              <tbody>

  {results.data.map((row, rowIndex) => (

                  <tr
                    key={rowIndex}
                    style={{
                      background:
                        rowIndex % 2 === 0
                          ? "rgba(255,255,255,0.03)"
                          : "rgba(255,255,255,0.06)"
                    }}
                  >

                    {row.map(
                      (cell, cellIndex) => (

                      <td
                        key={cellIndex}
                        style={{
                          padding: "14px",
                          borderBottom:
                            "1px solid rgba(255,255,255,0.06)",
                          color: "#e2e8f0"
                        }}
                      >
                        {cell}
                      </td>

                    ))}

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default App;