import path from "path";
import http from "http";
import express from "express";
import socketio from "socket.io";

const app = express();

const server = http.createServer(app);

const io = socketio(server);

app.use(express.static(path.join(__dirname, "../public")));

//run on connection
io.on("connection", (socket: any) => {
  socket.emit("message", "Welcome to discourse");

  //broadcast on new connection
  socket.broadcast.emit("message", "A new user has joined the chat");

  //when someone disconnects
  socket.on("disconnect", () => io.emit("message", "A user has left the chat"));

  //listen for chat
  socket.on("chatMessage", (msg: string) => {
    io.emit("message", msg);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.info(`running on ${PORT}`));
