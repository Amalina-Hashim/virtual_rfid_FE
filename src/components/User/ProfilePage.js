import React, { useState, useEffect } from "react";
import { Button, Form, Container } from "react-bootstrap";
import { getUser, updateUserProfile } from "../../services/api";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const [user, setUser] = useState({ username: "", email: "" });
  const [password, setPassword] = useState("");
  const [isUpdated, setIsUpdated] = useState(false);
  const navigate = useNavigate(); 

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUser();
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("No authentication token found");
      }

      const data = await updateUserProfile(authToken, user, password);
      setUser({ username: data.username, email: data.email });
      setPassword("");
      setIsUpdated(true);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

      const handleCancel = () => {
        navigate("/user/home");
      };

  return (
    <Container>
      <h2>Profile</h2>
      {isUpdated && (
        <div className="alert alert-success">Profile updated successfully!</div>
      )}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formUsername">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            name="username"
            value={user.username}
            onChange={handleChange}
            disabled
          />
        </Form.Group>
        <Form.Group controlId="formEmail">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={user.email}
            onChange={handleChange}
          />
        </Form.Group>
        <Form.Group controlId="formPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={password}
            onChange={handlePasswordChange}
          />
        </Form.Group>
        <Button
          variant="primary"
          style={{
            marginTop: "15px",
            marginBottom: "15px",
            marginRight: "10px",
          }}
          type="submit"
        >
          Update
        </Button>
        <Button
          variant="secondary"
          onClick={handleCancel}
          style={{ marginTop: "15px", marginBottom: "15px" }}
        >
          Cancel
        </Button>
      </Form>
    </Container>
  );
};

export default ProfilePage;
