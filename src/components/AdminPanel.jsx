import React, { useState, useEffect } from 'react';

function AdminPanel({ isDark, themeStyles, initialOrders }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState(initialOrders || []);
  const [activeTab, setActiveTab] = useState('products');

  // Стейтове за формата
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Електроника');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState(0); // НОВО: Пази избрания процент отстъпка (0, 10, 20...)
  const [image, setImage] = useState('');

  const [editingProductId, setEditingProductId] = useState(null);

  const fetchProducts = () => {
    fetch('http://localhost:3001/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetForm = () => {
    setName('');
    setCategory('Електроника');
    setPrice('');
    setDiscount(0);
    setImage('');
    setEditingProductId(null);
  };

  // Добавяне или Редактиране на продукт
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !price) return;

    const basePrice = Number(price);
    let finalPrice = basePrice;
    let computedOldPrice = null;
    let computedBadge = null;

    // Автоматично пресмятане, ако има избрана отстъпка
    if (discount > 0) {
      finalPrice = basePrice * (1 - discount / 100); // Новата по-ниска цена
      computedOldPrice = basePrice;                  // Старата по-висока цена
      computedBadge = `-${discount}%`;              // Автоматичен етикет
    }

    const productData = {
      name,
      category,
      price: Number(finalPrice.toFixed(2)),
      oldPrice: computedOldPrice ? Number(computedOldPrice.toFixed(2)) : null,
      badge: computedBadge,
      image: image.trim() || ""
    };

    if (editingProductId) {
      fetch(`http://localhost:3001/products/${editingProductId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })
      .then(res => {
        if (res.ok) {
          fetchProducts();
          resetForm();
        }
      });
    } else {
      fetch('http://localhost:3001/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      })
      .then(res => {
        if (res.ok) {
          fetchProducts();
          resetForm();
        }
      });
    }
  };

  // При натискане на Редактирай (Моливчето)
  const handleEditClick = (product) => {
    setEditingProductId(product.id);
    setName(product.name);
    setCategory(product.category);
    setImage(product.image || '');

    // Обратно изчисляване на първоначалната цена и процент за формата
    if (product.oldPrice) {
      setPrice(product.oldPrice);
      const computedDiscount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
      setDiscount(computedDiscount);
    } else {
      setPrice(product.price);
      setDiscount(0);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Сигурни ли сте, че искате да изтриете този продукт?')) {
      fetch(`http://localhost:3001/products/${id}`, { method: 'DELETE' })
        .then(res => {
          if (res.ok) fetchProducts();
        });
    }
  };

  const handleStatusChange = (orderId, newStatus) => {
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setOrders(updatedOrders);
    fetch(`http://localhost:3001/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    }).catch(err => console.error(err));
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
      <h1 style={{ marginBottom: '20px', textAlign: 'center' }}>🕵️‍♂️ SuperAdmin Конзола</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
        <button onClick={() => setActiveTab('products')} style={{ padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: activeTab === 'products' ? '#2563eb' : '#475569', color: 'white', border: 'none', borderRadius: '4px' }}>📦 Продукти</button>
        <button onClick={() => setActiveTab('orders')} style={{ padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: activeTab === 'orders' ? '#2563eb' : '#475569', color: 'white', border: 'none', borderRadius: '4px' }}>📋 Поръчки ({orders.length})</button>
        <button onClick={() => setActiveTab('dashboard')} style={{ padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: activeTab === 'dashboard' ? '#2563eb' : '#475569', color: 'white', border: 'none', borderRadius: '4px' }}>📊 Табло</button>
      </div>

      {activeTab === 'products' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
          
          {/* ОБНОВЕНА И ОЛЕКОТЕНА ФОРМА */}
          <form onSubmit={handleSubmit} style={{ backgroundColor: themeStyles.cardBg, padding: '20px', borderRadius: '8px', border: themeStyles.headerBorder, height: 'fit-content' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>{editingProductId ? '📝 Редактирай Продукт' : '➕ Добави Нов Продукт'}</h3>
            
            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold' }}>Име на продукта:</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isDark ? '#0f172a' : '#fff', color: themeStyles.color, boxSizing: 'border-box' }} required />
            </div>

            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold' }}>Категория:</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isDark ? '#0f172a' : '#fff', color: themeStyles.color }}>
                <option value="Електроника">Електроника</option>
                <option value="дрехи">Дрехи</option>
                <option value="раници">Раници</option>
                <option value="периферия">Периферия</option>
              </select>
            </div>

            {/* НОВАТА СЕКЦИЯ ЗА ЦЕНА И ПРОЦЕНТ НАМАЛЕНИЕ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold' }}>Цена на продукта (€):</label>
                <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="напр. 65" style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isDark ? '#0f172a' : '#fff', color: themeStyles.color, boxSizing: 'border-box' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold' }}>Намаление (Промоция):</label>
                <select value={discount} onChange={e => setDiscount(Number(e.target.value))} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isDark ? '#0f172a' : '#fff', color: themeStyles.color }}>
                  <option value={0}>❌ Няма (0%)</option>
                  <option value={10}>📉 -10% Отстъпка</option>
                  <option value={20}>📉 -20% Отстъпка</option>
                  <option value={30}>📉 -30% Отстъпка</option>
                  <option value={40}>📉 -40% Отстъпка</option>
                  <option value={50}>🔥 -50% На половина</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold' }}>URL адрес на снимка:</label>
              <input type="text" value={image} onChange={e => setImage(e.target.value)} placeholder="https://example.com/photo.jpg" style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isDark ? '#0f172a' : '#fff', color: themeStyles.color, boxSizing: 'border-box' }} />
            </div>

            <button type="submit" style={{ width: '100%', padding: '10px', marginTop: '20px', backgroundColor: editingProductId ? '#d97706' : '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
              {editingProductId ? '💾 Запази Промените' : '➕ Добави Продукт'}
            </button>

            {editingProductId && (
              <button type="button" onClick={resetForm} style={{ width: '100%', padding: '8px', marginTop: '8px', backgroundColor: '#64748b', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                Откажи Редакция
              </button>
            )}
          </form>

          {/* ТАБЛИЦА С ПРОДУКТИ */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: themeStyles.cardBg }}>
              <thead>
                <tr style={{ backgroundColor: themeStyles.tableHeaderBg, color: themeStyles.color }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Име</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Категория</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Цена</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Етикет</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px', color: themeStyles.color, fontWeight: '500' }}>{p.name}</td>
                    <td style={{ padding: '10px', color: themeStyles.color, textTransform: 'capitalize' }}>{p.category}</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                      {p.oldPrice && <div style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '11px' }}>{p.oldPrice} €</div>}
                      <div style={{ color: p.oldPrice ? '#ef4444' : '#2563eb' }}>{p.price} €</div>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      {p.badge && <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{p.badge}</span>}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button onClick={() => handleEditClick(p)} style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>✏️</button>
                        <button onClick={() => handleDelete(p.id)} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* ОСТАНАЛИТЕ ТАБОВЕ СИ СЕДЯТ СЪЩИТЕ */}
      {activeTab === 'orders' && (
        <div>
          <h3>📥 Списък с направени поръчки</h3>
          {orders.length === 0 ? <p style={{ marginTop: '10px' }}>Няма направени поръчки.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
              {orders.map((o, idx) => (
                <div key={idx} style={{ backgroundColor: themeStyles.cardBg, padding: '15px', borderRadius: '8px', border: themeStyles.headerBorder }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #475569', paddingBottom: '8px', marginBottom: '8px' }}>
                    <strong>📅 Дата: {o.date}</strong>
                    <div>
                      <span style={{ marginRight: '8px', fontSize: '13px' }}>Статус:</span>
                      <select value={o.status || 'Нова'} onChange={(e) => handleStatusChange(o.id, e.target.value)} style={{ padding: '4px', borderRadius: '4px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #475569' }}>
                        <option value="Нова">🆕 Нова</option>
                        <option value="Обработена">⚙️ Обработена</option>
                        <option value="Изпратена">🚚 Изпратена</option>
                        <option value="Завършена">✅ Завършена</option>
                      </select>
                    </div>
                  </div>
                  <p style={{ fontSize: '13px' }}><strong>📍 Клиент:</strong> {o.shipping_city}, {o.shipping_address} | 📞 Тел: {o.shipping_phone}</p>
                  <p style={{ fontSize: '13px' }}><strong>📦 Продукти:</strong> {o.items?.map(i => `${i.name} (${i.qty} бр.)`).join(', ')}</p>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#2563eb', marginTop: '5px' }}>💰 Обща сума: {o.total} €</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
          <div style={{ backgroundColor: '#10b981', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h2>{orders.reduce((sum, o) => sum + Number(o.total || 0), 0).toFixed(2)} €</h2>
            <p>Общ оборот от продажби</p>
          </div>
          <div style={{ backgroundColor: '#3b82f6', color: 'white', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <h2>{products.length}</h2>
            <p>Активни продукти в каталога</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;