import React, {
  createContext,
  useState,
  useEffect,
  useRef,
  useContext,
} from "react";
import { getBalance, checkAndChargeUser } from "../src/services/api";
import LoginContext from "./LoginContext";

const PollingContext = createContext();

export const PollingProvider = ({ children }) => {
  const [balance, setBalance] = useState(0);
  const [locationInfo, setLocationInfo] = useState(() => {
    const savedLocationInfo = localStorage.getItem("locationInfo");
    return savedLocationInfo ? JSON.parse(savedLocationInfo) : null;
  });
  const balancePolling = useRef(null);
  const operationInProgress = useRef(false);
  const { isLoggedIn, userRole } = useContext(LoginContext);

  const POLLING_INTERVAL = 1000;

  useEffect(() => {
    console.log(
      "PollingContext useEffect - Logged in:",
      isLoggedIn,
      "Role:",
      userRole
    );
    if (isLoggedIn && userRole === "user") {
      startPolling();
      checkGpsEnabled();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [isLoggedIn, userRole]);

  const startPolling = () => {
    console.log("Starting polling...");
    if (!balancePolling.current) {
      balancePolling.current = setInterval(async () => {
        if (!operationInProgress.current) {
          operationInProgress.current = true;
          await fetchBalance();
          if (locationInfo) {
            const { latitude, longitude } = locationInfo.location;
            await checkGeofenceAndCharge(latitude, longitude);
          }
          operationInProgress.current = false;
        }
      }, POLLING_INTERVAL);
    }
  };

  const stopPolling = () => {
    console.log("Stopping polling...");
    if (balancePolling.current) {
      clearInterval(balancePolling.current);
      balancePolling.current = null;
    }
  };

  const fetchBalance = async () => {
    try {
      console.log("Fetching balance...");
      const response = await getBalance();
      console.log("Fetched balance:", response.data.balance);
      setBalance(parseFloat(response.data.balance).toFixed(2));
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  };

  const checkGeofenceAndCharge = async (latitude, longitude) => {
    const timestamp = new Date().toISOString();
    try {
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      if (isNaN(lat) || isNaN(lon)) {
        throw new Error("Invalid latitude or longitude");
      }

      console.log(
        "Checking geofence with latitude:",
        lat,
        "longitude:",
        lon,
        "timestamp:",
        timestamp
      );

      const response = await checkAndChargeUser({
        latitude: lat.toFixed(7),
        longitude: lon.toFixed(7),
        timestamp: timestamp,
      });

      const { transaction } = response.data;
      if (transaction) {
        console.log("Transaction found:", transaction);
        setBalance((prevBalance) =>
          (prevBalance - transaction.amount).toFixed(2)
        );
      } else {
        console.log("No transaction found in response.");
      }
    } catch (error) {
      console.error("Geofence check error:", error);
    }
  };

  const checkGpsEnabled = async () => {
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
        console.error("GPS permission denied");
      }
    } catch (error) {
      console.error("Error checking GPS permission", error);
    }
  };

  const getGpsLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocationInfo = { location: { latitude, longitude } };
          setLocationInfo(newLocationInfo);
          localStorage.setItem("locationInfo", JSON.stringify(newLocationInfo));
          console.log("GPS location fetched:", position.coords);
        },
        (error) => {
          console.error("Error getting current position:", error);
        },
        {
          timeout: 20000,
          enableHighAccuracy: false,
          maximumAge: 0,
        }
      );
    } else {
      console.error("Geolocation not available in navigator");
    }
  };

  return (
    <PollingContext.Provider value={{ balance, setBalance, setLocationInfo }}>
      {children}
    </PollingContext.Provider>
  );
};

export default PollingContext;
