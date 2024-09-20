import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createWall } from './utils';
import wall_image from './wall.png';
import skybox_image from './skybox.png';

const GameScene = ({ playerCircleRef, cameraRef, sceneRef }) => {
  useEffect(() => {
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

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();
    const wallTexture = textureLoader.load(wall_image);

    const walls = [
      createWall(wallTexture, new THREE.Vector3(-5, 0, 0), new THREE.Vector3(1, 1, 10)),
      createWall(wallTexture, new THREE.Vector3(5, 0, 0), new THREE.Vector3(1, 1, 10)),
      createWall(wallTexture, new THREE.Vector3(0, 0, -5), new THREE.Vector3(10, 1, 1)),
      createWall(wallTexture, new THREE.Vector3(0, 0, 5), new THREE.Vector3(10, 1, 1)),
    ];

    walls.forEach(wall => scene.add(wall));

    const skyboxLoader = new THREE.TextureLoader();
    const skyboxTexture = skyboxLoader.load(skybox_image);
    scene.background = skyboxTexture;

    return () => {
      document.body.removeChild(renderer.domElement);
    };
  }, [cameraRef, sceneRef]);

  return null;
};

export default GameScene;