import React, { useState, useEffect, useContext } from "react";
import { Button, Form, Container, Row, Col } from "react-bootstrap";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { makePayment, getUser } from "../../services/api";
import { useNavigate } from "react-router-dom";
import LoginContext from "../../LoginContext"; 

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const TopUpForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [cardName, setCardName] = useState("");
  const [balance, setBalance] = useState(null); 
  const { isLoggedIn } = useContext(LoginContext); 

  useEffect(() => {
    if (isLoggedIn) {
      const fetchUserData = async () => {
        try {
          const response = await getUser();
          if (response.data && response.data.balance !== undefined) {
            console.log("Fetched user data:", response.data);
            setBalance(parseFloat(response.data.balance));
          }
        } catch (error) {
          console.error("Failed to fetch user data", error);
        }
      };

      fetchUserData();
    }
  }, [isLoggedIn]);

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const handleCardNameChange = (e) => {
    setCardName(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      return;
    }

    const cardNumberElement = elements.getElement(CardNumberElement);
    const cardExpiryElement = elements.getElement(CardExpiryElement);
    const cardCvcElement = elements.getElement(CardCvcElement);

    try {
      const { paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumberElement,
        billing_details: {
          name: cardName,
        },
      });

      const { id: paymentMethodId } = paymentMethod;

      const paymentResponse = await makePayment({
        amount: parseFloat(amount),
        paymentMethodId,
      });

      const { client_secret: clientSecret, status } = paymentResponse.data;

      if (status === "succeeded") {
        setMessage("Payment succeeded!");
        const newBalance = parseFloat(balance) + parseFloat(amount);
        setBalance(newBalance.toFixed(2));
        console.log("Navigating to /user/home...");
        navigate("/user/home", { state: { newBalance } });
      } else if (status === "requires_action") {
        const confirmCardPayment = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: cardNumberElement,
              billing_details: {
                name: cardName,
              },
            },
          }
        );

        if (confirmCardPayment.error) {
          setMessage("Payment failed: " + confirmCardPayment.error.message);
        } else if (confirmCardPayment.paymentIntent.status === "succeeded") {
          setMessage("Payment succeeded!");
          const newBalance = parseFloat(balance) + parseFloat(amount);
          setBalance(newBalance.toFixed(2));
          console.log("Navigating to /user/home...");
          navigate("/user/home", { state: { newBalance } });
        } else {
          setMessage(
            "Payment status: " + confirmCardPayment.paymentIntent.status
          );
        }
      } else {
        setMessage("Payment status: " + status);
      }
    } catch (error) {
      console.error("Payment failed", error);
      setMessage("Payment failed: " + error.message);
    }
  };

  const handleCancel = () => {
    navigate("/user/home");
  };

  const displayBalance =
    typeof balance === "number" && !isNaN(balance)
      ? balance.toFixed(2)
      : "0.00";

  return (
    <Container>
      <h2>Top Up</h2>
      <p style={{ fontSize: "20px" }}>
        Your current balance is: ${displayBalance}
      </p>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formAmount">
          <Form.Label>Amount</Form.Label>
          <Form.Control
            type="text"
            value={amount}
            onChange={handleAmountChange}
          />
        </Form.Group>
        <Form.Group controlId="formCardName">
          <Form.Label>Cardholder Name</Form.Label>
          <Form.Control
            type="text"
            value={cardName}
            onChange={handleCardNameChange}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Card Number</Form.Label>
          <CardNumberElement className="form-control" />
        </Form.Group>
        <Row>
          <Col>
            <Form.Group>
              <Form.Label>Expiry Date</Form.Label>
              <CardExpiryElement className="form-control" />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group>
              <Form.Label>CVC</Form.Label>
              <CardCvcElement className="form-control" />
            </Form.Group>
          </Col>
        </Row>
        <Button
          variant="secondary"
          onClick={handleCancel}
          style={{
            marginTop: "15px",
            marginBottom: "15px",
            marginRight: "10px",
          }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          style={{
            marginTop: "15px",
            marginBottom: "15px",
          }}
          type="submit"
          disabled={!stripe}
        >
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
