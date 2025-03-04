import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import TodoList from "./TodoList.tsx";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <TodoList />
    </StrictMode>,
  );
}
