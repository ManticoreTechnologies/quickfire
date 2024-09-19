import * as THREE from 'three';

class GameObject {
  public mesh: THREE.Mesh;
  private ws: WebSocket | null = null;

  constructor(geometry: THREE.Geometry | THREE.BufferGeometry, material: THREE.Material, ws: WebSocket | null = null) {
    this.mesh = new THREE.Mesh(geometry, material);
    this.ws = ws;
  }

  setPosition(position: THREE.Vector3) {
    this.mesh.position.copy(position);
    this.sendUpdate();
  }

  getPosition(): THREE.Vector3 {
    return this.mesh.position.clone();
  }

  addToScene(scene: THREE.Scene) {
    scene.add(this.mesh);
  }

  removeFromScene(scene: THREE.Scene) {
    scene.remove(this.mesh);
  }

  private sendUpdate() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'update',
        position: this.mesh.position
      }));
    }
  }
}

export default GameObject;