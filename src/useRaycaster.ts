import * as THREE from "three";

export const useRaycaster = (
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  meshList: THREE.Mesh[]
) => {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const originalPositions = new Map<THREE.Mesh, THREE.Vector3>();

  const onMouseMove = (event: MouseEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(meshList);

    meshList.forEach((mesh) => {
      if (!originalPositions.has(mesh)) {
        originalPositions.set(mesh, mesh.position.clone());
      }
    });

    meshList.forEach((mesh) => {
      if (intersects.some((intersect) => intersect.object === mesh)) {
        const direction = new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        )
          .normalize()
          .multiplyScalar(50);
        mesh.position.add(direction);
      } else {
        const originalPos = originalPositions.get(mesh);
        if (originalPos) {
          mesh.position.lerp(originalPos, 0.05);
        }
      }
    });
  };

  renderer.domElement.addEventListener("mousemove", onMouseMove);
};
