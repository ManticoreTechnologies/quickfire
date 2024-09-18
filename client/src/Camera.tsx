import * as THREE from 'three';

export const createCamera = (aspectRatio: number): THREE.PerspectiveCamera => {
  const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
  camera.position.set(0, 5, 5);
  camera.lookAt(0, 0, 0);
  camera.rotation.x = -Math.PI / 4;
  return camera;
};