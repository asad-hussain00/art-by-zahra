// ===== Shared Cart + Lightbox + Card rendering for arts by zahra =====

// Fixed delivery rates by city. "Other" = null (confirmed manually by Zahra).
const DELIVERY_RATES = { 'Islamabad': 100, 'Rawalpindi': 150 };
function getDeliveryCharge(city){
  return Object.prototype.hasOwnProperty.call(DELIVERY_RATES, city) ? DELIVERY_RATES[city] : null;
}

// Size options per product category. Each cart item shows its own size dropdown.
const CANVAS_SIZES = ['8x10 inch', '12x16 inch', '16x20 inch', '20x24 inch'];
const SHIRT_SIZES = ['Small', 'Medium', 'Large'];
const POSTER_SIZES = ['A4', 'A3'];
function sizeOptionsFor(category){
  if(category === 'tshirt') return SHIRT_SIZES;
  if(category === 'canvas') return CANVAS_SIZES;
  if(category === 'poster') return POSTER_SIZES;
  return [];
}

// Canvas items price per-size (sizePrices map). T-Shirt & Poster items have one flat price
// that applies to every size. This returns the correct unit price for whatever size is
// currently selected on the cart item.
function itemUnitPrice(item){
  if(item.sizePrices){
    const p = parseFloat(item.sizePrices[item.size]);
    return isNaN(p) ? 0 : p;
  }
  const p = parseFloat(item.price);
  return isNaN(p) ? 0 : p;
}
function itemHasPrice(item){
  if(item.sizePrices) return Object.values(item.sizePrices).some(v => v !== '' && v != null && !isNaN(parseFloat(v)));
  return !!item.price;
}

