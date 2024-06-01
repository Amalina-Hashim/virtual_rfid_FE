import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Form, Button, Container, Row, Col, Alert } from "react-bootstrap";
import { register, login, getUser } from "../../services/api";
import LoginContext from "../../LoginContext";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const { setIsLoggedIn } = useContext(LoginContext);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    try {
      await register({ username, email, password, role });
      const response = await login({ username, password });
      localStorage.setItem("authToken", response.data.token);
      const userResponse = await getUser();
      const userRole = userResponse.data.role;

      localStorage.setItem("userRole", userRole);
      setIsLoggedIn(true);

      if (userRole === "admin") {
        navigate("/admin/home");
      } else {
        navigate("/user/home");
      }
    } catch (error) {
      setErrorMessage("Signup failed. Please try again.");
      console.error("Signup failed", error);
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2>Signup to Geopayment</h2>
          {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
          <Form onSubmit={handleSignup}>
            <Form.Group
              controlId="formBasicUsername"
              style={{ textAlign: "left" }}
            >
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </Form.Group>
            <Form.Group
              controlId="formBasicEmail"
              style={{ textAlign: "left" }}
            >
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
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
                autoComplete="new-password"
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
            <Button
              variant="primary"
              style={{ marginTop: "15px" }}
              type="submit"
            >
              Signup
            </Button>
          </Form>
          <p className="mt-3">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default Signup;
