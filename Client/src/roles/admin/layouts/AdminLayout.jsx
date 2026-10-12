import { Outlet } from "react-router-dom";
import AdminNavbar from "../../shared/components/AdminNavbar.jsx";

function AdminLayout() {
  return (
    <>
      <AdminNavbar />
      <div className="pt-20"> 
        <Outlet />
      </div>
    </>
  );
}

export default AdminLayout;