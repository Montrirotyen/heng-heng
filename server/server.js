// ...existing code...
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const path = require('path');
// ...existing code...

// Serve React static files
app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// ...existing code...

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT"]
  }
});

// --- ข้อมูลเมนู (แทน Database) ---
const menuItems = [
  // ราดหน้า
  { id: 1, name: 'ราดหน้าหมู', price: 45, type: 'food', options: { เส้น: ['เส้นใหญ่', 'เส้นหมี่', 'บะหมี่กรอบ'], ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ห่อไข่'] } },
  { id: 3, name: 'ราดหน้าทะเล', price: 60, type: 'food', options: { เส้น: ['เส้นใหญ่', 'เส้นหมี่', 'บะหมี่กรอบ'], ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ห่อไข่'] } },
  { id: 4, name: 'ราดหน้าบะหมี่กรอบหมู', price: 50, type: 'food', options: { เส้น: ['บะหมี่กรอบ'], ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ห่อไข่'] } },
  { id: 6, name: 'ผัดซีอิ๊ว', price: 50, type: 'food', options: { เส้น: ['เส้นใหญ่', 'เส้นหมี่'], ขนาด: ['ธรรมดา', 'พิเศษ'] } },
  { id: 7, name: 'ผัดซีอิ๊วทะเล', price: 60, type: 'food', options: { เส้น: ['เส้นใหญ่', 'เส้นหมี่'], ขนาด: ['ธรรมดา', 'พิเศษ'] } },

  // ข้าวผัด
  { id: 8, name: 'ข้าวผัดหมู', price: 50, type: 'food', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 9, name: 'ข้าวผัดไก่', price: 50, type: 'food', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 10, name: 'ข้าวผัดทะเล', price: 60, type: 'food', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },

  // กะเพรา

  { id: 11, name: 'ข้าวกะเพราหมูสับ', price: 50, type: 'food', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 12, name: 'ข้าวกะเพราหมูชิ้น', price: 50, type: 'food', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 13, name: 'ข้าวกะเพราไก่', price: 50, type: 'food', options: {  ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 14, name: 'ข้าวกะเพราทะเล', price: 60, type: 'food', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 15, name: 'ข้าวกะเพราหมูกรอบ', price: 60, type: 'food', options: {  ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },

  // ผัดพริกแกง
  { id: 16, name: 'ข้าวผัดพริกแกงหมู', price: 50, type: 'food', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 17, name: 'ข้าวผัดพริกแกงไก่', price: 50, type: 'food', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },

  // ผัดคะน้า
  { id: 18, name: 'ข้าวผัดคะน้าหมูกรอบ', price: 60, type: 'food', options: {  ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 19, name: 'ข้าวผัดคะน้าหมูสับ', price: 50, type: 'food', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
  { id: 20, name: 'ข้าวผัดคะน้าหมูชิ้น', price: 50, type: 'food', options: {  ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },

  // ไข่เจียว/ข้าวไข่เจียว
  { id: 21, name: 'ข้าวไข่เจียว', price: 20, type: 'food', options: {} },
  { id: 22, name: 'ข้าวไข่เจียวหมูสับ', price: 50, type: 'food', options: {} },
  { id: 23, name: 'ข้าวไข่เจียวกุ้ง', price: 60, type: 'food', options: {} },

  // เครื่องดื่ม
  { id: 24, name: 'น้ำเปล่า', price: 15, type: 'drink', options: {} },
  { id: 25, name: 'โค้ก', price: 20, type: 'drink', options: {} },
  { id: 26, name: 'น้ำส้มแฟนต้า', price: 20, type: 'drink', options: {} },
  { id: 27, name: 'น้ำเขียวแฟนต้า', price: 20, type: 'drink', options: {} },
  { id: 28, name: 'น้ำแดงแฟนต้า', price: 20, type: 'drink', options: {} }
];

let orders = [];
let orderHistory = [];
let orderCounter = 1;

app.get('/api/menu', (req, res) => {
  res.json(menuItems);
});

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// endpoint สำหรับประวัติย้อนหลัง
app.get('/api/order-history', (req, res) => {
  res.json(orderHistory);
});

app.get('/api/orders/table/:tableNumber', (req, res) => {
  const { tableNumber } = req.params;
  const tableOrders = orders.filter(order => 
    order.tableNumber === tableNumber && order.status !== 'เสร็จสิ้น'
  );
  res.json(tableOrders);
});

app.post('/api/orders', (req, res) => {
  const { tableNumber, items } = req.body; 

  if (!tableNumber || !items || items.length === 0) {
    return res.status(400).json({ message: 'ข้อมูลไม่ถูกต้อง' });
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const newOrder = {
    id: orderCounter++,
    tableNumber, 
    items,
    total,
    createdAt: new Date(),
    status: 'ใหม่'
  };
  orders.push(newOrder);

  console.log('New order received:', newOrder);
  io.emit('new_order', newOrder);

  res.status(201).json(newOrder);
});

app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = orders.find(o => o.id === parseInt(id));

  if (!order) {
    return res.status(404).json({ message: 'ไม่พบออเดอร์' });
  }

  // ไม่อนุญาตเปลี่ยนสถานะถ้าออเดอร์ถูกยกเลิกแล้ว
  if (order.status === 'ยกเลิก') {
    return res.status(400).json({ message: 'ออเดอร์นี้ถูกยกเลิกแล้ว' });
  }

  order.status = status;

  console.log(`Order ${order.id} status updated to: ${status}`);

  if (status === 'เสร็จสิ้น' || status === 'ยกเลิก') {
    // เก็บลงประวัติย้อนหลัง
    orderHistory.unshift({ ...order });
    orders = orders.filter(o => o.id !== order.id);
    io.emit('table_cleared', { tableNumber: order.tableNumber });
  }

  io.emit('order_updated', order);
  res.json(order);
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server กำลังทำงานที่ http://localhost:${PORT}`));