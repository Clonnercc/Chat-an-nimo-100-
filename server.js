const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const QRCode = require('qrcode');

app.use(helmet());
app.use(express.json());
app.use(express.static('public'));

const JWT_SECRET = "troque_essa_chave";
const MONGO_URI = process.env.MONGO_URI; // Configurar no Render

mongoose.connect(MONGO_URI)
  .then(() => console.log("Mongo conectado"))
  .catch(err => console.error(err));

// ===== MODELOS =====

const User = mongoose.model("User", new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: { type: String, default: "user" },
  ip: String,
  createdAt: { type: Date, default: Date.now },
  banned: { type: Boolean, default: false }
}));

const Product = mongoose.model("Product", new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  imageUrl: String,
  downloadLink: String,
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}));

const Order = mongoose.model("Order", new mongoose.Schema({
  productId: String,
  userId: String,
  status: { type: String, default: "pendente" },
  createdAt: { type: Date, default: Date.now }
}));

// ===== MIDDLEWARES =====

function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.sendStatus(401);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.sendStatus(403);
  }
}

function admin(req, res, next) {
  if (req.user.role !== "admin") return res.sendStatus(403);
  next();
}

// ===== ROTAS =====

// Cadastro
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  await User.create({ username, email, password: hash, ip: req.ip });
  res.sendStatus(201);
});

// Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.sendStatus(404);
  if (user.banned) return res.status(403).send("Banido");
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.sendStatus(401);
  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
  res.json({ token });
});

// Listar usuários (admin)
app.get('/admin/users', auth, admin, async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// Banir usuário
app.post('/admin/ban/:id', auth, admin, async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { banned: true });
  res.sendStatus(200);
});

// Produtos (admin cadastra)
app.post('/admin/product', auth, admin, async (req, res) => {
  const { name, description, price, imageUrl, downloadLink } = req.body;
  await Product.create({ name, description, price, imageUrl, downloadLink });
  res.json({ ok: true });
});

// Listar produtos (usuário)
app.get('/products', async (req, res) => {
  const products = await Product.find({ active: true });
  res.json(products);
});

// Criar pedido
app.post('/order', auth, async (req, res) => {
  const { productId } = req.body;
  const order = new Order({ productId, userId: req.user.id });
  await order.save();
  res.json({ ok: true });
});

// Admin confirma pagamento
app.post('/admin/confirm-order', auth, admin, async (req, res) => {
  const { orderId } = req.body;
  await Order.findByIdAndUpdate(orderId, { status: "pago" });
  res.json({ ok: true });
});

// Usuário vê pedidos pagos
app.get('/my-orders', auth, async (req, res) => {
  const orders = await Order.find({ userId: req.user.id, status: "pago" });
  res.json(orders);
});

// Gerar QR Code Pix
app.get('/pix-qrcode', async (req, res) => {
  const pixKey = "d874698e-ba8a-492f-9cfc-b7f487aac459";
  const qr = await QRCode.toDataURL(pixKey);
  res.json({ qr });
});

// ===== SOCKET CHAT =====
io.on('connection', socket => {
  socket.on('message', msg => io.emit('message', msg));
});

http.listen(process.env.PORT || 3000, () => console.log("Server rodando"));
