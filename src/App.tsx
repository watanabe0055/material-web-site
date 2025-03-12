import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Scene from "./components/Scene";
import RippleEffect from "./RippleEffect";
import SkyBox from "./SkyBox";
import Lottie from "./Lottie";
import InstancingScatter from "./InstancingScatter";
import Water from "./Water";
import PointShadow from "./PointShadow";
import LinkedParticles from "./LinkedParticles";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Scene />} />
        <Route path="/shade" element={<RippleEffect />} />
        <Route path="/skybox" element={<SkyBox />} />
        <Route path="/lottie" element={<Lottie />} />
        <Route path="/instancingScatter" element={<InstancingScatter />} />
        <Route path="/water" element={<Water />} />
        <Route path="/pointShadow" element={<PointShadow />} />
        <Route path="/linkedParticles" element={<LinkedParticles />} />
      </Routes>
    </Router>
  );
}

export default App;
