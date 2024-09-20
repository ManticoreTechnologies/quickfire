import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { WebSocketServer } from "ws";
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';


dotenv.config({ path: "../.env" });

const app = express();
const port = 3001;
const host = '63.250.36.100'

// SSL certificates
const privateKey = fs.readFileSync('/etc/letsencrypt/live/quickfire.online/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/quickfire.online/fullchain.pem', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const httpsServer = https.createServer(credentials, app);

// Allow express to parse JSON bodies
app.use(express.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

httpsServer.listen(3002, host, ()=>{
  console.log(`${host}:3002`)
});

const wss = new WebSocketServer({ server: httpsServer });

const players = new Map();
const gameObjects = new Map();


/* On client connect  */
wss.on('connection', (ws) => {

  /* On message from client */
  ws.on('message', (message) => {

    /* Message from client */
    const data = JSON.parse(message);
    
    /* Each client send their player id when they connect */
    if (data.type === 'init') {
      /* Send all clients the new player */
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'init_player', player: data }));
        }
      });
  
      ws.send(JSON.stringify({ type: 'init', players: Array.from(players.values()) }));


      ws.playerId = data.playerId; 
      // store the player id and data
      players.set(data.playerId, {playerId: data.playerId, position: data.position});
      console.log(players);
      /* player joined message */
      console.log(`Player ${data.playerId} joined`);
    
    } else if (data.type === 'update_player') {
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'update_player', player: data }));
        }
      });
      players.set(data.playerId, {playerId: data.playerId, position: data.position});

    } 
  
    
  });
  
  ws.on('close', () => {
    if (ws.playerId) {
      console.log(`Player ${ws.playerId} disconnected`);
      /*destroy the player object*/
      players.delete(ws.playerId);
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'remove_player', playerId: ws.playerId }));
        }
      });
      ws.playerId = null;
    }
  });

});

const broadcastState = () => {
  const playerData = Array.from(players.values());
  const gameObjectData = Array.from(gameObjects.values());
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'players', players: playerData }));
    }
  });
};

app.listen(port, host, () => {
  console.log(`Server is running on ${host}:${port}`);
});