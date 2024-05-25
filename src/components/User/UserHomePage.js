import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import { getUser } from "../../services/auth";

const UserHomePage = () => {
  const [user, setUser] = useState(null);

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

  return (
    <Container>
      <h1>Hello, {user ? user.username : "User"}</h1>
      <p>Welcome to your dashboard.</p>
    </Container>
  );
};

export default UserHomePage;
