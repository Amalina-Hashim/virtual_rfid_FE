import React from "react";
import { Nav } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../services/auth";

const UserSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Nav className="flex-column">
      <NavLink to="/user/home" className="nav-link">
        Home
      </NavLink>
      <NavLink to="/user/profile" className="nav-link">
        Profile
      </NavLink>
      <NavLink to="/user/top-up" className="nav-link">
        Top Up
      </NavLink>
      <NavLink to="/user/transactions" className="nav-link">
        Transactions
      </NavLink>
      <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
    </Nav>
  );
};

export default UserSidebar;
