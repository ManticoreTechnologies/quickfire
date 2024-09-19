import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './App.css';
import { checkCollision, createWall } from './utils';
import wall_image from './wall.png';
import GameObject from './GameObject';
import Projectile from './Projectile';
import ObjectManager from './ObjectManager';

const App = () => {
  const playerCircleRef = useRef<GameObject | null>(null);
  const otherPlayersRef = useRef<Map<string, GameObject>>(new Map());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const projectilesRef = useRef<Projectile[]>([]);

  const generateUniqueId = () => {
    return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () => {
      return (Math.random() * 16 | 0).toString(16);
    });
  };

  useEffect(() => {
    const playerId = generateUniqueId();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue background
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

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const objectManager = new ObjectManager(scene, renderer, camera);
    objectManager.animate();

    // Add your game objects using objectManager.addCube or other methods
    const playerCircle = objectManager.addCube(0xff0000, new THREE.Vector3(0, 0, 0));
    playerCircleRef.current = playerCircle;

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    const wallTexture = textureLoader.load(wall_image); // Replace with the path to your texture

    const walls = [
      createWall(wallTexture, new THREE.Vector3(-5, 0, 0), new THREE.Vector3(1, 1, 10)),
      createWall(wallTexture, new THREE.Vector3(5, 0, 0), new THREE.Vector3(1, 1, 10)),
      createWall(wallTexture, new THREE.Vector3(0, 0, -5), new THREE.Vector3(10, 1, 1)),
      createWall(wallTexture, new THREE.Vector3(0, 0, 5), new THREE.Vector3(10, 1, 1)),
    ];

    walls.forEach(wall => scene.add(wall));

    // Track keys currently pressed
    const keysPressed: { [key: string]: boolean } = {};

    const onKeyDown = (event: KeyboardEvent) => {
      keysPressed[event.code] = true;
    };

    const onKeyUp = (event: KeyboardEvent) => {
      keysPressed[event.code] = false;
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    const clock = new THREE.Clock();
    const moveSpeed = 2; // units per second

    const animate = () => {
      requestAnimationFrame(animate);

      const delta = clock.getDelta(); // Time elapsed since the last frame

      if (playerCircleRef.current) {
        const moveDistance = moveSpeed * delta;

        // Move along Z axis
        if (keysPressed['KeyW']) {
          playerCircleRef.current.mesh.position.z -= moveDistance;
          if (walls.some(wall => checkCollision(playerCircleRef.current.mesh, wall))) {
            playerCircleRef.current.mesh.position.z += moveDistance; // Revert movement along Z axis
          }
        }
        if (keysPressed['KeyS']) {
          playerCircleRef.current.mesh.position.z += moveDistance;
          if (walls.some(wall => checkCollision(playerCircleRef.current.mesh, wall))) {
            playerCircleRef.current.mesh.position.z -= moveDistance; // Revert movement along Z axis
          }
        }

        // Move along X axis
        if (keysPressed['KeyA']) {
          playerCircleRef.current.mesh.position.x -= moveDistance;
          if (walls.some(wall => checkCollision(playerCircleRef.current.mesh, wall))) {
            playerCircleRef.current.mesh.position.x += moveDistance; // Revert movement along X axis
          }
        }
        if (keysPressed['KeyD']) {
          playerCircleRef.current.mesh.position.x += moveDistance;
          if (walls.some(wall => checkCollision(playerCircleRef.current.mesh, wall))) {
            playerCircleRef.current.mesh.position.x -= moveDistance; // Revert movement along X axis
          }
        }

        // Update camera position to follow the player circle
        if (cameraRef.current) {
          cameraRef.current.position.set(
            playerCircleRef.current.mesh.position.x,
            playerCircleRef.current.mesh.position.y + 5,
            playerCircleRef.current.mesh.position.z + 5
          );
          cameraRef.current.lookAt(playerCircleRef.current.mesh.position);
        }

        // Rotate player to look at the mouse
        const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(cameraRef.current);
        const dir = vector.sub(cameraRef.current.position).normalize();
        const distance = -cameraRef.current.position.y / dir.y;
        const pos = cameraRef.current.position.clone().add(dir.multiplyScalar(distance));
        playerCircleRef.current.mesh.lookAt(pos.x, playerCircleRef.current.mesh.position.y, pos.z);

        // Send player circle position to the server
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'update',
            playerId: playerId,
            position: playerCircleRef.current.mesh.position
          }));
        }
      }

      // Update projectiles
      projectilesRef.current.forEach((projectile, index) => {
        projectile.update(delta);
        if (walls.some(wall => checkCollision(projectile.mesh, wall))) {
          projectile.removeFromScene(scene);
          projectilesRef.current.splice(index, 1);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // WebSocket setup
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
      console.log('Received message:', event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'state') {
          const localPlayerId = playerId;
          objectManager.addOrUpdatePlayers(
            data.players.filter((player: any) => player.id !== localPlayerId),
            localPlayerId
          );

          // Handle projectiles
          if (data.projectiles) {
            projectilesRef.current.forEach(projectile => projectile.removeFromScene(sceneRef.current));
            projectilesRef.current = data.projectiles.map(projData => {
              const projectile = new Projectile(
                new THREE.SphereGeometry(0.1, 32, 32),
                new THREE.MeshBasicMaterial({ color: 0xffffff })
              );
              projectile.setPosition(new THREE.Vector3(projData.position.x, projData.position.y, projData.position.z));
              projectile.setVelocity(new THREE.Vector3(projData.velocity.x, projData.velocity.y, projData.velocity.z));
              projectile.addToScene(sceneRef.current);
              return projectile;
            });
          }
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };

    const onMouseClick = (event: MouseEvent) => {
      if (cameraRef.current && playerCircleRef.current) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, cameraRef.current);
        const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(cameraRef.current);
        const dir = vector.sub(cameraRef.current.position).normalize();
        const distance = -cameraRef.current.position.y / dir.y;
        const pos = cameraRef.current.position.clone().add(dir.multiplyScalar(distance));

        const projectile = new Projectile(
          new THREE.SphereGeometry(0.1, 32, 32),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        projectile.setPosition(playerCircleRef.current.mesh.position);
        projectile.setVelocity(new THREE.Vector3(pos.x - playerCircleRef.current.mesh.position.x, 0, pos.z - playerCircleRef.current.mesh.position.z).normalize().multiplyScalar(2));
        projectile.addToScene(scene);
        projectilesRef.current.push(projectile);
      }
    };

    document.addEventListener('click', onMouseClick);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('click', onMouseClick);
      document.body.removeChild(renderer.domElement);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return <div className="crosshair"></div>;
};

export default App;