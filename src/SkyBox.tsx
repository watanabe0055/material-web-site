import { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const SkyBox = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // シーンとカメラの設定
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      30000
    );
    camera.position.set(0, 0, 1); // カメラ位置を調整（内側から見るため）

    // レンダラーの設定
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // OrbitControlsの設定
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.update();

    // テクスチャ配列の作成
    const materialArray = [];
    const loader = new THREE.TextureLoader();

    // 正しいファイル名で読み込み
    const texture_ft = loader.load("/skybox/arid2_ft.jpg");
    const texture_bk = loader.load("/skybox/arid2_bk.jpg");
    const texture_up = loader.load("/skybox/arid2_up.jpg");
    const texture_dn = loader.load("/skybox/arid2_dn.jpg");
    const texture_rt = loader.load("/skybox/arid2_rt.jpg");
    const texture_lf = loader.load("/skybox/arid2_lf.jpg");

    // マテリアルの設定 - 重要: side: THREE.BackSide を設定して内側から見えるようにする
    materialArray.push(
      new THREE.MeshBasicMaterial({ map: texture_ft, side: THREE.BackSide })
    );
    materialArray.push(
      new THREE.MeshBasicMaterial({ map: texture_bk, side: THREE.BackSide })
    );
    materialArray.push(
      new THREE.MeshBasicMaterial({ map: texture_up, side: THREE.BackSide })
    );
    materialArray.push(
      new THREE.MeshBasicMaterial({ map: texture_dn, side: THREE.BackSide })
    );
    materialArray.push(
      new THREE.MeshBasicMaterial({ map: texture_rt, side: THREE.BackSide })
    );
    materialArray.push(
      new THREE.MeshBasicMaterial({ map: texture_lf, side: THREE.BackSide })
    );

    // スカイボックスの作成
    const skyboxGeo = new THREE.BoxGeometry(10000, 10000, 10000);
    const skybox = new THREE.Mesh(skyboxGeo, materialArray);
    scene.add(skybox);

    // アニメーションループ
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // リサイズハンドラ
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // クリーンアップ
    return () => {
      window.removeEventListener("resize", handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100vh" }}></div>
  );
};

export default SkyBox;
