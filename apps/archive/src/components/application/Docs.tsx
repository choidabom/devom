import type { JSX } from "react";

const Docs = (): JSX.Element => {
  return (
    <div className="h-full w-full relative">
      <iframe
        src="/docs/index.html"
        className="w-full h-full border-0"
        title="Docs"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
        loading="lazy"
      />
    </div>
  );
};

export default Docs;
