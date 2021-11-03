import cors from "cors";
import express from "express";
import http from "http";
import { MyRoom } from "./MyRoom";
import { Server as ColyseusServer } from "colyseus";

// Basic settings.
const port = Number(process.env.PORT || 2567);
const app = express();
app.use(cors());

app.use(express.json()); // Parse JSON payloads.

// Create HTTP server and add it to Colyseus Server.
const server = http.createServer(app);
const gameServer = new ColyseusServer({
  server,
});

// Register room handlers and listen to the port.
gameServer.define("my_room", MyRoom);
gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);
