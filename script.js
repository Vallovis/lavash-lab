/**
 * Lavash Lab — логіка кошика та замовлення
 * Винесено з index.html для SEO (сторінка менше, JS кешується окремо)
 *
 * ВАЖЛИВО: токен Telegram-бота НЕ зберігати у фронтенд-коді (будь-хто може
 * його вкрасти). Відправку замовлень у Telegram робіть через бекенд/проксі.
 */
window.labCart = [];
let nextItemId = 1;

// Повний список можливих добавок (допів)
const DOPI_LIST = [
  { name: "М'ясо", price: 45 },
  { name: "Сосиска", price: 30 },
  { name: "Сир", price: 30 },
  { name: "Огірок маринований", price: 15 },
  { name: "Грибочки", price: 20 },
  { name: "Цибуля маринована", price: 10 },
  { name: "Помідор", price: 20 },
  { name: "Маслини, оливки", price: 30 },
  { name: "Картопля фрі", price: 30 },
  { name: "Корейська морквина", price: 20 },
  { name: "Ананас", price: 30 },
];

let modalTarget = {
  cartItemId: null,
  name: "",
  basePrice: 0,
  selectedDopiIndexes: [],
};

// Фільтрація категорій меню
function filterMenu(category) {
  document.querySelectorAll(".cat-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-cat") === category);
  });

  document.querySelectorAll(".menu-section").forEach((section) => {
    const match = category === "all" || section.getAttribute("data-section") === category;
    section.style.display = match ? "block" : "none";
  });
}

// Скролл до блоку конструктора
function scrollToBuilder() {
  const el = document.getElementById("builder-section");
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

// Відкриття модального вікна вибору допів для Шаурми
function openDopiModal(name, basePrice, cartItemId = null) {
  modalTarget.cartItemId = cartItemId;
  modalTarget.name = name;
  modalTarget.basePrice = basePrice;

  if (cartItemId) {
    const existing = window.labCart.find((i) => i.id === cartItemId);
    if (existing && existing.dopi) {
      modalTarget.selectedDopiIndexes = DOPI_LIST.map((d, idx) =>
        existing.dopi.some((ed) => ed.name === d.name) ? idx : -1,
      ).filter((idx) => idx !== -1);
    } else {
      modalTarget.selectedDopiIndexes = [];
    }
  } else {
    modalTarget.selectedDopiIndexes = [];
  }

  renderDopiModalContent();
  document.getElementById("dopi-modal").classList.remove("hidden");
}

function closeDopiModal() {
  document.getElementById("dopi-modal").classList.add("hidden");
}

function toggleDopIndex(index) {
  const idxLocation = modalTarget.selectedDopiIndexes.indexOf(index);
  if (idxLocation > -1) {
    modalTarget.selectedDopiIndexes.splice(idxLocation, 1);
  } else {
    modalTarget.selectedDopiIndexes.push(index);
  }
  renderDopiModalContent();
}

function renderDopiModalContent() {
  document.getElementById("modal-shawarma-title").innerText =
    modalTarget.name;

  const dopiContainer = document.getElementById("modal-dopi-list");
  dopiContainer.innerHTML = DOPI_LIST.map((dop, idx) => {
    const isChecked = modalTarget.selectedDopiIndexes.includes(idx);
    return `
      <label class="dop-item${isChecked ? " selected" : ""}">
          <div class="dop-item-left">
              <input type="checkbox" onchange="toggleDopIndex(${idx})" ${isChecked ? "checked" : ""}>
              <span class="dop-item-name">${dop.name}</span>
          </div>
          <span class="dop-item-price">+${dop.price} грн</span>
      </label>
    `;
  }).join("");

  let dopiTotal = modalTarget.selectedDopiIndexes.reduce(
    (sum, i) => sum + DOPI_LIST[i].price,
    0
  );
  let totalPrice = modalTarget.basePrice + dopiTotal;

  document.getElementById("modal-total-price").innerText =
    totalPrice + " ГРН";
}

function confirmDopi(withoutDopi) {
  const selectedDopi = withoutDopi
    ? []
    : modalTarget.selectedDopiIndexes.map((i) => DOPI_LIST[i]);

  if (modalTarget.cartItemId) {
    const item = window.labCart.find(
      (i) => i.id === modalTarget.cartItemId
    );
    if (item) {
      item.dopi = selectedDopi;
      item.price =
        item.basePrice +
        selectedDopi.reduce((sum, d) => sum + d.price, 0);
    }
  } else {
    let price =
      modalTarget.basePrice +
      selectedDopi.reduce((sum, d) => sum + d.price, 0);

    window.labCart.push({
      id: nextItemId++,
      name: modalTarget.name,
      basePrice: modalTarget.basePrice,
      price: price,
      qty: 1,
      dopi: selectedDopi,
    });
  }

  closeDopiModal();
  renderCart();
}

function addToCart(name, price) {
  const existing = window.labCart.find(
    (i) => i.name === name && (!i.dopi || i.dopi.length === 0)
  );
  if (existing) {
    existing.qty++;
  } else {
    window.labCart.push({
      id: nextItemId++,
      name: name,
      basePrice: price,
      price: price,
      qty: 1,
      dopi: [],
    });
  }
  renderCart();
}

function changeQty(id, delta) {
  const item = window.labCart.find((i) => i.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      window.labCart = window.labCart.filter((i) => i.id !== id);
    }
  }
  renderCart();
}

