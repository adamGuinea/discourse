import path from "path";
import http from "http";
import express from "express";
import socketio from "socket.io";
import redis from "redis";
import { formatMessage, SavedData } from "./utils/messages";
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
  socket.on("joinRoom", ({ username, room }: User) => {
    const user = joinUser(socket.id, username, room);

    socket.join(user.room);

    //greet the user
    socket.emit("message", formatMessage(botName, `Welcome to Discourse`));

    //send previous chat messages
    redisClient.lrange("messages", 0, -1, (err, savedMessages) => {
      if (err) {
        console.error(err);
      }
      savedMessages = savedMessages.reverse();
      savedMessages.forEach((m: string) => {
        const savedData: SavedData = JSON.parse(m);
        if (savedData.room == user.room) {
          socket.emit("message", savedData.message);
        }
      });
    });

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
      const prettyMsg = formatMessage(user.username, msg);
      io.to(user.room).emit("message", prettyMsg);

      //save chat history
      const messageData = {
        message: prettyMsg,
        room: user.room,
      };

      const stringifyMsg = JSON.stringify(messageData);
      redisClient.lpush("messages", stringifyMsg, (err, _res) => {
        if (err) {
          console.error(err);
        }
        redisClient.ltrim("messages", 0, 9);
      });
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

      //flush db once everyone leaves
      const userCount = getUsersInRoom(user.room);
      userCount.length === 0 && redisClient.flushdb();
    }
  });
});

server.listen(PORT, () => console.info(`running on ${PORT}`));
