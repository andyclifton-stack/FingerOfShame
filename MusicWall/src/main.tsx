import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";
const root = createRoot(document.getElementById("root")!);
if (import.meta.env.DEV && new URLSearchParams(location.search).has("verify")) {
  void import("./DevVerify").then(({ default: Verify }) =>
    root.render(<Verify />),
  );
} else root.render(<App />);
