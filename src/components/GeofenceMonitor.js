import React, { useEffect } from "react";
import { getChargingLogicByLocation } from "../services/api";

const GeofenceMonitor = ({ onGeofenceEnter }) => {
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          checkGeofence(latitude, longitude);
        },
        (error) => {
          console.error("Error watching position:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 5000,
        }
      );
    }
  }, []);

  const checkGeofence = async (latitude, longitude) => {
    try {
      const lat = parseFloat(latitude.toFixed(6));
      const lon = parseFloat(longitude.toFixed(6));
      console.log("Checking geofence with latitude:", lat, "longitude:", lon);
      const response = await getChargingLogicByLocation({
        latitude: lat,
        longitude: lon,
      });
      console.log("Geofence check response:", response.data); // Log the entire response data

      if (response.data && typeof onGeofenceEnter === "function") {
        onGeofenceEnter(response.data);
      } else {
        console.error("onGeofenceEnter is not a function");
      }
    } catch (error) {
      console.error("Failed to check geofence:", error);
    }
  };

  return null;
};

export default GeofenceMonitor;
