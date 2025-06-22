import * as React from "react";
import App from "./App.tsx";
import "./styles/index.css";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthProvider from "./context/AuthContext";

const queryClient = new QueryClient();
const rootElement = document.getElementById("root") as HTMLElement;
createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
