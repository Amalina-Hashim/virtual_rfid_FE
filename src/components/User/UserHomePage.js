import React, { useState, useEffect } from "react";
import { Container, Button } from "react-bootstrap";
import { getUser, getBalance } from "../../services/api";
import GeofenceMonitor from "../GeofenceMonitor";

const POLLING_INTERVAL = 30000;
const GEOLOCATION_TIMEOUT = 10000;

const UserHomePage = () => {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [locationInfo, setLocationInfo] = useState(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUser();
        setUser(response.data);
        checkGpsEnabled();
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };

    fetchUser();
  }, []);

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

  const checkGpsEnabled = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsEnabled(true);
          fetchBalance();
        },
        (error) => {
          console.error("Error watching position:", error);
          setGpsEnabled(false);
        },
        {
          timeout: GEOLOCATION_TIMEOUT,
        }
      );
    } else {
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
    }
  };

  const handleGeofenceEnter = (locationInfo) => {
    setLocationInfo(locationInfo);
  };

  const handleBalanceUpdate = (newBalance) => {
    setBalance(newBalance);
  };

  return (
    <Container>
      <h1>Hello, {user ? user.username : "User"}</h1>
      {!gpsEnabled ? (
        <div>
          <p>Please enable GPS to use our service.</p>
          <Button onClick={checkGpsEnabled}>Enable GPS</Button>
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
    </Container>
  );
};

export default UserHomePage;
