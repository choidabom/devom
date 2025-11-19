import type { JSX } from "react"
import { Calendar } from "./components/portfolio/Calendar"
import { Portfolio } from "./components/portfolio/Portfolio"

const App = (): JSX.Element => {
  return (
    <>
      <Calendar />
      <Portfolio />
    </>
  )
}

export default App
