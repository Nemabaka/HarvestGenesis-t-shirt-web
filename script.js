/* HarvestGENESIS static shop script.js
   - Products rendered dynamically
   - Cart persisted in localStorage
   - Quote form composes an email (mailto) with order summary
*/

const PRODUCTS = [
  {id:'tee-1', title:'HG Classic Tee', price:350, img:'products/tshirt1.svg'},
  {id:'tee-2', title:'HG Street Tee', price:350, img:'products/tshirt2.svg'},
  {id:'tee-3', title:'HG Minimal Tee', price:350, img:'products/tshirt3.svg'},
  {id:'tee-4', title:'HG Premium Tee', price:350, img:'products/tshirt4.svg'}
];

const SIZES = ['S','M','L','XL','2XL'];
const COLORS = [{id:'black', name:'Black', hex:'#111111', text:'#ffffff'}, {id:'white', name:'White', hex:'#ffffff', text:'#111111'}];

const CART_KEY = 'hg_cart_v2';

let cart = [];

function currency(n){ return new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format(n); }

function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartUI(); }
function loadCart(){ try{ cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; }catch(e){ cart = []; } updateCartUI(); }

function init(){
  renderProducts();
  loadCart();
  document.getElementById('year').textContent = new Date().getFullYear();
  document.getElementById('quote-form').addEventListener('submit', handleQuoteSubmit);
  document.getElementById('open-cart').addEventListener('click', ()=> document.getElementById('cart-panel').scrollIntoView({behavior:'smooth'}));
  document.getElementById('checkout-quote').addEventListener('click', ()=> location.hash = '#quote');
}

