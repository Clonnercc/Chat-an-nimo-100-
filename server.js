const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use(express.json());

// ================= CONFIG =================
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

// ================= MEMÓRIA (VOLÁTIL) =================
let produtos = [];

// ================= FUNÇÕES =================
function gerarId() {
  return crypto.randomBytes(3).toString("hex");
}

// ================= CHAT =================
const lastMsg = new Map();

io.on("connection", (socket) => {
  socket.userId = gerarId();

  socket.on("joinRoom", (room) => {
    socket.join(room);
    const count = io.sockets.adapter.rooms.get(room)?.size || 0;
    io.to(room).emit("online", count);
    socket.emit("produtos", produtos);
  });

  socket.on("msg", ({ room, texto }) => {
    const agora = Date.now();
    const ultimo = lastMsg.get(socket.id) || 0;

    if (agora - ultimo < 1000) return;

    lastMsg.set(socket.id, agora);

    io.to(room).emit("msg", {
      id: socket.userId,
      texto: texto.slice(0, 200)
    });
  });

});

// ================= ADMIN =================
function auth(req, res, next) {
  if (req.headers.authorization !== ADMIN_TOKEN) {
    return res.status(403).json({ ok: false });
  }
  next();
}

app.get("/admin", (req, res) => {
  res.sendFile(__dirname + "/public/admin.html");
});

app.post("/add-produto", auth, (req, res) => {
  const { nome, preco } = req.body;
  produtos.push({ id: Date.now(), nome, preco });
  io.emit("produtos", produtos);
  res.json({ ok: true });
});

app.post("/global-alert", auth, (req, res) => {
  io.emit("globalAlert", { texto: req.body.mensagem });
  res.json({ ok: true });
});

// ================= START =================
const PORT = process.env.PORT || 3000;
server.listen(PORT);
