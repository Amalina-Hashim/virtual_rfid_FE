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
  console.log("Polygon complete:", polygon);
  const coordinates = polygon
    .getPath()
    .getArray()
    .map((coord) => ({
      lat: parseFloat(coord.lat().toFixed(7)),
      lng: parseFloat(coord.lng().toFixed(7)),
    }));
  console.log("Polygon coordinates:", coordinates);
  setLocationData((prev) => ({
    ...prev,
    polygon_points: coordinates,
    radius: null,
  }));
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
            disabled={locationData.polygon_points.length > 0}
          />
        </Form.Group>
        <Form.Group controlId="formPolygonPoints" style={{ marginTop: "10px" }}>
          <Form.Label>Polygon Points</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={JSON.stringify(locationData.polygon_points, null, 2) || ""}
            readOnly
          />
        </Form.Group>

        <Button
          variant="secondary"
          style={{ marginTop: "15px", marginBottom: "15px", marginRight: "8px" }}
          onClick={handleCancel}
        >
          {" "}
          Cancel
        </Button>

        <Button
          variant="primary"
          type="submit"
          style={{ marginTop: "15px", marginBottom: "15px" }}
          className="float-end"
        >
          Save Changes
        </Button>
      </Form>
    </Container>
  );
};

export default EditChargingLogicPage;
