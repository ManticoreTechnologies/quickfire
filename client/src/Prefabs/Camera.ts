import * as THREE from 'three';

/* Camera */
class Camera extends THREE.PerspectiveCamera {
    followObject: THREE.Object3D | null;
    controls: { forward: string, backward: string, left: string, right: string };
    keysPressed: { [key: string]: boolean };
    followOffset: THREE.Vector3;
    damping: number; // For smoothing
    lookAheadFactor: number; // For looking ahead of movement
    rotationDamping: number; // Smoothing for rotation

    constructor(
      fov: number,
      aspect: number,
      near: number,
      far: number,
      followObject: THREE.Object3D | null = null,
      controls: { forward: string, backward: string, left: string, right: string } = { forward: 'ArrowUp', backward: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
      followOffset: THREE.Vector3 = new THREE.Vector3(0, 5, 10), // Default offset: behind and above the object
      damping: number = 0.1, // Smoothing factor for position
      lookAheadFactor: number = 0.05, // Looking ahead of the object movement
      rotationDamping: number = 1 // Smoothing factor for rotation
    ) {
      super(fov, aspect, near, far);
      this.followObject = followObject;
      this.controls = controls;
      this.keysPressed = {};
      this.followOffset = followOffset;
      this.damping = damping;
      this.lookAheadFactor = lookAheadFactor;
      this.rotationDamping = rotationDamping;
      this.initializeControls();
    }
  
    initializeControls() {
      window.addEventListener('keydown', (event) => {
        this.keysPressed[event.code] = true;
      });
  
      window.addEventListener('keyup', (event) => {
        this.keysPressed[event.code] = false;
      });
    }
  
    setPosition(x: number, y: number, z: number) {
      this.position.set(x, y, z);
    }

    update(delta: number) {
      if (this.followObject) {
        // Calculate the desired position based on the offset
        const offset = this.followOffset.clone().applyQuaternion(this.followObject.quaternion); // Apply rotation to offset
        const targetPosition = this.followObject.position.clone().add(offset);

        // Smoothly move the camera towards the target position using lerp (linear interpolation)
        this.position.lerp(targetPosition, this.damping);

        // Calculate the direction the object is moving in (for look-ahead effect)
        const lookAheadPosition = this.followObject.position
          .clone()
          .add(this.followObject.getWorldDirection(new THREE.Vector3()).multiplyScalar(this.lookAheadFactor));

        // Smoothly rotate the camera to match the character's orientation
        const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().lookAt(this.position, lookAheadPosition, this.up)
        );
        this.quaternion.slerp(targetQuaternion, this.rotationDamping);
      } else {
        // Manual camera controls when not following an object
        if (this instanceof Camera) {
          if (this.keysPressed[this.controls.forward]) {
            this.position.z -= 10 * delta;
          }
          if (this.keysPressed[this.controls.backward]) {
            this.position.z += 10 * delta;
          }
          if (this.keysPressed[this.controls.left]) {
            this.position.x -= 10 * delta;
          }
          if (this.keysPressed[this.controls.right]) {
            this.position.x += 10 * delta;
          }
        }
      }
    }
}

export default Camera;
