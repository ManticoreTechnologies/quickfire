import GameObject from "../Primatives/GameObject.js";
import * as THREE from 'three';
import {checkCollision} from '../utils.js';

/* Collider */ 
class Collider {
    GameObject: GameObject;
  
    constructor(GameObject: GameObject) {
      this.GameObject = GameObject;
    }
  
    update(otherObjects: GameObject[]) {
      for (const object of otherObjects) {
        if (object.mesh !== this.GameObject.mesh && 
            !(this.GameObject.isPlayer && object.isPlayer) && 
            !(this.GameObject.isWall && object.isWall) && 
            checkCollision(this.GameObject.mesh, object.mesh)) {
          this.handleCollision(object.mesh);
        }
      }
    }
  
    handleCollision(object: THREE.Object3D) {
      // Handle the collision logic here
      
    }
  }
        
  
export default Collider;