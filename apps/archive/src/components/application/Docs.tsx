import type { JSX } from "react"
import React from "react"

const Docs = React.memo((): JSX.Element => {
  return (
    <div className="h-full w-full relative">
      <iframe
        src="https://archive.devom.dev/"
        className="w-full h-full border-0"
        title="Docs"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-downloads allow-modals"
        loading="eager"
        allow="clipboard-write"
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ isolation: "isolate" }}
      />
    </div>
  )
})

export default Docs
