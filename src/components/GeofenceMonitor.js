import React, { useEffect, useRef } from "react";
import { checkAndChargeUser, getLocationById } from "../services/api";

const GeofenceMonitor = ({ onGeofenceEnter, onBalanceUpdate }) => {
  const watchId = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const timestamp = new Date().toISOString();
          checkGeofenceAndCharge(latitude, longitude, timestamp);
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

  const checkGeofenceAndCharge = async (latitude, longitude, timestamp) => {
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
              amount_to_charge:
                response.data.charging_logic.amount_to_charge || "0.00",
              amount_rate: response.data.charging_logic.amount_rate || "N/A",
              transaction: response.data.transaction,
              location: response.data.location,
              charging_logic: response.data.charging_logic,
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
