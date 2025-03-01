import * as THREE from "three";

export const useRaycaster = (
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  meshList: THREE.Mesh[],
  scene: THREE.Scene
) => {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const blinkingMeshes = new Set<THREE.Mesh>();

  const onClick = (event: MouseEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(meshList);

    intersects.forEach((intersect) => {
      const mesh = intersect.object as THREE.Mesh;
      if (!blinkingMeshes.has(mesh)) {
        blinkingMeshes.add(mesh);
        let visible = true;
        const interval = setInterval(() => {
          visible = !visible;
          mesh.visible = visible;
        }, 200);

        setTimeout(() => {
          clearInterval(interval);
          mesh.visible = true;
          blinkingMeshes.delete(mesh);
        }, 2000);
      }
    });
  };

  renderer.domElement.addEventListener("click", onClick);
};
