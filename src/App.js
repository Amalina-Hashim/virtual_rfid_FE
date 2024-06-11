import React from "react";
import { GoogleMapsProvider } from "./GoogleMapsProvider";
import AppRoutes from "./Routes";
import { LoginProvider } from "./LoginContext";
import { PollingProvider } from "./PollingContext"; 
import "./App.css";

const App = () => {
  return (
    <GoogleMapsProvider>
      <LoginProvider>
        <PollingProvider>
          <div className="App">
            <AppRoutes />
          </div>
        </PollingProvider>
      </LoginProvider>
    </GoogleMapsProvider>
  );
};

export default App;
