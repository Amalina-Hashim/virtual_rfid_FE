import React from "react";
import { GoogleMapsProvider } from "./GoogleMapsProvider";
import AppRoutes from "./Routes";
import { LoginProvider } from "./LoginContext";
import "./App.css";

const App = () => {
  return (
    <GoogleMapsProvider>
      <LoginProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </LoginProvider>
    </GoogleMapsProvider>
  );
};

export default App;
