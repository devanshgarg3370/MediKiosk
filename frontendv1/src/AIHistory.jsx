import { useState } from "react";

function AIHistory({ next }) {
  const [answer, setAnswer] = useState("");

  const options = [
    "🤒 Fever",
    "🤕 Headache",
    "😷 Cough / Cold",
    "🤢 Stomach Pain",
  ];

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
          <span>STEP 4 OF 6</span>
          <span>AI HEALTH HISTORY</span>
        </div>

        <div className="progress">
          <div className="progressActive"></div>
        </div>

        <div className="titleRow">
          <div>
            <p className="welcome">● AI ASSISTANT</p>
            <h1>Let's understand<br />your health.</h1>
            <p className="subtitle">
              I'll ask you a few simple questions.
              You can speak or tap your answer.
            </p>
          </div>

          <div className="aiIcon">✦</div>
        </div>

        <section className="chatCard">

          <div className="aiBubble">
            <div className="botCircle">✦</div>
            <div>
              <small>MediKiosk AI</small>
              <h3>What brings you here today?</h3>
            </div>
          </div>

          <p className="questionHint">
            Select an option or tell me in your own words.
          </p>

          <div className="answerGrid">
            {options.map((item) => (
              <button
                key={item}
                className="answerButton"
                onClick={() => setAnswer(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {answer && (
            <div className="patientAnswer">
              <span>You</span>
              <p>{answer}</p>
            </div>
          )}

          <div className="voiceArea">
            <button className="voiceButton">
              🎤
              <span>Tap to speak</span>
            </button>

            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Or type your answer..."
            />
          </div>

        </section>

        <div className="navigation">
          <button className="secondaryButton">← Back</button>

          <button className="secondaryButton">
            🔊 Repeat Question
          </button>

          <button className="primaryButton" onClick={next}>
            Continue →
          </button>
        </div>

      </main>
    </div>
  );
}

export default AIHistory;