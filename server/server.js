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

const wss = new WebSocketServer({ server:httpsServer });

const players = new Map();

wss.on('connection', (ws) => {
  const playerId = generateUniqueId();
  ws.playerId = playerId;

  // Send the current state of all players to the new client
  const playerData = Array.from(players.values());
  ws.send(JSON.stringify({ type: 'players', players: playerData }));

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === 'init') {
      players.set(ws.playerId, { id: ws.playerId, position: data.position });
      broadcastPlayers();
    } else if (data.type === 'update') {
      players.set(ws.playerId, { id: ws.playerId, position: data.position });
      broadcastPlayers();
    }
  });

  ws.on('close', () => {
    players.delete(ws.playerId);
    broadcastPlayers();
  });
});

const broadcastPlayers = () => {
  const playerData = Array.from(players.values());
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'players', players: playerData }));
    }
  });
};

const generateUniqueId = () => {
  return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () => {
    return (Math.random() * 16 | 0).toString(16);
  });
};

app.listen(port, host, () => {
  console.log(`Server is running on ${host}:${port}`);
});
