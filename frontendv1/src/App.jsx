import { useState } from "react";
import AIHistory from "./AIHistory";
import DocumentScan from "./DocumentScan";
import ReviewConfirm from "./ReviewConfirm";

function App() {
  const [screen, setScreen] = useState(4);

  return (
    <div>
      {screen === 4 && (
        <AIHistory next={() => setScreen(5)} />
      )}

      {screen === 5 && (
        <DocumentScan
          back={() => setScreen(4)}
          next={() => setScreen(6)}
        />
      )}

      {screen === 6 && (
        <ReviewConfirm
          back={() => setScreen(5)}
        />
      )}
    </div>
  );
}

export default App;