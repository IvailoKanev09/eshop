import React from 'react';

function ProductCard({ product, isDark, themeStyles, onAddToCart }) {
  // Фиксиран курс за преобразуване (1 € = 1.95583 лв.)
  const BGN_RATE = 1.95583;
  const priceInBGN = product.price * BGN_RATE;

  return (
    <div 
      className="product-card" 
      style={{ 
        backgroundColor: themeStyles.cardBg, 
        border: themeStyles.cardBorder, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between',
        position: 'relative' // За правилната позиция на ПРОМО етикета
      }}
    >
      {/* ДИНАМИЧЕН ПРОМО ЕТИКЕТ (Само ако има въведен badge) */}
      {product.badge && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: '#ef4444',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 'bold',
          zIndex: '5',
          textTransform: 'uppercase'
        }}>
          {product.badge}
        </div>
      )}

      <div>
        <div className="product-image-container" style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }}>
          <img src={product.image} alt={product.name} className="product-image" />
        </div>
        <h3 style={{ color: themeStyles.color }}>{product.name}</h3>
      </div>
      <div>
        
       {/* ЦЕНТРАЛИЗИРАНА СЕКЦИЯ ЗА ЦЕНИ В ЕВРО */}
<div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '8px', marginBottom: '2px' }}>
  
  {/* Стара цена: Показва се първа, задраскана и в сиво, САМО ако продуктът е в промоция */}
  {product.oldPrice && (
    <span style={{ fontSize: '14px', textDecoration: 'line-through', color: '#94a3b8', fontWeight: '500' }}>
      {Number(product.oldPrice).toFixed(2)} €
    </span>
  )}

  {/* Текуща цена: Ако има промоция (т.е. има oldPrice), тя свети в червено (#ef4444), за да привлече вниманието. Ако няма промоция, си остава стандартно синя (#2563eb). */}
  <span className="product-price" style={{ color: product.oldPrice ? '#ef4444' : '#2563eb', margin: 0, fontWeight: 'bold' }}>
    {Number(product.price).toFixed(2)} €
  </span>

</div>

        {/* Допълнителната цена в Лева - перфектно центрирана */}
        <p style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '14px', margin: '0 0 10px 0', fontWeight: '500', textAlign: 'center' }}>
          {priceInBGN.toFixed(2)} лв.
        </p>
        
        {/* Бутон */}
        <button 
          className="add-to-cart-btn" 
          onClick={(e) => {
            e.stopPropagation(); 
            onAddToCart(product);
          }}
        >
          Купи сега
        </button>
      </div>
    </div>
  );
}

export default ProductCard;