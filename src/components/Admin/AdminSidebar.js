import React, { useState } from "react";
import { Navbar, Nav, Offcanvas, Button } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../services/auth";
import { FaBars } from "react-icons/fa"; 
import "../../App.css";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setShow(false);
  };

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Button class="menu" variant="dark" onClick={handleShow}>
        <FaBars size={20} />
      </Button>

      <Offcanvas show={show} onHide={handleClose}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title >Geopayment</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column custom-sidebar">
            <NavLink
              to="/admin/home"
              className="nav-link"
              onClick={handleClose}
            >
              Home
            </NavLink>
            <NavLink
              to="/admin/add-location"
              className="nav-link"
              onClick={handleClose}
            >
              Add Location
            </NavLink>
            <NavLink
              to="/admin/transactions"
              className="nav-link"
              onClick={handleClose}
            >
              Transactions
            </NavLink>
            <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default AdminSidebar;
