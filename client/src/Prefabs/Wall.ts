/* Wall */
import GameObject from '../Primatives/GameObject.js';
import Collider from '../Scripts/Collider.js';
import * as THREE from 'three';
import GameObjects from '../Public/GameObjects.js';

class Wall extends GameObject {
    collider: Collider;
  
    constructor(position: THREE.Vector3, size: THREE.Vector3, texture: THREE.Texture) {
      const wallGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
      const wallMaterial = new THREE.MeshBasicMaterial({ map: texture });
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(position.x, position.y, position.z);
      super(wall);
      GameObjects.push(this);
      this.isWall = true;
      this.collider = new Collider(this);
    }
  
    update(delta: number) {
      this.collider.update(GameObjects);
    }
  }
  
  export default Wall;