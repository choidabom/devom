import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChatBubbleDemo } from "./components/ChatBubbleDemo";
import "./index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ChatBubbleDemo />
    </StrictMode>
  );
}
