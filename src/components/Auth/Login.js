import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Button, Container, Row, Col } from "react-bootstrap";
import { login } from "../../services/auth"; 

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); 
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login({ username, password });
      const userRole = localStorage.getItem("userRole");
      if (userRole === "admin") {
        navigate("/admin/home");
      } else {
        navigate("/user/home");
      }
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2>Login</h2>
          <Form onSubmit={handleLogin}>
            <Form.Group
              controlId="formBasicEmail"
              style={{ textAlign: "left" }}
            >
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Form.Group>
            <Form.Group
              controlId="formBasicPassword"
              style={{ textAlign: "left" }}
            >
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="formBasicRole" style={{ textAlign: "left" }}>
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>
            <Button variant="primary" type="submit">
              Login
            </Button>
          </Form>
          <p className="mt-3">
            No account yet? <Link to="/signup">Sign up here</Link>
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
