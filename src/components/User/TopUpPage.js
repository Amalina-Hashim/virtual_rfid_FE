import React, { useState } from "react";
import { Button, Form, Container } from "react-bootstrap";
import { createTransactionHistory } from "../../services/api";

const TopUpPage = () => {
  const [amount, setAmount] = useState("");

  const handleChange = (e) => {
    setAmount(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTransactionHistory({ user: 1, location: 1, amount }); 
      alert("Top-up successful!");
    } catch (error) {
      console.error("Failed to top-up", error);
    }
  };

  return (
    <Container>
      <h2>Top Up</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formAmount">
          <Form.Label>Amount</Form.Label>
          <Form.Control type="text" value={amount} onChange={handleChange} />
        </Form.Group>
        <Button variant="primary" type="submit">
          Top Up
        </Button>
      </Form>
    </Container>
  );
};

export default TopUpPage;
