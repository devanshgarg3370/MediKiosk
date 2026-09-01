import { useNavigate } from "react-router-dom";

function ReviewConfirm() {
  const navigate = useNavigate();
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
          <span>STEP 6 OF 6</span>
          <span>REVIEW & CONFIRM</span>
        </div>

        <div className="progress">
          <div
            className="progressActive"
            style={{ width: "100%" }}
          ></div>
        </div>

        <div className="titleRow">
          <div>
            <p className="welcome">● ALMOST DONE</p>

            <h1>Review your<br />information.</h1>

            <p className="subtitle">
              Please check the details below before
              submitting your health history.
            </p>
          </div>

          <div className="aiIcon">✓</div>
        </div>

        <div className="reviewGrid">

          <div className="reviewCard">
            <div className="cardHeader">
              <h3>👤 Patient Information</h3>
              <button>✎ Edit</button>
            </div>

            <div className="infoGrid">
              <p><span>Name</span>Rahul Kumar</p>
              <p><span>Age</span>45 years</p>
              <p><span>Gender</span>Male</p>
              <p><span>Contact</span>98XXXXXX21</p>
            </div>
          </div>

          <div className="reviewCard">
            <div className="cardHeader">
              <h3>🩺 Chief Complaint</h3>
              <button>✎ Edit</button>
            </div>

            <p className="bigText">
              Fever and headache for the last 2 days.
            </p>
          </div>

          <div className="reviewCard">
            <div className="cardHeader">
              <h3>🤖 AI Health History</h3>
              <button>✎ Edit</button>
            </div>

            <ul>
              <li>Fever for 2 days</li>
              <li>Headache since yesterday</li>
              <li>No known drug allergies</li>
              <li>No previous major surgery reported</li>
            </ul>

            <div className="aiNotice">
              ✦ AI-generated draft — review before submission
            </div>
          </div>

          <div className="reviewCard">
            <div className="cardHeader">
              <h3>💊 Medicines & Allergies</h3>
              <button>✎ Edit</button>
            </div>

            <p><b>Current medicines:</b> None reported</p>
            <p><b>Allergies:</b> No known allergies</p>
          </div>

          <div className="reviewCard">
            <div className="cardHeader">
              <h3>📄 Documents</h3>
              <button>✎ Edit</button>
            </div>

            <p>📄 Prescription.pdf</p>
            <p>🧪 Blood_Test.pdf</p>
          </div>

        </div>

        <label className="confirmation">
          <input type="checkbox" />
          <span>
            I confirm that the information shown above is correct
            and can be shared with the hospital for my consultation.
          </span>
        </label>

        <div className="navigation">

          <button
            className="secondaryButton"
            onClick={() => navigate("/document-scan")}
          >
            ← Back
          </button>

          <button className="primaryButton">
            Submit Health History ✓
          </button>

        </div>

      </main>
    </div>
  );
}

export default ReviewConfirm;