import GameObject from "../Primatives/GameObject.js";
import * as THREE from 'three';

/* Basic Player Object */
class Player extends GameObject {
    id: string;
    position: { x: number; y: number; z: number };
    isPlayer: boolean;
  
    constructor(id: string, position: { x: number; y: number; z: number }, mesh: THREE.Mesh) {
      super(mesh);
      this.id = id;
      this.position = position;
      this.isPlayer = true;
    } 
  }

  export default Player;