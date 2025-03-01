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
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float simplexNoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1;
          i1.x = step(x0.y, x0.x);
          i1.y = 1.0 - i1.x;
          vec2 x1 = x0 - i1 + C.xx;
          vec2 x2 = x0 - 1.0 + 2.0 * C.xx;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)), 0.0);
          m = m*m;
          m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g = vec3(a0.x * x0.x + h.x * x0.y, a0.y * x1.x + h.y * x1.y, a0.z * x2.x + h.z * x2.y);
          return 130.0 * dot(m, g);
        }
          

        // フラグメントシェーダー（リアルな海の波紋）
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uMousePos; // マウス位置
        uniform bool uMouseActive; // マウスクリック中

        void main() {
          vec3 color = vec3(0.0, 0.2, 0.5); // 基本の海の色

          // 波の動き（全体的なうねり）
          float wave = simplexNoise(vUv * 10.0 + uTime * 0.2) * 0.1;
          
          // マウスの波紋（クリック時）
          if (uMouseActive) {
            float dist = length(vUv - uMousePos.xy);
            float ripple = sin(dist * 20.0 - uTime * 4.0) * exp(-dist * 5.0);
            color += vec3(0.3, 0.5, 1.0) * ripple; // 波紋の色
          }
          
          // グロー追加
          float glow = exp(-wave * 10.0) * 0.2;
          color += glow;

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
