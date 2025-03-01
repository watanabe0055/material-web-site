import * as THREE from "three";
import { useEffect, useRef } from "react";

const AuroraEffect = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

  useEffect(() => {
    if (!canvasRef.current) return;
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvasRef.current.appendChild(renderer.domElement);

    camera.position.set(0, 0, 50);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const geometry = new THREE.PlaneGeometry(200, 100, 64, 64);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          pos.z += sin(pos.x * 0.1 + pos.y * 0.1 + time * 2.0) * 5.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
          float glow = 0.5 + 0.5 * sin(vUv.y * 10.0 + time * 3.0);
          gl_FragColor = vec4(0.2, 0.6, 1.0, 1.0) * glow;
        }
      `,
      transparent: true,
    });

    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 4;
    scene.add(plane);

    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);
      material.uniforms.time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };
    animate();
  }, []);

  return (
    <div
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
      }}
    />
  );
};

export default AuroraEffect;
