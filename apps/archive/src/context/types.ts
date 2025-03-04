import { type ReactNode, createContext } from "react";
import type { Application } from "../types/types";

export interface ApplicationContextType {
  applications: Application[];
  addApplication: (
    name: string,
    component: ReactNode,
    config: Omit<Application["config"], "zIndex">,
  ) => void;
  setZIndexToFront: (id: number) => void;
}

export const ApplicationContext = createContext<
  ApplicationContextType | undefined
>(undefined);
