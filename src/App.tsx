import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Scene from "./components/Scene";
import RippleEffect from "./RippleEffect";
import SkyBox from "./SkyBox";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Scene />} />
        <Route path="/shade" element={<RippleEffect />} />
        <Route path="/skybox" element={<SkyBox />} />
      </Routes>
    </Router>
  );
}

export default App;
