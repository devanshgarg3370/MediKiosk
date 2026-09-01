import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PatientIdentification from "../pages/PatientIdentification";
import "./Landing.css";


const Landing = () => {
  const navigate = useNavigate();

  const [language, setLanguage] = useState("English");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const startConsultation = () => {
  navigate("/patient-identification");
};
  const toggleVoice = () => {
    const nextState = !voiceEnabled;
    setVoiceEnabled(nextState);

    if (nextState && "speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance(
        "Welcome to MediKiosk. Tap Start Consultation to begin."
      );

      speech.rate = 0.9;
      window.speechSynthesis.speak(speech);
    }
  };

  const scrollToHowItWorks = () => {
    document
      .getElementById("how-it-works")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToSupport = () => {
    document
      .getElementById("support")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="medikiosk-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="main-header">

        {/* LOGO */}

        <div className="brand">

          <div className="brand-logo">
            +
          </div>

          <div className="brand-text">
            <h2>MediKiosk</h2>
            <p>Smart Healthcare Assistant</p>
          </div>

        </div>


        {/* NAVIGATION */}

        <nav className="main-nav">

          <a href="#home">
            Home
          </a>

          <button onClick={scrollToHowItWorks}>
            How It Works
          </button>

          <button onClick={scrollToSupport}>
            Support
          </button>

        </nav>


        {/* HEADER ACTIONS */}

        <div className="header-actions">

  {/* Language */}
  <div className="language-selector">
    <span className="header-icon">🌐</span>

    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
    >
      <option value="English">English</option>
      <option value="हिन्दी">हिन्दी</option>
      <option value="मराठी">मराठी</option>
      <option value="বাংলা">বাংলা</option>
      <option value="தமிழ்">தமிழ்</option>
      <option value="తెలుగు">తెలుగు</option>
    </select>
  </div>

  {/* Voice */}
  <button
    className={`voice-button ${voiceEnabled ? "voice-active" : ""}`}
    onClick={toggleVoice}
  >
    <span className="voice-icon">🔊</span>
    <span>
      {voiceEnabled ? "Voice On" : "Voice Assistance"}
    </span>
  </button>

  {/* Accessibility */}
  <button
    className="accessibility-button"
    onClick={() => setShowAccessibility(!showAccessibility)}
  >
    <span className="accessibility-icon">♿</span>
    <span>Accessibility</span>
  </button>

</div>
      </header>


      {/* ==================================================
          ACCESSIBILITY PANEL
      ================================================== */}

      {showAccessibility && (

        <div className="accessibility-panel">

          <div>
            <h3>Accessibility Options</h3>

            <p>
              Make MediKiosk easier and more comfortable to use.
            </p>
          </div>

          <div className="accessibility-actions">

            <button>
              Increase Text
            </button>

            <button>
              High Contrast
            </button>

            <button onClick={toggleVoice}>
              Voice Guidance
            </button>

          </div>

        </div>

      )}


      {/* ==================================================
          HERO SECTION
      ================================================== */}

      <section
        id="home"
        className="hero-section"
      >

        {/* LEFT CONTENT */}

        <div className="hero-content">

          <div className="welcome-tag">

            <span></span>

            WELCOME TO MEDIKIOSK

          </div>


          <h1>

            Healthcare
            <br />

            <span>made simpler.</span>

          </h1>


          <p className="hero-description">

            Begin your healthcare consultation with a simple,
            secure and guided experience. MediKiosk helps you
            navigate every step with ease.

          </p>


          {/* MAIN CTA */}

          <button
            className="start-consultation"
            onClick={startConsultation}
            >

            <div className="start-icon">
              +
            </div>

            <div className="start-content">

              <strong>
                Start Consultation
              </strong>

              <span>
                Begin your healthcare journey
              </span>

            </div>

            <div className="start-arrow">
              →
            </div>

          </button>


          {/* TRUST POINTS */}

          <div className="trust-points">

            <div className="trust-item">

              <div className="trust-icon">
                ✓
              </div>

              <div>
                <strong>Secure</strong>
                <span>Privacy protected</span>
              </div>

            </div>


            <div className="trust-item">

              <div className="trust-icon">
                ✓
              </div>

              <div>
                <strong>Simple</strong>
                <span>Easy to navigate</span>
              </div>

            </div>


            <div className="trust-item">

              <div className="trust-icon">
                ✓
              </div>

              <div>
                <strong>Multilingual</strong>
                <span>Your preferred language</span>
              </div>

            </div>

          </div>

        </div>


        {/* RIGHT VISUAL */}

        <div className="hero-visual">

          <div className="visual-bg"></div>


          {/* Main medical card */}

          <div className="medical-main-card">

            <div className="medical-card-header">

              <div className="medical-logo">
                +
              </div>

              <div className="verified">
                ✓ Verified
              </div>

            </div>


            <h3>
              Healthcare
              <br />
              <span>Consultation</span>
            </h3>


            <p>
              Simple and guided healthcare assistance
            </p>


            <div className="consultation-status">

              <span></span>

              Ready to begin

            </div>

          </div>


          {/* Floating card */}

          <div className="floating-card">

            <div className="floating-icon">
              ✓
            </div>

            <div>

              <strong>
                Patient First
              </strong>

              <span>
                Designed for everyone
              </span>

            </div>

          </div>


          {/* Decorative medical icon */}

          <div className="medical-cross">
            +
          </div>


          {/* Pulse */}

          <div className="pulse-line">
            ──╱╲──╱╲────
          </div>

        </div>

      </section>


      {/* ==================================================
          HOW IT WORKS
      ================================================== */}

      <section
        id="how-it-works"
        className="how-section"
      >

        <div className="section-heading">

          <span>
            SIMPLE PROCESS
          </span>

          <h2>
            How does MediKiosk work?
          </h2>

          <p>
            Getting started takes only a few simple steps.
          </p>

        </div>


        <div className="process-container">


          {/* STEP 1 */}

          <div className="process-card">

            <div className="process-top">

              <div className="step-number">
                01
              </div>

              <div className="process-icon">
                ◎
              </div>

            </div>

            <h3>
              Choose your language
            </h3>

            <p>
              Select the language you are most comfortable
              communicating in.
            </p>

          </div>


          <div className="process-connector">
            →
          </div>


          {/* STEP 2 */}

          <div className="process-card active-process">

            <div className="process-top">

              <div className="step-number">
                02
              </div>

              <div className="process-icon">
                +
              </div>

            </div>

            <h3>
              Start consultation
            </h3>

            <p>
              Tap Start Consultation to begin your guided
              healthcare journey.
            </p>

          </div>


          <div className="process-connector">
            →
          </div>


          {/* STEP 3 */}

          <div className="process-card">

            <div className="process-top">

              <div className="step-number">
                03
              </div>

              <div className="process-icon">
                ✓
              </div>

            </div>

            <h3>
              Follow the instructions
            </h3>

            <p>
              Answer simple questions and provide the required
              health information step-by-step.
            </p>

          </div>

        </div>

      </section>


      {/* ==================================================
          SUPPORT
      ================================================== */}

      <section
        id="support"
        className="support-section"
      >

        <div className="support-content">

          <div className="support-icon">
            ?
          </div>

          <div>

            <span>
              NEED HELP?
            </span>

            <h2>
              We're here to help.
            </h2>

            <p>
              If you need assistance using MediKiosk,
              our guided support and voice assistance
              are available throughout your journey.
            </p>

          </div>

        </div>


        <button
          className="support-button"
          onClick={() => alert("Support assistance opened.")}
        >
          Get Support
          <span>→</span>
        </button>

      </section>


      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer className="main-footer">

        <div className="footer-top">

          {/* BRAND */}

          <div className="footer-brand">

            <div className="footer-logo">
              +
            </div>

            <div>

              <h3>
                MediKiosk
              </h3>

              <p>
                Smart Healthcare Assistant
              </p>

            </div>

          </div>


          {/* LINKS */}

          <div className="footer-links">

            <div>

              <h4>
                Navigation
              </h4>

              <a href="#home">
                Home
              </a>

              <a href="#how-it-works">
                How It Works
              </a>

              <a href="#support">
                Support
              </a>

            </div>


            <div>

              <h4>
                Assistance
              </h4>

              <button onClick={toggleVoice}>
                Voice Assistance
              </button>

              <button
                onClick={() =>
                  setShowAccessibility(!showAccessibility)
                }
              >
                Accessibility
              </button>

              <button onClick={scrollToSupport}>
                Get Help
              </button>

            </div>


            <div>

              <h4>
                Security
              </h4>

              <p>
                ✓ Privacy protected
              </p>

              <p>
                ✓ Secure consultation
              </p>

              <p>
                ✓ Patient-first design
              </p>

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

export default Landing;