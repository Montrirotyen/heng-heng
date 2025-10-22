import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5050');

function getMenuName(item, language = 'th') {
  if (language === 'en' && item.name_en) return item.name_en;
  if (language === 'cn' && item.name_cn) return item.name_cn;
  return item.name;
}

// ✅ ฟังก์ชันแสดงตัวเลือกพร้อมราคาเพิ่ม
function getOptionDisplay(item) {
  const options = item.options;
  let optionString = '';
  
  if (options?.['เส้น']) {
    optionString += `เส้น: ${options['เส้น']} `;
  }
  
  if (options?.['ขนาด']) {
    // แสดง +5 บาท ในตะกร้า
    const extraPrice = options['ขนาด'] === 'พิเศษ' ? ' (+5บ.)' : '';
    optionString += `ขนาด: ${options['ขนาด']}${extraPrice} `; 
  }
  
  if (options?.['เพิ่มเติม'] && options['เพิ่มเติม'].length > 0) {
    // แสดง +10 บาท ในตะกร้า
    const updatedExtras = options['เพิ่มเติม'].map(opt => {
        if (['ห่อไข่', 'ไข่ดาว', 'ไข่เจียว'].includes(opt)) {
            return `${opt} (+10บ.)`;
        }
        return opt;
    });
    optionString += `เพิ่มเติม: ${updatedExtras.join(', ')} `;
  }
  
  return optionString.trim();
}

// ✅ ฟังก์ชันคำนวณราคารวม (รวมราคาพิเศษและออปชั่นไข่)
const getItemTotalPrice = (item, menuItems) => {
    let extra = 0;
    
    // ขนาดพิเศษ +5 บาท
    if (item.options?.['ขนาด'] === 'พิเศษ') extra += 5; 
    
    // ออปชั่นไข่ +10 บาท ต่อรายการ
    if (item.options?.['เพิ่มเติม']) {
        if (item.options['เพิ่มเติม'].includes('ห่อไข่')) extra += 10;
        if (item.options['เพิ่มเติม'].includes('ไข่ดาว')) extra += 10;
        if (item.options['เพิ่มเติม'].includes('ไข่เจียว')) extra += 10;
    }
    const basePrice = menuItems.find(mi => mi.id === item.id)?.price || item.price;
    return (basePrice + extra) * item.quantity;
};

const getOrderTotal = (order, menuItems) => order.items.reduce((sum, item) => sum + getItemTotalPrice(item, menuItems), 0);

