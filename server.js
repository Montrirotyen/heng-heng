const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const path = require('path');
// ⭐️ เพิ่ม Mongoose และ Dotenv
const mongoose = require('mongoose');
require('dotenv').config(); 


const app = express();
app.use(express.json());

// ✅ Config CORS
const allowedOrigins = [
  "http://localhost:3000",         
  process.env.FRONTEND_URL || "https://heng-heng.onrender.com" // ดึงจาก .env หรือใช้ค่าเดิม
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


// ------------------------------------
// ⭐️ Mongoose & Database Configuration
// ------------------------------------
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("❌ ERROR: MONGO_URI is not defined in .env file.");
    process.exit(1); 
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));


// 1. กำหนด Schema และ Model สำหรับ Menu
const MenuSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true }, // ใช้เป็น Menu ID เดิม
    name: String,
    name_en: String,
    name_cn: String,
    price: Number,
    type: String,
    options: Object,
});

const MenuItem = mongoose.model('MenuItem', MenuSchema, 'menus'); // ชื่อ Collection คือ 'menus'


// 2. กำหนด Schema และ Model สำหรับ Order
const OrderItemSchema = new mongoose.Schema({
    id: Number, 
    name: String,
    name_en: String,
    name_cn: String,
    price: Number,
    quantity: Number,
    options: Object, 
    note: String
}, { _id: false }); 

