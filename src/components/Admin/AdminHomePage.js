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
        const formattedData = response.data.map((logic) => {
          const days = Array.isArray(logic.days)
            ? logic.days.map((day) => {
                if (typeof day === "string") {
                  try {
                    const parsedDay = JSON.parse(day.replace(/'/g, '"'));
                    return parsedDay.name.toLowerCase();
                  } catch (e) {
                    return day;
                  }
                }
                return day.name.toLowerCase();
              })
            : [];

          const months = Array.isArray(logic.months)
            ? logic.months.map((month) => {
                if (typeof month === "string") {
                  try {
                    const parsedMonth = JSON.parse(month.replace(/'/g, '"'));
                    return parsedMonth.name.toLowerCase();
                  } catch (e) {
                    return month;
                  }
                }
                return month.name.toLowerCase();
              })
            : [];

          const years = Array.isArray(logic.years)
            ? logic.years.map((year) => {
                if (year !== undefined && year !== null) {
                  return typeof year === "object" && year.year !== undefined
                    ? year.year.toString()
                    : year.toString();
                }
                return "";
              })
            : [];

          return {
            ...logic,
            days,
            months,
            years,
          };
        });
        setChargingLogics(formattedData);
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
            <th>Days/Months/Years</th>
            <th>Charge Rate</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {chargingLogics.map((logic) => (
            <tr key={logic.id}>
              <td>{logic.location ? logic.location.location_name : "N/A"}</td>
              <td>${logic.amount_to_charge}</td>
              <td>{logic.start_time}</td>
              <td>{logic.end_time}</td>
              <td>
                Days: {logic.days.join(", ")} <br />
                Months: {logic.months.join(", ")} <br />
                Years: {logic.years.join(", ")}
              </td>
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
