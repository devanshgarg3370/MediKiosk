import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ConsentPrivacy.css";

const ConsentPrivacy = () => {
  const navigate = useNavigate();

  const [consents, setConsents] = useState({
    clinical: false,
    documents: false,
    hospital: false,
    abha: false,
  });

  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const toggleConsent = (key) => {
    setConsents({
      ...consents,
      [key]: !consents[key],
    });
  };

  const toggleVoice = () => {
    const nextState = !voiceEnabled;
    setVoiceEnabled(nextState);

    if (nextState && "speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance(
        "Please review the privacy information and choose which permissions you want to provide."
      );

      speech.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(speech);
    }
  };

  const handleContinue = (e) => {
    e.preventDefault();

    const allAccepted = Object.values(consents).every(Boolean);

    if (!allAccepted) {
      alert("Please review and accept all required permissions to continue.");
      return;
    }

    navigate("/ai-history");
  };

  const handleDecline = () => {
    const confirmDecline = window.confirm(
      "Some healthcare services may not be available without consent. Do you want to go back?"
    );

    if (confirmDecline) {
      navigate("/patient-identification");
    }
  };

  return (
    <div className="consent-page">

      {/* ================= HEADER ================= */}

      <header className="consent-header">

        <div className="consent-brand">

          <div className="consent-logo">
            +
          </div>

          <div className="consent-brand-text">
            <h2>MediKiosk</h2>
            <p>Smart Healthcare Assistance</p>
          </div>

        </div>


        <div className="consent-progress">

          <div className="progress-item completed">
            <span>✓</span>
            <small>Identification</small>
          </div>

          <div className="progress-line active"></div>

          <div className="progress-item completed">
            <span>✓</span>
            <small>Patient Details</small>
          </div>

          <div className="progress-line active"></div>

          <div className="progress-item current">
            <span>03</span>
            <small>Consent</small>
          </div>

        </div>


        <div className="secure-label">
          🔒 Secure & Private
        </div>

      </header>


      {/* ================= MAIN ================= */}

      <main className="consent-content">

        <div className="consent-title">

          <span className="page-tag">
            STEP 3 OF CONSULTATION
          </span>

          <h1>Consent & Privacy</h1>

          <p>
            Please review how your information will be used and
            choose the permissions you are comfortable providing.
          </p>

        </div>


        {/* ================= DATA EXPLANATION ================= */}

        <section className="consent-card">

          <div className="card-heading">

            <div className="heading-icon">
              🔐
            </div>

            <div>
              <h2>Your data, your choice</h2>

              <p>
                We only collect information needed to provide
                healthcare assistance and improve your consultation.
              </p>
            </div>

          </div>


          {/* ================= VOICE ================= */}

          <div className="voice-section">

            <div className="voice-info">

              <div className="voice-icon">
                🔊
              </div>

              <div>
                <strong>Listen to privacy explanation</strong>

                <p>
                  Hear this information in your selected language.
                </p>
              </div>

            </div>

            <button
              type="button"
              className={`voice-button ${
                voiceEnabled ? "voice-active" : ""
              }`}
              onClick={toggleVoice}
            >
              {voiceEnabled ? "Voice On" : "▶ Play Explanation"}
            </button>

          </div>


          {/* ================= INFORMATION ================= */}

          <div className="information-box">

            <h3>What information may be collected?</h3>

            <div className="information-grid">

              <div className="info-item">
                <span>👤</span>
                <div>
                  <strong>Patient Details</strong>
                  <p>
                    Name, age, gender and contact information.
                  </p>
                </div>
              </div>

              <div className="info-item">
                <span>📋</span>
                <div>
                  <strong>Clinical Information</strong>
                  <p>
                    Health history and information required for consultation.
                  </p>
                </div>
              </div>

              <div className="info-item">
                <span>📄</span>
                <div>
                  <strong>Documents</strong>
                  <p>
                    Medical documents may be scanned when required.
                  </p>
                </div>
              </div>

              <div className="info-item">
                <span>🏥</span>
                <div>
                  <strong>Healthcare Records</strong>
                  <p>
                    Information may be shared with the hospital system
                    when permitted.
                  </p>
                </div>
              </div>

            </div>

          </div>


          {/* ================= CONSENTS ================= */}

          <div className="permissions-section">

            <div className="permissions-heading">

              <div>
                <h2>Permissions</h2>
                <p>
                  Please review each permission before continuing.
                </p>
              </div>

              <span>
                Required
              </span>

            </div>


            {/* CLINICAL */}

            <button
              type="button"
              className={`permission-card ${
                consents.clinical ? "accepted" : ""
              }`}
              onClick={() => toggleConsent("clinical")}
            >

              <div className="permission-icon">
                🩺
              </div>

              <div className="permission-text">

                <strong>
                  Clinical history collection
                </strong>

                <p>
                  Allow MediKiosk to collect relevant health history
                  for your consultation.
                </p>

              </div>

              <div className="checkbox">
                {consents.clinical && "✓"}
              </div>

            </button>


            {/* DOCUMENT */}

            <button
              type="button"
              className={`permission-card ${
                consents.documents ? "accepted" : ""
              }`}
              onClick={() => toggleConsent("documents")}
            >

              <div className="permission-icon">
                📄
              </div>

              <div className="permission-text">

                <strong>
                  Document scanning / OCR
                </strong>

                <p>
                  Allow medical documents to be scanned and converted
                  into readable information.
                </p>

              </div>

              <div className="checkbox">
                {consents.documents && "✓"}
              </div>

            </button>


            {/* HOSPITAL */}

            <button
              type="button"
              className={`permission-card ${
                consents.hospital ? "accepted" : ""
              }`}
              onClick={() => toggleConsent("hospital")}
            >

              <div className="permission-icon">
                🏥
              </div>

              <div className="permission-text">

                <strong>
                  Share with hospital / HIS
                </strong>

                <p>
                  Allow relevant information to be shared with the
                  hospital healthcare information system.
                </p>

              </div>

              <div className="checkbox">
                {consents.hospital && "✓"}
              </div>

            </button>


            {/* ABHA */}

            <button
              type="button"
              className={`permission-card ${
                consents.abha ? "accepted" : ""
              }`}
              onClick={() => toggleConsent("abha")}
            >

              <div className="permission-icon">
                🔗
              </div>

              <div className="permission-text">

                <strong>
                  ABDM / ABHA integration
                </strong>

                <p>
                  Allow your healthcare information to interact with
                  supported ABDM / ABHA services.
                </p>

              </div>

              <div className="checkbox">
                {consents.abha && "✓"}
              </div>

            </button>

          </div>


          {/* ================= PRIVACY ================= */}

          <div className="privacy-security">

            <div className="security-icon">
              🔒
            </div>

            <div>

              <h3>
                Your privacy & security
              </h3>

              <p>
                Your information is handled securely and is used only
                for providing healthcare assistance. You can review
                your choices before continuing.
              </p>

              <div className="security-points">

                <span>✓ Secure data handling</span>
                <span>✓ Privacy protected</span>
                <span>✓ Patient-controlled consent</span>

              </div>

            </div>

          </div>


          {/* ================= ACTIONS ================= */}

          <div className="consent-actions">

            <button
              type="button"
              className="decline-button"
              onClick={handleDecline}
            >
              ← Back
            </button>

            <button
              type="button"
              className="accept-button"
              onClick={handleContinue}
            >
              Accept & Continue
              <span>→</span>
            </button>

          </div>

        </section>


        <div className="bottom-note">
          🔒 Your choices are securely recorded for this consultation.
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

export default ConsentPrivacy;