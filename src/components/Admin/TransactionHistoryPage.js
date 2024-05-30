import React, { useState, useEffect } from "react";
import {
  Table,
  Container,
  Spinner,
  Form,
  Row,
  Col,
} from "react-bootstrap";
import { getTransactionHistories } from "../../services/api";

const TransactionHistoryPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("");

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await getTransactionHistories();
        setTransactions(response.data);
      } catch (error) {
        setError("Failed to fetch transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
  };

  const handleTimeFilterChange = (e) => {
    setTimeFilter(e.target.value);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const searchString = search.toLowerCase();
    const dateMatch = dateFilter
      ? transaction.timestamp.startsWith(dateFilter)
      : true;
    const timeMatch = timeFilter
      ? new Date(transaction.timestamp)
          .toLocaleTimeString()
          .startsWith(timeFilter)
      : true;
    return (
      (transaction.userId.toString().includes(searchString) ||
        transaction.username.toLowerCase().includes(searchString) ||
        transaction.location.location_name
          .toLowerCase()
          .includes(searchString)) &&
      dateMatch &&
      timeMatch
    );
  });

  return (
    <Container>
      <h1>Hello, Admin</h1>
      <h2>Transactions</h2>
      <Row className="mb-3">
        <Col>
          <Form.Control
            type="text"
            placeholder="Search by User ID, Username, or Location"
            value={search}
            onChange={handleSearchChange}
          />
        </Col>
        <Col>
          <Form.Control
            type="date"
            placeholder="Filter by Date"
            value={dateFilter}
            onChange={handleDateFilterChange}
          />
        </Col>
        <Col>
          <Form.Control
            type="time"
            placeholder="Filter by Time"
            value={timeFilter}
            onChange={handleTimeFilterChange}
          />
        </Col>
      </Row>
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
              <th>User ID</th>
              <th>Username</th>
              <th>Location</th>
              <th>Amount</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.userId}</td>
                <td>{transaction.username}</td>
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

export default TransactionHistoryPage;
