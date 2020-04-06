import path from "path";
import http from "http";
import express from "express";
import socketio from "socket.io";
import { formatMessage } from "./utils/messages";

const app = express();

const server = http.createServer(app);

const io = socketio(server);

app.use(express.static(path.join(__dirname, "../public")));

const botName = "Ernest";

//run on connection
io.on("connection", (socket: any) => {
  socket.emit("message", formatMessage(botName, `Welcome to Discourse`));

  //broadcast on new connection
  socket.broadcast.emit(
    "message",
    formatMessage(botName, "A new user has joined the chat")
  );

  //when someone disconnects
  socket.on("disconnect", () =>
    io.emit("message", formatMessage(botName, `A new user left the chat`))
  );

  //listen for chat
  socket.on("chatMessage", (msg: string) => {
    io.emit("message", formatMessage("user", msg));
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.info(`running on ${PORT}`));
