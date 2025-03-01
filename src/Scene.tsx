import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useRaycaster } from "./useRaycaster";
import RotatingBox from "./RotatingBox";
import AuroraEffect from "./AuroraEffect";

const Scene = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scene] = useState(new THREE.Scene());
  const [camera] = useState(
    new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
  );
  const [renderer] = useState(
    new THREE.WebGLRenderer({ antialias: true, alpha: true })
  );
  const meshList = useRef<THREE.Mesh[]>([]);

  useRaycaster(renderer, camera, meshList.current);

  useEffect(() => {
    if (!canvasRef.current) return;

    renderer.setSize(window.innerWidth, window.innerHeight);
    canvasRef.current.appendChild(renderer.domElement);

    camera.position.set(0, 0, 150);

    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const controls = new OrbitControls(camera, renderer.domElement);

    for (let i = 0; i < 300; i++) {
      const box = new RotatingBox();
      scene.add(box.mesh);
      meshList.current.push(box.mesh);
    }

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();

      meshList.current.forEach((mesh) => {
        mesh.rotation.x += mesh.userData.rotationSpeed.x;
        mesh.rotation.y += mesh.userData.rotationSpeed.y;
        mesh.rotation.z += mesh.userData.rotationSpeed.z;
      });

      renderer.render(scene, camera);
    };
    animate();
  }, [camera, renderer, scene]);

  return (
    <div
      ref={canvasRef}
      style={{ position: "relative", width: "100vw", height: "100vh" }}
    >
      {/* <AuroraEffect /> */}
      {/* 他のThree.jsのシーン */}
    </div>
  );
};

export default Scene;
