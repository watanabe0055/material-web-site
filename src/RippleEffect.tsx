import { useEffect } from "react";
import * as THREE from "three";

const RippleEffect = () => {
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 2;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const material = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uMouse;

        void main() {
          float dist = length(vUv - uMouse);
          float wave = sin(15.0 * dist - uTime * 2.0);
          vec3 color = vec3(0.2, 0.4, 1.0) * (0.5 + 0.5 * wave);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      uniforms: {
        uTime: { value: 0.0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) }, // 初期値は中央
      },
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // アニメーションループ
    const animate = () => {
      requestAnimationFrame(animate);
      material.uniforms.uTime.value += 0.02;
      renderer.render(scene, camera);
    };
    animate();

    // クリックイベントで波紋の位置を変更
    const onMouseMove = (event: MouseEvent) => {
      const x = event.clientX / window.innerWidth;
      const y = 1.0 - event.clientY / window.innerHeight; // Y座標を反転
      material.uniforms.uMouse.value.set(x, y);
    };
    window.addEventListener("click", onMouseMove);

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onWindowResize);

    return () => {
      window.removeEventListener("resize", onWindowResize);
      window.removeEventListener("click", onMouseMove);
      document.body.removeChild(renderer.domElement);
    };
  }, []);

  return null;
};

export default RippleEffect;
