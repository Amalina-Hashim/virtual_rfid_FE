import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api", // Change this to actual backend URL later!
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

// Get charging logic by location
export const getChargingLogicByLocation = (coords) =>
    api.post("/charging-logic/location/", coords);

export const checkAndChargeUser = (coords) =>
  api.post("/check-and-charge/", coords);

// Transaction History APIs
export const getTransactionHistories = () => api.get("/transaction-histories/");
export const createTransactionHistory = (data) =>
    api.post("/transaction-histories/", data);

export const createTransaction = (data) =>
  api.post("/create-transaction/", data);

export default api;
