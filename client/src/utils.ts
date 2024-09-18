import * as THREE from 'three';

// Utility function to check collision between two objects
export const checkCollision = (object1: THREE.Object3D, object2: THREE.Object3D) => {
  const object1BB = new THREE.Box3().setFromObject(object1);
  const object2BB = new THREE.Box3().setFromObject(object2);
  return object1BB.intersectsBox(object2BB);
};

// Helper function to create a cube collider
export const createCubeCollider = (color: number, position: THREE.Vector3) => {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.copy(position);
    return cube;
  };