import { useState } from "react";
import { useNavigate } from "react-router-dom";

function DocumentScan() {
  const navigate = useNavigate();

  const [category, setCategory] = useState("");
  const [file, setFile] = useState(null);

  return (
    <div className="page">

      <header className="header">
        <div className="logo">
          <div className="logoIcon">+</div>

          <div>
            <h2>MediKiosk</h2>
            <span>Smart Healthcare Assistant</span>
          </div>
        </div>

        <div className="headerActions">
          <button>English ▾</button>
          <button>🔊 Voice Assistance</button>
          <button>♿</button>
        </div>
      </header>

      <main className="main">

        <div className="stepInfo">
          <span>STEP 5 OF 6</span>
          <span>DOCUMENT SCANNING</span>
        </div>

        <div className="progress">
          <div
            className="progressActive"
            style={{ width: "83%" }}
          />
        </div>

        <div className="titleRow">

          <div>
            <p className="welcome">
              ● MEDICAL DOCUMENTS
            </p>

            <h1>
              Have any medical
              <br />
              documents?
            </h1>

            <p className="subtitle">
              Scan or upload prescriptions, lab reports,
              or discharge summaries.
            </p>
          </div>

          <div className="aiIcon">
            ▣
          </div>

        </div>

        <section className="documentCard">

          <h2>
            What would you like to add?
          </h2>

          <div className="documentTypes">

            <button
              className={
                category === "Prescription"
                  ? "docType selected"
                  : "docType"
              }
              onClick={() =>
                setCategory("Prescription")
              }
            >
              <span>💊</span>
              <b>Prescription</b>
              <small>Medicines & dosage</small>
            </button>

            <button
              className={
                category === "Lab Report"
                  ? "docType selected"
                  : "docType"
              }
              onClick={() =>
                setCategory("Lab Report")
              }
            >
              <span>🧪</span>
              <b>Lab Report</b>
              <small>Blood tests & reports</small>
            </button>

            <button
              className={
                category === "Discharge Summary"
                  ? "docType selected"
                  : "docType"
              }
              onClick={() =>
                setCategory("Discharge Summary")
              }
            >
              <span>🏥</span>
              <b>Discharge Summary</b>
              <small>Hospital records</small>
            </button>

          </div>

          <div className="scanArea">

            <div className="cameraIcon">
              📷
            </div>

            <h2>
              Scan your document
            </h2>

            <p>
              Place your document clearly in front
              of the camera
            </p>

            <button className="scanButton">
              📷 Open Camera
            </button>

            <label className="uploadButton">

              📁 Upload from device

              <input
                type="file"
                hidden
                onChange={(e) =>
                  setFile(e.target.files[0])
                }
              />

            </label>

          </div>

          {file && (
            <div className="uploadedDocument">

              <div>
                <b>
                  📄 {file.name}
                </b>

                <p>
                  {category || "Document"}
                </p>
              </div>

              <span className="ocrStatus">
                ✓ OCR Ready
              </span>

            </div>
          )}

        </section>

        <div className="navigation">

          <button
            className="secondaryButton"
            onClick={() =>
              navigate("/ai-history")
            }
          >
            ← Back
          </button>

          <button
            className="primaryButton"
            onClick={() =>
              navigate("/review-confirm")
            }
          >
            Continue →
          </button>

        </div>

      </main>

    </div>
  );
}

export default DocumentScan;