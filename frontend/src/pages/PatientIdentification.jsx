import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PatientIdentification.css";

const PatientIdentification = () => {
     const navigate = useNavigate();
  const [identificationType, setIdentificationType] = useState("abha");
  const [patientType, setPatientType] = useState("existing");

  const [formData, setFormData] = useState({
    abhaId: "",
    aadhaar: "",
    name: "",
    age: "",
    gender: "",
    contact: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleContinue = (e) => {
  e.preventDefault();

  navigate("/consent-privacy");
};
    // Later:
    // navigate("/next-page");


  return (
    <div className="patient-page">

      {/* ================= HEADER ================= */}

      <header className="main-header">

  <div className="brand">
    <div className="brand-logo">+</div>

    <div className="brand-text">
      <h2>MediKiosk</h2>
      <p>Smart Healthcare Assistant</p>
    </div>
  </div>

  <div className="patient-progress">
    <span className="progress-step completed">01</span>
    <span className="progress-line"></span>
    <span className="progress-step current">02</span>
    <span className="progress-line"></span>
    <span className="progress-step">03</span>
  </div>

  <div className="secure-label">
    🔒 Secure & Private
  </div>

</header>
      {/* ================= PAGE CONTENT ================= */}

      <main className="patient-content">

        {/* PAGE TITLE */}

        <div className="patient-title">

          <span className="page-tag">
            STEP 2 OF CONSULTATION
          </span>

          <h2>Patient Identification</h2>

          <p>
            Please identify yourself to continue with your healthcare
            consultation.
          </p>

        </div>


        {/* ================= IDENTIFICATION CARD ================= */}

        <section className="identification-card">

          {/* CARD HEADER */}

          <div className="card-header">

            <div className="card-icon">
              👤
            </div>

            <div>
              <h3>How would you like to identify?</h3>
              <p>
                Use your existing healthcare identity or register as a new
                patient.
              </p>
            </div>

          </div>


          {/* IDENTIFICATION OPTIONS */}

          <div className="identification-options">

            <button
              type="button"
              className={
                identificationType === "abha"
                  ? "id-option selected"
                  : "id-option"
              }
              onClick={() => setIdentificationType("abha")}
            >
              <span className="option-icon">🏥</span>

              <span>
                <strong>ABHA ID</strong>
                <small>Ayushman Bharat Health Account</small>
              </span>

              <span className="radio-circle">
                {identificationType === "abha" && "✓"}
              </span>
            </button>


            <button
              type="button"
              className={
                identificationType === "aadhaar"
                  ? "id-option selected"
                  : "id-option"
              }
              onClick={() => setIdentificationType("aadhaar")}
            >
              <span className="option-icon">🪪</span>

              <span>
                <strong>Aadhaar</strong>
                <small>Use your Aadhaar for identification</small>
              </span>

              <span className="radio-circle">
                {identificationType === "aadhaar" && "✓"}
              </span>
            </button>

          </div>


          {/* ================= ID INPUT ================= */}

          <div className="id-input-section">

            {identificationType === "abha" ? (
              <>
                <label>ABHA ID</label>

                <div className="input-with-action">

                  <input
                    type="text"
                    name="abhaId"
                    value={formData.abhaId}
                    onChange={handleChange}
                    placeholder="Enter your 14-digit ABHA ID"
                    maxLength="14"
                  />

                  <button type="button" className="scan-button">
                    ▣ Scan
                  </button>

                </div>

                <span className="input-hint">
                  Your ABHA ID helps us securely access your health records.
                </span>
              </>
            ) : (
              <>
                <label>Aadhaar Number</label>

                <div className="input-with-action">

                  <input
                    type="text"
                    name="aadhaar"
                    value={formData.aadhaar}
                    onChange={handleChange}
                    placeholder="Enter your 12-digit Aadhaar number"
                    maxLength="12"
                  />

                  <button type="button" className="scan-button">
                    ▣ Scan
                  </button>

                </div>

                <span className="input-hint">
                  Your Aadhaar information is used only for identification.
                </span>
              </>
            )}

          </div>


          {/* ================= DIVIDER ================= */}

          <div className="or-divider">
            <span>OR</span>
          </div>


          {/* ================= NEW PATIENT ================= */}

          <div className="patient-type">

            <button
              type="button"
              className={
                patientType === "new"
                  ? "patient-type-card selected"
                  : "patient-type-card"
              }
              onClick={() => setPatientType("new")}
            >

              <div className="new-patient-icon">
                +
              </div>

              <div>
                <strong>New Patient</strong>
                <p>
                  I am visiting MediKiosk for the first time.
                </p>
              </div>

              <span className="radio-circle">
                {patientType === "new" && "✓"}
              </span>

            </button>


            <button
              type="button"
              className={
                patientType === "existing"
                  ? "patient-type-card selected"
                  : "patient-type-card"
              }
              onClick={() => setPatientType("existing")}
            >

              <div className="existing-patient-icon">
                ✓
              </div>

              <div>
                <strong>Existing Patient</strong>
                <p>
                  I already have a MediKiosk patient record.
                </p>
              </div>

              <span className="radio-circle">
                {patientType === "existing" && "✓"}
              </span>

            </button>

          </div>


          {/* ================= BASIC DETAILS ================= */}

          <div className="details-section">

            <div className="details-heading">
              <div>
                <h3>Basic Patient Details</h3>
                <p>Please provide the following information.</p>
              </div>

              <span>Required fields *</span>
            </div>


            <form onSubmit={handleContinue}>

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Full Name <span>*</span>
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Age <span>*</span>
                  </label>

                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="Enter age"
                    min="0"
                    max="120"
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Gender <span>*</span>
                  </label>

                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      Select gender
                    </option>

                    <option value="male">
                      Male
                    </option>

                    <option value="female">
                      Female
                    </option>

                    <option value="other">
                      Other
                    </option>

                    <option value="prefer-not">
                      Prefer not to say
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Contact Number <span>*</span>
                  </label>

                  <input
                    type="tel"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                    placeholder="Enter mobile number"
                    maxLength="10"
                    required
                  />

                </div>

              </div>


              {/* EXISTING RECOGNITION */}

              {patientType === "existing" && (
                <div className="recognition-message">

                  <div className="recognition-icon">
                    ✓
                  </div>

                  <div>
                    <strong>Existing patient recognition</strong>

                    <p>
                      If your details match an existing record,
                      MediKiosk will securely recognize your profile
                      and continue your consultation.
                    </p>
                  </div>

                </div>
              )}


              {/* ================= ACTIONS ================= */}

              <div className="form-actions">

                <button
                  type="button"
                  className="back-button"
                  onClick={() => window.history.back()}
                >
                  ← Back
                </button>

                <button
                  type="submit"
                  className="continue-button"
                >
                  Continue
                  <span>→</span>
                </button>

              </div>

            </form>

          </div>

        </section>


        {/* PRIVACY NOTE */}

        <div className="privacy-note">

          <span>🔒</span>

          <p>
            Your information is securely handled and used only for
            providing healthcare assistance.
          </p>

        </div>

      </main>


      {/* ================= FOOTER ================= */}

     <footer className="main-footer">

  <div className="footer-top">

    <div className="footer-brand">

      <div className="footer-logo">
        +
      </div>

      <div>
        <h3>MediKiosk</h3>
        <p>Smart Healthcare Assistant</p>
      </div>

    </div>

    <div className="footer-links">

      <div>
        <h4>Navigation</h4>
        <a href="/">Home</a>
        <a href="#patient">Patient Identification</a>
      </div>

      <div>
        <h4>Assistance</h4>
        <button type="button">Voice Assistance</button>
        <button type="button">Accessibility</button>
        <button type="button">Get Help</button>
      </div>

      <div>
        <h4>Security</h4>
        <p>✓ Privacy protected</p>
        <p>✓ Secure consultation</p>
        <p>✓ Patient-first design</p>
      </div>

    </div>

  </div>

  <div className="footer-bottom">

    <span>
      © 2026 MediKiosk. Smart Healthcare Assistance.
    </span>

    <span>
      Your privacy and security matter to us.
    </span>

  </div>

</footer>

    </div>
  );
};

export default PatientIdentification;