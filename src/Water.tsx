import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import GUI from "three/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { SkyMesh } from "three/examples/jsm/objects/SkyMesh.js";
import { WaterMesh } from "three/examples/jsm/objects/WaterMesh.js";
import { WebGPURenderer } from "three/webgpu";

interface WaterSceneProps {
  className?: string;
}

const WaterScene: React.FC<WaterSceneProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<Stats | null>(null);
  const rendererRef = useRef<WebGPURenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const waterRef = useRef<WaterMesh | null>(null);
  const boxMeshRef = useRef<THREE.Mesh | null>(null);
  const sunRef = useRef<THREE.Vector3 | null>(null);
  const skyRef = useRef<SkyMesh | null>(null);
  const requestRef = useRef<number | null>(null);

  const [skyParams] = useState({
    elevation: 2,
    azimuth: 180,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      1,
      20000
    );
    camera.position.set(30, 30, 100);
    cameraRef.current = camera;

    // Renderer
    const renderer = new WebGPURenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Sun
    const sun = new THREE.Vector3();
    sunRef.current = sun;

    // Water setup
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    const loader = new THREE.TextureLoader();
    const waterNormals = loader.load("/Water/waternormals.jpg");
    waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

    const water = new WaterMesh(waterGeometry, {
      waterNormals: waterNormals,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
    });

    water.rotation.x = -Math.PI / 2;
    scene.add(water);
    waterRef.current = water;

    // Sky setup
    const sky = new SkyMesh();
    sky.scale.setScalar(10000);
    scene.add(sky);
    skyRef.current = sky;

    sky.turbidity.value = 10;
    sky.rayleigh.value = 2;
    sky.mieCoefficient.value = 0.005;
    sky.mieDirectionalG.value = 0.8;

    // Environment setup
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const sceneEnv = new THREE.Scene();

    let renderTarget: THREE.WebGLRenderTarget;

    const updateSun = () => {
      if (
        !sunRef.current ||
        !skyRef.current ||
        !waterRef.current ||
        !sceneRef.current
      )
        return;

      const phi = THREE.MathUtils.degToRad(90 - skyParams.elevation);
      const theta = THREE.MathUtils.degToRad(skyParams.azimuth);

      sunRef.current.setFromSphericalCoords(1, phi, theta);

      skyRef.current.sunPosition.value.copy(sunRef.current);
      waterRef.current.sunDirection.value.copy(sunRef.current).normalize();

      if (renderTarget !== undefined) renderTarget.dispose();

      sceneEnv.add(skyRef.current);
      renderTarget = pmremGenerator.fromScene(sceneEnv);
      sceneRef.current.add(skyRef.current);

      sceneRef.current.environment = renderTarget.texture;
    };

    // Box mesh
    const geometry = new THREE.BoxGeometry(30, 30, 30);
    const material = new THREE.MeshStandardMaterial({ roughness: 0 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    boxMeshRef.current = mesh;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set(0, 10, 0);
    controls.minDistance = 40.0;
    controls.maxDistance = 200.0;
    controls.update();
    controlsRef.current = controls;

    // Stats
    const stats = new Stats();
    containerRef.current.appendChild(stats.dom);
    statsRef.current = stats;

    // GUI
    const gui = new GUI();
    const folderSky = gui.addFolder("Sky");
    folderSky.add(skyParams, "elevation", 0, 90, 0.1).onChange(updateSun);
    folderSky.add(skyParams, "azimuth", -180, 180, 0.1).onChange(updateSun);
    folderSky.open();

    const folderWater = gui.addFolder("Water");
    folderWater
      .add(water.distortionScale, "value", 0, 8, 0.1)
      .name("distortionScale");
    folderWater.add(water.size, "value", 0.1, 10, 0.1).name("size");
    folderWater.open();

    // Window resize handler
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Initialize renderer and update sun
    renderer.init().then(updateSun);

    // Animation
    const animate = () => {
      if (
        !sceneRef.current ||
        !cameraRef.current ||
        !rendererRef.current ||
        !statsRef.current ||
        !boxMeshRef.current
      )
        return;

      const time = performance.now() * 0.001;

      boxMeshRef.current.position.y = Math.sin(time) * 20 + 5;
      boxMeshRef.current.rotation.x = time * 0.5;
      boxMeshRef.current.rotation.z = time * 0.51;

      rendererRef.current.render(sceneRef.current, cameraRef.current);
      statsRef.current.update();

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }

      if (gui) {
        gui.destroy();
      }

      window.removeEventListener("resize", handleResize);

      if (containerRef.current && statsRef.current) {
        containerRef.current.removeChild(statsRef.current.dom);
      }

      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, [skyParams]);

  return <div ref={containerRef} className={className || "w-full h-screen"} />;
};

export default WaterScene;
