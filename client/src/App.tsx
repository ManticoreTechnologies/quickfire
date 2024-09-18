import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './App.css';
import { checkCollision, createCubeCollider } from './utils';
//import {patchUrlMappings} from '@discord/embedded-app-sdk';
//patchUrlMappings([{prefix: '/api', target: 'quickfire.online'}]);
const App = () => {
  const playerCubeRef = useRef<THREE.Mesh | null>(null);
  const otherPlayersRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
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

    const addEdges = (mesh: THREE.Mesh) => {
      const edges = new THREE.EdgesGeometry(mesh.geometry);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
      mesh.add(line);
    };

    const playerCube = createCubeCollider(0xff0000, new THREE.Vector3(0, 0, 0));
    playerCubeRef.current = playerCube;
    scene.add(playerCube);
    addEdges(playerCube);

    // Create walls
    const createWall = (color: number, position: THREE.Vector3, size: THREE.Vector3) => {
      const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
      const material = new THREE.MeshBasicMaterial({ color });
      const wall = new THREE.Mesh(geometry, material);
      wall.position.copy(position);
      addEdges(wall);
      return wall;
    };

    const walls = [
      createWall(0x00ff00, new THREE.Vector3(-5, 0, 0), new THREE.Vector3(1, 1, 10)),
      createWall(0x00ff00, new THREE.Vector3(5, 0, 0), new THREE.Vector3(1, 1, 10)),
      createWall(0x00ff00, new THREE.Vector3(0, 0, -5), new THREE.Vector3(10, 1, 1)),
      createWall(0x00ff00, new THREE.Vector3(0, 0, 5), new THREE.Vector3(10, 1, 1)),
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

      if (playerCubeRef.current) {
        const moveDistance = moveSpeed * delta;

        // Move along Z axis
        if (keysPressed['ArrowUp']) {
          playerCubeRef.current.position.z -= moveDistance;
          if (walls.some(wall => checkCollision(playerCubeRef.current, wall))) {
            playerCubeRef.current.position.z += moveDistance; // Revert movement along Z axis
          }
        }
        if (keysPressed['ArrowDown']) {
          playerCubeRef.current.position.z += moveDistance;
          if (walls.some(wall => checkCollision(playerCubeRef.current, wall))) {
            playerCubeRef.current.position.z -= moveDistance; // Revert movement along Z axis
          }
        }

        // Move along X axis
        if (keysPressed['ArrowLeft']) {
          playerCubeRef.current.position.x -= moveDistance;
          if (walls.some(wall => checkCollision(playerCubeRef.current, wall))) {
            playerCubeRef.current.position.x += moveDistance; // Revert movement along X axis
          }
        }
        if (keysPressed['ArrowRight']) {
          playerCubeRef.current.position.x += moveDistance;
          if (walls.some(wall => checkCollision(playerCubeRef.current, wall))) {
            playerCubeRef.current.position.x -= moveDistance; // Revert movement along X axis
          }
        }

        // Update camera position to follow the player cube
        if (cameraRef.current) {
          cameraRef.current.position.set(
            playerCubeRef.current.position.x,
            playerCubeRef.current.position.y + 5,
            playerCubeRef.current.position.z + 5
          );
          cameraRef.current.lookAt(playerCubeRef.current.position);
        }

        // Send player cube position to the server
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'update',
            position: playerCubeRef.current.position
          }));
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // WebSocket setup
    const ws = new WebSocket('wss://1285775518750343208.discordsays.com/.proxy/api');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      if (playerCubeRef.current) {
        ws.send(JSON.stringify({
          type: 'init',
          position: playerCubeRef.current.position
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'players') {
          const colors = [0x0000ff, 0xff00ff, 0x00ffff, 0xffff00]; // Add more colors as needed
          const otherPlayers = data.players.filter(player => player.id !== wsRef.current?.playerId); // Exclude the current player
          otherPlayersRef.current.forEach((player, id) => {
            if (!otherPlayers.some(p => p.id === id)) {
              scene.remove(player);
              otherPlayersRef.current.delete(id);
            }
          });
          otherPlayers.forEach((player, index) => {
            if (!otherPlayersRef.current.has(player.id)) {
              const color = colors[index % colors.length]; // Cycle through colors
              const otherPlayer = createCubeCollider(color, new THREE.Vector3(player.position.x, player.position.y, player.position.z));
              scene.add(otherPlayer);
              otherPlayersRef.current.set(player.id, otherPlayer);
            } else {
              const existingPlayer = otherPlayersRef.current.get(player.id);
              if (existingPlayer) {
                existingPlayer.position.set(player.position.x, player.position.y, player.position.z);
              }
            }
          });
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
      document.body.removeChild(renderer.domElement);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return <div className="crosshair"></div>;
};

export default App;