function editCartItemDopi(itemId) {
  const item = window.labCart.find((i) => i.id === itemId);
  if (item) {
    openDopiModal(item.name, item.basePrice, item.id);
  }
}

function renderCart() {
  const cartContainer = document.getElementById("cart-items-list");
  const totalCount = window.labCart.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = window.labCart.reduce(
    (sum, i) => sum + i.price * i.qty,
    0
  );

  document.getElementById("header-cart-badge").innerText = totalCount;
  document.getElementById("cart-items-counter").innerText =
    totalCount + " позицій";
  document.getElementById("calc-total-text").innerText = totalPrice;
  document.getElementById("calc-breakdown-text").innerHTML =
    `Всього у кошику: <strong>${totalCount} шт.</strong>`;

  if (window.labCart.length === 0) {
    cartContainer.innerHTML =
      `<p class="cart-empty">Кошик порожній. Оберіть страви вище.</p>`;
    return;
  }

  cartContainer.innerHTML = window.labCart
    .map((item) => {
      let dopiStr = "";
      if (item.dopi && item.dopi.length > 0) {
        dopiStr = `<div class="cart-item-dopi">+ Допи: ${item.dopi.map((d) => d.name).join(", ")}</div>`;
      }

      return `
      <div class="cart-item">
        <div class="cart-item-info">
          <span class="cart-item-name">${item.name}</span>
          ${dopiStr}
          <span class="cart-item-price">${item.price} грн / шт.</span>
        </div>
        <div class="cart-item-actions">
          ${
            item.basePrice && item.name.includes("Шаурма")
              ? `<button type="button" onclick="editCartItemDopi(${item.id})" class="btn-edit-dopi">Змінити допи</button>`
              : ""
          }
          <div class="qty-control">
            <button type="button" onclick="changeQty(${item.id}, -1)" class="qty-btn" aria-label="Менше">-</button>
            <span class="qty-value">${item.qty}</span>
            <button type="button" onclick="changeQty(${item.id}, 1)" class="qty-btn" aria-label="Більше">+</button>
          </div>
          <span class="cart-item-total">${item.price * item.qty} грн</span>
        </div>
      </div>
    `;
    })
    .join("");
}

function handleOrderSubmit(event) {
  event.preventDefault();

  if (window.labCart.length === 0) {
    alert("Ваш кошик порожній!");
    return;
  }

  const name = document.getElementById("order-customer-name").value;
  const phone = document.getElementById("order-customer-phone").value;
  const time = document.querySelector('input[name="pickup-time"]:checked').value;
  const payment = document.querySelector('input[name="payment_method"]:checked').value;
  const comment = document.getElementById("order-customer-comment").value;

  let total = window.labCart.reduce((sum, i) => sum + i.price * i.qty, 0);

  alert(
    `Дякуємо за замовлення, ${name}!\nСамовивіз: ${time}\nСпосіб оплати: ${payment}\nСума: ${total} грн.\nМи вже готуємо ваші страви!`
  );

  window.labCart = [];
  renderCart();
}

