import React from "react";
import { Outlet } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import Sidebar from "../components/Admin/Sidebar"; 

const MainLayout = () => {
  return (
    <Container fluid stye={{ marginTop: "10px" }}>
      <Row>
        <Col md={2}>
          <Sidebar />
        </Col>
        <Col md={10}>
          <Outlet />
        </Col>
      </Row>
    </Container>
  );
};

export default MainLayout;
