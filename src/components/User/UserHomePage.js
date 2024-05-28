import React, { useState, useEffect } from "react";
import { Container, Button } from "react-bootstrap";
import { getUser, getBalance } from "../../services/api";
import GeofenceMonitor from "../GeofenceMonitor";

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

  const checkGpsEnabled = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsEnabled(true);
          fetchBalance();
        },
        (error) => {
          setGpsEnabled(false);
        }
      );
    } else {
      setGpsEnabled(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const response = await getBalance();
      setBalance(response.data.balance);
    } catch (error) {
      console.error("Failed to fetch balance", error);
    }
  };

  const handleGeofenceEnter = (locationInfo) => {
    setLocationInfo(locationInfo);
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
          <GeofenceMonitor onGeofenceEnter={handleGeofenceEnter} />
        </div>
      )}
    </Container>
  );
};

export default UserHomePage;