function getCart(){
  try { return JSON.parse(localStorage.getItem('azCart') || '[]'); } catch(e){ return []; }
}
function setCart(cart){
  localStorage.setItem('azCart', JSON.stringify(cart));
  updateCartBadge();
}
function addToCart(item){
  const cart = getCart();
  const existing = cart.find(i=>i.code === item.code);
  if(existing){
    existing.qty = (existing.qty || 1) + 1;
  } else {
    const sizes = sizeOptionsFor(item.category);
    const newItem = { ...item, qty: 1, size: sizes[0] || '' };
    cart.push(newItem);
  }
  setCart(cart);
  return true;
}
function updateItemSize(code, size){
  const cart = getCart();
  const item = cart.find(i=>i.code === code);
  if(item) item.size = size;
  setCart(cart);
}
function updateCartQty(code, newQty){
  let cart = getCart();
  if(newQty <= 0){
    cart = cart.filter(i=>i.code !== code);
  } else {
    const item = cart.find(i=>i.code === code);
    if(item) item.qty = newQty;
  }
  setCart(cart);
}
function removeFromCart(code){
  setCart(getCart().filter(i=>i.code!==code));
}
function cartCount(){
  return getCart().reduce((sum,i)=> sum + (i.qty || 1), 0);
}
function itemLineTotal(item){
  return itemUnitPrice(item) * (item.qty || 1);
}
function cartSubtotal(){
  return getCart().reduce((sum,i)=> sum + itemLineTotal(i), 0);
}
function updateCartBadge(){
  const badge = document.getElementById('cartBadge');
  if(!badge) return;
  const count = cartCount();
  badge.textContent = count;
  badge.style.display = count>0 ? 'flex' : 'none';
}
function openCartDrawer(){
  renderCartDrawer();
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if(drawer) drawer.classList.add('open');
  if(overlay) overlay.classList.add('show');
}
function closeCartDrawer(){
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if(drawer) drawer.classList.remove('open');
  if(overlay) overlay.classList.remove('show');
}
function renderCartDrawer(){
  const list = document.getElementById('cartItemsList');
  const totalBox = document.getElementById('cartDrawerTotal');
  if(!list) return;
  const cart = getCart();
  if(!cart.length){
    list.innerHTML = '<div class="cart-empty">Your cart is empty. Add a piece from the portfolio!</div>';
    if(totalBox) totalBox.innerHTML = '';
    return;
  }
  list.innerHTML = cart.map(item=>`
    <div class="cart-item" data-code="${item.code}">
      ${item.imageUrl ? `<img class="cart-item-thumb" src="${item.imageUrl}" alt="">` : ''}
      <div class="cart-item-info">
        <strong>${item.title}</strong>
        <span>${itemHasPrice(item) ? 'Rs. '+itemUnitPrice(item)+' each' : 'Code: '+item.code}</span>
        <div class="qty-stepper">
          <button class="qty-btn" data-action="dec" data-code="${item.code}" aria-label="Decrease quantity">−</button>
          <span class="qty-value">${item.qty || 1}</span>
          <button class="qty-btn" data-action="inc" data-code="${item.code}" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="cart-item-right">
        ${itemHasPrice(item) ? `<span class="cart-item-subtotal">Rs. ${itemLineTotal(item)}</span>` : ''}
        <button class="cart-remove" data-code="${item.code}" aria-label="Remove">&times;</button>
      </div>
    </div>`).join('');

  list.querySelectorAll('.cart-remove').forEach(btn=>{
    btn.addEventListener('click', ()=>{ removeFromCart(btn.dataset.code); renderCartDrawer(); });
  });
  list.querySelectorAll('.qty-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const cart = getCart();
      const item = cart.find(i=>i.code===btn.dataset.code);
      if(!item) return;
      const delta = btn.dataset.action === 'inc' ? 1 : -1;
      updateCartQty(item.code, (item.qty||1) + delta);
      renderCartDrawer();
    });
  });

  if(totalBox){
    totalBox.innerHTML = `<span>Items Total</span><span>Rs. ${cartSubtotal()}</span>`;
  }
}
function proceedToOrder(){
  closeCartDrawer();
  const onOrderPage = !!document.getElementById('orderForm');
  if(onOrderPage){
    fillOrderFormFromCart();
    const orderSection = document.getElementById('order');
    if(orderSection) orderSection.scrollIntoView({behavior:'smooth'});
  } else {
    window.location.href = 'index.html#order';
  }
}
function fillOrderFormFromCart(){
  const box = document.getElementById('selectedItemsBox');
  const hidden = document.getElementById('selectedItemsHidden');
  const productField = document.getElementById('productField');
  if(!box) return;
  const cart = getCart();

  if(productField) productField.style.display = cart.length ? 'none' : 'flex';

  if(!cart.length){
    box.innerHTML = '<p class="empty-cart-note">No items selected yet — browse the portfolio and add a piece, or describe your custom design below.</p>';
    if(hidden) hidden.value = '';
    updateOrderTotals();
    return;
  }
  box.innerHTML = cart.map(item=>{
    const sizes = sizeOptionsFor(item.category);
    const sizeHtml = sizes.length ? `
        <div class="size-select-wrap">
          <label class="size-label">Size</label>
          <select class="size-select" data-code="${item.code}">
            ${sizes.map(s=>{
              const sizePrice = item.sizePrices ? parseFloat(item.sizePrices[s]) : NaN;
              const label = !isNaN(sizePrice) ? `${s} — Rs. ${sizePrice}` : s;
              return `<option value="${s}" ${item.size===s ? 'selected' : ''}>${label}</option>`;
            }).join('')}
          </select>
        </div>` : '';
    return `
    <div class="order-summary-item" data-code="${item.code}">
      ${item.imageUrl ? `<img src="${item.imageUrl}" alt="">` : ''}
      <div class="osi-info">
        <strong>${item.title}</strong>
        <span>${itemHasPrice(item) ? 'Rs. '+itemUnitPrice(item)+' each' : 'Code: '+item.code}</span>
        <div class="qty-stepper">
          <button type="button" class="qty-btn" data-action="dec" data-code="${item.code}" aria-label="Decrease quantity">−</button>
          <span class="qty-value">${item.qty || 1}</span>
          <button type="button" class="qty-btn" data-action="inc" data-code="${item.code}" aria-label="Increase quantity">+</button>
        </div>
        ${sizeHtml}
      </div>
      <div class="osi-right">
        ${itemHasPrice(item) ? `<span class="osi-subtotal">Rs. ${itemLineTotal(item)}</span>` : ''}
        <button type="button" class="cart-remove" data-code="${item.code}" aria-label="Remove">&times;</button>
      </div>
    </div>`;
  }).join('');

  box.querySelectorAll('.qty-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const cart = getCart();
      const item = cart.find(i=>i.code===btn.dataset.code);
      if(!item) return;
      const delta = btn.dataset.action === 'inc' ? 1 : -1;
      updateCartQty(item.code, (item.qty||1) + delta);
      fillOrderFormFromCart();
    });
  });
  box.querySelectorAll('.size-select').forEach(sel=>{
    sel.addEventListener('change', ()=>{
      updateItemSize(sel.dataset.code, sel.value);
      fillOrderFormFromCart();
    });
  });
  box.querySelectorAll('.cart-remove').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      removeFromCart(btn.dataset.code);
      fillOrderFormFromCart();
    });
  });

  if(hidden){
    hidden.value = cart.map(i=>`${i.title} x${i.qty||1} [${i.code}]${i.size ? ' - Size: '+i.size : ''}${itemHasPrice(i) ? ' - Rs.'+itemLineTotal(i) : ''}`).join('; ');
  }
  updateOrderTotals();
}
function updateOrderTotals(){
  const totalsBox = document.getElementById('orderTotals');
  const hiddenDelivery = document.getElementById('deliveryChargeHidden');
  const hiddenGrand = document.getElementById('grandTotalHidden');
  if(!totalsBox) return;

  const cart = getCart();
  if(!cart.length){
    totalsBox.innerHTML = '';
    if(hiddenDelivery) hiddenDelivery.value = '';
    if(hiddenGrand) hiddenGrand.value = '';
    return;
  }

  const citySelect = document.getElementById('city');
  const city = citySelect ? citySelect.value : '';
  const subtotal = cartSubtotal();
  const delivery = getDeliveryCharge(city);
  const deliveryLabel = delivery === null ? 'To be confirmed' : `Rs. ${delivery}`;
  const grand = subtotal + (delivery || 0);
  const grandLabel = delivery === null ? `Rs. ${grand} + delivery` : `Rs. ${grand}`;

  totalsBox.innerHTML = `
    <div class="ot-row"><span>Items Subtotal</span><span>Rs. ${subtotal}</span></div>
    <div class="ot-row"><span>Delivery Charge (${city || '—'})</span><span>${deliveryLabel}</span></div>
    <div class="ot-row grand"><span>Estimated Total</span><span>${grandLabel}</span></div>
    <p class="delivery-note">Delivery is calculated automatically based on your selected city. For "Other" locations, Zahra will confirm the exact charge with you directly.</p>
  `;
  if(hiddenDelivery) hiddenDelivery.value = delivery === null ? 'To be confirmed' : ('Rs. ' + delivery);
  if(hiddenGrand) hiddenGrand.value = grandLabel;
}

