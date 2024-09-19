import * as THREE from 'three';
import GameObject from './GameObject';

class Projectile extends GameObject {
  constructor(geometry: THREE.Geometry | THREE.BufferGeometry, material: THREE.Material) {
    super(geometry, material);
  }

  setVelocity(velocity: THREE.Vector3) {
    this.mesh.userData.velocity = velocity;
  }

  getVelocity(): THREE.Vector3 {
    return this.mesh.userData.velocity.clone();
  }

  update(delta: number) {
    this.mesh.position.add(this.getVelocity().clone().multiplyScalar(delta));
  }
}

export default Projectile;
