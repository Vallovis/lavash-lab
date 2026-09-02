const TELEGRAM_TOKEN = "8850740494:AAG_UsyNR3wGa0FCijfcdGi8AI6bAXTqLFg";
const TELEGRAM_CHAT_ID = "ВАШ_CHAT_ID";

// Загрузка корзины из localStorage
let cart = JSON.parse(localStorage.getItem('lavash_cart')) || [];

const modal = document.getElementById('order-modal');
const modalCloseBtn = document.querySelector('.modal-close');
const cartBar = document.getElementById('bottom-cart-bar');
const cartBadge = document.getElementById('cart-badge');
const headerOrderBtn = document.querySelector('.btn-header-order');

function saveCart() {
  localStorage.setItem('lavash_cart', JSON.stringify(cart));
}

function openModal() {
  if (modal) {
    modal.classList.add('active');
    document.body.classList.add('no-scroll');
  }
}

function closeModal() {
  if (modal) {
    modal.classList.remove('active');
    document.body.classList.remove('no-scroll');
  }
}

function smoothScrollTo(targetSelector, duration = 1000) {
  const target = document.querySelector(targetSelector);
  if (!target) return;

  const headerOffset = 80;
  const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  let startTime = null;

  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);

    const ease = progress < 0.5 
      ? 2 * progress * progress 
      : -1 + (4 - 2 * progress) * progress;

    window.scrollTo(0, startPosition + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);
}

// 1. Клики по товарам "+ Додати"
document.querySelectorAll('.btn-add-to-cart').forEach(button => {
  button.addEventListener('click', function(e) {
    e.preventDefault();
    
    const name = this.getAttribute('data-name');
    const price = parseInt(this.getAttribute('data-price'));

    cart.push({ name, price });
    saveCart();
    updateCartUI();
  });
});

function updateCartUI() {
  const totalCount = cart.length;

  if (totalCount > 0) {
    if (cartBadge) cartBadge.innerText = totalCount;
    if (cartBar) cartBar.classList.add('active');
    if (headerOrderBtn) headerOrderBtn.style.display = 'none'; // Скрываем "Замовити онлайн"
  } else {
    if (cartBar) cartBar.classList.remove('active');
    if (headerOrderBtn) headerOrderBtn.style.display = 'block'; // Возвращаем кнопку
  }
  
  updateOrderFormText();
}

function updateOrderFormText() {
  const itemsList = document.getElementById('cart-items-list');
  const totalPriceElem = document.getElementById('cart-total-price');

  if (!itemsList || !totalPriceElem) return;

  if (cart.length === 0) {
    itemsList.innerHTML = '<li class="empty-cart-msg">Корзина порожня</li>';
    totalPriceElem.innerText = 'Сума: 0 ГРН';
    return;
  }

  // Группируем товары
  const summary = {};
  cart.forEach(item => {
    if (!summary[item.name]) {
      summary[item.name] = { count: 0, price: item.price };
    }
    summary[item.name].count += 1;
  });

  let totalPrice = 0;
  itemsList.innerHTML = '';

  Object.entries(summary).forEach(([itemName, itemData]) => {
    totalPrice += itemData.price * itemData.count;

    const li = document.createElement('li');
    li.className = 'cart-item-row';
    li.innerHTML = `
      <span class="cart-item-text">• ${itemName} x${itemData.count}</span>
      <button type="button" class="btn-remove-item" data-name="${itemName}" title="Видалити один">✕</button>
    `;
    itemsList.appendChild(li);
  });

  totalPriceElem.innerText = `Сума: ${totalPrice} ГРН`;

  // Навешиваем событие клика на кнопки удаления
  document.querySelectorAll('.btn-remove-item').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const nameToRemove = this.getAttribute('data-name');
      removeOneItemFromCart(nameToRemove);
    });
  });
}

// Функция удаления одной единицы товара из массива корзины
function removeOneItemFromCart(name) {
  const index = cart.findIndex(item => item.name === name);
  if (index !== -1) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
  }
}

// 2. Открытие окна заказа по кнопкам
document.querySelectorAll('.btn-header-order, .btn-order').forEach(button => {
  button.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });
});

// 3. Кнопка "Дивитися меню"
const heroMenuBtn = document.querySelector('.btn-hero:not(#btn-submit)');
if (heroMenuBtn) {
  heroMenuBtn.addEventListener('click', (e) => {
    const targetId = heroMenuBtn.getAttribute('href');
    if (targetId && targetId.startsWith('#')) {
      e.preventDefault();
      closeModal();
      smoothScrollTo(targetId, 1000);
    }
  });
}

// 4. Закрытие модального окна
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
    closeModal();
  }
});

// 5. Отправка заказа в Telegram
// Изменённый форматированный текст для Telegram
function sendOrderToTelegram(e) {
  e.preventDefault();

  const btnSubmit = document.getElementById('btn-submit');
  btnSubmit.innerText = "НАДСИЛАННЯ...";
  btnSubmit.disabled = true;

  const name = document.getElementById('client-name').value.trim();
  const phone = document.getElementById('client-phone').value.trim();
  const orderId = 'LAB-' + Math.floor(100 + Math.random() * 900);

  const summary = {};
  let totalPrice = 0;
  cart.forEach(item => {
    summary[item.name] = (summary[item.name] || 0) + 1;
    totalPrice += item.price;
  });

  const formattedItems = Object.entries(summary)
    .map(([itemName, qty]) => `• ${itemName} x${qty}`)
    .join('\n');

  const message = 
    `🔔 *НОВЕ ЗАМОВЛЕННЯ #${orderId}*\n\n` +
    `👤 *Ім'я:* ${name}\n` +
    `📞 *Тел:* ${phone}\n\n` +
    `📝 *Замовлення:*\n${formattedItems}\n\n` +
    `💰 *Сума:* ${totalPrice} ГРН\n` +
    `📍 *Заклад:* LAVASH LAB (Одеса)`;

  fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    })
  })
  .then(response => response.json())
  .then(data => {
    btnSubmit.innerText = "ВІДПРАВИТИ ЗАМОВЛЕННЯ";
    btnSubmit.disabled = false;

    if (data.ok) {
      alert(`Дякуємо, ${name}! Ваше замовлення #${orderId} успішно прийнято.`);
      document.getElementById('order-form').reset();
      cart = [];
      saveCart();
      updateCartUI();
      closeModal();
    } else {
      alert('Помилка відправки.');
    }
  })
  .catch(() => {
    btnSubmit.innerText = "ВІДПРАВИТИ ЗАМОВЛЕННЯ";
    btnSubmit.disabled = false;
    alert('Помилка мережі.');
  });
}

const orderForm = document.getElementById('order-form');
if (orderForm) {
  orderForm.addEventListener('submit', sendOrderToTelegram);
}

// 6. Подсветка карточек
document.querySelectorAll('.spotlight-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  });
});

// 7. Инициализация UI
document.addEventListener('DOMContentLoaded', updateCartUI);