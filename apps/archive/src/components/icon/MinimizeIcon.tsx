import type { JSX } from "react";

export const MinimizeIcon = (): JSX.Element => (
  <svg
    className="hidden h-2.5 w-2.5 text-black opacity-50 group-hover:block"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title id="minimize-icon">Minimize</title>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h12" />
  </svg>
);
