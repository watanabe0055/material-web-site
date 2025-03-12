import { useEffect, useRef } from "react";
import * as THREE from "three";

const PointShadow = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // シーンの作成
    const scene = new THREE.Scene();

    // カメラの作成
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(10, 10, 20);
    camera.lookAt(0, 0, 0);

    // レンダラーの作成
    const renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true; // 影を有効化
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvasRef.current.appendChild(renderer.domElement);

    // スポットライトを追加
    const light = new THREE.SpotLight(0xffffff, 400, 100, Math.PI / 4, 0.5);
    light.position.set(10, 20, 10);
    light.castShadow = true; // 影を有効化
    scene.add(light);

    // シャドウ設定
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 100;

    // トーラスノットを作成
    const meshKnot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(3, 1, 100, 16),
      new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.5 })
    );
    meshKnot.position.set(0, 5, 0);
    meshKnot.castShadow = true; // 影を落とす
    scene.add(meshKnot);

    // 床を作成
    const meshFloor = new THREE.Mesh(
      new THREE.BoxGeometry(2000, 0.1, 2000),
      new THREE.MeshStandardMaterial({ color: 0x808080, roughness: 0.8 })
    );
    meshFloor.position.y = 0; // 床の高さを設定
    meshFloor.receiveShadow = true; // 影を受ける
    scene.add(meshFloor);

    // アニメーションループ
    const animate = () => {
      requestAnimationFrame(animate);
      meshKnot.rotation.x += 0.01;
      meshKnot.rotation.y += 0.01;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      canvasRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={canvasRef} />;
};

export default PointShadow;
