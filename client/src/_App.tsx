import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './App.css';
import { FirstPersonControls } from './FirstPersonControls.js';

const App = () => {
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const raycaster = new THREE.Raycaster();
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const controlsRef = useRef<FirstPersonControls | null>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const cube = new THREE.Mesh(geometry, material);
    cubeRef.current = cube;
    scene.add(cube);

    // Add more cubes around the area
    const addCube = (x: number, y: number, z: number) => {
      const newCube = new THREE.Mesh(geometry, material);
      newCube.position.set(x, y, z);
      scene.add(newCube);
    };

    addCube(2, 0, -5);
    addCube(-2, 0, -5);
    addCube(0, 2, -5);
    addCube(0, -2, -5);

    const groundGeometry = new THREE.BoxGeometry();
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -3; // Position it below the main cube
    ground.scale.set(50, 0.1, 50); // Change the size of the yellow cube
    scene.add(ground);

    camera.position.z = 5;

    const controls = new FirstPersonControls(camera, renderer.domElement);
    controls.movementSpeed = 1;
    controls.lookSpeed = 0.5;
    controls.activeLook = true;
    controlsRef.current = controls;

    const animate = function () {
      requestAnimationFrame(animate);
      if (cubeRef.current) {
        cubeRef.current.rotation.x += 0.01;
        cubeRef.current.rotation.y += 0.01;
      }
      controls.update(0.1, scene.children); // Pass scene children for collision detection
      renderer.render(scene, camera);
    };

    const onClick = () => {
      if (cameraRef.current) {
        raycaster.setFromCamera(new THREE.Vector2(0, 0), cameraRef.current);
        const intersects = raycaster.intersectObjects(scene.children);
        if (intersects.length > 0) {
          const intersectedObject = intersects[0].object;
          scene.remove(intersectedObject);

          // Add shooting effect
          const shootEffect = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
          );
          shootEffect.position.copy(intersects[0].point);
          scene.add(shootEffect);

          setTimeout(() => {
            scene.remove(shootEffect);
          }, 100);
        }
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      // Hide the cursor but still let it move
      document.body.style.cursor = 'none';
    };

    document.addEventListener('click', onClick);
    document.addEventListener('mousemove', onMouseMove);

    animate();

    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('mousemove', onMouseMove);
      document.body.removeChild(renderer.domElement);
      document.body.style.cursor = 'default'; // Reset cursor style on cleanup
    };
  }, []);

  return <div className="crosshair"></div>;
};

export default App;