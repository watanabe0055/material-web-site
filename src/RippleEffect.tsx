import { useEffect } from "react";
import * as THREE from "three";

const MAX_RIPPLES = 5;

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
        uniform vec3 uRipples[${MAX_RIPPLES}];

        void main() {
          vec3 color = vec3(0.0);
          
          for (int i = 0; i < ${MAX_RIPPLES}; i++) {
            vec2 ripplePos = uRipples[i].xy;
            float startTime = uRipples[i].z;
            float timeSinceStart = uTime - startTime;

            if (timeSinceStart >= 0.0 && timeSinceStart <= 2.0) {
              float dist = length(vUv - ripplePos);
              float wave = sin(15.0 * dist - timeSinceStart * 3.0);
              float fade = smoothstep(2.0, 0.0, timeSinceStart);
              color += vec3(0.2, 0.4, 1.0) * (0.5 + 0.5 * wave) * fade;
            }
          }

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      uniforms: {
        uTime: { value: 0.0 },
        uRipples: {
          value: Array.from(
            { length: MAX_RIPPLES },
            () => new THREE.Vector3(0.5, 0.5, -10.0)
          ),
        },
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

    // クリックイベントで新しい波紋を追加
    const onMouseClick = (event: MouseEvent) => {
      const x = event.clientX / window.innerWidth;
      const y = 1.0 - event.clientY / window.innerHeight; // Y座標を反転
      const time = material.uniforms.uTime.value;

      // 古い波紋を消して、新しい波紋を追加
      const ripples = material.uniforms.uRipples.value as THREE.Vector3[];
      ripples.shift(); // 先頭の波紋を削除（最も古いもの）
      ripples.push(new THREE.Vector3(x, y, time)); // 新しい波紋を追加
      material.uniforms.uRipples.value = ripples;
    };

    window.addEventListener("click", onMouseClick);

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onWindowResize);

    return () => {
      window.removeEventListener("resize", onWindowResize);
      window.removeEventListener("click", onMouseClick);
      document.body.removeChild(renderer.domElement);
    };
  }, []);

  return null;
};

export default RippleEffect;
