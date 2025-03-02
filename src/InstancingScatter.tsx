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
    const count = 2000;
    const dummy = new THREE.Object3D();
    const scales: number[] = [];
    const ages: number[] = [];
    const _position = new THREE.Vector3();
    const _normal = new THREE.Vector3();

    const easeOutCubic = (t: number) => --t * t * t + 1;
    const scaleCurve = (t: number) =>
      Math.abs(easeOutCubic((t > 0.5 ? 1 - t : t) * 2));

    const init = async () => {
      camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        100
      );
      camera.position.set(0, 0, 50);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xe39469);
      scene.add(new THREE.AmbientLight(0xffffff, 3));

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

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync("./Flower/Flower.glb");
      const stemMeshOriginal = gltf.scene.getObjectByName("Stem") as THREE.Mesh;
      const blossomMeshOriginal = gltf.scene.getObjectByName(
        "Blossom"
      ) as THREE.Mesh;

      if (!stemMeshOriginal || !blossomMeshOriginal) return;

      const transform = new THREE.Matrix4()
        .makeRotationX(Math.PI)
        .multiply(new THREE.Matrix4().makeScale(10, 10, 10));

      const stemGeometry = stemMeshOriginal.geometry
        .clone()
        .applyMatrix4(transform);

      // 花の色を赤、青、黄色からランダムに設定
      const flowerColors = [0xff0000, 0x0000ff, 0xffff00]; // 赤、青、黄色の色コード

      // 花の色をランダムに設定
      const randomColor =
        flowerColors[Math.floor(Math.random() * flowerColors.length)];
      const blossomMaterial = new THREE.MeshLambertMaterial({
        color: randomColor,
      });

      const blossomGeometry = blossomMeshOriginal.geometry
        .clone()
        .applyMatrix4(transform);

      stemMesh = new THREE.InstancedMesh(
        stemGeometry,
        stemMeshOriginal.material,
        count
      );
      blossomMesh = new THREE.InstancedMesh(
        blossomGeometry,
        blossomMaterial,
        count
      );

      scene.add(stemMesh);
      scene.add(blossomMesh);

      sampler = new MeshSurfaceSampler(surface)
        .setWeightAttribute(null)
        .build();
      for (let i = 0; i < count; i++) {
        ages[i] = Math.random();
        scales[i] = scaleCurve(ages[i]);
        sampler.sample(_position, _normal);
        dummy.position.copy(_position);
        dummy.lookAt(_position.add(_normal)); // 法線方向に向ける
        dummy.scale.set(scales[i], scales[i], scales[i]);
        dummy.updateMatrix();
        stemMesh.setMatrixAt(i, dummy.matrix);
        blossomMesh.setMatrixAt(i, dummy.matrix);
      }

      stemMesh.instanceMatrix.needsUpdate = true;
      blossomMesh.instanceMatrix.needsUpdate = true;

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (mountRef.current) {
        mountRef.current.appendChild(renderer.domElement);
        stats = new Stats();
        mountRef.current.appendChild(stats.dom);
      }

      window.addEventListener("resize", onResize);
      setIsLoaded(true);
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
      renderer.render(scene, camera);
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