function Customer() {
  const [menuItems, setMenuItems] = useState([]);
  const [language, setLanguage] = useState('th');
  const [selectedItems, setSelectedItems] = useState([]);
  const [tableNumber, setTableNumber] = useState(null);
  const [tableOrders, setTableOrders] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [options, setOptions] = useState({เส้น: null, ขนาด: null, เพิ่มเติม: []});
  const [searchTerm, setSearchTerm] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); 
  const [showMobileCart, setShowMobileCart] = useState(false); 

  const menuCategories = [ 
    { key: 'all', name: 'ทั้งหมด' },
    { key: 'radna', name: 'ราดหน้า/ผัดซีอิ๊ว' },
    { key: 'a-la-carte', name: 'อาหารจานเดียว' },
    { key: 'drink', name: 'เครื่องดื่ม' },
  ];

  const location = useLocation();

  const handleIncreaseQty = (idx) => {
    setSelectedItems(items => items.map((item, i) => 
      i === idx ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  const handleDecreaseQty = (idx) => {
    setSelectedItems(items => items.map((item, i) => 
      i === idx ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
    ).filter(item => item.quantity > 0)); 
  };

  const handleRemoveItem = (idx) => {
    setSelectedItems(items => items.filter((_, i) => i !== idx));
  };
  
  const currentOrderTotal = selectedItems.reduce((sum, item) => sum + getItemTotalPrice(item, menuItems), 0);


  const toggleLanguage = () => {
    setLanguage(prevLang => {
      if (prevLang === 'th') return 'en';
      if (prevLang === 'en') return 'cn';
      return 'th';
    });
  };

  const handleOptionChange = (key, value, isMultiple = false) => {
    if (isMultiple) {
      setOptions(prev => {
        const currentArr = prev[key] || [];
        if (currentArr.includes(value)) {
          return { ...prev, [key]: currentArr.filter(v => v !== value) };
        } else {
          return { ...prev, [key]: [...currentArr, value] };
        }
      });
    } else {
      setOptions(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleOpenModal = (menuItem) => {
    setCurrentItem(menuItem);
    const defaultOptions = { เส้น: null, ขนาด: null, เพิ่มเติม: [] };
    if (menuItem.options?.['เส้น']?.length > 0) defaultOptions['เส้น'] = menuItem.options['เส้น'][0];
    if (menuItem.options?.['ขนาด']?.length > 0) defaultOptions['ขนาด'] = menuItem.options['ขนาด'][0];
    
    setOptions(defaultOptions);
    setShowModal(true);
  };

  const handleConfirmAdd = () => {
    const newItem = {
      ...currentItem,
      quantity: 1,
      options: options,
      name: currentItem.name, 
      name_en: currentItem.name_en,
      name_cn: currentItem.name_cn,
      price: currentItem.price,
      id: currentItem.id 
    };

    const existingItemIndex = selectedItems.findIndex(
      item => item.id === newItem.id && JSON.stringify(item.options) === JSON.stringify(newItem.options)
    );

    if (existingItemIndex > -1) {
      setSelectedItems(items => items.map((item, i) => 
        i === existingItemIndex ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setSelectedItems(prev => [...prev, newItem]);
    }
    
    setShowModal(false);
    setCurrentItem(null);
    setOptions({เส้น: null,ขนาด: null,เพิ่มเติม: []});
    setShowMobileCart(true); 
  };
  
  const handleOrderSubmit = async () => {
    if (selectedItems.length === 0 || isOrdering) return;
    setIsOrdering(true);
    try {
      const orderData = {
        tableNumber: tableNumber,
        items: selectedItems,
        total: currentOrderTotal,
        status: 'ใหม่'
      };

      const res = await fetch('http://localhost:5050/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
        setSelectedItems([]);
        setShowMobileCart(false);
        
        fetch(`http://localhost:5050/api/orders/table/${tableNumber}`)
          .then(res => res.json())
          .then(data => setTableOrders(data));
      } else {
        alert('เกิดข้อผิดพลาดในการส่งออเดอร์');
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsOrdering(false);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const nameMatches = 
      getMenuName(item, 'th').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.name_en && item.name_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.name_cn && item.name_cn.toLowerCase().includes(searchTerm.toLowerCase()));
      
    if (activeTab === 'all') return nameMatches;
    
    if (activeTab === 'radna') {
        return item.type === 'radna' && nameMatches;
    }
    if (activeTab === 'a-la-carte') {
        // เพิ่ม fried-rice ในกลุ่มอาหารจานเดียว
        return (item.type === 'a-la-carte' || item.type === 'fried-rice') && nameMatches; 
    }
    if (activeTab === 'drink') {
        return item.type === 'drink' && nameMatches;
    }
    return false;
  });

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const table = queryParams.get('table');
    setTableNumber(table);

    fetch('http://localhost:5050/api/menu')
      .then(res => res.json())
      .then(data => setMenuItems(data));
      
    if (table) {
      fetch(`http://localhost:5050/api/orders/table/${table}`)
        .then(res => res.json())
        .then(data => setTableOrders(data));
    }
    
    const handleTableCleared = (data) => {
      if (String(data.tableNumber) === String(table)) {
        setTableOrders(prev => prev.filter(order => order.id !== data.orderId));
      }
    };
    
    const handleNewOrder = (newOrder) => {
      if (String(newOrder.tableNumber) === String(table)) {
        setTableOrders(prevOrders => [newOrder, ...prevOrders]);
      }
    };

    const handleOrderUpdated = (updatedOrder) => {
      if (String(updatedOrder.tableNumber) === String(table)) {
        setTableOrders(prevOrders => prevOrders.map(order =>
          order.id === updatedOrder.id ? updatedOrder : order
        ));
      }
    };

    socket.on('table_cleared', handleTableCleared);
    socket.on('new_order', handleNewOrder);
    socket.on('order_updated', handleOrderUpdated);

    return () => {
      socket.off('table_cleared', handleTableCleared);
      socket.off('new_order', handleNewOrder);
      socket.off('order_updated', handleOrderUpdated);
    };
  }, [location.search]);


  return (
    <div className={`app customer-container ${tableNumber ? 'show' : ''}`} style={{ padding: 0 }}>
      
      {/* 1. Restaurant Header */}
      <div className="restaurant-header">
        <h1>
          <span style={{ color: 'red' }}>เฮงเฮง</span>{' '}
          <span style={{ color: 'green' }}>ราดหน้ายอดผัก</span>{' '}
          <span style={{ color: 'black' }}>สาขา เจริญนคร 14</span>
        </h1>
        {tableNumber && <h3 style={{ margin: '8px 0 0 0', color: '#666' }}>โต๊ะที่: {tableNumber}</h3>}
      </div>

      {/* 2. Layout หลัก: Menu Categories (ซ้าย/บน) + Menu Items (กลาง) + Selected Items (ขวา/Desktop) */}
      <div className="customer-main-layout"> 
        
        {/* Menu Categories: แถบหมวดหมู่ (ซ้ายบน Desktop / แนวนอนบน Mobile) */}
        <div className="menu-category-tabs">
          <h4 style={{marginTop: 0, marginBottom: 15, textAlign: 'center', color: 'var(--primary-color)'}}>หมวดหมู่</h4>
          {menuCategories.map(category => (
            <button
              key={category.key}
              className={`category-tab-button ${activeTab === category.key ? 'active' : ''}`}
              onClick={() => setActiveTab(category.key)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Menu Content: ส่วนแสดงรายการอาหาร */}
        <div className="menu-content">
          {/* Search Bar */}
          <input 
            type="text" 
            placeholder="ค้นหาเมนู..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="search-input"
          />

          {/* Menu Grid (2 ปุ่มต่อแถวสำหรับ Mobile/Tablet และ 3 ปุ่มสำหรับ Desktop) */}
          <div className="menu-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="menu-card" onClick={() => handleOpenModal(item)}>
                {/* โค้ดส่วนแสดงรูปภาพถูกนำออกแล้ว */}
                <div className="menu-info">
                  <div className="menu-name">{getMenuName(item, language)}</div>
                  {item.name !== getMenuName(item, language) && <div style={{ fontSize: '0.8rem', color: '#666' }}>{item.name}</div>}
                  <div className="menu-price">{item.price} บาท</div>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && <p className="text-center">ไม่พบเมนูที่ค้นหา</p>}
          </div>
        </div>

        {/* Selected Items Sidebar (Desktop Cart - แสดงบน Desktop เท่านั้น) */}
        {tableNumber && (selectedItems.length > 0 || tableOrders.length > 0) && (
          <div className="selected-items-sidebar show"> 
            <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: 10 }}>
              <h3>รายการสั่งซื้อ</h3>
              <button className="lang-toggle-btn" onClick={toggleLanguage}>
                {language === 'th' ? 'EN/CN' : (language === 'en' ? 'CN/TH' : 'TH/EN')}
              </button>
            </div>
            
            <ul className="selected-items-list">
              {selectedItems.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#888', marginTop: 15 }}>ยังไม่มีรายการ</p>
              ) : (
                selectedItems.map((item, idx) => (
                  <li key={idx} className="selected-item">
                    <div className="item-details">
                      <div style={{ fontWeight: 600 }}>{getMenuName(item, language)}</div>
                      <div style={{ fontSize: 13, color: '#666' }}>
                        {getOptionDisplay(item)}
                      </div>
                    </div>
                    <div className="item-controls-right">
                      <div style={{ fontSize: 13, color: '#444', fontWeight: 700, textAlign: 'right', marginBottom: 4 }}>
                        {getItemTotalPrice(item, menuItems)} บาท
                      </div>
                      <div className="item-controls">
                        <button className="control-btn minus" onClick={() => handleDecreaseQty(idx)}>-</button>
                        <span className="item-quantity">{item.quantity}</span>
                        <button className="control-btn plus" onClick={() => handleIncreaseQty(idx)}>+</button>
                        <button className="control-btn" style={{ background: '#bbb', marginLeft: 8 }} onClick={() => handleRemoveItem(idx)}>ลบ</button>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
            
            <div className="total-price" style={{ marginTop: 12, marginBottom: 12, textAlign: 'right', borderTop: '1px solid #eee', paddingTop: 10 }}>
              <b>รวม {currentOrderTotal} บาท</b>
            </div>
            
            <button onClick={handleOrderSubmit} className="order-button" disabled={isOrdering || selectedItems.length === 0}>
              {isOrdering ? 'กำลังส่ง...' : `ยืนยันการสั่งซื้อ (${selectedItems.length} รายการ)`}
            </button>
            
            {/* ออเดอร์ที่ถูกส่งไปแล้ว */}
            {tableOrders.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>ออเดอร์ที่สั่งไปแล้ว ({tableOrders.length})</h4>
                {tableOrders.map(order => (
                  <div key={order.id} style={{ padding: 8, border: '1px solid #ddd', borderRadius: 4, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <b>ออเดอร์ #{order.id}</b>
                      <span className={`status-badge status-${order.status === 'ใหม่' ? 'new' : order.status === 'กำลังทำ' ? 'inprogress' : 'completed'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>รวม {getOrderTotal(order, menuItems)} บาท</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      
      {/* Mobile Bottom Bar (Cart) - แสดงบน Mobile/Tablet เท่านั้น */}
      {tableNumber && (
        <div className={`selected-items-bottom-bar ${showMobileCart ? 'show' : ''}`}>
          <button 
            className="toggle-selected-btn" 
            onClick={() => setShowMobileCart(!showMobileCart)}
          >
            <span style={{ fontWeight: 600 }}>
              {showMobileCart ? '▲ ปิด' : '▼ เปิด'} รายการสั่งซื้อ ({selectedItems.length} รายการ) 
            </span>
            <span style={{ fontWeight: 700 }}>
                รวม {currentOrderTotal} บาท
            </span>
          </button>
          
          {/* รายละเอียดตะกร้าที่ถูกซ่อน/เปิด */}
          <div className="selected-items-content">
            <ul className="selected-items-list">
              {selectedItems.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#888', marginTop: 15 }}>ยังไม่มีรายการ</p>
              ) : (
                  selectedItems.map((item, idx) => (
                      <li key={idx} className="selected-item">
                          <div className="item-details">
                              <div style={{ fontWeight: 600 }}>{getMenuName(item, language)}</div>
                              <div style={{ fontSize: 13, color: '#666' }}>
                                  {getOptionDisplay(item)}
                              </div>
                          </div>
                          <div className="item-controls-right">
                              <div style={{ fontSize: 13, color: '#444', fontWeight: 700, textAlign: 'right', marginBottom: 4 }}>
                                  {getItemTotalPrice(item, menuItems)} บาท
                              </div>
                              <div className="item-controls">
                                  <button className="control-btn minus" onClick={() => handleDecreaseQty(idx)}>-</button>
                                  <span className="item-quantity">{item.quantity}</span>
                                  <button className="control-btn plus" onClick={() => handleIncreaseQty(idx)}>+</button>
                                  <button className="control-btn" style={{ background: '#bbb', marginLeft: 8 }} onClick={() => handleRemoveItem(idx)}>ลบ</button>
                              </div>
                          </div>
                      </li>
                  ))
              )}
            </ul>
            
            <div className="total-price" style={{ marginTop: 12, marginBottom: 12, textAlign: 'right', borderTop: '1px solid #eee', paddingTop: 10 }}>
              <b>รวม {currentOrderTotal} บาท</b>
            </div>
            
            <button onClick={handleOrderSubmit} className="order-button" disabled={isOrdering || selectedItems.length === 0}>
              {isOrdering ? 'กำลังส่ง...' : `ยืนยันการสั่งซื้อ (${selectedItems.length} รายการ)`}
            </button>
            
            {/* ออเดอร์ที่ถูกส่งไปแล้ว */}
            {tableOrders.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 10, borderTop: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>ออเดอร์ที่สั่งไปแล้ว ({tableOrders.length})</h4>
                {tableOrders.map(order => (
                  <div key={order.id} style={{ padding: 8, border: '1px solid #ddd', borderRadius: 4, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <b>ออเดอร์ #{order.id}</b>
                      <span className={`status-badge status-${order.status === 'ใหม่' ? 'new' : order.status === 'กำลังทำ' ? 'inprogress' : 'completed'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>รวม {getOrderTotal(order, menuItems)} บาท</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      {/* Modal for Item Options */}
      {showModal && currentItem && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{getMenuName(currentItem, language)} ({currentItem.price} บาท)</h3>
            
            {/* Option: เลือกเส้น */}
            {currentItem.options?.['เส้น']?.length > 0 && (
              <div className="option-group">
                <label>เลือกเส้น:</label>
                <div>
                  {currentItem.options['เส้น'].map(opt => (
                    <button
                      key={opt}
                      className={options['เส้น'] === opt ? 'selected' : ''}
                      onClick={() => handleOptionChange('เส้น', opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Option: เลือกขนาด */}
            {currentItem.options?.['ขนาด']?.length > 0 && (
              <div className="option-group">
                <label>เลือกขนาด:</label>
                <div>
                  {currentItem.options['ขนาด'].map(opt => (
                    <button
                      key={opt}
                      className={options['ขนาด'] === opt ? 'selected' : ''}
                      onClick={() => handleOptionChange('ขนาด', opt)}
                    >
                      {opt}
                      {/* แสดง +5 บาท ในปุ่มขนาดพิเศษ */}
                      {opt === 'พิเศษ' && ' +5 บาท'} 
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Option: เพิ่มเติม */}
            {currentItem.options?.['เพิ่มเติม']?.length > 0 && (
              <div className="option-group">
                <label>เพิ่มเติม (เลือกได้หลายรายการ):</label>
                <div>
                  {currentItem.options['เพิ่มเติม'].map(opt => (
                    <button
                      key={opt}
                      className={options['เพิ่มเติม']?.includes(opt) ? 'selected' : ''}
                      onClick={() => handleOptionChange('เพิ่มเติม', opt, true)}
                    >
                      {opt}
                      {/* แสดง +10 บาท ในปุ่มออปชั่นไข่ */}
                      {['ห่อไข่', 'ไข่ดาว', 'ไข่เจียว'].includes(opt) && ' +10 บาท'} 
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <button 
                onClick={handleConfirmAdd} 
                className="order-button" 
                style={{ marginTop: 15, background: '#1976D2' }}
                disabled={
                    (currentItem.options?.['เส้น']?.length > 0 && options['เส้น'] === null) ||
                    (currentItem.options?.['ขนาด']?.length > 0 && options['ขนาด'] === null)
                }
            >
              เพิ่มลงในรายการสั่งซื้อ
            </button>
          </div>
        </div>
      )}

      {/* Popup for Order Confirmation */}
      {showPopup && (
        <div className="modal-overlay" onClick={() => setShowPopup(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--primary-color)' }}>✅ สั่งซื้อสำเร็จ!</h3>
            <p>รายการสั่งซื้อของคุณได้ถูกส่งไปยังห้องครัวแล้ว</p>
            <p style={{ fontSize: 14, color: '#888' }}>กรุณารออาหารสักครู่</p>
            <button onClick={() => setShowPopup(false)} className="order-button" style={{ marginTop: 15 }}>
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customer;