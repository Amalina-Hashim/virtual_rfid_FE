import React, { useState, useEffect, useRef } from "react";
import { Container, Button, Spinner } from "react-bootstrap";
import { getUser, getBalance } from "../../services/api";
import GeofenceMonitor from "../GeofenceMonitor";

const POLLING_INTERVAL = 30000;
const GEOLOCATION_TIMEOUT = 30000;

const UserHomePage = ({ isLoggedOut }) => {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [locationInfo, setLocationInfo] = useState(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [checkingGps, setCheckingGps] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [retryGps, setRetryGps] = useState(false);

  const watchId = useRef(null);

  useEffect(() => {
    if (isLoggedOut) {
      setUser(null);
      setBalance(0);
      setLocationInfo(null);
      setGpsEnabled(false);
      setCheckingGps(false);
      setFetchError(null);
      setRetryGps(false);
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    }
  }, [isLoggedOut]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUser();
        console.log("Fetched user:", response.data);
        setUser(response.data);
        checkGpsEnabled();
      } catch (error) {
        console.error("Failed to fetch user", error);
        setCheckingGps(false);
        setFetchError("Failed to fetch user data.");
      }
    };

    if (!isLoggedOut) {
      fetchUser();
    }
  }, [isLoggedOut]);

  useEffect(() => {
    let balancePolling;

    if (gpsEnabled) {
      fetchBalance();
      balancePolling = setInterval(() => {
        fetchBalance();
      }, POLLING_INTERVAL);
    }

    return () => {
      if (balancePolling) {
        clearInterval(balancePolling);
      }
    };
  }, [gpsEnabled]);

  useEffect(() => {
    if (retryGps) {
      checkGpsEnabled();
    }
  }, [retryGps]);

  const checkGpsEnabled = async () => {
    console.log("Checking GPS status...");
    setCheckingGps(true);

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
        setCheckingGps(false);
      }
    } catch (error) {
      console.error("Failed to check GPS permission", error);
      setGpsEnabled(false);
      setCheckingGps(false);
    }

    setRetryGps(false);
  };

  const getGpsLocation = () => {
    if ("geolocation" in navigator) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          console.log("GPS enabled:", position);
          setGpsEnabled(true);
          setCheckingGps(false);
          fetchBalance();
        },
        (error) => {
          console.error("Error watching position:", error);
          setGpsEnabled(false);
          setCheckingGps(false);
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
      setCheckingGps(false);
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
      {checkingGps ? (
        <div>
          <p>Checking GPS status...</p>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : !gpsEnabled ? (
        <div>
          <p>Please enable GPS to use our service.</p>
          <Button onClick={handleRetryGps}>Retry GPS Check</Button>
          {!gpsEnabled && (
            <p>
              GPS is not enabled. Please enable GPS in your device settings.
            </p>
          )}
        </div>
      ) : (
        <div>
          <p>Your current balance is: ${balance}</p>
          {locationInfo && (
            <div>
              <p>You are within the zone: {locationInfo.location_name}</p>
              <p>Charge amount: ${locationInfo.amount_to_charge}</p>
              <p>Charge rate: {locationInfo.amount_rate}</p>
            </div>
          )}
          <GeofenceMonitor
            onGeofenceEnter={handleGeofenceEnter}
            onBalanceUpdate={handleBalanceUpdate}
          />
        </div>
      )}
      {fetchError && <p style={{ color: "red" }}>{fetchError}</p>}
    </Container>
  );
};

export default UserHomePage;
