import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force title — prevents any plugin/library from overriding it
document.title = "Instant Blood Connect";

createRoot(document.getElementById("root")!).render(<App />);
