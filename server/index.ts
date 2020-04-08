import path from "path";
import http from "http";
import express from "express";
import socketio from "socket.io";
import redis from "redis";
import { formatMessage, Message } from "./utils/messages";
import {
  joinUser,
  User,
  getCurrentUser,
  onUserExit,
  getUsersInRoom,
} from "./utils/users";

const PORT = process.env.PORT || 3000;

const REDIS_PORT = 6379;

const redisClient = redis.createClient(REDIS_PORT);

const app = express();

const server = http.createServer(app);

const io = socketio(server);

app.use(express.static(path.join(__dirname, "../public")));

const botName = "Ernest";

//run on connection
io.on("connection", (socket: any) => {
  redisClient.lrange("savedMessages", 0, -1, (_err, messageList) => {
    const savedMessages = messageList.reverse();

    savedMessages.forEach((message) => {
      const user = getCurrentUser(socket.id);

      user &&
        io.to(user.room).emit("message", formatMessage(user.username, message));
    });
  });

  socket.on("joinRoom", ({ username, room }: User) => {
    const user = joinUser(socket.id, username, room);

    socket.join(user.room);
    //greet the user
    socket.emit("message", formatMessage(botName, `Welcome to Discourse`));

    //broadcast to room on new connection
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    //send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
  });

  //listen for chat
  socket.on("chatMessage", (msg: string) => {
    const user = getCurrentUser(socket.id);

    if (user) {
      const savedMessage = JSON.stringify({ name: user.username, data: msg });
      redisClient.lpush("savedMessage", savedMessage, (err, res) => {
        redisClient.ltrim("savedMessage", 0, 9);
      });
      io.to(user.room).emit("message", formatMessage(user.username, msg));
    }
  });

  //when someone disconnects
  socket.on("disconnect", () => {
    const user = onUserExit(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} left the chat`)
      );

      //send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(PORT, () => console.info(`running on ${PORT}`));
