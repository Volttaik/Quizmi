import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./components/ThemeProvider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark" storageKey="quizmi-theme">
    <App />
  </ThemeProvider>
);
