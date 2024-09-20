import Player from './Player.js';
import Collider from '../Scripts/Collider.js';
import GameObjects from '../Public/GameObjects.js';
import * as THREE from 'three';
import { checkCollision } from '../utils.js';

/* Player Controller for this client */
class PlayerController extends Player {
    keysPressed: { [key: string]: boolean } = {};
    collider: Collider;
    moveSpeed: number = 5;
    sprintSpeed: number = 10;
    controls: { forward: string; backward: string; left: string; right: string, jump: string, sprint: string };
    onMove: (position: THREE.Vector3, direction: string, distance: number) => void;
    isGrounded: boolean = false;
    isJumping: boolean = false;
    jumpHeight: number = 10;
    jumpSpeed: number = 15; // Initial jump velocity
    gravity: number = -30; // Acceleration due to gravity
    velocityY: number = 0; // Vertical velocity
    fallSpeed: number = 50; // Maximum fall spee,d
    mouseSensitivity: number = 0.002; // Sensitivity for mouse movement
    rotationY: number = 0; // Track the current Y rotation (for horizontal rotation)
    sprinting: boolean = false;
    
    constructor(
      id: string,
      position: { x: number; y: number; z: number },
      mesh: THREE.Mesh,
      controls?: { forward: string; backward: string; left: string; right: string, jump: string, sprint: string },
      onMove?: (position: THREE.Vector3, direction: string, distance: number) => void
    ) {
      super(id, position, mesh);
      this.controls = controls || { forward: 'KeyW', backward: 'KeyS', left: 'KeyA', right: 'KeyD', jump: 'Space', sprint: 'ShiftLeft'};
      this.initializeControls();
      this.collider = new Collider(this);
      this.onMove = onMove || (() => {});
      this.initializeMouseControls(); // Initialize mouse control
    }

    // Initialize keyboard controls
    initializeControls() {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
    }

    // Initialize mouse movement and pointer lock
    initializeMouseControls() {
      // Listen for mouse movement
      window.addEventListener('mousemove', this.handleMouseMove);

      // Enable pointer lock when the mouse is clicked
      window.addEventListener('click', () => {
        if (document.pointerLockElement !== document.body) {
          document.body.requestPointerLock();
        }
      });

      // Handle pointer lock change (in case the user exits pointer lock)
      document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement !== document.body) {
          console.log('Pointer lock lost, press click to re-enable.');
        }
      });
    }

    // Handle mouse movement to rotate player
    handleMouseMove = (event: MouseEvent) => {
      // Only rotate if pointer is locked
      if (document.pointerLockElement === document.body) {
        const movementX = event.movementX || 0;
        this.rotationY -= movementX * this.mouseSensitivity; // Adjust rotation based on movement
        this.mesh.rotation.y = this.rotationY; // Apply the new rotation to the player mesh
      }
    }

    handleKeyDown = (event: KeyboardEvent) => {
      console.log(event.code);
      this.keysPressed[event.code] = true;
    }

    handleKeyUp = (event: KeyboardEvent) => {
      this.keysPressed[event.code] = false;
    }

    update(delta: number) {
      const moveDistance = this.sprinting ? this.sprintSpeed * delta : this.moveSpeed * delta;

      // Handle movement: forward/backward/left/right
      if (this.keysPressed[this.controls.forward]) {
        this.move('forward', moveDistance);
        if (this.checkCollisions()) {
          this.move('forward', -moveDistance); // Revert forward movement
        }
      }

      if (this.keysPressed[this.controls.backward]) {
        this.move('backward', moveDistance);
        if (this.checkCollisions()) {
          this.move('backward', -moveDistance); // Revert backward movement
        }
      }

      if (this.keysPressed[this.controls.left]) {
        this.move('left', moveDistance);
        if (this.checkCollisions()) {
          this.move('left', -moveDistance); // Revert left movement
        }
      }

      if (this.keysPressed[this.controls.right]) {
        this.move('right', moveDistance);
        if (this.checkCollisions()) {
          this.move('right', -moveDistance); // Revert right movement
        }
      }

      // Handle sprinting
      this.sprinting = this.keysPressed[this.controls.sprint];

      /* Jump and gravity logic */
      if (this.isGrounded) {
        if (this.keysPressed[this.controls.jump]) {
          this.isJumping = true;
          this.isGrounded = false;
          this.velocityY = this.jumpSpeed; // Set initial jump velocity
        } else {
          this.velocityY = 0; // Ensure velocity is zero when grounded and not jumping
        }
      } else {
        // Apply gravity
        this.velocityY += this.gravity * delta;
        // Clamp velocityY to max fall speed
        if (this.velocityY < -this.fallSpeed) {
          this.velocityY = -this.fallSpeed;
        }
        // Move vertically based on velocityY
        this.move('up', this.velocityY * delta);
      }

      // Check collision after vertical movement only if falling or stationary
      if (this.velocityY <= 0) { // Only check when falling or stationary
        this.move('down', 0.2);
        if (this.checkCollisions()) {
          this.isGrounded = true;
          this.isJumping = false;
          this.velocityY = 0; // Reset vertical velocity when grounded
        } else {
          this.isGrounded = false;
        }
        this.move('up', 0.2);
      }

      super.update(delta);
      this.collider.update(GameObjects);
    }

    move(direction: string, distance: number) {
      const forward = new THREE.Vector3(
        Math.sin(this.rotationY),
        0,
        Math.cos(this.rotationY)
      );
      const right = new THREE.Vector3(
        Math.sin(this.rotationY + Math.PI / 2),
        0,
        Math.cos(this.rotationY + Math.PI / 2)
      );

      switch (direction) {
        case 'forward':
          this.mesh.position.add(forward.multiplyScalar(-distance));
          break;
        case 'backward':
          this.mesh.position.add(forward.multiplyScalar(distance));
          break;
        case 'left':
          this.mesh.position.add(right.multiplyScalar(-distance));
          break;
        case 'right':
          this.mesh.position.add(right.multiplyScalar(distance));
          break;
        case 'down':
          this.mesh.position.y -= distance;
          break;
        case 'up':
          this.mesh.position.y += distance;
          break;
      }

      try {
        this.onMove(this.mesh.position, direction, distance);
      } catch (e) {
        console.log("Error in onMove", e);
      }
    }

    checkCollisions(): boolean {
      for (const object of GameObjects) {
        if (object !== this && !object.isPlayer && checkCollision(this.mesh, object.mesh)) {
          return true;
        }
      }
      return false;
    }
}

export default PlayerController;
