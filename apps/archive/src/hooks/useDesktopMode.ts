import { safeLocalStorage } from "@devom/utils";
import { useEffect, useState } from "react";

type DesktopMode = "light" | "dark";

export const useDesktopMode = (): {
  desktopMode: DesktopMode;
  toggleDesktopMode: () => void;
} => {
  const [desktopMode, setDesktopMode] = useState<DesktopMode>("light");

  const toggleDesktopMode = (): void => {
    setDesktopMode((currentMode) => {
      const newMode: DesktopMode = currentMode === "light" ? "dark" : "light";
      safeLocalStorage.setItem("theme", newMode);
      document.documentElement.classList.replace(currentMode, newMode);

      return newMode;
    });
  };

  useEffect(() => {
    const theme = safeLocalStorage.getItem("theme") as DesktopMode;
    // wip: I just want to setup light mode ..

    // const preferDark = window.matchMedia(
    //   "(prefers-color-scheme: dark)",
    // ).matches;
    // const mode = theme || (preferDark ? "dark" : "light");
    document.documentElement.classList.add(theme);
    setDesktopMode(theme);

    return (): void => {
      document.documentElement.classList.remove("light", "dark");
    };
  }, []);

  return { desktopMode, toggleDesktopMode };
};
