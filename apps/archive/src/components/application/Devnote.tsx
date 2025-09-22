import type { JSX } from "react";

const Devnote = (): JSX.Element => {
  return (
    <div className="h-full w-full relative">
      <iframe
        src="/devnote/index.html"
        className="w-full h-full border-0"
        title="Devnote"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
        loading="lazy"
      />
    </div>
  );
};

export default Devnote;
