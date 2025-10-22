import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Customer from './Customer';
import Kitchen from './Kitchen';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="nav-buttons">
          <Link to="/customer?table=1">
            <button>(โต๊ะ 1) </button>
          </Link>
          <Link to="/kitchen">
            <button>Order </button>
          </Link>
        </nav>
        
        <Routes>
          <Route path="/customer" element={<Customer />} />
          <Route path="/kitchen" element={<Kitchen />} />
          <Route path="/" element={<h2 className="text-center">กรุณาเลือกหน้าเพื่อทดสอบระบบ</h2>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;