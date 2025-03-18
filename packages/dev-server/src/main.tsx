import React from "react";
import { createRoot } from "react-dom/client";

const App = (): React.JSX.Element => {
  return <h1>Hello React</h1>;
};

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
