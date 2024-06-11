import React, { useState, useEffect, useContext } from "react";
import { Table, Container, Spinner } from "react-bootstrap";
import { getTransactionHistories } from "../../services/api";
import PollingContext from "../../PollingContext";

const UserTransactionHistoryPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { balance, setLocationInfo, setBalance } = useContext(PollingContext);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await getTransactionHistories();
        setTransactions(response.data);
      } catch (error) {
        console.error("Failed to fetch transactions", error);
        setError("Failed to fetch transactions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <Container>
      <h2>Transaction History</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? (
        <div className="text-center">
          <p>Loading transactions...</p>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Location</th>
              <th>Amount</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.location.location_name}</td>
                <td>${transaction.amount}</td>
                <td>{new Date(transaction.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default UserTransactionHistoryPage;
