import { useRef, useEffect } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { LottieLoader } from "three/addons/loaders/LottieLoader.js";

// 静的インポートを使用 - Viteがアセットを適切に扱えるようにする
import lottieJsonUrl from "./textures/Lottie/24017-lottie-logo-animation.json?url";
import textureUrl from "./textures/Lottie/uv_grid_directx.jpg";

const Lottie = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let renderer: THREE.WebGLRenderer,
      scene: THREE.Scene,
      camera: THREE.PerspectiveCamera;
    let mesh: THREE.Mesh;

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
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // 環境マップの設定
    const environment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(environment).texture;
    pmremGenerator.dispose();

    // アニメーションループ
    const animate = () => {
      requestAnimationFrame(animate);

      if (mesh) {
        mesh.rotation.y -= 0.001;
      }

      renderer.render(scene, camera);
    };

    // アニメーションの開始
    const animationFrame = requestAnimationFrame(animate);

    // デバッグ情報
    console.log("Lottie JSON URL:", lottieJsonUrl);
    console.log("Texture URL:", textureUrl);

    // Lottieローダーの設定
    const loader = new LottieLoader();
    loader.setQuality(2);

    // エラーハンドリングを追加
    loader.load(
      lottieJsonUrl, // Vite経由でインポートしたURLを使用
      function (texture) {
        console.log("Lottie loaded successfully:", texture);

        // アニメーション制御のセットアップ
        if (scrubberRef.current && texture.animation) {
          setupControls(texture.animation, scrubberRef.current);
        }

        // テクスチャのロード
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
          textureUrl, // Vite経由でインポートしたURLを使用
          function (tex) {
            console.log("Texture loaded successfully");
            tex.colorSpace = THREE.SRGBColorSpace;

            // ジオメトリとマテリアルの作成
            const geometry = new RoundedBoxGeometry(1, 1, 1, 7, 0.2);
            const material = new THREE.MeshStandardMaterial({
              roughness: 0.1,
              map: tex,
            });
            mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);
          },
          undefined,
          function (err) {
            console.error("テクスチャの読み込みエラー:", err);
          }
        );
      },
      undefined, // onProgress
      function (error) {
        console.error("Lottieファイルの読み込みエラー:", error);
      }
    );

    // リサイズイベントの設定
    const handleResize = () => {
      if (!camera || !renderer) return;

      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // クリーンアップ関数
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrame);

      if (containerRef.current && renderer) {
        containerRef.current.removeChild(renderer.domElement);
      }

      // リソースの解放
      if (mesh) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }

      renderer.dispose();
    };
  }, []);

  // Lottieアニメーションのコントロール設定
  function setupControls(animation: any, scrubber: HTMLInputElement) {
    // スクラバーの設定
    scrubber.max = animation.totalFrames.toString();

    scrubber.addEventListener("pointerdown", function () {
      animation.pause();
    });

    scrubber.addEventListener("pointerup", function () {
      animation.play();
    });

    scrubber.addEventListener("input", function () {
      animation.goToAndStop(parseFloat(scrubber.value), true);
    });

    animation.addEventListener("enterFrame", function () {
      scrubber.value = animation.currentFrame;
    });
  }

  return (
    <div>
      <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />
      <input
        ref={scrubberRef}
        type="range"
        min="0"
        max="100"
        style={{ width: "100%", position: "absolute", bottom: "20px" }}
      />
    </div>
  );
};

export default Lottie;
