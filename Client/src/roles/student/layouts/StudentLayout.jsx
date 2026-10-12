import { Outlet } from "react-router-dom";
import StudentNavbar from "../../shared/components/StudentNavbar.jsx";

function StudentLayout() {
  return (
    <>
      <StudentNavbar />
      <Outlet />
    </>
  );
}

export default StudentLayout;