// Lightbox
function openLightbox(src, alt){
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  if(!lb || !img || !src) return;
  img.src = src;
  img.alt = alt || '';
  lb.classList.add('show');
}
function closeLightbox(){
  const lb = document.getElementById('lightbox');
  if(lb) lb.classList.remove('show');
}

// Card template shared by homepage (featured) and full portfolio page
function cardTemplate(item){
  let priceHtml = '';
  if(item.category === 'canvas' && item.sizePrices){
    const vals = Object.values(item.sizePrices).map(v=>parseFloat(v)).filter(v=>!isNaN(v));
    if(vals.length){
      const min = Math.min(...vals);
      priceHtml = `<div class="price">From Rs. ${min}</div>`;
    }
  } else if(item.price){
    priceHtml = `<div class="price">Rs. ${item.price}</div>`;
  }
  const safeTitle = (item.title || 'Untitled Piece').replace(/"/g,'&quot;');
  const photoHtml = item.imageUrl
    ? `<div class="card-photo" data-src="${item.imageUrl}" data-alt="${safeTitle}"><img src="${item.imageUrl}" alt="${safeTitle}" loading="lazy"></div>`
    : `<div class="card-photo"><span class="mono">ز</span><small>Photo coming soon</small></div>`;
  const sizePricesAttr = (item.category === 'canvas' && item.sizePrices)
    ? ` data-sizeprices="${JSON.stringify(item.sizePrices).replace(/"/g,'&quot;')}"`
    : '';
  return `
    <div class="card">
      ${photoHtml}
      <div class="card-body">
        <h3>${safeTitle}</h3>
        ${priceHtml}
        <p>${item.description || ''}</p>
        <span class="code-tag">Code: ${item.code || '—'}</span>
        <button class="add-cart-btn" data-code="${item.code || ''}" data-title="${safeTitle}" data-price="${item.price || ''}" data-image="${item.imageUrl || ''}" data-category="${item.category || ''}"${sizePricesAttr}>Add to Cart</button>
      </div>
    </div>`;
}

function bindCardEvents(container){
  if(!container) return;
  container.querySelectorAll('.card-photo[data-src]').forEach(el=>{
    el.addEventListener('click', ()=> openLightbox(el.dataset.src, el.dataset.alt));
  });
  container.querySelectorAll('.add-cart-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(!btn.dataset.code){ return; }
      const payload = {code: btn.dataset.code, title: btn.dataset.title, imageUrl: btn.dataset.image, category: btn.dataset.category};
      if(btn.dataset.sizeprices){
        try{ payload.sizePrices = JSON.parse(btn.dataset.sizeprices); }catch(e){ payload.sizePrices = {}; }
      } else {
        payload.price = btn.dataset.price;
      }
      addToCart(payload);
      btn.textContent = 'Added ✓';
      setTimeout(()=>{ btn.textContent = 'Add to Cart'; }, 1200);
    });
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  updateCartBadge();
  if(document.getElementById('selectedItemsBox')) fillOrderFormFromCart();

  const citySelect = document.getElementById('city');
  if(citySelect) citySelect.addEventListener('change', updateOrderTotals);

  const cartBtn = document.getElementById('cartBtn');
  if(cartBtn) cartBtn.addEventListener('click', openCartDrawer);
  const cartClose = document.getElementById('cartClose');
  if(cartClose) cartClose.addEventListener('click', closeCartDrawer);
  const cartOverlay = document.getElementById('cartOverlay');
  if(cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);
  const cartProceedBtn = document.getElementById('cartProceedBtn');
  if(cartProceedBtn) cartProceedBtn.addEventListener('click', proceedToOrder);

  const lightboxClose = document.getElementById('lightboxClose');
  if(lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  const lightbox = document.getElementById('lightbox');
  if(lightbox) lightbox.addEventListener('click', (e)=>{ if(e.target === lightbox) closeLightbox(); });
});

// Browsers sometimes restore form field values (like the City dropdown) from
// history AFTER our initial scripts run. Recompute totals when that happens
// so the delivery charge always matches whatever city is actually selected.
window.addEventListener('pageshow', ()=>{
  if(document.getElementById('selectedItemsBox')) fillOrderFormFromCart();
});
