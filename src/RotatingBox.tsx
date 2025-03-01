import * as THREE from "three";

class RotatingBox {
  mesh: THREE.Mesh;

  constructor() {
    const geometry = new THREE.BoxGeometry(5, 5, 5);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    this.mesh = new THREE.Mesh(geometry, material);

    this.mesh.position.set(
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100,
      (Math.random() - 0.5) * 100
    );

    this.mesh.userData.rotationSpeed = {
      x: Math.random() * 0.02 - 0.01,
      y: Math.random() * 0.02 - 0.01,
      z: Math.random() * 0.02 - 0.01,
    };
  }
}

export default RotatingBox;
