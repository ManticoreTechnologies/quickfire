import GameObject from '../Primatives/GameObject.js';
import Collider from '../Scripts/Collider.js';
import * as THREE from 'three';
import GameObjects from '../Public/GameObjects.js';

class Floor extends GameObject {
    collider: Collider;

    constructor(position: THREE.Vector3, size: THREE.Vector3, texture: THREE.Texture) {
        const floorGeometry = new THREE.PlaneGeometry(size.x, size.z);
        const floorMaterial = new THREE.MeshBasicMaterial({ map: texture });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.set(position.x, position.y, position.z);
        floor.rotation.x = -Math.PI / 2; // Rotate the floor to be horizontal
        super(floor);
        GameObjects.push(this);
        this.isWall = true;
        this.collider = new Collider(this);
    }

    update(delta: number) {
        this.collider.update(GameObjects);
    }
}

export default Floor;
