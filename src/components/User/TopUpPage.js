import React, { useState, useEffect } from "react";
import { Button, Form, Container } from "react-bootstrap";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { getBalance, createTransactionHistory } from "../../services/api";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const TopUpForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await getBalance();
        setBalance(response.data.balance);
      } catch (error) {
        console.error("Failed to fetch balance", error);
      }
    };

    fetchBalance();
  }, []);

  const handleChange = (e) => {
    setAmount(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);

    try {
      const { paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      const paymentIntent = await createTransactionHistory({
        amount: parseInt(amount),
        paymentMethodId: paymentMethod.id,
      });

      const confirmedPayment = await stripe.confirmCardPayment(
        paymentIntent.client_secret
      );

      if (confirmedPayment.error) {
        setMessage("Payment failed: " + confirmedPayment.error.message);
      } else if (confirmedPayment.paymentIntent.status === "succeeded") {
        setMessage("Payment succeeded!");
        setBalance((prevBalance) => prevBalance + parseInt(amount));
      }
    } catch (error) {
      console.error("Payment failed", error);
      setMessage("Payment failed: " + error.message);
    }
  };

  return (
    <Container>
      <h2>Top Up</h2>
      <p>Your current balance is: ${balance}</p>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formAmount">
          <Form.Label>Amount</Form.Label>
          <Form.Control type="text" value={amount} onChange={handleChange} />
        </Form.Group>
        <CardElement />
        <Button variant="primary" type="submit" disabled={!stripe}>
          Top Up
        </Button>
      </Form>
      {message && <p>{message}</p>}
    </Container>
  );
};

const TopUpPage = () => (
  <Elements stripe={stripePromise}>
    <TopUpForm />
  </Elements>
);

export default TopUpPage;
