import React, { useState, useEffect, useRef, useContext } from "react";
import { Container, Spinner, Card } from "react-bootstrap";
import {
  getUser,
  getBalance,
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
  const [applicableChargingLogic, setApplicableChargingLogic] = useState(null);
  const [checkingGps, setCheckingGps] = useState(false);
  const [gpsChecked, setGpsChecked] = useState(false);

  const balancePolling = useRef(null);
  const { isLoggedIn } = useContext(LoginContext);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUser();
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
          checkChargingLogicByLocation(latitude, longitude);
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
          checkChargingLogicByLocation(latitude, longitude);
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
    if (!locationInfo) return; // Ensure location info is available

    try {
      const response = await checkAndChargeUser({
        latitude: locationInfo.location.latitude,
        longitude: locationInfo.location.longitude,
        timestamp: new Date().toISOString(),
      });

      if (response.status === 200) {
        setBalance(response.data.balance);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      setFetchError("Failed to fetch balance.");
    }
  };

  const checkChargingLogicByLocation = async (latitude, longitude) => {
    try {
      const response = await getChargingLogicByLocation({
        latitude,
        longitude,
      });
      console.log("Full charging logic by location response:", response.data);

      if (response.data) {
        setApplicableChargingLogic({
          amount: response.data.amount_to_charge, // Use the actual amount from the response
          amount_rate: response.data.amount_rate,
          location_name: response.data.location_name,
        });
      } else {
        setApplicableChargingLogic(null);
      }
    } catch (error) {
      console.error("Failed to get charging logic by location:", error);
      setApplicableChargingLogic(null);
    }
  };

  const handleGeofenceEnter = (locationInfo) => {
    setLocationInfo(locationInfo);
    fetchBalance();
  };

  const handleBalanceUpdate = (newBalance) => {
    setBalance(newBalance);
  };

  if (fetchError) {
    return (
      <Container>
        <div className="alert alert-danger">{fetchError}</div>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

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
            style={{ width: "500px", backgroundColor: "#555555" }}
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
                  {console.log(
                    "Rendering applicableChargingLogic:",
                    applicableChargingLogic
                  )}
                  <p>
                    You are within the zone:{" "}
                    <span style={{ fontWeight: "bold" }}>
                      {applicableChargingLogic.location_name}
                    </span>
                  </p>
                  <p>
                    Charge amount:{" "}
                    <span style={{ fontWeight: "bold" }}>
                      ${applicableChargingLogic.amount}
                    </span>{" "}
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