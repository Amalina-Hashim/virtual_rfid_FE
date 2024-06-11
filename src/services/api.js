import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api", // Update with deployed url
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// User APIs
export const getUsers = () => api.get("/users/");
export const getUser = () => api.get("/current-user/");
export const register = (data) => api.post("/register/", data);
export const login = (data) => api.post("/token/", data);

// User Profile Update API
export const updateUserProfile = async (authToken, user, password) => {
  try {
    const payload = {
      username: user.username,
      email: user.email,
    };

    if (password) {
      payload.password = password;
    }

    const response = await api.put("/profile/update/", payload, {
      headers: {
        Authorization: `Token ${authToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile");
  }
};

// Balance API
export const getBalance = () => api.get("/balance/");

// Location APIs
export const createLocation = (data) => api.post("/locations/", data);
export const getLocationById = (id) => api.get(`/locations/${id}/`);
export const deleteLocation = (id) => api.delete(`/locations/${id}/`);
export const updateLocation = (id, data) =>
  api.patch(`/locations/${id}/`, data);

// Charging Logic APIs
export const getChargingLogics = () => api.get("/charging-logics/");
export const getChargingLogicById = (id) => api.get(`/charging-logics/${id}/`);
export const createChargingLogic = (data) =>
  api.post("/charging-logics/", data);
export const updateChargingLogic = (id, data) =>
  api.patch(`/charging-logics/${id}/`, data);
export const deleteChargingLogic = (id) =>
  api.delete(`/charging-logics/${id}/`);
export const disableChargingLogic = (id) =>
  api.patch(`/charging-logics/${id}/disable/`);
export const enableChargingLogic = (id) =>
  api.patch(`/charging-logics/${id}/enable/`);

export const getChargingLogicStatus = async () => {
  try {
    const response = await api.get("/charging-logic/status/");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch charging logic status", error);
    throw error;
  }
};

// Get charging logic by location
export const getChargingLogicByLocation = async (coords) => {
  try {
    const response = await api.post("/charging-logic/location/", coords);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn("No charging logic found for the given location and timestamp.");
      return null;
    } else {
      console.error("Failed to fetch charging logic by location:", error);
      throw error;
    }
  }
};

// Check location and charge user
export const checkAndChargeUser = async (data) => {
  try {
    console.log("Sending request payload:", data);
    const response = await api.post("/check-and-charge/", data);
    console.log("Response received:", response.data);
    return response;
  } catch (error) {
    console.error("API call to check and charge user failed:", error);
    throw error;
  }
};

// Transaction History APIs
export const getTransactionHistories = (page, pageSize) => {
  return api.get(`/transactions/?page=${page}&page_size=${pageSize}`);
};
export const createTransactionHistory = (data) =>
  api.post("/transactions/", data);

// Payment API
export const makePayment = (data) => api.post("/make-payment/", data);

export default api;
