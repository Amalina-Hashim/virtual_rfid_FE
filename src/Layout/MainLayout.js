import { Outlet } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import AdminSidebar from "../components/Admin/AdminSidebar";
import UserSidebar from "../components/User/UserSidebar";

const MainLayout = () => {
  const userRole = localStorage.getItem("userRole");

  return (
    <Container fluid style={{ marginTop: "10px" }}>
      <Row>
        <Col md={1}>
          {userRole === "admin" ? <AdminSidebar /> : <UserSidebar />}
        </Col>
        <Col md={10}>
          <Outlet />
        </Col>
      </Row>
    </Container>
  );
};

export default MainLayout;
