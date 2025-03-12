import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/addons/math/MeshSurfaceSampler.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import Stats from "three/examples/jsm/libs/stats.module.js";

const InstancingScatter = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    let camera: THREE.PerspectiveCamera;
    let scene: THREE.Scene;
    let renderer: THREE.WebGLRenderer;
    let stats: Stats;
    let stemMesh: THREE.InstancedMesh, blossomMesh: THREE.InstancedMesh;
    let sampler: MeshSurfaceSampler;
    const count = 2500;
    const dummy = new THREE.Object3D();
    const scales: number[] = [];
    const ages: number[] = [];
    const _position = new THREE.Vector3();
    const _normal = new THREE.Vector3();

    // イージング関数（カーブを滑らかに）
    const easeOutCubic = (t: number) => --t * t * t + 1;
    const scaleCurve = (t: number) =>
      Math.abs(easeOutCubic((t > 0.5 ? 1 - t : t) * 2));

    const init = async () => {
      // カメラ設定
      camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        100
      );
      camera.position.set(0, 0, 50);

      // シーン設定
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xe39469); // 背景色
      scene.add(new THREE.AmbientLight(0xffffff, 3)); // 照明

      // 表面ジオメトリ（トーラスノット）作成
      const surfaceGeometry = new THREE.TorusKnotGeometry(
        10,
        3,
        100,
        16
      ).toNonIndexed();
      const surfaceMaterial = new THREE.MeshLambertMaterial({
        color: 0xfff784,
      });
      const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
      scene.add(surface);

      // 3Dモデル（花の茎と花びら）読み込み
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync("./Flower/Flower.glb");
      const stemMeshOriginal = gltf.scene.getObjectByName("Stem") as THREE.Mesh;
      const blossomMeshOriginal = gltf.scene.getObjectByName(
        "Blossom"
      ) as THREE.Mesh;

      if (!stemMeshOriginal || !blossomMeshOriginal) return;

      // 変換行列の作成（回転、拡大）
      const transform = new THREE.Matrix4()
        .makeRotationX(Math.PI)
        .multiply(new THREE.Matrix4().makeScale(10, 10, 10));

      // ジオメトリの作成
      const stemGeometry = stemMeshOriginal.geometry
        .clone()
        .applyMatrix4(transform);
      const blossomGeometry = blossomMeshOriginal.geometry
        .clone()
        .applyMatrix4(transform);

      // ステムのインスタンシングメッシュ作成
      stemMesh = new THREE.InstancedMesh(
        stemGeometry,
        stemMeshOriginal.material,
        count
      );
      // 花びらのインスタンシングメッシュ作成（白色の材質）
      blossomMesh = new THREE.InstancedMesh(
        blossomGeometry,
        new THREE.MeshLambertMaterial({ color: 0xffffff }),
        count
      );

      scene.add(stemMesh);
      scene.add(blossomMesh);

      sampler = new MeshSurfaceSampler(surface)
        .setWeightAttribute(null)
        .build();

      // 花の色
      const color = new THREE.Color();
      const blossomPalette = [
        0xf20587, 0xf2d479, 0xf2c879, 0xf2b077, 0xf24405, 0xf9ed69, 0xffc7c7,
      ];

      for (let i = 0; i < count; i++) {
        // ランダムな年齢とスケールを設定
        ages[i] = Math.random();
        scales[i] = scaleCurve(ages[i]);
        sampler.sample(_position, _normal); // サーフェスサンプラーでランダム位置を取得
        dummy.position.copy(_position);
        dummy.lookAt(_position.add(_normal)); // 法線方向に向ける
        dummy.scale.set(scales[i], scales[i], scales[i]); // スケールを設定
        dummy.updateMatrix(); // 行列を更新
        stemMesh.setMatrixAt(i, dummy.matrix); // ステムのインスタンスを設定
        blossomMesh.setMatrixAt(i, dummy.matrix); // 花びらのインスタンスを設定

        color.setHex(
          blossomPalette[Math.floor(Math.random() * blossomPalette.length)]
        ); // ランダムな色を設定

        blossomMesh.setColorAt(i, color); // 花びらの色を設定
      }

      stemMesh.instanceMatrix.needsUpdate = true;
      blossomMesh.instanceMatrix.needsUpdate = true;

      // レンダラーの設定
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (mountRef.current) {
        mountRef.current.appendChild(renderer.domElement);
        stats = new Stats();
        mountRef.current.appendChild(stats.dom);
      }

      window.addEventListener("resize", onResize); // ウィンドウリサイズ対応
      setIsLoaded(true); // ロード完了
      animate();
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const animate = () => {
      requestAnimationFrame(animate);

      const time = performance.now() * 0.001;
      for (let i = 0; i < count; i++) {
        stemMesh.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

        const scaleFactor = Math.abs(Math.sin(time + i * 0.1)) * 0.5 + 0.5;
        dummy.scale.set(
          scales[i] * scaleFactor,
          scales[i] * scaleFactor,
          scales[i] * scaleFactor
        );

        dummy.updateMatrix();
        stemMesh.setMatrixAt(i, dummy.matrix);
        blossomMesh.setMatrixAt(i, dummy.matrix);
      }

      stemMesh.instanceMatrix.needsUpdate = true;
      blossomMesh.instanceMatrix.needsUpdate = true;

      scene.rotation.y += 0.01;
      renderer.render(scene, camera); // 描画
      stats.update();
    };

    init();

    return () => {
      window.removeEventListener("resize", onResize);
      mountRef.current?.removeChild(renderer.domElement);
      mountRef.current?.removeChild(stats.dom);
    };
  }, []);

  return <div ref={mountRef}>{!isLoaded && <p>Loading...</p>}</div>;
};

export default InstancingScatter;
