import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Form, Button, Container } from "react-bootstrap";
import {
  getChargingLogics,
  updateChargingLogic,
  getDays,
  getMonths,
  getYears,
} from "../../services/api";

const EditChargingLogicPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [chargingLogic, setChargingLogic] = useState(null);
  const [days, setDays] = useState([]);
  const [months, setMonths] = useState([]);
  const [years, setYears] = useState([]);
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  useEffect(() => {
    const fetchChargingLogic = async () => {
      try {
        const response = await getChargingLogics();
        const logic = response.data.find((logic) => logic.id === parseInt(id));
        setChargingLogic(logic);
        if (logic) {
          initMap(logic.location.latitude, logic.location.longitude);
        }
      } catch (error) {
        console.error("Failed to fetch charging logic", error);
      }
    };

    const fetchOptions = async () => {
      try {
        const daysResponse = await getDays();
        setDays(daysResponse.data);
        const monthsResponse = await getMonths();
        setMonths(monthsResponse.data);
        const yearsResponse = await getYears();
        setYears(yearsResponse.data);
      } catch (error) {
        console.error("Failed to fetch options", error);
      }
    };

    fetchChargingLogic();
    fetchOptions();
  }, [id]);

  const initMap = (lat, lng) => {
    const initialLatLng = { lat: parseFloat(lat), lng: parseFloat(lng) };
    const map = new window.google.maps.Map(mapRef.current, {
      center: initialLatLng,
      zoom: 15,
    });
    const marker = new window.google.maps.Marker({
      position: initialLatLng,
      map: map,
      draggable: true,
    });
    setMap(map);
    setMarker(marker);

    marker.addListener("dragend", () => {
      const position = marker.getPosition();
      setChargingLogic((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          latitude: position.lat(),
          longitude: position.lng(),
        },
      }));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateChargingLogic(id, chargingLogic);
      navigate("/admin/home");
    } catch (error) {
      console.error("Failed to update charging logic", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setChargingLogic({ ...chargingLogic, [name]: value });
  };

  const handleMultiSelectChange = (name, selectedOptions) => {
    setChargingLogic({
      ...chargingLogic,
      [name]: Array.from(selectedOptions, (option) => option.value),
    });
  };

  if (!chargingLogic) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <h2>Edit Charging Logic</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formLocation">
          <Form.Label>Location</Form.Label>
          <Form.Control
            type="text"
            name="location_name"
            value={chargingLogic.location.location_name}
            onChange={handleChange}
            readOnly
          />
        </Form.Group>
        <Form.Group controlId="formAddressName">
          <Form.Label>Address Name</Form.Label>
          <Form.Control
            type="text"
            name="address_name"
            value={chargingLogic.location.address_name}
            onChange={(e) =>
              setChargingLogic((prev) => ({
                ...prev,
                location: { ...prev.location, address_name: e.target.value },
              }))
            }
          />
        </Form.Group>
        <Form.Group controlId="formLatitude">
          <Form.Label>Latitude</Form.Label>
          <Form.Control
            type="number"
            step="any"
            name="latitude"
            value={chargingLogic.location.latitude}
            onChange={(e) =>
              setChargingLogic((prev) => ({
                ...prev,
                location: { ...prev.location, latitude: e.target.value },
              }))
            }
          />
        </Form.Group>
        <Form.Group controlId="formLongitude">
          <Form.Label>Longitude</Form.Label>
          <Form.Control
            type="number"
            step="any"
            name="longitude"
            value={chargingLogic.location.longitude}
            onChange={(e) =>
              setChargingLogic((prev) => ({
                ...prev,
                location: { ...prev.location, longitude: e.target.value },
              }))
            }
          />
        </Form.Group>
        <div ref={mapRef} style={{ height: "400px", marginBottom: "20px" }} />
        <Form.Group controlId="formAmount">
          <Form.Label>Amount</Form.Label>
          <Form.Control
            type="number"
            name="amount_to_charge"
            value={chargingLogic.amount_to_charge}
            onChange={handleChange}
          />
        </Form.Group>
        <Form.Group controlId="formStartTime">
          <Form.Label>Start Time</Form.Label>
          <Form.Control
            type="time"
            name="start_time"
            value={chargingLogic.start_time}
            onChange={handleChange}
          />
        </Form.Group>
        <Form.Group controlId="formEndTime">
          <Form.Label>End Time</Form.Label>
          <Form.Control
            type="time"
            name="end_time"
            value={chargingLogic.end_time}
            onChange={handleChange}
          />
        </Form.Group>
        <Form.Group controlId="formDays">
          <Form.Label>Days</Form.Label>
          <Form.Control
            as="select"
            multiple
            name="days"
            value={chargingLogic.days.map((day) => day.id)}
            onChange={(e) =>
              handleMultiSelectChange("days", e.target.selectedOptions)
            }
          >
            {days.map((day) => (
              <option key={day.id} value={day.id}>
                {day.name}
              </option>
            ))}
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="formMonths">
          <Form.Label>Months</Form.Label>
          <Form.Control
            as="select"
            multiple
            name="months"
            value={chargingLogic.months.map((month) => month.id)}
            onChange={(e) =>
              handleMultiSelectChange("months", e.target.selectedOptions)
            }
          >
            {months.map((month) => (
              <option key={month.id} value={month.id}>
                {month.name}
              </option>
            ))}
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="formYears">
          <Form.Label>Years</Form.Label>
          <Form.Control
            as="select"
            multiple
            name="years"
            value={chargingLogic.years.map((year) => year.id)}
            onChange={(e) =>
              handleMultiSelectChange("years", e.target.selectedOptions)
            }
          >
            {years.map((year) => (
              <option key={year.id} value={year.id}>
                {year.year}
              </option>
            ))}
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="formAmountRate">
          <Form.Label>Charge Rate</Form.Label>
          <Form.Control
            as="select"
            name="amount_rate"
            value={chargingLogic.amount_rate}
            onChange={handleChange}
          >
            <option value="second">Per Second</option>
            <option value="minute">Per Minute</option>
            <option value="hour">Per Hour</option>
          </Form.Control>
        </Form.Group>
        <Button variant="primary" type="submit">
          Save
        </Button>
      </Form>
    </Container>
  );
};

export default EditChargingLogicPage;
