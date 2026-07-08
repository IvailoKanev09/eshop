import React, { useState, useEffect } from 'react';
import './App.css';

// Импортираме компонентите от папката components
import ProductCard from './components/ProductCard';
import AdminPanel from './components/AdminPanel'; 

// Импортираме снимките(папка assets)
import shoesImg from './assets/shoes.jpg';
import jacketImg from './assets/jacket+pants.jpg';
import watchImg from './assets/watchgt6.jpg';
import bagImg from './assets/jordan_bag.jpg';
import headphonesImg from './assets/headphones.jpg';
import mouseImg from './assets/mouse.jpg';

function App() {
  const [products, setProducts] = useState([]); 
  const [cartItems, setCartItems] = useState([]); 
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('всички');
  const [theme, setTheme] = useState('dark'); 
  const [sortBy, setSortBy] = useState('default'); // Стейт за критерия на сортиране

  // --- СЪСТОЯНИЕ ЗА ДЕТАЙЛНА СТРАНИЦА (ТИП ТЕХНОПОЛИС) ---
  const [selectedProduct, setSelectedProduct] = useState(null);

  // --- СЪСТОЯНИЯ ЗА НОВ ОТЗИВ ---
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // --- СЪСТОЯНИЕ ЗА SUPERADMIN ---
  const [isAdminMode, setIsAdminMode] = useState(false); 
  const [showAdminButton, setShowAdminButton] = useState(false); // Скрит по подразбиране

  // --- СЪСТОЯНИЯ ЗА ПОРЪЧКАТА ---
  const [promoInput, setPromoInput] = useState(''); 
  const [appliedDiscount, setAppliedDiscount] = useState(0); 
  const [promoError, setPromoError] = useState(''); 
  const [promoSuccess, setPromoSuccess] = useState(''); 
  
  const [shippingMethod, setShippingMethod] = useState('econt'); 
  const [paymentMethod, setPaymentMethod] = useState('cash'); 
  const [orderComment, setOrderComment] = useState('');

  // ДИНАМИЧНИ СТЕЙТОВЕ ЗА АДРЕС, ГРАД И ТЕЛЕФОН
  const [shippingCity, setShippingCity] = useState('');
  const [shippingDetails, setShippingDetails] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');

  // --- НАЧАЛО НА НОВИТЕ СТЕЙТОВЕ (ТОП ЕКСТРИ) ---
  const [wishlist, setWishlist] = useState([]); // Списък с любими продукти
  const [orders, setOrders] = useState([]); // Заредени поръчки за Admin Dashboard-а
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  // --- КРАЙ НА НОВИТЕ СТЕЙТОВЕ ---

  const BGN_RATE = 1.95583;
  
  // Функции за форматиране до два знака след запетая (__,00)
  const formatEUR = (eur) => Number(eur).toFixed(2);
  const toBGN = (eur) => (eur * BGN_RATE).toFixed(2);

  // Функция за показване на Toast известия (заместващая alert)
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Слушател за тайна клавишна комбинация (Ctrl + Shift + A)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setShowAdminButton(prev => !prev); 
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Връзка с json-server бекенда за продукти и поръчки
  useEffect(() => {
    fetch('http://localhost:3001/products')
      .then(response => response.json())
      .then(data => {
        const updatedData = data.map(product => {
          // Ако в базата има реален уеб линк към снимка, го запазваме директно!
          if (product.image && (product.image.startsWith('http://') || product.image.startsWith('https://'))) {
            return product;
          }
          // Fallback към локалните активи за първите 6 продукта
          if (product.id === "1") return { ...product, image: shoesImg };      
          if (product.id === "2") return { ...product, image: jacketImg };     
          if (product.id === "3") return { ...product, image: watchImg };      
          if (product.id === "4") return { ...product, image: bagImg };       
          if (product.id === "5") return { ...product, image: headphonesImg }; 
          if (product.id === "6") return { ...product, image: mouseImg };      
          return { ...product, image: product.image || shoesImg }; 
        });
        setProducts(updatedData);
      })
      .catch(error => console.error("Грешка при зареждане на продукти:", error));

    // Зареждаме поръчките, за да може Admin панелът да има актуално инфо за Dashboard-а
    fetch('http://localhost:3001/orders')
      .then(response => response.json())
      .then(data => setOrders(data))
      .catch(error => console.error("Грешка при зареждане на поръчки:", error));
  }, []);

  const handleAddToCart = (product) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
    showToast(`"${product.name}" е добавен в количката! 🛒`, 'success');
  };

  // Функция за добавяне/премахване от любими (Wishlist)
  const toggleWishlist = (product, e) => {
    if (e) e.stopPropagation(); // Спира отварянето на детайлната страница при клик на сърцето
    if (wishlist.some(item => item.id === product.id)) {
      setWishlist(wishlist.filter(item => item.id !== product.id));
      showToast('Премахнато от Любими 💔', 'error');
    } else {
      setWishlist([...wishlist, product]);
      showToast('Добавено в Любими! ❤️', 'success');
    }
  };

  // ФУНКЦИЯ ЗА ДОБАВЯНЕ НА РЕАЛЕН ОТЗИВ В БАЗАТА (PUT)
  const handleAddReview = (e) => {
    e.preventDefault();
    if (!reviewAuthor.trim() || !reviewComment.trim()) {
      showToast('Моля, попълнете име и коментар!', 'error');
      return;
    }

    const newReview = {
      author: reviewAuthor.trim(),
      rating: Number(reviewRating),
      comment: reviewComment.trim()
    };

    // Взимаме досегашните отзиви или правим нов масив, ако няма такива
    const currentReviews = selectedProduct.reviews || [];
    const updatedReviews = [...currentReviews, newReview];

    // Създаваме обновения обект на продукта за базата данни
    const updatedProduct = { ...selectedProduct, reviews: updatedReviews };

    fetch(`http://localhost:3001/products/${selectedProduct.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProduct)
    })
    .then(response => {
      if (response.ok) {
        showToast('Благодарим за отзива! ⭐', 'success');
        // Обновяваме локалните стейтове веднага на екрана
        setSelectedProduct(updatedProduct);
        setProducts(products.map(p => p.id === selectedProduct.id ? updatedProduct : p));
        // Изчистваме полетата на формата
        setReviewAuthor('');
        setReviewComment('');
        setReviewRating(5);
      } else {
        showToast('Грешка при запис на отзива.', 'error');
      }
    })
    .catch(err => {
      console.error(err);
      showToast('Няма връзка със сървъра.', 'error');
    });
  };

  const updateCartQuantity = (productId, amount) => {
    setCartItems(cartItems.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + amount;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
    showToast('Продуктът е премахнат от количката.', 'error');
  };

  const handleApplyPromo = () => {
    if (promoInput.trim().toUpperCase() === 'PROMO10') {
      setAppliedDiscount(0.10); 
      setPromoSuccess('Кодът е приложен! Получавате 10% отстъпка.');
      setPromoError('');
      showToast('Промокодът е приложен успешно! 🎉', 'success');
    } else {
      setPromoError('Невалиден или изтекъл промокод!');
      setPromoSuccess('');
      showToast('Грешен промокод!', 'error');
    }
  };

  // Изчисления на сумите
  const productsTotalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = productsTotalPrice * appliedDiscount;
  const priceAfterDiscount = productsTotalPrice - discountAmount;

  // Точни такси за доставка според условията
  let shippingFee = 0;
  if (shippingMethod === 'boxnow') {
    shippingFee = 0; 
  } else if (shippingMethod === 'address') {
    shippingFee = 6.00; 
  } else {
    shippingFee = priceAfterDiscount < 120 ? 4.00 : 0;
  }

  const codFee = paymentMethod === 'cash' ? 2.20 : 0;
  const finalOrderTotal = priceAfterDiscount + shippingFee + codFee;

  const handleCheckout = () => {
    if (!shippingCity.trim() || !shippingDetails.trim() || !shippingPhone.trim()) {
      showToast('Моля, попълнете град, адрес/офис и телефон!', 'error');
      return;
    }

    const phoneRegex = /^08[0-9]{8}$/;
    if (!phoneRegex.test(shippingPhone.trim())) {
      showToast('Невалиден телефон! Трябва да е 10 цифри и да започва с 08...', 'error');
      return;
    }

    const newOrder = {
      date: new Date().toLocaleString('bg-BG'),
      status: 'Нова', 
      items: cartItems.map(item => ({ name: item.name, price: item.price, qty: item.quantity })),
      subtotal: formatEUR(productsTotalPrice),
      discount: formatEUR(discountAmount),
      shipping_method: 
        shippingMethod === 'econt' ? 'Еконт офис' : 
        shippingMethod === 'speedy' ? 'Спиди офис' : 
        shippingMethod === 'boxnow' ? 'BOX NOW автомат' : 'До адрес',
      shipping_cost: formatEUR(shippingFee),
      shipping_city: shippingCity,
      shipping_address: shippingDetails,
      shipping_phone: shippingPhone,
      payment_method: paymentMethod === 'cash' ? 'Наложен платеж' : 'Плащане с карта',
      cod_fee: formatEUR(codFee), 
      comment: orderComment,
      total: formatEUR(finalOrderTotal)
    };

    fetch('http://localhost:3001/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    })
      .then(response => {
        if (response.ok) {
          showToast(`Поръчката е приета! Обща сума: ${formatEUR(finalOrderTotal)} €`, 'success');
          setOrders(prev => [...prev, newOrder]);
          
          setCartItems([]);
          setIsCartOpen(false);
          setAppliedDiscount(0);
          setPromoInput('');
          setPromoSuccess('');
          setOrderComment('');
          setShippingCity('');
          setShippingDetails('');
          setShippingPhone('');
        } else {
          showToast('Възникна проблем при изпращането.', 'error');
        }
      })
      .catch(error => {
        console.error("Грешка при поръчка:", error);
        showToast('Няма връзка със сървъра.', 'error');
      });
  };

  // Филтриране на продуктите по търсене, категория и ЛЮБИМИ
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategory === 'любими') {
      return matchesSearch && wishlist.some(item => item.id === product.id);
    }
    
    const matchesCategory = selectedCategory === 'всички' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Сортиране на филтрираните продукти според избраната опция
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price; 
    if (sortBy === 'price-desc') return b.price - a.price; 
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name); 
    return 0; 
  });

  const isDark = theme === 'dark';
  const themeStyles = {
    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    color: isDark ? '#f8fafc' : '#0f172a',
    cardBg: isDark ? '#1e293b' : '#ffffff',
    cardBorder: isDark ? 'none' : '1px solid #e2e8f0',
    headerBg: isDark ? '#1e293b' : '#ffffff',
    headerBorder: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    tableHeaderBg: isDark ? '#334155' : '#e2e8f0'
  };

  return (
    <div className="app-container" style={{ backgroundColor: themeStyles.backgroundColor, color: themeStyles.color, minHeight: '100vh', transition: 'all 0.3s ease' }}>
      
      {/* Шапка */}
      <header className="app-header" style={{ backgroundColor: themeStyles.headerBg, borderBottom: themeStyles.headerBorder }}>
        <h2 className="logo" style={{ color: themeStyles.color, fontWeight: '700', letterSpacing: '0.5px', cursor: 'pointer' }} onClick={() => setSelectedProduct(null)}>
          Vibe<span style={{ color: '#2563eb' }}>Grid</span>
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          
          {showAdminButton && (
            <button 
              onClick={() => {
                setIsAdminMode(!isAdminMode);
                setSelectedProduct(null); 
              }}
              style={{
                padding: '8px 14px',
                backgroundColor: isAdminMode ? '#ef4444' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                animation: 'pulse 1.5s infinite'
              }}
            >
              {isAdminMode ? '🛒 Към Магазина' : '🕵️‍♂️ SuperAdmin'}
            </button>
          )}

          {/* Брояч за любими продукти в хедъра (цъкането му праща в категория Любими) */}
          {!isAdminMode && (
            <div 
              onClick={() => { setSelectedProduct(null); setSelectedCategory('любими'); }}
              style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', backgroundColor: selectedCategory === 'любими' ? '#ef444422' : 'transparent', padding: '6px 10px', borderRadius: '20px', transition: '0.2s' }}
            >
              ❤️ <span style={{ fontWeight: 'bold' }}>{wishlist.length}</span>
            </div>
          )}

          <button 
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            style={{
              background: 'none', border: isDark ? '1px solid #475569' : '1px solid #cbd5e1', borderRadius: '50%',
              width: '40px', height: '40px', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: isDark ? '#334155' : '#f1f5f9'
            }}
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {!isAdminMode && (
            <button className="cart-toggle-btn" onClick={() => setIsCartOpen(!isCartOpen)}>
              🛒 Количка <span className="cart-badge">{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</span>
            </button>
          )}
        </div>
      </header>
      
      {isAdminMode ? (
        <main className="main-content">
          <AdminPanel isDark={isDark} themeStyles={themeStyles} initialOrders={orders} />
        </main>
      ) : (
        /* ПОТРЕБИТЕЛСКИ МАГАЗИН */
        <main className="main-content">
          
          {selectedProduct ? (
            /* --- СТРАНИЦА ЗА ДЕТАЙЛИ НА ПРОДУКТ --- */
            <div className="product-details-page">
              <button className="back-btn" onClick={() => setSelectedProduct(null)}>
                ⬅ Назад към продуктите
              </button>

              <div className="details-container">
                <div className="details-left" style={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', border: themeStyles.headerBorder, position: 'relative' }}>
                  <button 
                    onClick={(e) => toggleWishlist(selectedProduct, e)}
                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
                  >
                    {wishlist.some(item => item.id === selectedProduct.id) ? '❤️' : '🤍'}
                  </button>
                  <img src={selectedProduct.image} alt={selectedProduct.name} />
                </div>

                <div className="details-right">
                  <span className="details-category">{selectedProduct.category}</span>
                  <h1 style={{ color: themeStyles.color }}>{selectedProduct.name}</h1>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', margin: '5px 0 15px 0', color: '#fbbf24', fontSize: '18px' }}>
                    <span>⭐⭐⭐⭐⭐</span>
                    <span style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>
                      ({selectedProduct.reviews ? selectedProduct.reviews.length : 0} отзива)
                    </span>
                  </div>

                  <div className="details-price-block">
                    <span className="details-price">{formatEUR(selectedProduct.price)} €</span>
                    <span className="details-price-bgn">/ {toBGN(selectedProduct.price)} лв.</span>
                  </div>
                  
                  <p className="details-description" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                    {selectedProduct.description || "Продуктът е част от ексклузивния каталог на VibeGrid. Изработен от висококачествени материали с гаранция за надеждност, оригинален стил и максимален комфорт за ежедневно ползване."}
                  </p>

                  <button 
                    className="details-buy-btn"
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      setIsCartOpen(true); 
                    }}
                  >
                    КУПИ
                  </button>

                  {/* СЕКЦИЯ С НАПЪЛНО ДИНАМИЧНИ ОТЗИВИ */}
                  <div style={{ marginTop: '30px', borderTop: isDark ? '1px solid #334155' : '1px solid #e2e8f0', paddingTop: '20px' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>
                      💬 Клиентски отзиви ({selectedProduct.reviews ? selectedProduct.reviews.length : 0}):
                    </h3>
                    
                    {selectedProduct.reviews && selectedProduct.reviews.length > 0 ? (
                      selectedProduct.reviews.map((review, index) => (
                        <div key={index} style={{ 
                          padding: '10px', 
                          borderRadius: '6px', 
                          backgroundColor: isDark ? '#1e293b' : '#f1f5f9', 
                          fontSize: '13px', 
                          marginBottom: '10px',
                          border: isDark ? '1px solid #334155' : '1px solid #e2e8f0'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span style={{ color: '#10b981' }}>{review.author}</span>
                            <span style={{ color: '#fbbf24' }}>
                              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                            </span>
                          </div>
                          <p style={{ margin: '4px 0 0 0', color: isDark ? '#cbd5e1' : '#334155' }}>
                            {review.comment}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b', fontStyle: 'italic', marginBottom: '20px' }}>
                        Все още няма отзиви за този продукт. Бъдете първият купувач!
                      </p>
                    )}

                    {/* ФОРМА ЗА ОСТАВЯНЕ НА НОВ ОТЗИВ */}
                    <form onSubmit={handleAddReview} style={{ marginTop: '20px', padding: '15px', borderRadius: '8px', backgroundColor: isDark ? '#0f172a' : '#fff', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>✍️ Остави твоя отзив:</h4>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                          <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: 'bold' }}>Твоето име:</label>
                          <input 
                            type="text" placeholder="напр. Георги В." value={reviewAuthor} onChange={(e) => setReviewAuthor(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isDark ? '#1e293b' : '#fff', color: themeStyles.color, boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: 'bold' }}>Оценка:</label>
                          <select 
                            value={reviewRating} onChange={(e) => setReviewRating(e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isDark ? '#1e293b' : '#fff', color: themeStyles.color, cursor: 'pointer' }}
                          >
                            <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                            <option value="4">⭐⭐⭐⭐ (4)</option>
                            <option value="3">⭐⭐⭐ (3)</option>
                            <option value="2">⭐⭐ (2)</option>
                            <option value="1">⭐ (1)</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '11px', marginBottom: '4px', fontWeight: 'bold' }}>Коментар:</label>
                        <textarea 
                          placeholder="Сподели мнението си за качеството, доставката..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                          style={{ width: '100%', height: '60px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isDark ? '#1e293b' : '#fff', color: themeStyles.color, resize: 'none', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                        />
                      </div>
                      <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                        Изпрати отзив
                      </button>
                    </form>

                  </div>

                </div>
              </div>
            </div>
          ) : (
            /* --- ГЛАВНА СТРАНИЦА НА МАГАЗИНА --- */
            <>
              <div className="hero-section">
                <h1 style={{ color: themeStyles.color }}>Твоят стил. Твоят избор.</h1>
                <p style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Открий най-актуалните предложения за сезона.</p>
              </div>

              <div className="search-container">
                <input 
                  type="text" placeholder="Търси любима марка..." value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} className="search-input"
                  style={{ backgroundColor: themeStyles.cardBg, color: themeStyles.color, border: isDark ? '1px solid #334155' : '1px solid #cbd5e1' }}
                />
              </div>

              {/* ТАБОВЕ ЗА КАТЕГОРИИ С ВКЛЮЧЕНА КАТЕГОРИЯ "ЛЮБИМИ" */}
              <div className="categories-container" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
                {['всички', 'Електроника', 'Дрехи', 'Раници', 'Периферия', 'Любими'].map(category => (
                  <button 
                    key={category} onClick={() => setSelectedCategory(category)}
                    style={{
                      padding: '10px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', textTransform: 'capitalize',
                      backgroundColor: selectedCategory === category ? (category === 'любими' ? '#ef4444' : '#2563eb') : (isDark ? '#1e293b' : '#e2e8f0'),
                      color: selectedCategory === category ? 'white' : themeStyles.color
                    }}
                  >
                    {category === 'любими' ? '❤️ Любими' : category}
                  </button>
                ))}
              </div>

              {/* МЕНЮ ЗА СОРТИРАНЕ НА ПРОДУКТИТЕ */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: '1200px', margin: '0 auto 20px auto', padding: '0 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Сортирай по:</label>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
                      backgroundColor: themeStyles.cardBg, color: themeStyles.color, cursor: 'pointer', fontSize: '13px', fontWeight: '500'
                    }}
                  >
                    <option value="default">Препоръчани (По подразбиране)</option>
                    <option value="price-asc">Цена: Ниска към Висока 📈</option>
                    <option value="price-desc">Цена: Висока към Ниска 📉</option>
                    <option value="name-asc">Име: А-Я 🔤</option>
                  </select>
                </div>
              </div>
              
              <div className="products-grid">
                {sortedProducts.length > 0 ? (
                  sortedProducts.map(product => (
                    <div key={product.id} onClick={() => setSelectedProduct(product)} style={{ cursor: 'pointer', position: 'relative' }}>
                      <button 
                        onClick={(e) => toggleWishlist(product, e)}
                        style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', zIndex: '10', cursor: 'pointer' }}
                      >
                        {wishlist.some(item => item.id === product.id) ? '❤️' : '🤍'}
                      </button>
                      <ProductCard 
                        product={product}
                        isDark={isDark}
                        themeStyles={themeStyles}
                        onAddToCart={handleAddToCart}
                      />
                    </div>
                  ))
                ) : (
                  <p style={{ gridColumn: '1 / -1', textAlign: 'center', fontStyle: 'italic', color: isDark ? '#94a3b8' : '#64748b', marginTop: '20px' }}>
                    {selectedCategory === 'любими' ? 'Все още нямате добавени любими продукти.' : 'Няма намерени продукти по зададените критерии.'}
                  </p>
                )}
              </div>
            </>
          )}
        </main>
      )}

      {/* КОЛИЧКА */}
      {!isAdminMode && isCartOpen && (
        <div className="side-cart" style={{ backgroundColor: themeStyles.cardBg, borderLeft: themeStyles.headerBorder, width: '480px', overflowY: 'auto' }}>
          <div>
            <div className="cart-header">
              <h3 style={{ color: themeStyles.color }}>Твоята количка</h3>
              <button className="close-cart-btn" onClick={() => setIsCartOpen(false)} style={{ color: themeStyles.color }}>✕</button>
            </div>
            
            {cartItems.length === 0 ? (
              <p className="empty-cart-msg">Количката ти все още е празна</p>
            ) : (
              <>
                <div style={{ overflowX: 'auto', marginTop: '15px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: themeStyles.tableHeaderBg, color: themeStyles.color }}>
                        <th style={{ padding: '8px' }}>Продукт</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Ед. цена</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Брой</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Сума</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item) => (
                        <tr key={item.id} style={{ borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px 8px', color: themeStyles.color, fontWeight: '500', maxWidth: '110px', wordBreak: 'break-word' }}>{item.name}</td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', color: themeStyles.color, whiteSpace: 'nowrap' }}>
                            <div>{formatEUR(item.price)} €</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{toBGN(item.price)} лв.</div>
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <button onClick={() => updateCartQuantity(item.id, -1)} style={{ width: '20px', height: '20px', border: '1px solid #cbd5e1', cursor: 'pointer', borderRadius: '3px' }}>-</button>
                              <span style={{ fontWeight: 'bold', minWidth: '12px', color: themeStyles.color }}>{item.quantity}</span>
                              <button onClick={() => updateCartQuantity(item.id, 1)} style={{ width: '20px', height: '20px', border: '1px solid #cbd5e1', cursor: 'pointer', borderRadius: '3px' }}>+</button>
                            </div>
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'center', fontWeight: 'bold', color: themeStyles.color, whiteSpace: 'nowrap' }}>
                            <div>{formatEUR(item.price * item.quantity)} €</div>
                            <div style={{ fontSize: '11px', fontWeight: 'normal', color: '#94a3b8' }}>{toBGN(item.price * item.quantity)} лв.</div>
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                            <button onClick={() => handleRemoveFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '20px', padding: '12px', borderRadius: '6px', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Добави ваучер/промокод:</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" placeholder="Въведи тук (напр. PROMO10)..." value={promoInput} 
                      onChange={(e) => setPromoInput(e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isDark ? '#0f172a' : '#fff', color: themeStyles.color }}
                    />
                    <button onClick={handleApplyPromo} style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Приложи</button>
                  </div>
                  {promoError && <p style={{ color: '#ef4444', fontSize: '12px', margin: '5px 0 0 0' }}>{promoError}</p>}
                  {promoSuccess && <p style={{ color: '#10b981', fontSize: '12px', margin: '5px 0 0 0' }}>{promoSuccess}</p>}
                </div>

                {/* ИЗБОР НА ДОСТАВКА */}
                <div style={{ marginTop: '15px', padding: '12px', borderRadius: '6px', backgroundColor: isDark ? '#1e293b' : '#f8fafc', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', borderBottom: '1px solid #475569', paddingBottom: '4px' }}>🚚 Изберете метод на доставка:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="radio" name="shipping" value="boxnow" checked={shippingMethod === 'boxnow'} onChange={() => setShippingMethod('boxnow')} style={{ accentColor: '#ff6b00' }} />
                      <span>🟩 BOX NOW автомат (<span style={{ color: '#10b981', fontWeight: 'bold' }}>БЕЗПЛАТНО</span>)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="radio" name="shipping" value="econt" checked={shippingMethod === 'econt'} onChange={() => setShippingMethod('econt')} style={{ accentColor: '#ff6b00' }} />
                      <span>Еконт – Офис и Еконтомати (<span style={{ color: '#10b981', fontWeight: 'bold' }}>FREE над 120€</span>)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="radio" name="shipping" value="speedy" checked={shippingMethod === 'speedy'} onChange={() => setShippingMethod('speedy')} style={{ accentColor: '#ff6b00' }} />
                      <span>Спиди – Офиси и Автомати (<span style={{ color: '#10b981', fontWeight: 'bold' }}>FREE над 120€</span>)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="radio" name="shipping" value="address" checked={shippingMethod === 'address'} onChange={() => setShippingMethod('address')} style={{ accentColor: '#ff6b00' }} />
                      <span>До адрес (+6.00 € фиксирана такса)</span>
                    </label>
                  </div>
                </div>

                {/* ДАННИ ЗА ДОСТАВКА */}
                <div style={{ marginTop: '15px', padding: '12px', borderRadius: '6px', backgroundColor: isDark ? '#1e293b' : '#f8fafc', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', borderBottom: '1px solid #475569', paddingBottom: '4px' }}>📍 Данни за доставка:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Град / Населено място:</label>
                      <input 
                        type="text" placeholder="напр. София" value={shippingCity} onChange={(e) => setShippingCity(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isDark ? '#0f172a' : '#fff', color: themeStyles.color, boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {shippingMethod === 'address' ? 'Точен адрес (улица, номер, бл., ап.):' : `Име или код на ${shippingMethod === 'boxnow' ? 'BOX NOW автомат' : shippingMethod === 'econt' ? 'офис на Еконт' : 'офис на Спиди'}:`}
                      </label>
                      <input 
                        type="text" placeholder={shippingMethod === 'address' ? "ул. Иван Вазов №10, ет. 2" : "офис Централен / автомат №123"} value={shippingDetails} onChange={(e) => setShippingDetails(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isDark ? '#0f172a' : '#fff', color: themeStyles.color, boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Телефон за връзка:</label>
                      <input 
                        type="tel" placeholder="напр. 0888123456" value={shippingPhone} onChange={(e) => setShippingPhone(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isDark ? '#0f172a' : '#fff', color: themeStyles.color, boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                </div>

                {/* НАЧИН НА ПЛАЩАНЕ */}
                <div style={{ marginTop: '15px', padding: '12px', borderRadius: '6px', backgroundColor: isDark ? '#1e293b' : '#f8fafc', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', borderBottom: '1px solid #475569', paddingBottom: '4px' }}>💳 Начин на плащане:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="radio" name="payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} style={{ accentColor: '#ff6b00' }} />
                      <span>Наложен платеж (плащане при получаване)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} style={{ accentColor: '#ff6b00' }} />
                      <span>Плащане с карта (Visa / MasterCard)</span>
                    </label>
                  </div>
                </div>

                {/* КОМЕНТАР */}
                <div style={{ marginTop: '15px', padding: '12px', borderRadius: '6px', backgroundColor: isDark ? '#1e293b' : '#f8fafc', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', borderBottom: '1px solid #475569', paddingBottom: '4px' }}>💬 Добави коментар:</h4>
                  <textarea 
                    placeholder="Напиши коментар тук (напр. изисквания за доставка)..." value={orderComment} onChange={(e) => setOrderComment(e.target.value)}
                    style={{ width: '100%', height: '70px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: isDark ? '#0f172a' : '#fff', color: themeStyles.color, resize: 'none', fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="cart-total-section" style={{ borderTop: isDark ? '1px solid #334155' : '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '20px' }}>
              
              {shippingMethod !== 'boxnow' && shippingMethod !== 'address' && (
                <div style={{ marginBottom: '12px', padding: '10px', borderRadius: '6px', backgroundColor: isDark ? '#1e293b' : '#f1f5f9', border: '1px solid #cbd5e1' }}>
                  {priceAfterDiscount < 120 ? (
                    <>
                      <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '500', color: themeStyles.color }}>
                        Добави още <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{formatEUR(120 - priceAfterDiscount)} €</span> за <span style={{ fontWeight: 'bold' }}>БЕЗПЛАТНА</span> доставка!
                      </p>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min((priceAfterDiscount / 120) * 100, 100)}%`, height: '100%', backgroundColor: '#2563eb', transition: 'width 0.4s ease' }}></div>
                      </div>
                    </>
                  ) : (
                    <p style={{ margin: '0', fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}>
                      Поздравления! Имате безплатна доставка до офис!
                    </p>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>
                <span>Междинна сума:</span>
                <span>{formatEUR(productsTotalPrice)} € ({toBGN(productsTotalPrice)} лв.)</span>
              </div>
              
              {appliedDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#10b981', fontWeight: '500' }}>
                  <span>Отстъпка (10%):</span>
                  <span>-{formatEUR(discountAmount)} € (-{toBGN(discountAmount)} лв.)</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: shippingFee > 0 ? '#ef4444' : '#10b981' }}>
                <span>Доставка:</span>
                <span>{shippingFee > 0 ? `${formatEUR(shippingFee)} € (${toBGN(shippingFee)} лв.)` : 'БЕЗПЛАТНА'}</span>
              </div>

              {codFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#ef4444', fontWeight: '500' }}>
                  <span>Такса наложен платеж:</span>
                  <span>{formatEUR(codFee)} € ({toBGN(codFee)} лв.)</span>
                </div>
              )}

              <hr style={{ border: isDark ? '0.5px solid #334155' : '0.5px solid #e2e8f0', margin: '4px 0' }} />

              <div className="total-row" style={{ margin: '0 0 8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: themeStyles.color, fontWeight: 'bold' }}>Общо:</span>
                <div style={{ textAlign: 'right' }}>
                  <span className="total-price" style={{ color: '#2563eb', fontSize: '19px', fontWeight: 'bold' }}>{formatEUR(finalOrderTotal)} €</span>
                  <div className="total-price-bgn" style={{ color: isDark ? '#94a3b8' : '#475569', fontSize: '14px', fontWeight: 'bold' }}>{toBGN(finalOrderTotal)} лв.</div>
                </div>
              </div>
              <button className="checkout-btn" onClick={handleCheckout} style={{ backgroundColor: '#ff6b00', color: 'white', fontWeight: 'bold', textTransform: 'uppercase', padding: '12px', border: 'none', cursor: 'pointer' }}>
                Към завършване ➔
              </button>
            </div>
          )}
        </div>
      )}
      
      <footer className="app-footer" style={{ borderTop: themeStyles.headerBorder }}>
        <p>&copy; 2026 VibeGrid. Всички права запазени.</p>
      </footer>

      {/* 🚨 TOAST ИЗВЕСТИЕ */}
      {toast.show && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', padding: '12px 24px',
          backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444', color: 'white',
          borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', animation: 'slideIn 0.3s ease-out'
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}

    </div> 
  );
}

export default App;