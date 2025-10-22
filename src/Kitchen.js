import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5050');

function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const audioRef = useRef(null);

  useEffect(() => {
    fetch('http://localhost:5050/api/orders')
      .then(res => res.json())
      .then(data => setOrders(data));

    if (!audioRef.current) {
      audioRef.current = new window.Audio('/notification.mp3');
      audioRef.current.load();
    }

    const handleNewOrder = (newOrder) => {
      setOrders(prev => [newOrder, ...prev]);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      }
    };

    const handleOrderUpdated = (updatedOrder) => {
      if (updatedOrder.status === 'เสร็จสิ้น' || updatedOrder.status === 'ยกเลิก') {
        setOrders(prev => prev.filter(order => order.id !== updatedOrder.id));
      } else {
        setOrders(prev => prev.map(order => order.id === updatedOrder.id ? updatedOrder : order));
      }
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_updated', handleOrderUpdated);

    return () => {
      socket.off('new_order');
      socket.off('order_updated');
    };
  }, []);

  const fetchHistory = () => {
    fetch('http://localhost:5050/api/order-history')
      .then(res => res.json())
      .then(data => {
        setHistory(data);
        setShowHistory(true);
      });
  };

  const getMenuName = (item) => item.name;

  const handleStatusChange = (order, nextStatus) => {
    fetch(`http://localhost:5050/api/orders/${order.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    });
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('ยืนยันยกเลิกออเดอร์นี้?')) return;
    try {
      await fetch(`http://localhost:5050/api/orders/${orderId}/cancel`, {
        method: 'PUT',
      });
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ Server');
    }
  };

  const statusFlow = ['ใหม่', 'กำลังทำ', 'เสิร์ฟแล้ว', 'เสร็จสิ้น'];

  const getItemTotalPrice = (item) => {
    let extra = 0;
    if (item.options?.ขนาด === 'พิเศษ') extra += 10;
    if (item.options?.เพิ่มเติม) {
      if (item.options.เพิ่มเติม.includes('ห่อไข่')) extra += 10;
      if (item.options.เพิ่มเติม.includes('ไข่ดาว')) extra += 10;
      if (item.options.เพิ่มเติม.includes('ไข่เจียว')) extra += 10;
    }
    return (item.price + extra) * item.quantity;
  };

  const getOrderTotal = (order) => order.items.reduce((sum, item) => sum + getItemTotalPrice(item), 0);

  return (
    <div className="container kitchen-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h1 style={{ margin: 0 }}>หน้าครัว</h1>
        <button onClick={fetchHistory} style={{ background: '#2196F3', color: '#fff', border: 'none', borderRadius: 5, padding: '8px 18px', fontWeight: 600, cursor: 'pointer' }}>ดูประวัติ</button>
      </div>
      {!showHistory ? (
        <>
          <h2>ออเดอร์ปัจจุบัน</h2>
          <div className="order-list">
            {orders.length === 0 ? (<div className="no-orders">ยังไม่มีออเดอร์</div>) : (
              orders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <h3>#{order.id} โต๊ะ {order.tableNumber}</h3>
                    <span className={`status-badge status-${order.status}`}>{order.status}</span>
                  </div>
                  <ul className="item-list">
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        {getMenuName(item)}
                        {item.options?.เส้น ? ` (เส้น: ${item.options.เส้น})` : ''}
                        {item.options?.ขนาด ? ` (ขนาด: ${item.options.ขนาด})` : ''}
                        {item.options?.เพิ่มเติม?.length > 0 ? ` (เพิ่ม: ${item.options.เพิ่มเติม.join(', ')})` : ''}
                        {' '}x {item.quantity}
                      </li>
                    ))}
                  </ul>
                  <div className="order-footer">
                    <b>รวม {getOrderTotal(order)} บาท</b>
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      {statusFlow.indexOf(order.status) < statusFlow.length - 1 && (
                        <button className={`confirm-button${order.status === 'เสิร์ฟแล้ว' ? ' complete-button' : ''}`}
                          onClick={() => handleStatusChange(order, statusFlow[statusFlow.indexOf(order.status) + 1])}
                        >
                          {order.status === 'ใหม่' && 'เริ่มทำ'}
                          {order.status === 'กำลังทำ' && 'เสิร์ฟแล้ว'}
                          {order.status === 'เสิร์ฟแล้ว' && 'เสร็จสิ้น'}
                        </button>
                      )}
                      {order.status === 'ใหม่' && (
                        <button style={{ background: '#f44336', color: '#fff', border: 'none', borderRadius: 5, padding: '6px 16px', cursor: 'pointer' }} onClick={() => handleCancelOrder(order.id)}>
                          ยกเลิก
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 style={{ margin: 0 }}>ประวัติย้อนหลัง</h2>
            <button onClick={() => setShowHistory(false)} style={{ background: '#aaa', color: '#fff', border: 'none', borderRadius: 5, padding: '6px 16px', fontWeight: 600 }}>กลับ</button>
          </div>
          <div className="order-list">
            {history.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-header"><h3>#{order.id} โต๊ะ {order.tableNumber}</h3><span className={`status-badge status-${order.status}`}>{order.status}</span></div>
                <div style={{ fontSize: '1rem', color: '#888', marginBottom: 6 }}>สั่งเมื่อ: {new Date(order.createdAt).toLocaleString()}</div>
                <ul className="item-list">{order.items.map((item, idx) => (<li key={idx}>{getMenuName(item)}{' '}x {item.quantity}</li>))}</ul>
                <div className="order-footer"><b>รวม {getOrderTotal(order)} บาท</b></div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Kitchen;