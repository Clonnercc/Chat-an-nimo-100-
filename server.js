const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {

  socket.on("joinRoom", (room) => {
    socket.join(room);
    const count = io.sockets.adapter.rooms.get(room)?.size || 0;
    io.to(room).emit("online", count);
  });

  socket.on("msg", ({ room, texto }) => {
    io.to(room).emit("msg", {
      id: socket.id.slice(0, 5),
      texto,
      tempo: Date.now()
    });
  });

  socket.on("disconnecting", () => {
    socket.rooms.forEach(room => {
      const count = io.sockets.adapter.rooms.get(room)?.size || 0;
      io.to(room).emit("online", count - 1);
    });
  });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT);
