import React, { useState, useEffect, useCallback, useRef } from "react";
import { Container, Form, Button, Row, Col } from "react-bootstrap";
import { GoogleMap, DrawingManager, Marker } from "@react-google-maps/api";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  getLocationById,
  getChargingLogicById,
  updateLocation,
  updateChargingLogic,
} from "../../services/api";
import { useGoogleMaps } from "../../GoogleMapsProvider";


const defaultCenter = { lat: 37.7749, lng: -122.4194 };

const EditChargingLogicPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [circle, setCircle] = useState(null);
  const [polygon, setPolygon] = useState(null);
  const mapRef = useRef();
  const [drawingMode, setDrawingMode] = useState(null);

  useEffect(() => {
    const fetchLocationAndChargingLogic = async () => {
      try {
        const chargingLogicResponse = await getChargingLogicById(id);
        const chargingLogic = chargingLogicResponse.data;
        const locationId = chargingLogic.location.id;

        const locationResponse = await getLocationById(locationId);
        const locationData = locationResponse.data;

        setLocationData({
          ...locationData,
          latitude: parseFloat(locationData.latitude),
          longitude: parseFloat(locationData.longitude),
          radius:
            locationData.radius !== "" ? parseFloat(locationData.radius) : null,
          polygon_points: locationData.polygon_points || [],
        });

        setChargingLogicData({
          ...chargingLogic,
          days: chargingLogic.days || [],
          months: chargingLogic.months || [],
          years: chargingLogic.years || [],
        });
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    if (location.state) {
      const { locationData, chargingLogicData } = location.state;
      setLocationData({
        ...locationData,
        latitude: parseFloat(locationData.latitude),
        longitude: parseFloat(locationData.longitude),
        radius:
          locationData.radius !== "" ? parseFloat(locationData.radius) : null,
        polygon_points: locationData.polygon_points || [],
      });
      setChargingLogicData({
        ...chargingLogicData,
        days: chargingLogicData.days || [],
        months: chargingLogicData.months || [],
        years: chargingLogicData.years || [],
      });
    } else {
      fetchLocationAndChargingLogic();
    }
  }, [id, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formattedLocationData = {
      ...locationData,
      latitude: locationData.latitude
        ? parseFloat(locationData.latitude.toFixed(7))
        : null,
      longitude: locationData.longitude
        ? parseFloat(locationData.longitude.toFixed(7))
        : null,
      radius: locationData.radius
        ? parseFloat(locationData.radius.toFixed(2))
        : null,
    };

    try {
      console.log("Updating location with data:", formattedLocationData);
      await updateLocation(formattedLocationData.id, formattedLocationData);

      const updatedChargingLogic = {
        ...chargingLogicData,
        days: chargingLogicData.days,
        months: chargingLogicData.months,
        years: chargingLogicData.years.map((year) => parseInt(year, 10)),
        location: formattedLocationData,
      };

      console.log("Updating charging logic with data:", updatedChargingLogic);
      await updateChargingLogic(chargingLogicData.id, updatedChargingLogic);

      const updatedLocation = await getLocationById(formattedLocationData.id);
      setLocationData(updatedLocation.data);

      navigate("/admin/home");
    } catch (error) {
      console.error("Error updating data: ", error);
    }
  };

  const onPolygonComplete = (polygon) => {
    const polygonPath = polygon
      .getPath()
      .getArray()
      .map((latLng) => ({
        lat: latLng.lat(),
        lng: latLng.lng(),
      }));
    setLocationData({
      ...locationData,
      polygon_points: polygonPath,
      radius: null,
    });
    setPolygon(polygon);
    setDrawingMode(null);
  };

  const onCircleComplete = (circle) => {
    setLocationData({
      ...locationData,
      latitude: circle.getCenter().lat(),
      longitude: circle.getCenter().lng(),
      radius: circle.getRadius(),
      polygon_points: [],
    });
    setCircle(circle);
    setDrawingMode(null);
  };

  const onMapLoad = useCallback(
    (map) => {
      mapRef.current = map;
      if (locationData.latitude && locationData.longitude) {
        mapRef.current.panTo({
          lat: locationData.latitude,
          lng: locationData.longitude,
        });
        mapRef.current.setZoom(15);
        setMarkers([
          {
            lat: locationData.latitude,
            lng: locationData.longitude,
            time: new Date(),
          },
        ]);
      }
    },
    [locationData]
  );

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

  const handleCancel = () => {
    navigate(-1); 
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formLocationName" style={{ marginTop: "15px" }}>
          <Form.Label>Location Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter location name"
            value={locationData.location_name || ""}
            onChange={(e) =>
              setLocationData({
                ...locationData,
                location_name: e.target.value,
              })
            }
          />
        </Form.Group>
        <Form.Group controlId="formAddressSearch" style={{ marginTop: "10px" }}>
          <Form.Label>Address Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter address name"
            value={locationData.address_name || ""}
            onChange={(e) =>
              setLocationData({ ...locationData, address_name: e.target.value })
            }
          />
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
            <Button variant="secondary" onClick={handleClearDrawing}>
              Clear Drawing
            </Button>
          </div>
        </Form.Group>
        <Form.Group controlId="formMap">
          <Form.Label>Map</Form.Label>
          <div style={{ height: "400px" }}>
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ height: "100%", width: "100%" }}
                center={
                  locationData.latitude && locationData.longitude
                    ? {
                        lat: locationData.latitude,
                        lng: locationData.longitude,
                      }
                    : defaultCenter
                }
                zoom={15}
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
            ) : (
              <p>Loading...</p>
            )}
          </div>
        </Form.Group>
        <Form.Group controlId="formLatitude" style={{ marginTop: "10px" }}>
          <Form.Label>Latitude</Form.Label>
          <Form.Control
            type="number"
            value={locationData.latitude || ""}
            onChange={(e) =>
              setLocationData({
                ...locationData,
                latitude: parseFloat(e.target.value),
              })
            }
          />
        </Form.Group>
        <Form.Group controlId="formLongitude" style={{ marginTop: "10px" }}>
          <Form.Label>Longitude</Form.Label>
          <Form.Control
            type="number"
            value={locationData.longitude || ""}
            onChange={(e) =>
              setLocationData({
                ...locationData,
                longitude: parseFloat(e.target.value),
              })
            }
          />
        </Form.Group>
        <Form.Group controlId="formRadius" style={{ marginTop: "10px" }}>
          <Form.Label>Radius (meters)</Form.Label>
          <Form.Control
            type="number"
            value={locationData.radius || ""}
            onChange={(e) =>
              setLocationData({
                ...locationData,
                radius: parseFloat(e.target.value),
              })
            }
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
        <Form.Group controlId="formChargingLogic" style={{ marginTop: "10px" }}>
          <Form.Label>Charging Logic</Form.Label>
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
                  value={chargingLogicData.amount_to_charge}
                  onChange={(e) =>
                    setChargingLogicData({
                      ...chargingLogicData,
                      amount_to_charge: parseFloat(e.target.value),
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
              value={chargingLogicData.months.join(", ")}
              onChange={(e) =>
                setChargingLogicData({
                  ...chargingLogicData,
                  months: e.target.value
                    .split(",")
                    .map((month) => month.trim()),
                })
              }
            />
          </Form.Group>
          <Form.Group controlId="formYears" style={{ marginTop: "10px" }}>
            <Form.Label>Years</Form.Label>
            <Form.Control
              type="text"
              value={chargingLogicData.years.join(", ")}
              onChange={(e) =>
                setChargingLogicData({
                  ...chargingLogicData,
                  years: e.target.value.split(",").map((year) => year.trim()),
                })
              }
            />
          </Form.Group>
        </Form.Group>
        <Button
          variant="primary"
          type="submit"
          style={{ marginTop: "15px", marginBottom: "15px" }}
        >
          Update
        </Button>{" "}
        <Button
          variant="secondary"
          onClick={handleCancel}
          style={{ marginTop: "15px", marginBottom: "15px" }}
        >
          Cancel
        </Button>
      </Form>
    </Container>
  );
};

export default EditChargingLogicPage;
