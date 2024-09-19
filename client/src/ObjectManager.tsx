import * as THREE from 'three';
import GameObject from './GameObject';

class ObjectManager {
  private scene: THREE.Scene;
  private objects: GameObject[] = [];
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private otherPlayers: Map<string, GameObject> = new Map();

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
  }

  addCube(color: number, position: THREE.Vector3): GameObject {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color });
    const cube = new GameObject(geometry, material);
    cube.setPosition(position);
    cube.addToScene(this.scene);
    this.objects.push(cube);
    return cube;
  }

  removeObject(object: GameObject) {
    object.removeFromScene(this.scene);
    this.objects = this.objects.filter(obj => obj !== object);
  }

  findObjectByName(name: string): THREE.Object3D | undefined {
    return this.scene.getObjectByName(name);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.render();
  }

  addOrUpdatePlayers(players: any[], currentPlayerId: string) {
    const colors = [0x003300, 0xff55ff, 0x00ffff, 0xffff00]; // Add more colors as needed

    // Remove players that are no longer in the data
    this.otherPlayers.forEach((player, id) => {
      if (!players.some(p => p.id === id)) {
        player.removeFromScene(this.scene);
        this.otherPlayers.delete(id);
      }
    });

    // Add or update players
    players.forEach((player, index) => {
      if (player.id !== currentPlayerId) {
        if (!this.otherPlayers.has(player.id)) {
          const color = colors[index % colors.length]; // Cycle through colors
          const otherPlayer = new GameObject(
            new THREE.BoxGeometry(),
            new THREE.MeshBasicMaterial({ color })
          );
          otherPlayer.setPosition(new THREE.Vector3(player.position.x, player.position.y, player.position.z));
          otherPlayer.addToScene(this.scene);
          this.otherPlayers.set(player.id, otherPlayer);
        } else {
          const existingPlayer = this.otherPlayers.get(player.id);
          if (existingPlayer) {
            existingPlayer.setPosition(new THREE.Vector3(player.position.x, player.position.y, player.position.z));
          }
        }
      }
    });
  }
}

export default ObjectManager;