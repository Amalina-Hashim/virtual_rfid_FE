import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, Container, Table, Row, Col } from "react-bootstrap";
import {
  GoogleMap,
  Marker,
  DrawingManager,
  Autocomplete,
} from "@react-google-maps/api";
import {
  createLocation,
  createChargingLogic,
    getChargingLogics,
    deleteChargingLogic,
  deleteLocation,
} from "../../services/api";
import { useGoogleMaps } from "../../GoogleMapsProvider";

const mapContainerStyle = {
  height: "400px",
  width: "100%",
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194,
};

const options = {
  disableDefaultUI: true,
  zoomControl: true,
};

const AddLocationPage = () => {
  const navigate = useNavigate();
  const { isLoaded } = useGoogleMaps();
  const [locationData, setLocationData] = useState({
    country: "SINGAPORE",
    latitude: null,
    longitude: null,
    address_name: "",
    location_name: "",
    radius: null,
    polygon_points: [],
  });

  const [chargingLogicData, setChargingLogicData] = useState({
    start_time: "",
    end_time: "",
    amount_to_charge: "",
    amount_rate: "",
    days: [],
    months: [],
    years: [],
  });

  const [markers, setMarkers] = useState([]);
  const [chargingLogics, setChargingLogics] = useState([]);
  const [circle, setCircle] = useState(null);
  const [polygon, setPolygon] = useState(null);
  const mapRef = useRef();
  const autocompleteRef = useRef();
  const [drawingMode, setDrawingMode] = useState(null);

  useEffect(() => {
    const fetchChargingLogics = async () => {
      try {
        const response = await getChargingLogics();
        console.log("Charging logics raw response data:", response.data);

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
            ? logic.years.map((year) =>
                year !== undefined && year !== null
                  ? typeof year === "object" && year.year !== undefined
                    ? year.year.toString()
                    : year.toString()
                  : ""
              )
            : [];

          return {
            ...logic,
            days,
            months,
            years,
            location_name: logic.location_name,
          };
        });

        console.log("Formatted charging logics data:", formattedData);
        setChargingLogics(formattedData);
      } catch (error) {
        console.error("Failed to fetch charging logics", error);
      }
    };

    const fetchGeolocation = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLocationData((prevState) => ({
              ...prevState,
              latitude,
              longitude,
            }));
            if (mapRef.current) {
              mapRef.current.panTo({ lat: latitude, lng: longitude });
              mapRef.current.setZoom(15);
              setMarkers([{ lat: latitude, lng: longitude, time: new Date() }]);
            }
          },
          (error) => {
            console.error("Error fetching geolocation data", error);
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
      }
    };

    if (isLoaded) {
      fetchGeolocation();
    }

    fetchChargingLogics();
  }, [isLoaded]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    console.log("Map loaded");
  }, []);

  const onMapClick = useCallback(
    (event) => {
      if (drawingMode) return;
      setMarkers((current) => [
        ...current,
        { lat: event.latLng.lat(), lng: event.latLng.lng(), time: new Date() },
      ]);
      setLocationData((prev) => ({
        ...prev,
        latitude: event.latLng.lat(),
        longitude: event.latLng.lng(),
      }));
    },
    [drawingMode]
  );

  const onPolygonComplete = (polygon) => {
    console.log("Polygon complete:", polygon);
    const coordinates = polygon
      .getPath()
      .getArray()
      .map((coord) => ({ lat: coord.lat(), lng: coord.lng() }));
    console.log("Polygon coordinates:", coordinates);
    setLocationData((prev) => ({
      ...prev,
      polygon_points: coordinates,
      radius: null,
    }));
    setPolygon(polygon); // Persist polygon
    setDrawingMode(null);
  };

  const onCircleComplete = (circle) => {
    console.log("Circle complete:", circle);
    const center = circle.getCenter();
    const radius = circle.getRadius();
    console.log("Circle center:", { lat: center.lat(), lng: center.lng() });
    console.log("Circle radius:", radius);
    setLocationData((prev) => ({
      ...prev,
      latitude: center.lat(),
      longitude: center.lng(),
      radius: radius,
      polygon_points: [],
    }));
    setCircle(circle); // Persist circle
    setDrawingMode(null);
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setLocationData((prev) => ({
          ...prev,
          address_name: place.formatted_address,
          latitude: lat,
          longitude: lng,
        }));
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(15);
        }
        setMarkers([{ lat, lng, time: new Date() }]);
      } else {
        console.error("Place geometry is not defined");
      }
    } else {
      console.error("Autocomplete reference is not defined");
    }
  };

  const handleEdit = (id) => {
    navigate(`/admin/edit-charging-logic/${id}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const locationPayload = {
      country: locationData.country,
      latitude: parseFloat(locationData.latitude).toFixed(6),
      longitude: parseFloat(locationData.longitude).toFixed(6),
      address_name: locationData.address_name,
      location_name: locationData.location_name,
      radius:
        locationData.radius !== "" && !isNaN(parseFloat(locationData.radius))
          ? parseFloat(locationData.radius).toFixed(2)
          : null,
      polygon_points: locationData.polygon_points,
    };

    try {
      console.log("Location Payload:", locationPayload);
      const locationResponse = await createLocation(locationPayload);
      const locationId = locationResponse.data.id;

      console.log("Location Response:", locationResponse.data);

      const amountRate = convertAmountRate(chargingLogicData.amount_rate);
      console.log("Converted Amount Rate:", amountRate);

      const chargingLogicPayload = {
        ...chargingLogicData,
        location: locationId,
        amount_rate: amountRate,
        days: chargingLogicData.days
          ? chargingLogicData.days.map((day) => day.toString())
          : [],
        months: chargingLogicData.months
          ? chargingLogicData.months.map((month) => month.toString())
          : [],
        years: chargingLogicData.years
          ? chargingLogicData.years.map((year) => parseInt(year).toString())
          : [],
      };

      console.log("Charging Logic Payload:", chargingLogicPayload);

      const chargingLogicResponse = await createChargingLogic(
        chargingLogicPayload
      );
      console.log("Charging Logic Response:", chargingLogicResponse.data);

      const response = await getChargingLogics();
      console.log("Fetched Charging Logics:", response.data);

      const formattedData = response.data.map((logic) => {
        console.log("Logic before formatting:", logic);

        const formattedDays = logic.days
          ? logic.days.map((day) => day.name)
          : [];
        const formattedMonths = logic.months
          ? logic.months.map((month) => month.name)
          : [];
        const formattedYears = logic.years
          ? logic.years.map((year) =>
              year && year.year !== undefined ? year.year.toString() : ""
            )
          : [];

        return {
          ...logic,
          days: formattedDays,
          months: formattedMonths,
          years: formattedYears,
          location_name: logic.location ? logic.location.location_name : "N/A",
        };
      });

      console.log("Formatted Charging Logics Data:", formattedData);
      setChargingLogics(formattedData);

      navigate("/admin/home", {
        state: { locationData, chargingLogicData },
      });
    } catch (error) {
      console.error("Error creating location and charging logic", error);
    }
  };

  const convertAmountRate = (displayValue) => {
    const rateMapping = {
      "Per Second": "second",
      "Per Minute": "minute",
      "Per Hour": "hour",
      "Per Day": "day",
      "Per Month": "month",
    };

    console.log("Display Value:", displayValue);

    return rateMapping[displayValue] || displayValue;
  };

const handleDelete = async (id, locationId) => {
  try {
    await deleteChargingLogic(id);
    await deleteLocation(locationId);
    setChargingLogics(chargingLogics.filter((logic) => logic.id !== id));
  } catch (error) {
    console.error("Failed to delete charging logic and location", error);
  }
};

  const handleClearDrawing = () => {
    if (polygon) {
      polygon.setMap(null);
      setPolygon(null);
    }
    if (circle) {
      circle.setMap(null);
      setCircle(null);
    }
    setDrawingMode(null);
  };

  if (!isLoaded) return <div>Loading maps...</div>;

  return (
    <Container>
      <h1>Hello, Admin</h1>
      <h3>Your Current Location(s):</h3>
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
                <Button variant="primary" onClick={() => handleEdit(logic.id)}>
                  Edit
                </Button>{" "}
                <Button variant="secondary">Disable</Button>{" "}
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
      <h2>Add Location:</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formLocationName">
          <Form.Label>Give location a name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Name"
            value={locationData.location_name}
            onChange={(e) =>
              setLocationData({
                ...locationData,
                location_name: e.target.value,
              })
            }
          />
        </Form.Group>
        <Form.Group controlId="formAddressSearch" style={{ marginTop: "10px" }}>
          <Form.Label>Search for address</Form.Label>
          <Autocomplete
            onLoad={(ref) => (autocompleteRef.current = ref)}
            onPlaceChanged={onPlaceChanged}
          >
            <Form.Control
              type="text"
              placeholder="Enter an address"
              value={locationData.address_name}
              onChange={(e) =>
                setLocationData({
                  ...locationData,
                  address_name: e.target.value,
                })
              }
            />
          </Autocomplete>
        </Form.Group>
        <Form.Group
          controlId="formSelectDrawingMode"
          style={{ marginTop: "10px" }}
        >
          <Form.Label>Select Drawing Mode:</Form.Label>
          <div>
            <Button
              variant="primary"
              onClick={() => setDrawingMode("polygon")}
              disabled={drawingMode === "polygon"}
            >
              Draw Polygon
            </Button>{" "}
            <Button
              variant="primary"
              onClick={() => setDrawingMode("circle")}
              disabled={drawingMode === "circle"}
            >
              Draw Circle
            </Button>{" "}
            <Button
              variant="secondary"
              onClick={handleClearDrawing}
              disabled={!drawingMode}
            >
              Clear Drawing
            </Button>
          </div>
        </Form.Group>
        <Form.Group controlId="formSelectArea" style={{ marginTop: "10px" }}>
          <Form.Label>Select area from map</Form.Label>
          <div
            style={{
              height: "400px",
              border: "1px solid #ccc",
              marginBottom: "10px",
            }}
          >
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={15}
              center={
                locationData.latitude && locationData.longitude
                  ? { lat: locationData.latitude, lng: locationData.longitude }
                  : defaultCenter
              }
              options={options}
              onClick={onMapClick}
              onLoad={onMapLoad}
            >
              {markers.map((marker) => (
                <Marker
                  key={marker.time.toISOString()}
                  position={{ lat: marker.lat, lng: marker.lng }}
                />
              ))}
              {drawingMode && (
                <DrawingManager
                  onPolygonComplete={onPolygonComplete}
                  onCircleComplete={onCircleComplete}
                  drawingMode={drawingMode}
                  options={{ drawingControl: false }}
                />
              )}
            </GoogleMap>
          </div>
        </Form.Group>
        <Form.Group controlId="formLatitude" style={{ marginTop: "10px" }}>
          <Form.Label>Latitude</Form.Label>
          <Form.Control
            type="text"
            value={locationData.latitude || ""}
            readOnly
          />
        </Form.Group>
        <Form.Group controlId="formLongitude" style={{ marginTop: "10px" }}>
          <Form.Label>Longitude</Form.Label>
          <Form.Control
            type="text"
            value={locationData.longitude || ""}
            readOnly
          />
        </Form.Group>
        <Form.Group controlId="formRadius" style={{ marginTop: "10px" }}>
          <Form.Label>Radius (meters)</Form.Label>
          <Form.Control
            type="number"
            value={locationData.radius || ""}
            readOnly
          />
        </Form.Group>
        <Form.Group controlId="formPolygonPoints" style={{ marginTop: "10px" }}>
          <Form.Label>Polygon Points</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            value={
              locationData.polygon_points.length
                ? JSON.stringify(locationData.polygon_points, null, 2)
                : ""
            }
            readOnly
          />
        </Form.Group>
        <h2 style={{ marginTop: "15px" }}>Charging Logic:</h2>
        <Row>
          <Col>
            <Form.Group controlId="formStartTime">
              <Form.Label>Start Time</Form.Label>
              <Form.Control
                type="time"
                value={chargingLogicData.start_time}
                onChange={(e) =>
                  setChargingLogicData({
                    ...chargingLogicData,
                    start_time: e.target.value,
                  })
                }
              />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group controlId="formEndTime">
              <Form.Label>End Time</Form.Label>
              <Form.Control
                type="time"
                value={chargingLogicData.end_time}
                onChange={(e) =>
                  setChargingLogicData({
                    ...chargingLogicData,
                    end_time: e.target.value,
                  })
                }
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col>
            <Form.Group
              controlId="formAmountToCharge"
              style={{ marginTop: "10px" }}
            >
              <Form.Label>Amount to Charge</Form.Label>
              <Form.Control
                type="number"
                placeholder="Amount"
                value={chargingLogicData.amount_to_charge}
                onChange={(e) =>
                  setChargingLogicData({
                    ...chargingLogicData,
                    amount_to_charge: e.target.value,
                  })
                }
              />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group
              controlId="formAmountRate"
              style={{ marginTop: "10px" }}
            >
              <Form.Label>Amount Rate</Form.Label>
              <Form.Select
                value={chargingLogicData.amount_rate || ""}
                onChange={(e) => {
                  console.log("Selected Amount Rate:", e.target.value);
                  setChargingLogicData({
                    ...chargingLogicData,
                    amount_rate: e.target.value,
                  });
                }}
              >
                <option value="">Select Rate</option>
                <option value="second">Per Second</option>
                <option value="minute">Per Minute</option>
                <option value="hour">Per Hour</option>
                <option value="day">Per Day</option>
                <option value="week">Per Week</option>
                <option value="month">Per Month</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        <Form.Group controlId="formDays" style={{ marginTop: "10px" }}>
          <Form.Label>Days</Form.Label>
          <Form.Control
            type="text"
            placeholder="Days (e.g., Monday, Tuesday)"
            value={chargingLogicData.days.join(", ")}
            onChange={(e) =>
              setChargingLogicData({
                ...chargingLogicData,
                days: e.target.value.split(",").map((day) => day.trim()),
              })
            }
          />
        </Form.Group>
        <Form.Group controlId="formMonths" style={{ marginTop: "10px" }}>
          <Form.Label>Months</Form.Label>
          <Form.Control
            type="text"
            placeholder="Months (e.g., January, February)"
            value={chargingLogicData.months.join(", ")}
            onChange={(e) =>
              setChargingLogicData({
                ...chargingLogicData,
                months: e.target.value.split(",").map((month) => month.trim()),
              })
            }
          />
        </Form.Group>
        <Form.Group controlId="formYears" style={{ marginTop: "10px" }}>
          <Form.Label>Years</Form.Label>
          <Form.Control
            type="text"
            placeholder="Years (e.g., 2022, 2023)"
            value={chargingLogicData.years.join(", ")}
            onChange={(e) =>
              setChargingLogicData({
                ...chargingLogicData,
                years: e.target.value.split(",").map((year) => year.trim()),
              })
            }
          />
        </Form.Group>
        <Button variant="primary" type="submit" style={{ marginTop: "15px" }}>
          Submit
        </Button>
      </Form>
    </Container>
  );
};

export default AddLocationPage;
