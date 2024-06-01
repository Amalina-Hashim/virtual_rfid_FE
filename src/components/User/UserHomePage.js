import React, { useState, useEffect, useRef, useContext } from "react";
import { Container, Spinner } from "react-bootstrap";
import {
  getUser,
  getBalance,
  getChargingLogicStatus,
  checkAndChargeUser as apiCheckAndChargeUser,
} from "../../services/api";
import GeofenceMonitor from "../GeofenceMonitor";
import LoginContext from "../../LoginContext";
import Card from "react-bootstrap/Card";


const POLLING_INTERVAL = 10000;
const GEOLOCATION_TIMEOUT = 20000;

const UserHomePage = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [locationInfo, setLocationInfo] = useState(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [chargingLogics, setChargingLogics] = useState([]);
  const [applicableChargingLogic, setApplicableChargingLogic] = useState(null);
  const [checkingGps, setCheckingGps] = useState(false);
  const [gpsChecked, setGpsChecked] = useState(false);

  const balancePolling = useRef(null);
  const { isLoggedIn } = useContext(LoginContext);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUser();
      fetchChargingLogicStatus();
      if (!gpsChecked) {
        checkGpsEnabled();
      }
    } else {
      resetState();
    }
    return () => {
      stopPolling();
    };
  }, [isLoggedIn, gpsChecked]);

  useEffect(() => {
    if (isLoggedIn && locationInfo) {
      startPolling();
    } else {
      stopPolling();
    }
    return () => {
      stopPolling();
    };
  }, [isLoggedIn, locationInfo]);

  const resetState = () => {
    setUser(null);
    setBalance(0);
    setLocationInfo(null);
    setGpsEnabled(false);
    setFetchError(null);
    setApplicableChargingLogic(null);
    setCheckingGps(false);
    setGpsChecked(false);
    stopPolling();
  };

  const startPolling = () => {
    if (!balancePolling.current) {
      balancePolling.current = setInterval(() => {
        fetchBalance();
        if (locationInfo) {
          const { latitude, longitude } = locationInfo.location;
          checkAndChargeUser(latitude, longitude);
        }
      }, POLLING_INTERVAL);
    }
  };

  const stopPolling = () => {
    if (balancePolling.current) {
      clearInterval(balancePolling.current);
      balancePolling.current = null;
    }
  };

  const fetchUser = async () => {
    try {
      const response = await getUser();
      if (response.data && response.data.username) {
        setUser(response.data);
        fetchBalance();
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
      setChargingLogics(status);
    } catch (error) {
      console.error("Failed to fetch charging logic status", error);
    }
  };

  const checkGpsEnabled = async () => {
    setCheckingGps(true);
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
        setGpsEnabled(false);
        setCheckingGps(false);
      }
    } catch (error) {
      setGpsEnabled(false);
      setCheckingGps(false);
    }
    setGpsChecked(true);
  };

  const getGpsLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsEnabled(true);
          setCheckingGps(false);
          const { latitude, longitude } = position.coords;
          setLocationInfo({ location: { latitude, longitude } });
          checkAndChargeUser(latitude, longitude);
        },
        (error) => {
          if (error.code === 3) {
            console.error("Geolocation timeout expired");
          } else {
            console.error("Error getting current position:", error);
          }
          setGpsEnabled(false);
          setCheckingGps(false);
        },
        {
          timeout: GEOLOCATION_TIMEOUT,
          enableHighAccuracy: false,
          maximumAge: 0,
        }
      );
    } else {
      setGpsEnabled(false);
      setCheckingGps(false);
      console.error("Geolocation not available in navigator");
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await getBalance();
      setBalance(response.data.balance);
    } catch (error) {
      setFetchError("Failed to fetch balance.");
    }
  };

  const checkAndChargeUser = async (latitude, longitude) => {
    if (latitude === undefined || longitude === undefined) {
      console.error("Latitude or longitude is undefined.");
      return;
    }

    const currentTime = new Date().toISOString(); 

    const payload = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: currentTime,
    };

    if (isNaN(payload.latitude) || isNaN(payload.longitude)) {
      console.error("Latitude or longitude is not a valid number.");
      return;
    }

    console.log("Sending request payload:", payload);

    try {
      const response = await apiCheckAndChargeUser(payload);
      console.log("Response received:", response.data);

      if (response.data.transaction) {
        setApplicableChargingLogic({
          amount: response.data.transaction.amount,
          amount_rate: response.data.transaction.amount_rate,
          location_name: response.data.location.location_name,
        });
        fetchBalance(); 
      } else {
        setApplicableChargingLogic(null);
      }
    } catch (error) {
      setFetchError("Failed to check and charge user.");
      setApplicableChargingLogic(null);
      console.error("API call to check and charge user failed:", error);

      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        console.error("Error response headers:", error.response.headers);
      }
    }
  };

  const handleGeofenceEnter = (locationInfo) => {
    setLocationInfo(locationInfo);
    const { latitude, longitude } = locationInfo.location;
    checkAndChargeUser(latitude, longitude);
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
          {applicableChargingLogic && (
            <div>
              <Card
                className="mx-auto mt-3"
                style={{
                  width: "500px",
                  backgroundColor: "#3a3a3a",
                  color: "white",
                  fontSize: "20px",
                }}
              >
                <Card.Body>
                  <p>
                    You are within the zone:{" "}
                    <span style={{ fontWeight: "bold" }}>
                      {" "}
                      {applicableChargingLogic.location_name}{" "}
                    </span>
                  </p>
                  <p>
                    Charge amount:{" "}
                    <span style={{ fontWeight: "bold" }}>
                      ${applicableChargingLogic.amount}
                    </span>
                  </p>
                  <p>
                    Charge rate:{" "}
                    <span style={{ fontWeight: "bold" }}>
                      Per {applicableChargingLogic.amount_rate}
                    </span>
                  </p>
                </Card.Body>
              </Card>
            </div>
          )}
          <GeofenceMonitor onGeofenceEnter={handleGeofenceEnter} />
        </div>
      )}
    </Container>
  );
};

export default UserHomePage;
