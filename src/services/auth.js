import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api", // update with deployed url
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

export const register = (data) => api.post("/register/", data);

export const login = async (data) => {
  const response = await api.post("/token/", data);
  if (response.data) {
    localStorage.setItem("authToken", response.data.token);
    const userResponse = await api.get("/users/", {
      headers: { Authorization: `Token ${response.data.token}` },
    });
    const user = userResponse.data.find((u) => u.username === data.username);
    localStorage.setItem("userRole", user.role);
  }
  return response;
};

export const getUser = () => api.get("/users/me/");

export const logout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("userRole");
};

export default api;
