import React, { useState, useEffect } from "react";
import { Button, Table, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  getChargingLogics,
  deleteChargingLogic,
  disableChargingLogic,
} from "../../services/api";

const AdminHomePage = () => {
  const [chargingLogics, setChargingLogics] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChargingLogics = async () => {
      try {
        const response = await getChargingLogics();
        setChargingLogics(response.data);
      } catch (error) {
        console.error("Failed to fetch charging logics", error);
      }
    };

    fetchChargingLogics();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteChargingLogic(id);
      setChargingLogics(chargingLogics.filter((logic) => logic.id !== id));
    } catch (error) {
      console.error("Failed to delete charging logic", error);
    }
  };

  const handleDisable = async (id) => {
    try {
      await disableChargingLogic(id);
      setChargingLogics(
        chargingLogics.map((logic) =>
          logic.id === id ? { ...logic, enabled: false } : logic
        )
      );
    } catch (error) {
      console.error("Failed to disable charging logic", error);
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/edit-charging-logic/${id}`);
  };

  return (
    <Container>
      <h1>Hello, Admin</h1>
      <h2>Your Current Location(s):</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Location</th>
            <th>Amount</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Days/Months</th>
            <th>Charge Rate</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {chargingLogics.map((logic) => (
            <tr key={logic.id}>
              <td>{logic.location.location_name}</td>
              <td>${logic.amount_to_charge}</td>
              <td>{logic.start_time}</td>
              <td>{logic.end_time}</td>
              <td>{logic.days.map((day) => day.name).join(", ")}</td>
              <td>{logic.amount_rate}</td>
              <td>
                <Button variant="primary" onClick={() => handleEdit(logic.id)}>
                  Edit
                </Button>{" "}
                <Button
                  variant="secondary"
                  onClick={() => handleDisable(logic.id)}
                  disabled={!logic.enabled}
                >
                  {logic.enabled ? "Disable" : "Disabled"}
                </Button>{" "}
                <Button variant="danger" onClick={() => handleDelete(logic.id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Button variant="dark" onClick={() => navigate("/admin/add-location")}>
        Add location
      </Button>
    </Container>
  );
};

export default AdminHomePage;
