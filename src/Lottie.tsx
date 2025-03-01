import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { LottieLoader } from "three/addons/loaders/LottieLoader.js";

// 静的インポートを使用 - Viteがアセットを適切に扱えるようにする
import lottieJsonUrl from "./textures/Lottie/24017-lottie-logo-animation.json?url";

// Three.jsの型定義を明示的に指定
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
  // コンテナとプログレスの参照を定義
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState<number>(0);

  // シーンをセットアップするためのuseEffectフック
  useEffect(() => {
    // コンテナが存在しない場合は処理を中断
    if (!containerRef.current) return;

    // 既存のcanvasを削除して重複を防ぐ
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    // Three.jsのシーン要素を初期化
    const sceneElements: ThreeSceneElements = {
      renderer: new THREE.WebGLRenderer({ antialias: true, alpha: true }),
      scene: new THREE.Scene(),
      camera: new THREE.PerspectiveCamera(
        50, // 視野角
        window.innerWidth / window.innerHeight, // アスペクト比
        0.1, // 近クリッピングプレーン
        10 // 遠クリッピングプレーン
      ),
      lights: {}, // 照明オブジェクトを初期化
    };

    // カメラの位置を調整
    sceneElements.camera.position.z = 2.5;

    // シーンの背景色を設定
    sceneElements.scene.background = new THREE.Color(0x111111);

    // レンダラーの設定
    sceneElements.renderer.setPixelRatio(window.devicePixelRatio);
    sceneElements.renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(sceneElements.renderer.domElement);

    // 複数の光源を追加して明るさを改善
    // アンビエントライト: 全体的な柔らかい光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneElements.scene.add(ambientLight);
    sceneElements.lights.ambient = ambientLight;

    // ディレクショナルライト: 方向性のある強い光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    sceneElements.scene.add(directionalLight);
    sceneElements.lights.directional = directionalLight;

    // ポイントライト: 特定の点から放射される光
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(0, 0, 5);
    sceneElements.scene.add(pointLight);
    sceneElements.lights.point = pointLight;

    // 環境マップを設定してシーンの照明を調整
    const environment = new RoomEnvironment();
    const pmremGenerator = new THREE.PMREMGenerator(sceneElements.renderer);
    sceneElements.scene.environment =
      pmremGenerator.fromScene(environment).texture;
    pmremGenerator.dispose();

    // Lottieローダーでアニメーションテクスチャを読み込み
    const lottieLoader = new LottieLoader();
    lottieLoader.load(lottieJsonUrl, (lottieTexture) => {
      // ジオメトリとマテリアルを作成
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshStandardMaterial({
        map: lottieTexture, // Lottieテクスチャをマッピング
        transparent: true, // 透明度を有効化
        opacity: 1, // 完全に不透明
        roughness: 0.2, // 表面の粗さを調整
        metalness: 0.5, // 金属感を追加
      });

      // メッシュを作成してシーンに追加
      sceneElements.mesh = new THREE.Mesh(geometry, material);
      sceneElements.scene.add(sceneElements.mesh);
      sceneElements.lottieTexture = lottieTexture;
    });

    // アニメーションループ
    const animate = (time: number) => {
      requestAnimationFrame(animate);

      // メッシュとLottieテクスチャが存在する場合のみアニメーション
      if (sceneElements.mesh && sceneElements.lottieTexture) {
        // メッシュを緩やかに回転
        // x軸は遅く、y軸は速く回転させることで、より自然な動きを表現
        sceneElements.mesh.rotation.x += 0.002; // ゆっくりとした回転
        sceneElements.mesh.rotation.y += 0.005; // やや速い回転

        // プログレスを計算（2秒周期でアニメーション）
        const currentProgress = (time % 2000) / 2000;
        setProgress(currentProgress * 100);

        // Lottieテクスチャのアニメーションを更新
        if (sceneElements.lottieTexture.onUpdate) {
          sceneElements.lottieTexture.onUpdate();
        }
      }

      // シーンをレンダリング
      sceneElements.renderer.render(sceneElements.scene, sceneElements.camera);
    };

    // アニメーションの開始
    animate(0);

    // クリーンアップ関数
    return () => {
      sceneElements.renderer.dispose();
      sceneElements.scene.clear();
    };
  }, []); // 依存配列は空（初回レンダー時のみ実行）

  return (
    <div>
      {/* Three.jsキャンバスを表示 */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100vh",
          overflow: "hidden",
        }}
      />

      {/* プログレスバー */}
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
