import React from "react";
import ReactDOM from "react-dom/client"; // Updated import
import App from "./App";

// Create the root element using createRoot
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);