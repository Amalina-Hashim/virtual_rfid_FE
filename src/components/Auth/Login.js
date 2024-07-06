import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  Alert,
  Spinner,
} from "react-bootstrap";
import { login, getUser } from "../../services/api";
import LoginContext from "../../LoginContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setIsLoggedIn, setUserRole } = useContext(LoginContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await login({ username, password });
      localStorage.setItem("authToken", response.data.token);
      const userResponse = await getUser();
      const userRole = userResponse.data.role;

      localStorage.setItem("userRole", userRole);
      setIsLoggedIn(true);
      setUserRole(userRole);

      if (userRole === "admin") {
        navigate("/admin/home");
      } else {
        navigate("/user/home");
      }
    } catch (error) {
      setErrorMessage("Login failed. Please check your username and password.");
      console.error("Login failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2>Login to Geopayment</h2>
          {errorMessage && (
            <Alert
              variant="danger"
              onClose={() => setErrorMessage("")}
              dismissible
            >
              {errorMessage}
            </Alert>
          )}
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
                autoComplete="username"
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
                autoComplete="current-password"
              />
            </Form.Group>
            <Button
              variant="primary"
              style={{ marginTop: "15px" }}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
              ) : (
                "Login"
              )}
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
