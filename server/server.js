import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { WebSocketServer } from "ws";
import https from 'https';
import fs from 'fs';
import path from 'path';

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

httpsServer.listen(3002, host, ()=>{
  console.log(`${host}:3002`)
});

const wss = new WebSocketServer({ server: httpsServer });

const players = new Map();
const gameObjects = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === 'init') {
      ws.playerId = data.playerId;
      players.set(ws.playerId, { id: ws.playerId, position: data.position });
      broadcastState();
    } else if (data.type === 'update') {
      players.set(ws.playerId, { id: ws.playerId, position: data.position });
      broadcastState();
    } else if (data.type === 'gameObject') {
      gameObjects.set(data.id, data);
      broadcastState();
    }
  });

  ws.on('close', () => {
    players.delete(ws.playerId);
    broadcastState();
  });

  // Send the current state of all players and game objects to the new client
  const playerData = Array.from(players.values());
  const gameObjectData = Array.from(gameObjects.values());
  ws.send(JSON.stringify({ type: 'init', players: playerData, gameObjects: gameObjectData }));
});

const broadcastState = () => {
  const playerData = Array.from(players.values());
  const gameObjectData = Array.from(gameObjects.values());
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'state', players: playerData, gameObjects: gameObjectData }));
    }
  });
};

app.listen(port, host, () => {
  console.log(`Server is running on ${host}:${port}`);
});