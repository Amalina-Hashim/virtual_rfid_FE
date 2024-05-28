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
    const response = await getChargingLogicByLocation({
      latitude: parseFloat(latitude.toFixed(6)), 
      longitude: parseFloat(longitude.toFixed(6)), 
    });
    if (response.data) {
      onGeofenceEnter(response.data);
    }
  } catch (error) {
    console.error("Failed to check geofence:", error);
  }
};

  return null;
};

export default GeofenceMonitor;
