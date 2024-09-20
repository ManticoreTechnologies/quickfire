import * as THREE from 'three';
import GameObject from './GameObject';
import Projectile from './Projectile';

class ObjectManager {
  private scene: THREE.Scene;
  private objects: GameObject[] = [];
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private otherPlayers: Map<string, GameObject> = new Map();
  private projectiles: Projectile[] = [];
  private ws: WebSocket;
  
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

  findObjectById(id: string): GameObject | undefined {
    return this.objects.find(obj => obj.id === id);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.updateProjectiles();
    this.render();
  }

  addOrUpdatePlayers(players: any[], currentPlayerId: string) {
    const colors = [0x003300, 0xff55ff, 0x00ffff, 0xffff00]; // Add more colors as needed

    this.removeAbsentPlayers(players);
    this.updateOrAddPlayers(players, currentPlayerId, colors);
  }

  private removeAbsentPlayers(players: any[]) {
    this.otherPlayers.forEach((player, id) => {
      if (!players.some(p => p.id === id)) {
        player.removeFromScene(this.scene);
        this.otherPlayers.delete(id);
      }
    });
  }

  private updateOrAddPlayers(players: any[], currentPlayerId: string, colors: number[]) {
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

  addProjectile(position: THREE.Vector3, velocity: THREE.Vector3): Projectile {
    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const projectile = new Projectile(geometry, material);
    projectile.setPosition(position);
    projectile.setVelocity(velocity);
    projectile.addToScene(this.scene);
    this.projectiles.push(projectile);
  
    // Send projectile data to the server
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'projectile',
        id: projectile.id,
        position: projectile.getPosition(),
        velocity: projectile.getVelocity()
      }));
    }
  
    return projectile;
  }

  updateProjectiles() {
    const delta = 0.016; // Assuming 60 FPS, adjust as needed
    this.projectiles.forEach((projectile, index) => {
      projectile.update(delta);
      // Remove projectile if it goes out of bounds or hits something
      //if (/* condition to remove projectile */) {
      //  projectile.removeFromScene(this.scene);
      //  this.projectiles.splice(index, 1);
      //}
    });
  }

  spawnProjectile() {
    const defaultPosition = new THREE.Vector3(0, 0, 0);
    const defaultVelocity = new THREE.Vector3(0, 1, 0);
    return this.addProjectile(defaultPosition, defaultVelocity);
  }
}

export default ObjectManager;