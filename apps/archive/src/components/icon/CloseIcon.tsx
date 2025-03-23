import type { JSX } from "react";

export const CloseIcon = (): JSX.Element => (
  <svg
    className="hidden h-2.5 w-2.5 text-black opacity-50 group-hover:block"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title id="close-icon">Close</title>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
