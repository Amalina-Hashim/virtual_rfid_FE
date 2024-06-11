import React, { useEffect, useRef, useContext } from "react";
import { getChargingLogicByLocation, getLocationById } from "../services/api";
import PollingContext from "../PollingContext";

const GeofenceMonitor = ({ onGeofenceEnter, onBalanceUpdate }) => {
  const { setLocationInfo } = useContext(PollingContext);
  const watchId = useRef(null);
  const lastCheckTime = useRef(0);

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
    if (Date.now() - lastCheckTime.current < 2000) {
      return;
    }
    lastCheckTime.current = Date.now();

    try {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      if (isNaN(lat) || isNaN(lon)) {
        throw new Error("Invalid latitude or longitude");
      }

      const response = await getChargingLogicByLocation({
        latitude: lat.toFixed(7),
        longitude: lon.toFixed(7),
        timestamp: timestamp,
      });

      if (
        response &&
        response.location &&
        typeof response.location.id === "number"
      ) {
        const chargingLogic = response;
        const locationId = chargingLogic.location.id;
        const locationResponse = await getLocationById(locationId);

        if (locationResponse.data) {
          const locationInfo = {
            location_name: locationResponse.data.location_name || "Unknown",
            amount_to_charge: chargingLogic.amount_to_charge || "0.00",
            amount_rate: chargingLogic.amount_rate || "N/A",
            transaction: chargingLogic.transaction || null,
            location: chargingLogic.location,
            charging_logic: chargingLogic,
          };

          if (typeof onGeofenceEnter === "function") {
            onGeofenceEnter(locationInfo);
          }
          setLocationInfo(locationInfo);
        } else {
          console.error("Location data not found");
        }
      } else {
        console.warn(
          "No valid charging logic found or invalid response structure"
        );
      }

      if (
        response &&
        response.balance !== undefined &&
        typeof onBalanceUpdate === "function"
      ) {
        onBalanceUpdate(response.balance);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.warn("No charging logic found for the given location");
      } else {
        console.error("Failed to check geofence and charge user:", error);
      }
    }
  };

  return null;
};

export default GeofenceMonitor;
