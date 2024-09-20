import * as THREE from 'three';

export const generateUniqueId = () => {
  return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () => {
    return (Math.random() * 16 | 0).toString(16);
  });
};
  // Utility function to check collision between two objects
  export const checkCollision = (object1: THREE.Object3D, object2: THREE.Object3D) => {
    
    const object1BB = new THREE.Box3().setFromObject(object1);
    const object2BB = new THREE.Box3().setFromObject(object2);
    return object1BB.intersectsBox(object2BB);
  };

  // Helper function to create a cube collider
  export const createCubeCollider = (color: number, position: THREE.Vector3) => {
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshBasicMaterial({ color });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.copy(position);
      return cube;
    };

export const addEdges = (mesh: THREE.Mesh) => {
      const edges = new THREE.EdgesGeometry(mesh.geometry);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
      mesh.add(line);
    };
    
export const createWall = (texture: THREE.Texture, position: THREE.Vector3, size: THREE.Vector3) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(size.x, size.y); // Adjust the repeat values based on the wall size
    
      const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const wall = new THREE.Mesh(geometry, material);
      wall.position.copy(position);
      addEdges(wall);
      return wall;
    };
