import React from "react";
import { GoogleMapsProvider } from "./GoogleMapsProvider";
import AppRoutes from "./Routes";
import "./App.css";

const App = () => {
  return (
    <GoogleMapsProvider>
      <div className="App">
        <AppRoutes />
      </div>
    </GoogleMapsProvider>
  );
};

export default App;
