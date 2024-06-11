import React, { createContext, useState, useEffect } from "react";

const LoginContext = createContext();

export const LoginProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("userRole");
    setIsLoggedIn(!!token);
    setUserRole(role);
    console.log(`Initial Load - Token: ${token}, Role: ${role}`);
  }, []);

  const login = async (data, apiLogin) => {
    const response = await apiLogin(data);
    if (response.data) {
      const token = localStorage.getItem("authToken");
      const role = localStorage.getItem("userRole");
      setIsLoggedIn(!!token);
      setUserRole(role);
      console.log(`Logged In - Token: ${token}, Role: ${role}`);
    }
    return response;
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("locationInfo"); 
    setIsLoggedIn(false);
    setUserRole(null);
    console.log("User logged out");
  };

  return (
    <LoginContext.Provider
      value={{
        isLoggedIn,
        userRole,
        setIsLoggedIn,
        setUserRole,
        login,
        logout,
      }}
    >
      {children}
    </LoginContext.Provider>
  );
};

export default LoginContext;
