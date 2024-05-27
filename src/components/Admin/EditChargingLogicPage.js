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

const mapContainerStyle = { height: "400px", width: "100%" };
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
    if (location.state) {
      const { locationData, chargingLogicData } = location.state;
      setLocationData({
        ...locationData,
        latitude: parseFloat(locationData.latitude),
        longitude: parseFloat(locationData.longitude),
        radius:
          locationData.radius !== "" ? parseFloat(locationData.radius) : null,
      });
      setChargingLogicData({
        ...chargingLogicData,
        days: chargingLogicData.days || [],
        months: chargingLogicData.months || [],
        years: chargingLogicData.years || [],
      });
    } else {
      const fetchLocationAndChargingLogic = async () => {
        try {
          const locationResponse = await getLocationById(id);
          const locationData = locationResponse.data;
          setLocationData({
            ...locationData,
            latitude: parseFloat(locationData.latitude),
            longitude: parseFloat(locationData.longitude),
            radius:
              locationData.radius !== ""
                ? parseFloat(locationData.radius)
                : null,
          });

          const chargingLogicResponse = await getChargingLogicById(id);
          const chargingLogic = chargingLogicResponse.data;
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
      };

      console.log("Updating charging logic with data:", updatedChargingLogic);
      await updateChargingLogic(chargingLogicData.id, updatedChargingLogic);
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
    setPolygon(polygon); // Persist polygon
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
    setCircle(circle); // Persist circle
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

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formLocationName">
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
        <Form.Group controlId="formAddressSearch">
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
        <Form.Group controlId="formSelectDrawingMode">
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
              <div>Loading Map...</div>
            )}
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
        <h2>Charging Logic</h2>
        <Form.Group controlId="formStartTime">
          <Form.Label>Start Time</Form.Label>
          <Form.Control
            type="time"
            value={chargingLogicData.start_time || ""}
            onChange={(e) =>
              setChargingLogicData({
                ...chargingLogicData,
                start_time: e.target.value,
              })
            }
          />
        </Form.Group>
        <Form.Group controlId="formEndTime">
          <Form.Label>End Time</Form.Label>
          <Form.Control
            type="time"
            value={chargingLogicData.end_time || ""}
            onChange={(e) =>
              setChargingLogicData({
                ...chargingLogicData,
                end_time: e.target.value,
              })
            }
          />
        </Form.Group>
        <Form.Group controlId="formAmountToCharge">
          <Form.Label>Amount to Charge</Form.Label>
          <Form.Control
            type="number"
            value={chargingLogicData.amount_to_charge || ""}
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
            as="select"
            value={chargingLogicData.amount_rate || ""}
            onChange={(e) =>
              setChargingLogicData({
                ...chargingLogicData,
                amount_rate: e.target.value,
              })
            }
          >
            <option value="">Select Rate</option>
            <option value="second">Per Second</option>
            <option value="minute">Per Minute</option>
            <option value="hour">Per Hour</option>
            <option value="day">Per Day</option>
            <option value="month">Per Month</option>
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="formDays">
          <Form.Label>Days</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter days (e.g., Mon,Tue,Wed)"
            value={chargingLogicData.days.join(",")}
            onChange={(e) =>
              setChargingLogicData({
                ...chargingLogicData,
                days: e.target.value.split(","),
              })
            }
          />
        </Form.Group>
        <Form.Group controlId="formMonths">
          <Form.Label>Months</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter months (e.g., Jan,Feb,Mar)"
            value={chargingLogicData.months.join(",")}
            onChange={(e) =>
              setChargingLogicData({
                ...chargingLogicData,
                months: e.target.value.split(","),
              })
            }
          />
        </Form.Group>
        <Form.Group controlId="formYears">
          <Form.Label>Years</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter years (e.g., 2021,2022)"
            value={chargingLogicData.years.join(",")}
            onChange={(e) =>
              setChargingLogicData({
                ...chargingLogicData,
                years: e.target.value.split(","),
              })
            }
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Save
        </Button>
      </Form>
    </Container>
  );
};

export default EditChargingLogicPage;
