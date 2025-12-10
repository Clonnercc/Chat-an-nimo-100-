const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.on("msg", (texto) => {
    io.emit("msg", {
      id: socket.id.slice(0, 5),
      texto
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT);
