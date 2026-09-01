import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "../pages/Landing";
import PatientIdentification from "../pages/PatientIdentification";
import ConsentPrivacy from "../pages/ConsentPrivacy";

import AIHistory from "../pages/AIHistory";
import DocumentScan from "../pages/DocumentScan";
import ReviewConfirm from "../pages/ReviewConfirm";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= PAGE 1 ================= */}
        <Route
          path="/"
          element={<Landing />}
        />

        {/* ================= PAGE 2 ================= */}
        <Route
          path="/patient-identification"
          element={<PatientIdentification />}
        />

        {/* ================= PAGE 3 ================= */}
        <Route
          path="/consent-privacy"
          element={<ConsentPrivacy />}
        />

        {/* ================= PAGE 4 ================= */}
        <Route
          path="/ai-history"
          element={<AIHistory />}
        />

        {/* ================= PAGE 5 ================= */}
        <Route
          path="/document-scan"
          element={<DocumentScan />}
        />

        {/* ================= PAGE 6 ================= */}
        <Route
          path="/review-confirm"
          element={<ReviewConfirm />}
        />

      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;