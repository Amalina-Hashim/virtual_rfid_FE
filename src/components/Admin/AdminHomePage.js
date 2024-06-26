import React, { useState, useEffect } from "react";
import { Button, Table, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  getChargingLogics,
  deleteChargingLogic,
  disableChargingLogic,
  enableChargingLogic,
  deleteLocation,
} from "../../services/api";

const AdminHomePage = () => {
  const [chargingLogics, setChargingLogics] = useState([]);
  const navigate = useNavigate();

  const fetchChargingLogics = async () => {
    try {
      const response = await getChargingLogics();
      const formattedData = response.data.map((logic) => {
        const days = Array.isArray(logic.days)
          ? logic.days.map((day) =>
              typeof day === "string"
                ? day.toLowerCase()
                : day.name.toLowerCase()
            )
          : [];

        const months = Array.isArray(logic.months)
          ? logic.months.map((month) =>
              typeof month === "string"
                ? month.toLowerCase()
                : month.name.toLowerCase()
            )
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
          location_name: logic.location_name,
          enabled: logic.is_enabled,
        };
      });

      setChargingLogics(formattedData);
    } catch (error) {
      console.error("Failed to fetch charging logics", error);
    }
  };

  useEffect(() => {
    fetchChargingLogics();
  }, []);

  const handleDelete = async (id, locationId) => {
    try {
      await deleteChargingLogic(id);
      await deleteLocation(locationId.id);
      setChargingLogics(chargingLogics.filter((logic) => logic.id !== id));
    } catch (error) {
      console.error("Failed to delete charging logic and location", error);
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

  const handleEnable = async (id) => {
    try {
      await enableChargingLogic(id);
      setChargingLogics(
        chargingLogics.map((logic) =>
          logic.id === id ? { ...logic, enabled: true } : logic
        )
      );
    } catch (error) {
      console.error("Failed to enable charging logic", error);
    }
  };

  const handleEdit = async (id) => {
    navigate(`/admin/edit-charging-logic/${id}`);
    await fetchChargingLogics();
  };

  return (
    <Container>
      <h1>Hello, Admin</h1>
      <h3>
        {chargingLogics.length === 0
          ? "You have not created any locations yet"
          : "Your Current Location(s):"}
      </h3>
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
            <tr
              key={logic.id}
              style={{ color: logic.enabled ? "black" : "grey" }}
            >
              <td>{logic.location_name || "N/A"}</td>
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
                <Button
                  variant="primary"
                  style={{ marginTop: "8px" }}
                  onClick={() => handleEdit(logic.id)}
                >
                  Edit
                </Button>{" "}
                <Button
                  variant={logic.enabled ? "secondary" : "success"}
                  style={{ marginTop: "8px" }}
                  onClick={() =>
                    logic.enabled
                      ? handleDisable(logic.id)
                      : handleEnable(logic.id)
                  }
                >
                  {logic.enabled ? "Disable" : "Enable"}
                </Button>{" "}
                <Button
                  variant="danger"
                  style={{ marginTop: "8px" }}
                  onClick={() => handleDelete(logic.id, logic.location)}
                >
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
