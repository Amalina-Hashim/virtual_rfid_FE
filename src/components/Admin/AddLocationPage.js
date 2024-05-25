import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button, Form, Container, Table, Row, Col } from "react-bootstrap";
import {
  GoogleMap,
  useLoadScript,
  DrawingManager,
  Marker,
  Autocomplete,
} from "@react-google-maps/api";
import {
  createLocation,
  createChargingLogic,
  getChargingLogics,
} from "../../services/api";

const libraries = ["places", "drawing"];
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
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

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
  const mapRef = useRef();
  const autocompleteRef = useRef();
  const [drawingMode, setDrawingMode] = useState(null);

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
              setMarkers([
                {
                  lat: latitude,
                  lng: longitude,
                  time: new Date(),
                },
              ]);
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
        {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
          time: new Date(),
        },
      ]);
      setLocationData({
        ...locationData,
        latitude: event.latLng.lat(),
        longitude: event.latLng.lng(),
      });
    },
    [locationData, drawingMode]
  );

  const onPolygonComplete = (polygon) => {
    console.log("Polygon complete:", polygon);
    const coordinates = polygon
      .getPath()
      .getArray()
      .map((coord) => ({
        lat: coord.lat(),
        lng: coord.lng(),
      }));
    console.log("Polygon coordinates:", coordinates);
    setLocationData({
      ...locationData,
      polygon_points: coordinates,
      radius: null,
    });
    polygon.setMap(null);
    setDrawingMode(null);
  };

  const onCircleComplete = (circle) => {
    console.log("Circle complete:", circle);
    const center = circle.getCenter();
    const radius = circle.getRadius();
    console.log("Circle center:", { lat: center.lat(), lng: center.lng() });
    console.log("Circle radius:", radius);
    setLocationData({
      ...locationData,
      latitude: center.lat(),
      longitude: center.lng(),
      radius: radius,
      polygon_points: [],
    });
    circle.setMap(null);
    setDrawingMode(null);
  };

  const onPlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (place.geometry) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setLocationData({
        ...locationData,
        address_name: place.formatted_address,
        latitude: lat,
        longitude: lng,
      });
      if (mapRef.current) {
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(15);
      }
      setMarkers([
        {
          lat,
          lng,
          time: new Date(),
        },
      ]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const locationResponse = await createLocation(locationData);
      const locationId = locationResponse.data.id;

      await createChargingLogic({
        ...chargingLogicData,
        location: locationId,
      });

      const response = await getChargingLogics();
      setChargingLogics(response.data);
    } catch (error) {
      console.error("Error creating location and charging logic", error);
    }
  };

  if (loadError) return "Error loading maps";
  if (!isLoaded) return "Loading Maps";

  console.log("Google Maps API loaded with libraries: places, drawing");

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
                <Button variant="primary">Edit</Button>{" "}
                <Button variant="secondary">Disable</Button>{" "}
                <Button variant="danger">Delete</Button>
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
        <Form.Group controlId="formAddressSearch">
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
        <Form.Group controlId="formSelectDrawingMode">
          <Form.Label>Select Drawing Mode:</Form.Label>
          <div>
            <Button
              variant="primary"
              onClick={() => {
                setDrawingMode("polygon");
                console.log("Drawing mode set to polygon");
              }}
              disabled={drawingMode === "polygon"}
            >
              Draw Polygon
            </Button>{" "}
            <Button
              variant="primary"
              onClick={() => {
                setDrawingMode("circle");
                console.log("Drawing mode set to circle");
              }}
              disabled={drawingMode === "circle"}
            >
              Draw Circle
            </Button>{" "}
            <Button
              variant="secondary"
              onClick={() => {
                setDrawingMode(null);
                console.log("Drawing mode cleared");
              }}
              disabled={!drawingMode}
            >
              Clear Drawing
            </Button>
          </div>
        </Form.Group>
        <Form.Group controlId="formSelectArea">
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
                  options={{
                    drawingControl: false,
                  }}
                />
              )}
            </GoogleMap>
          </div>
        </Form.Group>
        <Form.Group controlId="formLatitude">
          <Form.Label>Latitude</Form.Label>
          <Form.Control
            type="text"
            value={locationData.latitude || ""}
            readOnly
          />
        </Form.Group>
        <Form.Group controlId="formLongitude">
          <Form.Label>Longitude</Form.Label>
          <Form.Control
            type="text"
            value={locationData.longitude || ""}
            readOnly
          />
        </Form.Group>
        <Form.Group controlId="formRadius">
          <Form.Label>Radius (meters)</Form.Label>
          <Form.Control
            type="number"
            value={locationData.radius || ""}
            readOnly
          />
        </Form.Group>
        <Form.Group controlId="formPolygonPoints">
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
        <h2>Charging Logic:</h2>
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
        <Form.Group controlId="formAmountToCharge">
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
        <Form.Group controlId="formAmountRate">
          <Form.Label>Amount Rate</Form.Label>
          <Form.Control
            type="text"
            placeholder="Rate"
            value={chargingLogicData.amount_rate}
            onChange={(e) =>
              setChargingLogicData({
                ...chargingLogicData,
                amount_rate: e.target.value,
              })
            }
          />
        </Form.Group>
        <Form.Group controlId="formDays">
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
        <Form.Group controlId="formMonths">
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
        <Form.Group controlId="formYears">
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
        <Button variant="primary" type="submit">
          Submit
        </Button>
      </Form>
    </Container>
  );
};

export default AddLocationPage;
