import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import SubscriptionPage from "./pages/SubscriptionPage.jsx";
import ManageVideos from "./pages/ManageVideos.jsx";
import ManageGrades from "./pages/ManageGrade.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import ManageSchedule from "./pages/ManageSchedule.jsx";
import ManageContent from "./pages/ManageContent.jsx";
import ManageStudents from "./pages/ManageStudents.jsx";
function App() {
  return (
    <Routes>
      {/* Login pages */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      {/* Subscription page */}
      <Route path="/subscribe" element={<SubscriptionPage />} />

      {/* Student dashboard */}
      <Route path="/student" element={<StudentDashboard />} />

      {/* Admin pages with unified admin navbar */}
        <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="videos" element={<ManageVideos />} />
        <Route path="grades" element={<ManageGrades />} />
        <Route path="manageschedule" element={<ManageSchedule />} />
        <Route path="managecontent" element={<ManageContent />} />
        <Route path="managestudents" element={<ManageStudents />} />
      </Route>


      {/* Any wrong URL goes back to login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;