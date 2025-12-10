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

// ================= MEMÓRIA (SEM BANCO) =================
let produtos = [];
let pedidos = [];

// ================= CHAT =================
io.on("connection", (socket) => {

  socket.on("joinRoom", (room) => {
    socket.join(room);
    const count = io.sockets.adapter.rooms.get(room)?.size || 0;
    io.to(room).emit("online", count);
    socket.emit("produtos", produtos);
  });

  socket.on("msg", ({ room, texto }) => {
    io.to(room).emit("msg", {
      id: socket.id.slice(0, 5),
      texto
    });
  });

});

// ================= ADMIN =================

app.get("/admin", (req, res) => {
  res.sendFile(__dirname + "/public/admin.html");
});

// Login
app.post("/admin-login", (req, res) => {
  const { user, pass } = req.body;
  res.json({ ok: user === ADMIN_USER && pass === ADMIN_PASS });
});

// ✅ Adicionar produto
app.post("/add-produto", (req, res) => {
  const { nome, preco } = req.body;

  const produto = {
    id: Date.now(),
    nome,
    preco
  };

  produtos.push(produto);

  io.emit("produtos", produtos);
  res.json({ ok: true });
});

// ✅ Comprar produto
app.post("/comprar", (req, res) => {
  const { produtoId } = req.body;

  const produto = produtos.find(p => p.id == produtoId);
  if (!produto) return res.json({ ok: false });

  pedidos.push({
    produto: produto.nome,
    preco: produto.preco,
    data: new Date()
  });

  res.json({ ok: true });
});

// ✅ Aviso global
app.post("/global-alert", (req, res) => {
  io.emit("globalAlert", { texto: req.body.mensagem });
  res.json({ ok: true });
});

// ✅ Destruição total
app.post("/destroy", (req, res) => {
  io.emit("globalAlert", { texto: "⚠️ SISTEMA ENCERRADO PELO ADMIN" });
  setTimeout(() => process.exit(0), 1500);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT);
