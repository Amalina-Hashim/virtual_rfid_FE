import React, { useState, useEffect } from "react";
import { Button, Table, Container } from "react-bootstrap";
import { getTransactionHistories } from "../../services/api";

const TransactionHistoryPage = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await getTransactionHistories();
        setTransactions(response.data);
      } catch (error) {
        console.error("Failed to fetch transactions", error);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <Container>
      <h1>Hello, Admin</h1>
      <h2>Transactions</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>User</th>
            <th>Location</th>
            <th>Amount</th>
            <th>Timestamp</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.user.username}</td>
              <td>{transaction.location.location_name}</td>
              <td>${transaction.amount}</td>
              <td>{new Date(transaction.timestamp).toLocaleString()}</td>
              <td>
                <Button variant="primary">Edit</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default TransactionHistoryPage;