const OrderSchema = new mongoose.Schema({
    // ไม่ต้องกำหนด id, MongoDB จะสร้าง _id ให้เอง
    tableNumber: { type: String, required: true },
    status: { type: String, default: 'ใหม่' }, // 'ใหม่', 'กำลังทำ', 'เสร็จสิ้น', 'ยกเลิก'
    items: [OrderItemSchema],
    total: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model('Order', OrderSchema, 'orders'); // ชื่อ Collection คือ 'orders'


// 3. ฟังก์ชัน Seed Data (ใส่เมนูเริ่มต้น)
const seedMenuData = async () => {
    // ⭐️ ใช้รายการเมนูเดิมจาก Mock Data ใน server.js ของคุณ
    const mockMenuItems = [
        // --- กลุ่ม ราดหน้า/ผัดซีอิ้ว ---
        { id: 101, name: 'ราดหน้าเส้นใหญ่', name_en: 'Radna Big Noodle', name_cn: '大河粉炒', price: 45, type: 'radna', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ห่อไข่'] } },
        { id: 102, name: 'ราดหน้าเส้นหมี่', name_en: 'Radna Thin Noodle', name_cn: '细米粉炒', price: 45, type: 'radna', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ห่อไข่'] } },
        { id: 103, name: 'ราดหน้าบะหมี่กรอบ', name_en: 'Radna Crispy Noodle', name_cn: '脆面炒', price: 50, type: 'radna', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ห่อไข่'] } },
        { id: 104, name: 'เส้นใหญ่ผัดซีอิ้ว', name_en: 'Pad See Ew Big Noodle', name_cn: '大河粉炒酱油', price: 50, type: 'radna', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว'] } },
        { id: 105, name: 'เส้นหมี่ผัดซีอิ้ว', name_en: 'Pad See Ew Thin Noodle', name_cn: '细米粉炒酱油', price: 50, type: 'radna', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว'] } },
        
        // --- กลุ่ม ข้าวกะเพรา ---
        { id: 201, name: 'ข้าวกระเพราหมูสับ', name_en: 'Holy Basil Minced Pork', name_cn: '碎猪肉罗勒饭', price: 50, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        { id: 202, name: 'ข้าวกระเพราหมูชิ้น', name_en: 'Holy Basil Sliced Pork', name_cn: '猪肉片罗勒饭', price: 50, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        { id: 203, name: 'ข้าวกระเพราไก่', name_en: 'Holy Basil Chicken', name_cn: '鸡肉罗勒饭', price: 50, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        { id: 204, name: 'ข้าวกระเพราทะเล', name_en: 'Holy Basil Seafood', name_cn: '海鲜罗勒饭', price: 60, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        { id: 205, name: 'ข้าวกระเพราหมูกรอบ', name_en: 'Holy Basil Crispy Pork', name_cn: '脆皮猪肉罗勒饭', price: 60, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        
        // --- กลุ่ม ข้าวคะน้า ---
        { id: 206, name: 'ข้าวคะน้าหมูสับ', name_en: 'Kale Minced Pork', name_cn: '碎猪肉芥兰饭', price: 50, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        { id: 207, name: 'ข้าวคะน้าหมูชิ้น', name_en: 'Kale Sliced Pork', name_cn: '猪肉片芥兰饭', price: 50, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        { id: 208, name: 'ข้าวคะน้าไก่', name_en: 'Kale Chicken', name_cn: '鸡肉芥兰饭', price: 50, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        { id: 209, name: 'ข้าวคะน้าทะเล', name_en: 'Kale Seafood', name_cn: '海鲜芥兰饭', price: 60, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        { id: 210, name: 'ข้าวคะน้าหมูกรอบ', name_en: 'Kale Crispy Pork', name_cn: '脆皮猪肉芥兰饭', price: 60, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },

        // --- กลุ่ม ข้าวผัด ---
        { id: 301, name: 'ข้าวผัดไก่', name_en: 'Chicken Fried Rice', name_cn: '鸡肉炒饭', price: 50, type: 'fried-rice', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        { id: 302, name: 'ข้าวผัดหมูสับ', name_en: 'Minced Pork Fried Rice', name_cn: '碎猪肉炒饭', price: 50, type: 'fried-rice', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        { id: 303, name: 'ข้าวผัดหมูชิ้น', name_en: 'Sliced Pork Fried Rice', name_cn: '猪肉片炒饭', price: 50, type: 'fried-rice', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        { id: 304, name: 'ข้าวผัดทะเล', name_en: 'Seafood Fried Rice', name_cn: '海鲜炒饭', price: 60, type: 'fried-rice', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },

        // --- กลุ่ม อื่นๆ (เน้นคำว่า "ผัด") ---
        { id: 401, name: 'ผัดพริกหยวกหมูชิ้น', name_en: 'Stir-fried Pepper Sliced Pork', name_cn: '青椒炒猪肉片', price: 50, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        { id: 402, name: 'ผัดพริกหยวกหมูสับ', name_en: 'Stir-fried Pepper Minced Pork', name_cn: '青椒炒碎猪肉', price: 50, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        { id: 403, name: 'ผัดพริกหยวกไก่', name_en: 'Stir-fried Pepper Chicken', name_cn: '青椒炒鸡肉', price: 50, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        
        { id: 404, name: 'ผัดพริกแกงหมูสับ', name_en: 'Curry Paste Minced Pork', name_cn: '咖喱炒碎猪肉', price: 50, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        { id: 405, name: 'ผัดพริกแกงหมูชิ้น', name_en: 'Curry Paste Sliced Pork', name_cn: '咖喱炒猪肉片', price: 50, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        { id: 406, name: 'ผัดพริกแกงไก่', name_en: 'Curry Paste Chicken', name_cn: '咖喱炒鸡肉', price: 50, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        
        { id: 407, name: 'ข้าวราดผัดผักบุ้งหมูสับ', name_en: 'Stir-fried Morning Glory Minced Pork', name_cn: '碎猪肉炒空心菜饭', price: 50, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        { id: 408, name: 'ข้าวราดผัดผักบุ้งหมูชิ้น', name_en: 'Stir-fried Morning Glory Sliced Pork', name_cn: '猪肉片炒空心菜饭', price: 50, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        { id: 409, name: 'ข้าวราดผัดผักบุ้งไก่', name_en: 'Stir-fried Morning Glory Chicken', name_cn: '鸡肉炒空心菜饭', price: 50, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },
        { id: 410, name: 'ข้าวราดผัดผักบุ้งทะเล', name_en: 'Stir-fried Morning Glory Seafood', name_cn: '海鲜炒空心菜饭', price: 60, type: 'a-la-carte', options: { ขนาด: ['ธรรมดา', 'พิเศษ'], เพิ่มเติม: ['ไข่ดาว', 'ไข่เจียว'] } },

        // --- กลุ่ม เครื่องดื่ม ---
        { id: 501, name: 'เป๊ปซี่', name_en: 'Pepsi', name_cn: '百事可乐', price: 20, type: 'drink', options: { ขนาด: ['แก้ว', 'ขวดเล็ก'] } },
        { id: 502, name: 'น้ำเปล่า', name_en: 'Water', name_cn: '矿泉水', price: 10, type: 'drink', options: {} },
    ];
    
    // ตรวจสอบว่ามีข้อมูลเมนูอยู่แล้วหรือไม่
    const count = await MenuItem.countDocuments();
    if (count === 0) {
        await MenuItem.insertMany(mockMenuItems);
        console.log('🍽️ Menu Seeded Successfully!');
    }
};


// ------------------------------------
// ✅ Socket.IO & Server Setup
// ------------------------------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('🔌 A user connected');
  socket.on('disconnect', () => {
    console.log('🚪 User disconnected');
  });
});


// ------------------------------------
// ✅ API Routes (ใช้ Database แทน Array เดิม)
// ------------------------------------

// 1. GET Menu Items
app.get('/api/menu', async (req, res) => {
    try {
        // ดึงเมนูทั้งหมดจาก MongoDB
        const menuItems = await MenuItem.find({}).sort({ id: 1 });
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu', error: error.message });
    }
});

// 2. GET Active Orders
app.get('/api/orders', async (req, res) => {
    try {
        // ดึงออเดอร์ที่มีสถานะ 'ใหม่' และ 'กำลังทำ' และเรียงตามเวลาล่าสุด
        const activeOrders = await Order.find({ 
            status: { $in: ['ใหม่', 'กำลังทำ'] } 
        }).sort({ createdAt: -1 }); 
        res.json(activeOrders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
});

// 3. GET Order History
app.get('/api/orders/history', async (req, res) => {
    try {
        // ดึงออเดอร์ที่มีสถานะ 'เสร็จสิ้น' และ 'ยกเลิก' 
        const historyOrders = await Order.find({ 
            status: { $in: ['เสร็จสิ้น', 'ยกเลิก'] } 
        }).sort({ createdAt: -1 }); 
        res.json(historyOrders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching history', error: error.message });
    }
});

// 4. GET Orders by Table
app.get('/api/orders/table/:tableNumber', async (req, res) => {
    try {
        const { tableNumber } = req.params;
        const tableOrders = await Order.find({ 
            tableNumber: tableNumber,
            status: { $in: ['ใหม่', 'กำลังทำ'] }
        }).sort({ createdAt: -1 }); 
        res.json(tableOrders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching table orders', error: error.message });
    }
});

// 5. POST New Order
app.post('/api/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        const savedOrder = await newOrder.save();
        
        // ส่ง Socket.IO แจ้งเตือนห้องครัว
        io.emit('new_order', savedOrder); 
        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(500).json({ message: 'Error creating order', error: error.message });
    }
});

// 6. PUT Update Order Status
app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedOrder = await Order.findByIdAndUpdate(
            id, 
            { status: status }, 
            { new: true }
        ); 

        if (!updatedOrder) {
            return res.status(404).json({ message: 'ไม่พบออเดอร์' });
        }
        
        // ส่ง Socket.IO แจ้งเตือน Client/Kitchen
        io.emit('order_updated', updatedOrder); 

        if (status === 'เสร็จสิ้น' || status === 'ยกเลิก') {
            // ส่งสัญญาณให้หน้า Customer เคลียร์รายการ
            io.emit('table_cleared', { tableNumber: updatedOrder.tableNumber, orderId: updatedOrder._id });
        }
        
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: 'Error updating status', error: error.message });
    }
});

// 7. PUT Cancel Order
app.put('/api/orders/:id/cancel', async (req, res) => {
    try {
        const { id } = req.params;
        
        const canceledOrder = await Order.findByIdAndUpdate(
            id, 
            { status: 'ยกเลิก' }, 
            { new: true }
        );

        if (!canceledOrder) {
            return res.status(404).json({ message: 'ไม่พบออเดอร์' });
        }

        io.emit('order_updated', canceledOrder); 
        io.emit('table_cleared', { tableNumber: canceledOrder.tableNumber, orderId: canceledOrder._id });
        
        res.json({ message: 'ยกเลิกออเดอร์สำเร็จ', order: canceledOrder });
    } catch (error) {
        res.status(500).json({ message: 'Error canceling order', error: error.message });
    }
});


// ✅ Start Server
const PORT = process.env.PORT || 5050;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // ⭐️ ใส่เมนูเริ่มต้นเข้า MongoDB เมื่อ Server เริ่มต้น
  seedMenuData(); 
});