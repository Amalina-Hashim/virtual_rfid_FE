import React, { useEffect, useRef } from "react";
import { checkAndChargeUser, getLocationById } from "../services/api";

const GeofenceMonitor = ({ onGeofenceEnter, onBalanceUpdate }) => {
  const watchId = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          checkGeofenceAndCharge(latitude, longitude);
        },
        (error) => {
          console.error("Error watching position:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 60000,
        }
      );
    }

    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, []);

  const checkGeofenceAndCharge = async (latitude, longitude) => {
    try {
      const lat = parseFloat(latitude.toFixed(6));
      const lon = parseFloat(longitude.toFixed(6));
      console.log("Checking geofence with latitude:", lat, "longitude:", lon);

      const response = await checkAndChargeUser({
        latitude: lat,
        longitude: lon,
      });

      console.log("Geofence check response:", response.data);

      if (response.data.transaction) {
        if (
          response.data.location &&
          typeof response.data.location.id === "number" &&
          typeof onGeofenceEnter === "function"
        ) {
          const locationId = response.data.location.id; 
          const locationResponse = await getLocationById(locationId);

          if (locationResponse.data) {
            const locationInfo = {
              location_name: locationResponse.data.location_name || "Unknown",
              amount_to_charge: response.data.transaction.amount || "0.00",
              amount_rate: response.data.transaction.amount_rate || "N/A",
              ...response.data,
            };

            onGeofenceEnter(locationInfo);
          } else {
            console.error("Location data not found");
          }
        } else {
          console.error(
            "Invalid location ID or onGeofenceEnter is not a function"
          );
        }
      }

      if (
        response.data.balance !== undefined &&
        typeof onBalanceUpdate === "function"
      ) {
        onBalanceUpdate(response.data.balance);
      }
    } catch (error) {
      console.error("Failed to check geofence and charge user:", error);
    }
  };

  return null;
};

export default GeofenceMonitor;
