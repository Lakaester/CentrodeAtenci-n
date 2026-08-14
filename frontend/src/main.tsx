import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { QueryProvider } from "@/providers/QueryProvider";
import { FilterProvider } from "@/contexts/FilterContext";
import { AuthProvider } from "@/modules/auth";
import "./index.css";
import "./styles/variables.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <FilterProvider>
          <App />
        </FilterProvider>
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>,
);