function renderProducts(){
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';
  PRODUCTS.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card product-card';
    card.innerHTML = `
      <div class="product-art"><img src="${p.img}" alt="${p.title}" style="max-width:100%;height:100%;object-fit:cover" /></div>
      <div class="product-title">${p.title}</div>
      <div class="price">${currency(p.price)}</div>
      <div class="controls">
        <label class="select">Size
          <select class="size-select">${SIZES.map(s=>`<option value="${s}">${s}</option>`).join('')}</select>
        </label>
        <div class="color-select">Color: ${COLORS.map(c=>`<button data-color="${c.id}" class="color-btn" title="${c.name}" style="background:${c.hex};border-color:${c.hex==='${'#ffffff'}' ? '#ddd' : c.hex}"></button>`).join('')}</div>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="btn btn-primary add-btn">Add to Cart</button>
        <button class="btn view-btn">Quick View</button>
      </div>
    `;
    // Attach events
    card.querySelector('.add-btn').addEventListener('click', ()=>{
      const size = card.querySelector('.size-select').value;
      // find active color or default to black
      let activeColor = 'black';
      const colorBtns = card.querySelectorAll('.color-btn');
      colorBtns.forEach(b=>{ if(b.classList.contains('active')) activeColor = b.dataset.color; });
      // if none active, pick first
      if(!Array.from(colorBtns).some(b=>b.classList.contains('active'))){ colorBtns[0].classList.add('active'); activeColor = colorBtns[0].dataset.color; }
      addToCart(p.id, size, activeColor);
    });
    // color toggle
    card.querySelectorAll('.color-btn').forEach(b=>{
      b.addEventListener('click', (e)=>{
        card.querySelectorAll('.color-btn').forEach(x=>x.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });
    grid.appendChild(card);
  });
}

function itemKey(item){ return `${item.id}__${item.size}__${item.color}`; }

function addToCart(id, size, color){
  const prod = PRODUCTS.find(p=>p.id===id);
  if(!prod) return;
  const key = `${id}__${size}__${color}`;
  const existing = cart.find(it=>itemKey(it)===key);
  if(existing){ existing.qty += 1; }
  else{
    const colorMeta = COLORS.find(c=>c.id===color) || COLORS[0];
    cart.push({ id:prod.id, title:prod.title, price:prod.price, size:size, color:colorMeta.name, qty:1, img:prod.img });
  }
  saveCart();
  notify('Added to cart');
}

function notify(msg){ const c = document.createElement('div'); c.textContent = msg; c.style.position='fixed'; c.style.bottom='24px'; c.style.right='24px'; c.style.padding='10px 14px'; c.style.background='var(--accent)'; c.style.color='#fff'; c.style.borderRadius='12px'; c.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)'; document.body.appendChild(c); setTimeout(()=>c.remove(),1600); }

function updateCartUI(){
  const container = document.getElementById('cart-items');
  const countEl = document.getElementById('cart-count');
  const totalEl = document.getElementById('cart-total');
  const orderSummaryEl = document.getElementById('order-summary');
  const orderTotalEl = document.getElementById('order-total');

  if(!container) return;
  if(cart.length===0){
    container.innerHTML = '<p>No items yet.</p>';
  } else {
    container.innerHTML = '';
    cart.forEach(it=>{
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div style="width:68px"><img src="${it.img}" alt="${it.title}" style="width:100%;height:60px;object-fit:cover;border-radius:8px" /></div>
        <div class="meta">
          <div style="font-weight:700">${it.title}</div>
          <div style="font-size:13px;color:#666">${it.color} · ${it.size}</div>
          <div class="qty-controls" style="margin-top:8px;">
            <button class="btn dec">-</button>
            <div style="min-width:28px;text-align:center">${it.qty}</div>
            <button class="btn inc">+</button>
            <button class="btn remove" style="margin-left:8px;background:#fff;color:#d00;border:1px solid #f3c2c2">Remove</button>
          </div>
        </div>
        <div style="text-align:right"><div style="font-weight:700">${currency(it.price * it.qty)}</div></div>
      `;
      // attach inc/dec/remove
      div.querySelector('.inc').addEventListener('click', ()=>{ it.qty+=1; saveCart(); });
      div.querySelector('.dec').addEventListener('click', ()=>{ it.qty = Math.max(1,it.qty-1); saveCart(); });
      div.querySelector('.remove').addEventListener('click', ()=>{ cart = cart.filter(x=>itemKey(x)!==itemKey(it)); saveCart(); });
      container.appendChild(div);
    });
  }

  const subtotal = cart.reduce((s,i)=>s + (Number(i.price) * Number(i.qty)), 0);
  totalEl.textContent = currency(subtotal);
  orderTotalEl.textContent = currency(subtotal);
  countEl.textContent = cart.reduce((s,i)=>s + i.qty,0);
  // order summary
  if(orderSummaryEl){
    if(cart.length===0) orderSummaryEl.textContent = 'No items in cart.';
    else orderSummaryEl.textContent = cart.map(it=>`${it.title} — ${it.size} / ${it.color} x${it.qty} = ${currency(it.price*it.qty)}`).join('\n');
  }
}

function handleQuoteSubmit(e){
  e.preventDefault();
  const form = e.target;
  const fullName = form.fullName.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const message = form.message.value.trim();

  if(!fullName || (!email && !phone)){
    alert('Please provide your name and at least an email or phone number.');
    return;
  }

  const subtotal = cart.reduce((s,i)=>s + (Number(i.price) * Number(i.qty)), 0);
  const orderLines = cart.length ? cart.map(it=>`${it.title} — ${it.size} / ${it.color} x${it.qty} = ${currency(it.price*it.qty)}`).join('\n') : 'No items in cart.';

  const subject = encodeURIComponent(`Quote Request — ${fullName}`);
  const body = encodeURIComponent(
    `Name: ${fullName}\nEmail: ${email}\nPhone: ${phone}\n\nOrder Details:\n${orderLines}\n\nTotal (approx): ${currency(subtotal)}\n\nMessage:\n${message}`
  );

  // default email (change here if you prefer)
  const TO = 'khanonemabaka2@gmail.com';
  const mailto = `mailto:${TO}?subject=${subject}&body=${body}`;
  window.location.href = mailto;
  // (note: opening mail client is expected; for direct sending use EmailJS/Formspree)
}

document.addEventListener('DOMContentLoaded', init);
