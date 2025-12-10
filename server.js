const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use(express.json());

const ADMIN_USER = "HKCHEF";
const ADMIN_PASS = "190108Hk";

// Chat normal
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

// Painel Admin (rota protegida)
app.get("/admin", (req, res) => {
  res.sendFile(__dirname + "/public/admin.html");
});

// Verifica login
app.post("/admin-login", (req, res) => {
  const { user, pass } = req.body;

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    res.json({ ok: true });
  } else {
    res.json({ ok: false });
  }
});

// Botão de destruição
app.post("/destroy", (req, res) => {
  io.emit("msg", { id: "SISTEMA", texto: "⚠️ SERVIDOR ENCERRADO PELO ADMIN" });

  setTimeout(() => {
    process.exit(0); // MATA O SERVIDOR
  }, 1000);

  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Servidor rodando...");
});
