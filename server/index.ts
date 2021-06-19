import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "colyseus";

import { MyRoom } from "./MyRoom";

const port = Number(process.env.PORT || 2567);
const app = express()

app.use(cors());
app.use(express.json())

// create http server
const server = http.createServer(app);

// add http server to colyseus
const gameServer = new Server({
  server,
});

// register your room handlers
gameServer.define('my_room', MyRoom);

// listen to port
gameServer.listen(port);
console.log(`Listening on ws://localhost:${ port }`)
