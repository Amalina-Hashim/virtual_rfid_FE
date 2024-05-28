import React from "react";
import { Nav } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../services/auth";

const AdminSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Nav className="flex-column">
      <NavLink to="/admin/home" className="nav-link">
        Home
      </NavLink>
      <NavLink to="/admin/add-location" className="nav-link">
        Add Location
      </NavLink>
      <NavLink to="/admin/transactions" className="nav-link">
        Transactions
      </NavLink>
      <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
    </Nav>
  );
};

export default AdminSidebar;
