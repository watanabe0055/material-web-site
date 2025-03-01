import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { LottieLoader } from "three/addons/loaders/LottieLoader.js";

// 静的インポートを使用 - Viteがアセットを適切に扱えるようにする
import lottieJsonUrl from "./textures/Lottie/24017-lottie-logo-animation.json?url";
import textureUrl from "./textures/Lottie/uv_grid_directx.jpg";

const Lottie = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // 既存のcanvasを削除
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    let renderer: THREE.WebGLRenderer,
      scene: THREE.Scene,
      camera: THREE.PerspectiveCamera,
      lottieTexture: any,
      mesh: THREE.Mesh;

    // シーンの初期化
    camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      10
    );
    camera.position.z = 2.5;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // レンダラーの設定
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // 環境マップの設定
    const environment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(environment).texture;
    pmremGenerator.dispose();

    // テクスチャの読み込み
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(textureUrl);

    // Lottieローダーの設定
    const lottieLoader = new LottieLoader();
    lottieLoader.load(lottieJsonUrl, (texture) => {
      lottieTexture = texture;

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({
        map: lottieTexture,
        transparent: true,
        opacity: 1,
      });

      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
    });

    // アニメーションループ
    const animate = (time: number) => {
      requestAnimationFrame(animate);

      if (mesh && lottieTexture) {
        // メッシュの回転
        mesh.rotation.x += 0.005;
        mesh.rotation.y += 0.01;

        // Lottieテクスチャのプログレス更新
        const currentProgress = (time % 2000) / 2000;
        setProgress(currentProgress * 100);

        if (lottieTexture.update) {
          lottieTexture.update(currentProgress);
        }
      }

      renderer.render(scene, camera);
    };

    animate(0);

    // クリーンアップ関数
    return () => {
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <div>
      <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />
      <input
        type="range"
        min="0"
        max="100"
        value={progress}
        readOnly
        style={{ width: "100%", position: "absolute", bottom: "20px" }}
      />
    </div>
  );
};

export default Lottie;
