const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());

// ✅ Config CORS ให้รองรับทั้ง dev + production
const allowedOrigins = [
  "http://localhost:3000",         // frontend dev
  "https://heng-heng.onrender.com" // frontend production (Render)
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

// ✅ เมนูอาหาร (mock data)
const menuItems = [
  { id: 1, name: 'ราดหน้าหมู', price: 45, type: 'food', options: { เส้น: ['เส้นใหญ่', 'เส้นหมี่', 'บะหมี่กรอบ'], ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ห่อไข่'] } },
  { id: 3, name: 'ราดหน้าทะเล', price: 60, type: 'food', options: { เส้น: ['เส้นใหญ่', 'เส้นหมี่', 'บะหมี่กรอบ'], ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ห่อไข่'] } },
  { id: 4, name: 'ราดหน้าบะหมี่กรอบหมู', price: 50, type: 'food', options: { เส้น: ['บะหมี่กรอบ'], ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ห่อไข่'] } },
  { id: 6, name: 'ผัดซีอิ๊ว', price: 50, type: 'food', options: { เส้น: ['เส้นใหญ่', 'เส้นหมี่'], ขนาด: ['ธรรมดา', 'พิเศษ'] } },
  { id: 7, name: 'ผัดซีอิ๊วทะเล', price: 60, type: 'food', options: { เส้น: ['เส้นใหญ่', 'เส้นหมี่'], ขนาด: ['ธรรมดา', 'พิเศษ'] } },
  { id: 8, name: 'ข้าวผัดหมู', price: 50, type: 'food', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 9, name: 'ข้าวผัดไก่', price: 50, type: 'food', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 10, name: 'ข้าวผัดทะเล', price: 60, type: 'food', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 11, name: 'ข้าวกะเพราหมูสับ', price: 50, type: 'food', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 12, name: 'ข้าวกะเพราหมูชิ้น', price: 50, type: 'food', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 13, name: 'ข้าวกะเพราไก่', price: 50, type: 'food', options: {  ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 14, name: 'ข้าวกะเพราทะเล', price: 60, type: 'food', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 15, name: 'ข้าวกะเพราหมูกรอบ', price: 60, type: 'food', options: {  ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 16, name: 'ข้าวผัดพริกแกงหมู', price: 50, type: 'food', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 17, name: 'ข้าวผัดพริกแกงไก่', price: 50, type: 'food', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 18, name: 'ข้าวผัดคะน้าหมูกรอบ', price: 60, type: 'food', options: {  ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 19, name: 'ข้าวผัดคะน้าหมูสับ', price: 50, type: 'food', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 20, name: 'ข้าวผัดคะน้าหมูชิ้น', price: 50, type: 'food', options: {  ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 21, name: 'ข้าวไข่เจียว', price: 20, type: 'food', options: {} },
  { id: 22, name: 'ข้าวไข่เจียวหมูสับ', price: 50, type: 'food', options: {} },
  { id: 23, name: 'ข้าวไข่เจียวกุ้ง', price: 60, type: 'food', options: {} },
  { id: 24, name: 'น้ำเปล่า', price: 15, type: 'drink', options: {} },
  { id: 25, name: 'โค้ก', price: 20, type: 'drink', options: {} },
  { id: 26, name: 'น้ำส้มแฟนต้า', price: 20, type: 'drink', options: {} },
  { id: 27, name: 'น้ำเขียวแฟนต้า', price: 20, type: 'drink', options: {} },
  { id: 28, name: 'น้ำแดงแฟนต้า', price: 20, type: 'drink', options: {} }
];


let orders = [];
let orderHistory = [];
let orderCounter = 1;

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: allowedOrigins, methods: ["GET", "POST", "PUT"] } });

// ✅ Routes
app.get('/api/menu', (req, res) => res.json(menuItems));
app.get('/api/orders', (req, res) => res.json(orders));
app.get('/api/order-history', (req, res) => res.json(orderHistory));
app.get('/api/orders/table/:tableNumber', (req, res) => {
  const { tableNumber } = req.params;
  res.json(orders.filter(o => String(o.tableNumber) === String(tableNumber)));
});

app.post('/api/orders', (req, res) => {
  const { tableNumber, items } = req.body;
  if (!tableNumber || !items || items.length === 0) return res.status(400).json({ message: 'ข้อมูลไม่ถูกต้อง' });

  const newOrder = { id: orderCounter++, tableNumber, items, createdAt: new Date(), status: 'ใหม่' };
  orders.push(newOrder);
  io.emit('new_order', newOrder);
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const orderIndex = orders.findIndex(o => o.id === parseInt(id));
  if (orderIndex === -1) return res.status(404).json({ message: 'ไม่พบออเดอร์' });

  const order = orders[orderIndex];
  order.status = status;
  io.emit('order_updated', order);

  if (status === 'เสร็จสิ้น') {
    orderHistory.unshift({ ...order });
    orders.splice(orderIndex, 1);
    io.emit('table_cleared', { tableNumber: order.tableNumber, orderId: order.id });
  }
  res.json(order);
});

app.put('/api/orders/:id/cancel', (req, res) => {
  const { id } = req.params;
  const orderIndex = orders.findIndex(o => o.id === parseInt(id));
  if (orderIndex === -1) return res.status(404).json({ message: 'ไม่พบออเดอร์' });

  const order = orders[orderIndex];
  order.status = 'ยกเลิก';
  orderHistory.unshift({ ...order });
  orders.splice(orderIndex, 1);

  io.emit('order_updated', order);
  io.emit('table_cleared', { tableNumber: order.tableNumber, orderId: order.id });
  res.json({ message: 'ยกเลิกออเดอร์สำเร็จ' });
});

// ✅ Socket.IO
io.on('connection', (socket) => {
  console.log('🔌 A user connected:', socket.id);
});

// ✅ Serve React build (production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// ✅ ใช้ process.env.PORT หรือ fallback เป็น 5050
const PORT = process.env.PORT || 5050;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
