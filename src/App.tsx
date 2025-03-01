import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Scene from "./components/Scene";
import RippleEffect from "./RippleEffect";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Scene />} />
        <Route path="/shade" element={<RippleEffect />} />
      </Routes>
    </Router>
  );
}

export default App;
