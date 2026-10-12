import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "./roles/admin/layouts/AdminLayout.jsx";
import AdminDashboard from "./roles/admin/pages/AdminDashboard.jsx";
import ManageContent from "./roles/admin/pages/ManageContent.jsx";
import ManageGrades from "./roles/admin/pages/ManageGrade.jsx";
import ManageSchedule from "./roles/admin/pages/ManageSchedule.jsx";
import ManageStudents from "./roles/admin/pages/ManageStudents.jsx";
import ManageVideos from "./roles/admin/pages/ManageVideos.jsx";
import StudentLayout from "./roles/student/layouts/StudentLayout.jsx";
import StudentDashboard from "./roles/student/pages/StudentDashboard.jsx";
import LoginPage from "./roles/shared/pages/LoginPage.jsx";
import SubscriptionPage from "./roles/shared/pages/SubscriptionPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/subscribe" element={<SubscriptionPage />} />

      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<StudentDashboard />} />
        <Route path="*" element={<Navigate to="/student" replace />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="videos" element={<ManageVideos />} />
        <Route path="grades" element={<ManageGrades />} />
        <Route path="schedule" element={<ManageSchedule />} />
        <Route path="content" element={<ManageContent />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="settings" element={<Navigate to="/admin" replace />} />
        <Route path="about-me" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;