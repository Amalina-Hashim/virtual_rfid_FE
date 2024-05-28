import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../src/Layout/MainLayout";
import AdminHomePage from "./components/Admin/AdminHomePage";
import AddLocationPage from "./components/Admin/AddLocationPage";
import TransactionHistoryPage from "./components/Admin/TransactionHistoryPage";
import EditChargingLogicPage from "./components/Admin/EditChargingLogicPage";
import UserHomePage from "./components/User/UserHomePage";
import ProfilePage from "./components/User/ProfilePage";
import TopUpPage from "./components/User/TopUpPage";
import UserTransactionHistoryPage from "./components/User/TransactionHistoryPage";
import Login from "./components/Auth/Login";
import Signup from "./components/Auth/Signup";
import PrivateRoute from "./components/PrivateRoute";

const AppRoutes = () => {
  const userRole = localStorage.getItem("userRole");

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/admin/*"
        element={
          <PrivateRoute role="admin">
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route path="home" element={<AdminHomePage />} />
        <Route path="add-location" element={<AddLocationPage />} />
        <Route path="transactions" element={<TransactionHistoryPage />} />
        <Route
          path="edit-charging-logic/:id"
          element={<EditChargingLogicPage />}
        />
      </Route>
      <Route
        path="/user/*"
        element={
          <PrivateRoute role="user">
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route path="home" element={<UserHomePage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="top-up" element={<TopUpPage />} />
        <Route path="transactions" element={<UserTransactionHistoryPage />} />
      </Route>
      <Route
        path="/"
        element={
          <Navigate to={userRole === "admin" ? "/admin/home" : "/user/home"} />
        }
      />
    </Routes>
  );
};

export default AppRoutes;
