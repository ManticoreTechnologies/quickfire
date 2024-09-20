import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './App.css';
import { checkCollision, createWall, generateUniqueId } from './utils.js';
import wall_image from './wall.png';
import skybox_image from './skybox.png';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
let initialized = false;
import GameObjects from './Public/GameObjects.js';
import PlayerController from './Prefabs/PlayerController.js';
import Camera from './Prefabs/Camera.js';
import Wall from './Prefabs/Wall.js';
import initWebSocket from './Scripts/initWebsocket.js';
import Floor from './Prefabs/Floor.js';

const drawPlayer = (player: any, scene: THREE.Scene) => {
  const randomColor = Math.floor(Math.random() * 16777215);
  const playerMesh = new THREE.Mesh(new THREE.CapsuleGeometry(1, 1, 4, 8), new THREE.MeshBasicMaterial({ color: randomColor }));
  playerMesh.position.set(player.x, player.y, player.z);
  scene.add(playerMesh);
}

const drawPlayers = (players: any, scene: THREE.Scene) => {
  for (const player of players) {
    drawPlayer(player, scene);
  }
}

const App = () => {
  const players = useRef({});
  /* Initialize the game */
  const initializeGame = async() => {

    /* Create a scene */
    const scene = new THREE.Scene();
    scene.background = await new THREE.TextureLoader().loadAsync(skybox_image);
    /* Create a texture loader */
    const textureLoader = new THREE.TextureLoader();
    const wallTexture = await textureLoader.loadAsync(wall_image);
    const floorTexture = await textureLoader.loadAsync(wall_image);

    /* Create a player controller for this client */
    const playerId = generateUniqueId();
    const playerGeometry = new THREE.CapsuleGeometry(1, 1, 4, 8);
    const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
    const wireframe = new THREE.WireframeGeometry(playerGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const wireframeMesh = new THREE.LineSegments(wireframe, wireframeMaterial);
    playerMesh.add(wireframeMesh);
    const playerController = new PlayerController(playerId, { x: 0, y: 0, z: 0 }, playerMesh);
    playerController.moveSpeed = 4;

    
    /* Create a camera */
    const camera = new Camera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.followObject = playerController.mesh;


    /* Create a renderer */
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);


    /* Add the player to the scene */
    scene.add(playerController.mesh);

    /* create a floor */
    const floorPosition = new THREE.Vector3(0, -5, 0);
    const floorSize = new THREE.Vector3(100, 100, 100);
    const floor = new Floor(floorPosition, floorSize, floorTexture);
    scene.add(floor.mesh);
   

    /* Create a wall that's a perfect cube 5x5x5 */
    const cubeWallPosition = new THREE.Vector3(10, -4, 0);
    const cubeWallSize = new THREE.Vector3(5, 5, 5);
    const cubeWall = new Wall(cubeWallPosition, cubeWallSize, wallTexture);
    scene.add(cubeWall.mesh);

    /* Create another slightly bigger cube wall that can be jumped to from the first one */
    const biggerCubeWallPosition = new THREE.Vector3(20, -3, 0);
    const biggerCubeWallSize = new THREE.Vector3(6, 6, 6);
    const biggerCubeWall = new Wall(biggerCubeWallPosition, biggerCubeWallSize, wallTexture);
    scene.add(biggerCubeWall.mesh);


    renderer.render(scene, camera);

    /* Create a clock */
    const clock = new THREE.Clock();


    /* Create a test wall */
    const wallPosition = new THREE.Vector3(0, 0, -10);
    const wallSize = new THREE.Vector3(10, 10, 1);
    const testWall = new Wall(wallPosition, wallSize, wallTexture);
    scene.add(testWall.mesh);
    
    /* Initialize the websocket */
    const ws = await initWebSocket(players, playerId, playerController, scene);


    /* Create a light */
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);
    /* Log the playergs every 2 seconds */
    //setInterval(() => {
    //  console.log("Current players:", players.current);
    //}, 2000);

    /* Start the game loop */
    gameLoop(scene, camera, renderer, playerController, clock, ws);

  };

  const updateGameObjects = (delta: number) => {
    for (const object of GameObjects) {
      object.update(delta);
    }
  }
    /* Main game loop */
  const gameLoop = (
    scene: THREE.Scene, 
    camera: Camera, 
    renderer: THREE.WebGLRenderer, 
    playerController: PlayerController, 
    clock: THREE.Clock, 
    ws: WebSocket
  ) => {
      requestAnimationFrame(() => gameLoop(scene, camera, renderer, playerController, clock, ws));
      const delta = clock.getDelta();
      updateGameObjects(delta);
      camera.update(delta);
      
      // Update game objects here
      renderer.render(scene, camera);
  };
    
  if (!initialized) {
    initializeGame();
    initialized = true;
  }

};

export default App;









