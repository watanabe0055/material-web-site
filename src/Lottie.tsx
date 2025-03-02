import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { LottieLoader } from "three/addons/loaders/LottieLoader.js";
import lottieJsonUrl from "./textures/Lottie/24017-lottie-logo-animation.json?url";

// 簡易的なRoundedBoxGeometryの実装
class RoundedBoxGeometry extends THREE.BufferGeometry {
  constructor(
    width = 1,
    height = 1,
    depth = 1,
    segments = 8, // セグメント数を増やして滑らかに
    radius = 0.2 // 角丸の半径を調整
  ) {
    super();

    const geo = new THREE.BoxGeometry(
      width,
      height,
      depth,
      segments,
      segments,
      segments
    );
    const position = geo.attributes.position;
    const normal = geo.attributes.normal;
    const vertex = new THREE.Vector3();
    const faceNormal = new THREE.Vector3();

    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i);
      faceNormal.fromBufferAttribute(normal, i);

      const distance = Math.min(
        Math.abs(vertex.x) - width / 2 + radius,
        Math.abs(vertex.y) - height / 2 + radius,
        Math.abs(vertex.z) - depth / 2 + radius
      );

      if (distance < 0) continue;

      const offset = faceNormal.clone().multiplyScalar(Math.max(0, distance));
      vertex.add(offset);
      position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geo.computeVertexNormals();
    this.setAttribute("position", position);
    this.setAttribute("normal", geo.attributes.normal);
    this.setAttribute("uv", geo.attributes.uv);
    this.setIndex(geo.index);
  }
}

interface ThreeSceneElements {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  mesh?: THREE.Mesh;
  lottieTexture?: THREE.Texture;
  lights: {
    ambient?: THREE.AmbientLight;
    directional?: THREE.DirectionalLight;
    point?: THREE.PointLight;
  };
}

const Lottie: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    const sceneElements: ThreeSceneElements = {
      renderer: new THREE.WebGLRenderer({ antialias: true, alpha: true }),
      scene: new THREE.Scene(),
      camera: new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        10
      ),
      lights: {},
    };

    sceneElements.camera.position.set(0, 0, 3);

    sceneElements.scene.background = new THREE.Color(0xffffff); // 背景色

    sceneElements.renderer.setPixelRatio(window.devicePixelRatio);
    sceneElements.renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(sceneElements.renderer.domElement);

    // 光源の設定を強化
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // 環境光を抑えめにしてハイライトを強調
    sceneElements.scene.add(ambientLight);
    sceneElements.lights.ambient = ambientLight;

    const directionalLight = new THREE.DirectionalLight(0xffffff, 5.0); // 強度を上げてハイライトを強調
    directionalLight.position.set(3, 3, 3).normalize();
    sceneElements.scene.add(directionalLight);
    sceneElements.lights.directional = directionalLight;

    const pointLight = new THREE.PointLight(0xffffff, 3.0, 100);
    pointLight.position.set(1, 1, 2); // 側面にも光が当たるように位置を調整
    sceneElements.scene.add(pointLight);
    sceneElements.lights.point = pointLight;

    // 環境マップを調整（反射を抑えめに）
    const environment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(sceneElements.renderer);
    sceneElements.scene.environment =
      pmremGenerator.fromScene(environment).texture;
    pmremGenerator.dispose();

    const lottieLoader = new LottieLoader();
    lottieLoader.load(lottieJsonUrl, (lottieTexture) => {
      const geometry = new RoundedBoxGeometry(1, 1, 1, 8, 0.2); // 角丸を滑らかに

      const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888, // 裏打ち用のグレー
        roughness: 0.5,
        metalness: 0.5,
      });

      const lottieMaterial = new THREE.MeshStandardMaterial({
        map: lottieTexture,
        transparent: true,
        opacity: 1.0,
        roughness: 0.5,
        metalness: 0.5,
      });
      const material = new THREE.MeshStandardMaterial({
        map: lottieTexture,
        color: 0x888888, // ベースカラーを黒にして理想に近づける
        transparent: true,
        opacity: 1.0, // テクスチャが薄くならないように
        roughness: 0.5, // 光沢を強調
        metalness: 0.5, // 金属感を増やして反射を強調
      });

      // マテリアルを配列として適用
      sceneElements.mesh = new THREE.Mesh(geometry, [
        baseMaterial,
        lottieMaterial,
      ]);
      sceneElements.scene.add(sceneElements.mesh);

      sceneElements.mesh = new THREE.Mesh(geometry, material);
      sceneElements.scene.add(sceneElements.mesh);
      sceneElements.lights.point?.position.set(1, 1, 2);
      sceneElements.lottieTexture = lottieTexture;
    });

    const animate = (time: number) => {
      requestAnimationFrame(animate);

      if (sceneElements.mesh && sceneElements.lottieTexture) {
        // sceneElements.mesh.rotation.x += 0.002;
        sceneElements.mesh.rotation.y -= 0.005;

        const currentProgress = (time % 2000) / 2000;
        setProgress(currentProgress * 100);
        if (sceneElements.lottieTexture.onUpdate) {
          sceneElements.lottieTexture.onUpdate();
        }
      }

      sceneElements.renderer.render(sceneElements.scene, sceneElements.camera);
    };

    animate(0);

    return () => {
      sceneElements.renderer.dispose();
      sceneElements.scene.clear();
    };
  }, []);

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100vh",
          overflow: "hidden",
        }}
      />
      <input
        type="range"
        min="0"
        max="100"
        value={progress}
        readOnly
        style={{
          width: "100%",
          position: "absolute",
          bottom: "20px",
        }}
      />
    </div>
  );
};

export default Lottie;
