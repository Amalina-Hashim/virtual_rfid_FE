import React, { useState, useEffect, useContext } from "react";
import { Container, Spinner, Card } from "react-bootstrap";
import { getUser, getChargingLogicStatus } from "../../services/api";
import GeofenceMonitor from "../GeofenceMonitor";
import LoginContext from "../../LoginContext";
import PollingContext from "../../PollingContext";

const UserHomePage = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [chargingLogics, setChargingLogics] = useState([]);
  const [applicableChargingLogics, setApplicableChargingLogics] = useState([]);
  const [checkingGps, setCheckingGps] = useState(false);
  const [gpsChecked, setGpsChecked] = useState(false);
  const { isLoggedIn } = useContext(LoginContext);
  const { balance, setLocationInfo, setBalance } = useContext(PollingContext);

  useEffect(() => {
    console.log("UserHomePage useEffect - isLoggedIn:", isLoggedIn);
    if (isLoggedIn) {
      fetchUser();
      fetchChargingLogicStatus();
      checkGpsEnabled();
    } else {
      resetState();
    }
  }, [isLoggedIn]);

  const resetState = () => {
    console.log("Resetting state in UserHomePage");
    setUser(null);
    setFetchError(null);
    setApplicableChargingLogics([]);
    setCheckingGps(false);
    setGpsChecked(false);
  };

  const fetchUser = async () => {
    try {
      const response = await getUser();
      if (response.data && response.data.username) {
        console.log("Fetched user data:", response.data);
        setUser(response.data);
      } else {
        setFetchError("User data is missing or incomplete.");
      }
    } catch (error) {
      setFetchError("Failed to fetch user data.");
    }
  };

  const fetchChargingLogicStatus = async () => {
    try {
      const status = await getChargingLogicStatus();
      console.log("Fetched charging logic status:", status);
      setChargingLogics(status);
    } catch (error) {
      console.error("Failed to fetch charging logic status", error);
    }
  };

  const handleGeofenceEnter = (locationInfo) => {
    console.log("Geofence Enter - Location Info:", locationInfo);
    setLocationInfo(locationInfo);
    setApplicableChargingLogics([locationInfo.charging_logic]);
  };

  const handleBalanceUpdate = (newBalance) => {
    setBalance(parseFloat(newBalance).toFixed(2));
  };

  const checkGpsEnabled = async () => {
    try {
      const permissionStatus = await navigator.permissions.query({
        name: "geolocation",
      });
      if (
        permissionStatus.state === "granted" ||
        permissionStatus.state === "prompt"
      ) {
        getGpsLocation();
      } else {
        console.error("GPS permission denied");
      }
    } catch (error) {
      console.error("Error checking GPS permission", error);
    }
  };

  const getGpsLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocationInfo = { location: { latitude, longitude } };
          setLocationInfo(newLocationInfo);
          localStorage.setItem("locationInfo", JSON.stringify(newLocationInfo));
          console.log("GPS location fetched:", position.coords);
          setGpsChecked(true);
        },
        (error) => {
          console.error("Error getting current position:", error);
        },
        {
          timeout: 20000,
          enableHighAccuracy: false,
          maximumAge: 0,
        }
      );
    } else {
      console.error("Geolocation not available in navigator");
    }
  };

  return (
    <Container className="d-flex flex-column align-items-center">
      <h1 className="text-center">Hello, {user ? user.username : "User"}</h1>
      {isLoggedIn && checkingGps && !gpsChecked && (
        <div className="text-center">
          <p>Checking GPS status...</p>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}
      {fetchError ? (
        <p style={{ color: "red" }}>{fetchError}</p>
      ) : (
        <div className="text-center">
          <Card
            className="mx-auto mt-3"
            style={{
              width: "500px",
              backgroundColor: "#555555",
            }}
          >
            <Card.Body>
              <p style={{ fontSize: "25px" }}>
                Your current balance is:{" "}
                <span style={{ fontWeight: "bold" }}>${balance}</span>
              </p>
            </Card.Body>
          </Card>
          {applicableChargingLogics.length > 0 &&
            applicableChargingLogics.map((chargingLogic, index) => (
              <Card
                key={index}
                className="mx-auto mt-3"
                style={{
                  width: "500px",
                  backgroundColor: "#3a3a3a",
                  color: "white",
                  fontSize: "20px",
                }}
              >
                <Card.Body>
                  {console.log("Rendering chargingLogic:", chargingLogic)}
                  <p>
                    You are within the zone:{" "}
                    <span style={{ fontWeight: "bold" }}>
                      {chargingLogic.location_name}
                    </span>
                  </p>
                  <p>
                    Charge amount:{" "}
                    <span style={{ fontWeight: "bold" }}>
                      ${chargingLogic.amount_to_charge}
                    </span>
                  </p>
                  <p>
                    Charge rate:{" "}
                    <span style={{ fontWeight: "bold" }}>
                      Per {chargingLogic.amount_rate}
                    </span>
                  </p>
                </Card.Body>
              </Card>
            ))}
          {isLoggedIn && (
            <GeofenceMonitor
              onGeofenceEnter={handleGeofenceEnter}
              onBalanceUpdate={handleBalanceUpdate}
            />
          )}
        </div>
      )}
    </Container>
  );
};

export default UserHomePage;
