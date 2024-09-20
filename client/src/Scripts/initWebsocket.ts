import * as THREE from 'three';
import PlayerController from '../Prefabs/PlayerController';
import Player from '../Prefabs/Player';

const initWebSocket = (players: any, playerId: string, playerController: PlayerController, scene: THREE.Scene): Promise<WebSocket> => {
  return new Promise((resolve, reject) => {
    /* Connect to the server */
    const ws = new WebSocket('wss://1285775518750343208.discordsays.com/.proxy/api');

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      ws.send(JSON.stringify({ type: 'init', playerId: playerId, position: playerController.mesh.position }));
      resolve(ws);  // Resolve the promise when the WebSocket connection is opened
    };

    ws.onerror = (error) => {
      console.log('WebSocket error', error);
      reject(error);  // Reject the promise if there is a WebSocket error
    };

    /* Listen for player updates */
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      /* Returned when the server has initialized our player */
      if (message.type === 'init') {
        const randomColor = Math.floor(Math.random() * 16777215);
        const playerGeometry = new THREE.CapsuleGeometry(1, 1, 4, 8);
        const playerMaterial = new THREE.MeshBasicMaterial({ color: randomColor });
        const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
        for (const player of message.players) {
          const new_player = new Player(
            player.playerId,
            player.position,
            playerMesh
          );
          (players.current as any)[player.playerId] = new_player;
          new_player.mesh.position.set(player.position.x, player.position.y, player.position.z);
          scene.add(new_player.mesh);
        }
      }

      /* Returned when the server has updated the player list */
      if (message.type === 'init_player') {
        console.log(`Player ${message.player.playerId} joined`);
        const randomColor = Math.floor(Math.random() * 16777215);
        const playerGeometry = new THREE.CapsuleGeometry(1, 1, 4, 8);
        const playerMaterial = new THREE.MeshBasicMaterial({ color: randomColor });
        const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);
        const new_player = new Player(
          message.player.playerId,
          message.player.position,
          playerMesh
        );
        (players.current as any)[message.player.playerId] = new_player;
        new_player.mesh.position.set(message.player.position.x, message.player.position.y, message.player.position.z);
        scene.add(new_player.mesh);
      }

      /* Update player position */
      if (message.type === 'update_player') {
        try {
          const player = (players.current as any)[message.player.playerId];
          player.mesh.position.set(message.player.position.x, message.player.position.y, message.player.position.z);
        } catch (error) {
          console.log(`Error updating player ${message.player.playerId}: ${error}`);
        }
      }

      /* Handle player disconnection */
      if (message.type === 'remove_player') {
        const player = (players.current as any)[message.playerId];
        if (player) {
          player.mesh.removeFromParent();
          delete (players.current as any)[message.playerId];
          console.log(`Player ${message.playerId} disconnected`);
        }
      }
    };

    playerController.onMove = (position: THREE.Vector3, direction: string, distance: number) => {
        if(direction === 'down'){
            if(distance > 0.2){
                ws.send(JSON.stringify({ type: 'update_player', playerId: playerId, position: position }));
            }
        }else{
            ws.send(JSON.stringify({ type: 'update_player', playerId: playerId, position: position }));
        }
    };
  });
};

export default initWebSocket;
