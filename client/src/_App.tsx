
const playerCircleRef = useRef<Player | null>(null);


const otherPlayersRef = useRef<Map<string, GameObject>>(new Map());
const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
const sceneRef = useRef<THREE.Scene | null>(null);
const wsRef = useRef<WebSocket | null>(null);
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();


const setupRenderer = () => {
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  return renderer;
}

useEffect(() => {
  return;
  const skyboxLoader = new THREE.TextureLoader();
  const skyboxTexture = skyboxLoader.load(skybox_image);

  const textureLoader = new THREE.TextureLoader();
  const wallTexture = textureLoader.load(wall_image);

  const playerId = generateUniqueId();

  const scene = new THREE.Scene();
  sceneRef.current = scene;

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  camera.position.set(0, 5, 5);
  camera.lookAt(0, 0, 0);
  camera.rotation.x = -Math.PI / 4;
  cameraRef.current = camera;

  const renderer = setupRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const objectManager = new ObjectManager(scene, renderer, camera);

  const playerCircle = objectManager.addCube(0xff0000, new THREE.Vector3(0, 0, 0));
  playerCircleRef.current = playerCircle;

  const walls = [
    createWall(wallTexture, new THREE.Vector3(-5, 0, 0), new THREE.Vector3(1, 1, 10)),
    createWall(wallTexture, new THREE.Vector3(5, 0, 0), new THREE.Vector3(1, 1, 10)),
    createWall(wallTexture, new THREE.Vector3(0, 0, -5), new THREE.Vector3(10, 1, 1)),
    createWall(wallTexture, new THREE.Vector3(0, 0, 5), new THREE.Vector3(10, 1, 1)),
  ];

  walls.forEach(wall => scene.add(wall));

  scene.background = skyboxTexture;

  const keysPressed: { [key: string]: boolean } = {};

  const onKeyDown = (event: KeyboardEvent) => {
    keysPressed[event.code] = true;
  };

  const onKeyUp = (event: KeyboardEvent) => {
    keysPressed[event.code] = false;
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  const onMouseMove = (event: MouseEvent) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  document.addEventListener('mousemove', onMouseMove);

  const clock = new THREE.Clock();
  const moveSpeed = 2;

  const projectiles: GameObject[] = [];

  const onClick = () => {
    if (playerCircleRef.current && cameraRef.current) {
      const projectile = objectManager.addCube(0x00ff00, playerCircleRef.current.mesh.position.clone());
      projectiles.push(projectile);

      const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(cameraRef.current);
      const dir = vector.sub(cameraRef.current.position).normalize();
      projectile.velocity = dir.multiplyScalar(5);

      // Send projectile data to the server
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {

        // Give the projectile a unique id
        projectile.id = generateUniqueId();
        
        wsRef.current.send(JSON.stringify({
          type: 'projectile',
          id: projectile.id,
          position: projectile.getPosition(),
          velocity: projectile.velocity // Placeholder velocity for testing
        }));
      }
    }
  };

  document.addEventListener('click', onClick);

  const animate = () => {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (playerCircleRef.current) {
      const moveDistance = moveSpeed * delta;

      if (keysPressed['KeyW']) {
        playerCircleRef.current.mesh.position.z -= moveDistance;
        if (walls.some(wall => checkCollision(playerCircleRef.current.mesh, wall))) {
          playerCircleRef.current.mesh.position.z += moveDistance;
        }
      }
      if (keysPressed['KeyS']) {
        playerCircleRef.current.mesh.position.z += moveDistance;
        if (walls.some(wall => checkCollision(playerCircleRef.current.mesh, wall))) {
          playerCircleRef.current.mesh.position.z -= moveDistance;
        }
      }
      if (keysPressed['KeyA']) {
        playerCircleRef.current.mesh.position.x -= moveDistance;
        if (walls.some(wall => checkCollision(playerCircleRef.current.mesh, wall))) {
          playerCircleRef.current.mesh.position.x += moveDistance;
        }
      }
      if (keysPressed['KeyD']) {
        playerCircleRef.current.mesh.position.x += moveDistance;
        if (walls.some(wall => checkCollision(playerCircleRef.current.mesh, wall))) {
          playerCircleRef.current.mesh.position.x -= moveDistance;
        }
      }

      if (cameraRef.current) {
        cameraRef.current.position.set(
          playerCircleRef.current.mesh.position.x,
          playerCircleRef.current.mesh.position.y + 5,
          playerCircleRef.current.mesh.position.z + 5
        );
        cameraRef.current.lookAt(playerCircleRef.current.mesh.position);
      }

      const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(cameraRef.current);
      const dir = vector.sub(cameraRef.current.position).normalize();
      const distance = -cameraRef.current.position.y / dir.y;
      const pos = cameraRef.current.position.clone().add(dir.multiplyScalar(distance));
      playerCircleRef.current.mesh.lookAt(pos.x, playerCircleRef.current.mesh.position.y, pos.z);

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'update',
          playerId: playerId,
          position: playerCircleRef.current.mesh.position
        }));
      }
    }
    for (const [id, player] of otherPlayersRef.current) {
      player.mesh.position.add(player.velocity.clone().multiplyScalar(delta));
    }
    projectiles.forEach((projectile, index) => {
      projectile.mesh.position.add(projectile.velocity.clone().multiplyScalar(delta));
      if (walls.some(wall => checkCollision(projectile.mesh, wall))) {
        scene.remove(projectile.mesh);
        projectiles.splice(index, 1);
      }
    });

    renderer.render(scene, camera);
  };


  const ws = new WebSocket('wss://1285775518750343208.discordsays.com/.proxy/api');
  wsRef.current = ws;

  ws.onopen = () => {
    console.log('Connected to WebSocket server');
    if (playerCircleRef.current) {
      ws.send(JSON.stringify({
        type: 'init',
        playerId: playerId,
        position: playerCircleRef.current.mesh.position
      }));
    }
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type !== 'state') {
        console.log("Data", data);
      }

      if (data.type === 'state') {
        console.log("State", data);
        if (data.players) {
          console.log(data.players)
          otherPlayersRef.current = data.players;
        }
      }

    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  };

  ws.onclose = () => {
    console.log('Disconnected from WebSocket server');
  };

  return () => {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('mousemove', onMouseMove);
    document.body.removeChild(renderer.domElement);
    if (wsRef.current) {
      wsRef.current.close();
    }
    document.removeEventListener('click', onClick);
  };
}, []);

return <div className="crosshair"></div>;

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