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

// Transaction History APIs
export const getTransactionHistories = () => api.get("/transaction-histories/");
export const createTransactionHistory = (data) =>
  api.post("/transaction-histories/", data);

// Day APIs
export const getDays = () => api.get("/days/");
export const createDay = (data) => api.post("/days/", data);

// Month APIs
export const getMonths = () => api.get("/months/");
export const createMonth = (data) => api.post("/months/", data);

// Year APIs
export const getYears = () => api.get("/years/");
export const createYear = (data) => api.post("/years/", data);

// calculateCharge function
export const calculateCharge = (data) => api.post("/calculate-charge/", data);

export default api;
