import React, { useState, useEffect, useRef, useContext } from "react";
import { Container, Button, Spinner } from "react-bootstrap";
import { getUser, getBalance } from "../../services/api";
import GeofenceMonitor from "../GeofenceMonitor";
import LoginContext from "../../LoginContext";
import { useLocation } from "react-router-dom";

const POLLING_INTERVAL = 30000;
const GEOLOCATION_TIMEOUT = 30000;

const UserHomePage = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [locationInfo, setLocationInfo] = useState(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [retryGps, setRetryGps] = useState(false);

  const watchId = useRef(null);
  const location = useLocation();
  const { isLoggedIn, setIsLoggedIn } = useContext(LoginContext);

  useEffect(() => {
    if (!isLoggedIn) {
      setUser(null);
      setBalance(0);
      setLocationInfo(null);
      setGpsEnabled(false);
      setFetchError(null);
      setRetryGps(false);
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUser();
        console.log("Fetched user:", response.data);
        setUser(response.data);
        if (isLoggedIn) {
          checkGpsEnabled();
        } else {
          fetchBalance();
        }
      } catch (error) {
        console.error("Failed to fetch user", error);
        setFetchError("Failed to fetch user data.");
      }
    };

    if (!isLoggedIn) {
      fetchUser();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    let balancePolling;

    if (gpsEnabled || !isLoggedIn) {
      balancePolling = setInterval(() => {
        fetchBalance();
      }, POLLING_INTERVAL);
    }

    return () => {
      if (balancePolling) {
        clearInterval(balancePolling);
      }
    };
  }, [gpsEnabled, isLoggedIn]);

  useEffect(() => {
    if (retryGps) {
      checkGpsEnabled();
    }
  }, [retryGps]);

  const checkGpsEnabled = async () => {
    console.log("Checking GPS status...");

    try {
      const permissionStatus = await navigator.permissions.query({
        name: "geolocation",
      });

      if (
        permissionStatus.state === "granted" ||
        permissionStatus.state === "prompt"
      ) {
        console.log("GPS permission granted or prompt required");
        getGpsLocation();
      } else {
        console.log("GPS permission denied");
        setGpsEnabled(false);
      }
    } catch (error) {
      console.error("Failed to check GPS permission", error);
      setGpsEnabled(false);
    }

    setRetryGps(false);
  };

  const getGpsLocation = () => {
    if ("geolocation" in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          console.log("GPS enabled:", position);
          setGpsEnabled(true);
          fetchBalance();
        },
        (error) => {
          console.error("Error watching position:", error);
          setGpsEnabled(false);
          if (error.code === error.TIMEOUT) {
            console.error("Geolocation timeout expired");
          }
        },
        {
          timeout: GEOLOCATION_TIMEOUT,
          enableHighAccuracy: true,
        }
      );
    } else {
      console.log("Geolocation not available in navigator");
      setGpsEnabled(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await getBalance();
      console.log("Fetched balance:", response.data.balance);
      setBalance(response.data.balance);
    } catch (error) {
      console.error("Failed to fetch balance", error);
      setFetchError("Failed to fetch balance.");
    }
  };

  const handleGeofenceEnter = (locationInfo) => {
    setLocationInfo(locationInfo);
  };

  const handleBalanceUpdate = (newBalance) => {
    setBalance(newBalance);
  };

  const handleRetryGps = () => {
    console.log("Retrying GPS check...");
    setRetryGps(true);
  };

  return (
    <Container>
      <h1>Hello, {user ? user.username : "User"}</h1>
      {isLoggedIn && !gpsEnabled && (
        <div>
          <p>Checking GPS status...</p>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}
      {fetchError ? (
        <p style={{ color: "red" }}>{fetchError}</p>
      ) : (
        <div>
          <p>Your current balance is: ${balance}</p>
          {locationInfo && (
            <div>
              <p>You are within the zone: {locationInfo.location_name}</p>
              <p>Charge amount: ${locationInfo.amount_to_charge}</p>
              <p>Charge rate: Per {locationInfo.amount_rate}</p>
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
