import * as THREE from 'three';
import GameObject from './GameObject.js';

/* Rigid Body Object */
class RigidBody extends GameObject {
    velocity: THREE.Vector3;
    gravity: THREE.Vector3;


    constructor(mesh: THREE.Mesh, velocity: THREE.Vector3, gravity: THREE.Vector3) {
      super(mesh);
      this.velocity = velocity;
      this.gravity = gravity;
    }
  
    update(delta: number) {
      this.velocity.add(this.gravity.clone().multiplyScalar(delta));
      this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
    }
  }

  
  export default RigidBody;