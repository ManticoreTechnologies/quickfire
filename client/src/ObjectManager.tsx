import * as THREE from 'three';

class ObjectManager {
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  addCube(color: number, position: THREE.Vector3) {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.copy(position);
    this.scene.add(cube);
    return cube;
  }

  removeObject(object: THREE.Object3D) {
    this.scene.remove(object);
  }

  findObjectByName(name: string): THREE.Object3D | undefined {
    return this.scene.getObjectByName(name);
  }
}

export default ObjectManager;
