import * as THREE from 'three';
import GameObjects from '../Public/GameObjects';

/* Basic Game Object */
class GameObject {
    mesh: THREE.Mesh;
    isPlayer: boolean;
    isWall: boolean;

    constructor(mesh: THREE.Mesh) {
    this.mesh = mesh;
    this.isPlayer = false;
    this.isWall = false;
    GameObjects.push(this);
    }

    update(delta: number) {
    // Do nothing
    }

    getPosition(): THREE.Vector3 {
    return this.mesh.position;
    }

    setPosition(position: THREE.Vector3) {
    this.mesh.position.set(position.x, position.y, position.z);
    }
}

export default GameObject;
