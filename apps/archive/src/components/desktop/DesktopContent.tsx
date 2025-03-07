import { TodoList } from "@devom/todolist";
import { type JSX, useEffect, useRef } from "react";
import { useApplications } from "../../context/useApplications";
import { useDesktopMode } from "../../hooks/useDesktopMode";
import AppWindow from "../appWindow/AppWindow";
import Blog from "../application/Blog";

export const DesktopContent = (): JSX.Element => {
  const initializedRef = useRef<boolean>(false);
  const { desktopMode, toggleDesktopMode } = useDesktopMode();
  const { applications, addApplication, setZIndexToFront } = useApplications();

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;

      addApplication("blog", <Blog />, {
        width: 800,
        height: 650,
        left: 70,
        top: 70,
        minWidth: 640,
        minHeight: 640,
      });
      addApplication("todolist", <TodoList />, {
        width: 800,
        height: 650,
        left: 350,
        top: 100,
        minWidth: 500,
        minHeight: 640,
      });
    }
  }, [addApplication]);

  return (
    <div className="h-screen w-screen bg-light bg-cover dark:bg-dark">
      <button
        type="button"
        className="absolute right-5 top-5 rounded-full bg-gray-200 p-2 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
        aria-label={`Switch to ${
          desktopMode === "light" ? "dark" : "light"
        } mode`}
        onClick={toggleDesktopMode}
      >
        {desktopMode === "light" ? "🌞" : "🌙"}
      </button>

      {applications.map((app) => (
        <AppWindow
          key={app.id}
          app={app}
          onZIndex={() => setZIndexToFront(app.id)}
        />
      ))}
    </div>
  );
};
