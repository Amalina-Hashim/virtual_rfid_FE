import React, { useState } from "react";
import { Nav, Offcanvas, Button } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from "../../services/auth";
import { FaBars } from "react-icons/fa";
import "../../App.css";

const UserSidebar = () => {
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
      <div className="menu-button-container">
        <Button class="menu" variant="dark" style={{marginLeft: "10px"}} onClick={handleShow}>
          <FaBars size={20} />
        </Button>

        <Offcanvas show={show} onHide={handleClose}>
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Geopayment</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Nav className="flex-column custom-sidebar">
              <NavLink
                to="/user/home"
                className="nav-link"
                onClick={handleClose}
              >
                Home
              </NavLink>
              <NavLink
                to="/user/profile"
                className="nav-link"
                onClick={handleClose}
              >
                Profile
              </NavLink>
              <NavLink
                to="/user/top-up"
                className="nav-link"
                onClick={handleClose}
              >
                Top Up
              </NavLink>
              <NavLink
                to="/user/transactions"
                className="nav-link"
                onClick={handleClose}
              >
                Transactions
              </NavLink>
              <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
            </Nav>
          </Offcanvas.Body>
        </Offcanvas>
      </div>
    </>
  );
};

export default UserSidebar;
