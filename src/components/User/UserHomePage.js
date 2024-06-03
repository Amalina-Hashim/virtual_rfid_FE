import React, { useState, useEffect, useRef, useContext } from "react";
import { Container, Spinner, Card } from "react-bootstrap";
import {
  getUser,
  getBalance,
  getChargingLogicStatus,
  getChargingLogicByLocation,
  checkAndChargeUser,
} from "../../services/api";
import GeofenceMonitor from "../GeofenceMonitor";
import LoginContext from "../../LoginContext";

const POLLING_INTERVAL = 2000;
const GEOLOCATION_TIMEOUT = 20000;

const UserHomePage = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [locationInfo, setLocationInfo] = useState(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [chargingLogics, setChargingLogics] = useState([]);
  const [applicableChargingLogics, setApplicableChargingLogics] = useState([]);
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
      const { latitude, longitude } = locationInfo.location;
      checkChargingLogic(latitude, longitude);
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
    setApplicableChargingLogics([]);
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
          checkGeofenceAndCharge(latitude, longitude);
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
          checkChargingLogic(latitude, longitude); // Check charging logic after getting the location
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

  const checkGeofenceAndCharge = async (latitude, longitude) => {
    const timestamp = new Date().toISOString();
    try {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      if (isNaN(lat) || isNaN(lon)) {
        throw new Error("Invalid latitude or longitude");
      }

      console.log(
        "Checking geofence with latitude:",
        lat.toFixed(7),
        "longitude:",
        lon.toFixed(7),
        "timestamp:",
        timestamp
      );

      const response = await checkAndChargeUser({
        latitude: lat.toFixed(7),
        longitude: lon.toFixed(7),
        timestamp: timestamp,
      });

      console.log("Geofence check response:", response.data);

      const { transaction, location, charging_logic } = response.data;

      if (transaction && location && charging_logic) {
        console.log("Setting applicableChargingLogic:", {
          amount: transaction.amount,
          amount_rate: charging_logic.amount_rate,
          location_name: location.location_name,
        });

        // Do not update the applicableChargingLogics here
      }
    } catch (error) {
      setFetchError("Failed to check geofence and charge.");
      console.error("Geofence check error:", error);
    }
  };

  const checkChargingLogic = async (latitude, longitude) => {
    const timestamp = new Date().toISOString();

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      console.error("Invalid latitude or longitude");
      return;
    }

    const payload = {
      latitude: lat.toFixed(7),
      longitude: lon.toFixed(7),
      timestamp: timestamp,
    };

    try {
      const data = await getChargingLogicByLocation(payload);
      console.log("Charging logic data:", data);
      setApplicableChargingLogics([data]); // Set applicable charging logics
    } catch (error) {
      console.error("Failed to fetch charging logic:", error);
      setApplicableChargingLogics([]); // Clear charging logics if fetching fails
    }
  };


  const handleGeofenceEnter = (locationInfo) => {
    setLocationInfo(locationInfo);
    fetchBalance();
  };

  const handleBalanceUpdate = (newBalance) => {
    setBalance(newBalance);
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
          <GeofenceMonitor
            onGeofenceEnter={handleGeofenceEnter}
            onBalanceUpdate={handleBalanceUpdate}
          />
        </div>
      )}
    </Container>
  );
};

export default UserHomePage;
