import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "../pages/Landing";
import PatientIdentification from "../pages/PatientIdentification";
import ConsentPrivacy from "../pages/ConsentPrivacy";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* Page 1 */}
        <Route path="/" element={<Landing />} />

        {/* Page 2 */}
        <Route
          path="/patient-identification"
          element={<PatientIdentification />}
        />

        {/* Page 3 */}
        <Route
          path="/consent-privacy"
          element={<ConsentPrivacy />}
        />

      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;