const $ = (selector) => document.querySelector(selector);

const memberForm = $("#member-form");
const staffForm = $("#staff-form");
const assignmentForm = $("#assignment-form");
const saleForm = $("#sale-form");
const productForm = $("#product-form");
const newProductButton = $("#new-product-button");
const assignmentMemberSelect = $("#assignment-member-select");
const assignmentStaffSelect = $("#assignment-staff-select");
const saleMemberSelect = $("#sale-member-select");
const saleProductSelect = $("#sale-product-select");
const staffTableBody = $("#staff-table-body");
const productsTableBody = $("#products-table-body");
const summaryValues = document.querySelectorAll(".summary-card strong");
const API_URL = window.location.port === "3000" ? "" : "http://localhost:3000";

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("tr-TR")} TL`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function api(path, options = {}) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      throw new Error(data.message || `Islem yapilamadi. HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Backend eski cevap dondu. Terminalde npm start'i kapatip tekrar ac.");
    }

    if (error instanceof TypeError) {
      throw new Error("Backend calismiyor. Terminalde npm start komutunu calistir.");
    }

    throw error;
  }
}

function option(value, text) {
  return `<option value="${value}">${text}</option>`;
}

function fillSelect(select, rows, label) {
  select.innerHTML = rows.map((row) => option(row.id, label(row))).join("");
}

function renderStaff(rows) {
  staffTableBody.innerHTML = rows.map((row) => `
    <tr>
      <td>${row.id}</td>
      <td>${row.name}</td>
      <td>${formatMoney(row.salary)}</td>
      <td><span class="status ok">Aktif</span></td>
    </tr>
  `).join("");
}

function renderProducts(rows) {
  productsTableBody.innerHTML = rows.map((row) => `
    <tr class="${Number(row.stock) <= 5 ? "low-stock" : ""}">
      <td>${row.id}</td>
      <td>${row.name}</td>
      <td>${row.category}</td>
      <td>${formatMoney(row.price)}</td>
      <td>${row.stock}</td>
      <td><span class="status ${Number(row.stock) <= 5 ? "danger" : "ok"}">${Number(row.stock) <= 5 ? "Azaldi" : "Yeterli"}</span></td>
    </tr>
  `).join("");
}

async function loadAdminData() {
  const data = await api("/api/admin/data");
  const { summary, members, staff, products } = data;

  summaryValues[0].textContent = summary.memberCount;
  summaryValues[1].textContent = summary.activeMembershipCount;
  summaryValues[2].textContent = summary.staffCount;
  summaryValues[3].textContent = `${summary.lowStockCount} Urun`;

  fillSelect(assignmentMemberSelect, members, (row) => row.name);
  fillSelect(saleMemberSelect, members, (row) => row.name);
  fillSelect(assignmentStaffSelect, staff, (row) => row.name);
  fillSelect(saleProductSelect, products, (row) => `${row.name} - ${formatMoney(row.price)}`);
  renderStaff(staff);
  renderProducts(products);
}

async function submitForm(form, path, getBody) {
  try {
    await api(path, {
      method: "POST",
      body: JSON.stringify(getBody(new FormData(form))),
    });
    form.reset();
    setDefaultDates();
    await loadAdminData();
    alert("Islem basarili.");
  } catch (error) {
    alert(error.message);
  }
}

function setDefaultDates() {
  document.querySelectorAll('input[type="date"]').forEach((input) => {
    if (!input.value) input.value = today();
  });
}

memberForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitForm(memberForm, "/api/admin/members", (form) => ({
    name: form.get("name"),
    phone: form.get("phone"),
    startDate: form.get("startDate"),
    endDate: form.get("endDate"),
  }));
});

staffForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitForm(staffForm, "/api/admin/staff", (form) => ({
    name: form.get("name"),
    salary: form.get("salary"),
  }));
});

newProductButton.addEventListener("click", () => {
  productForm.classList.toggle("is-hidden");
});

productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitForm(productForm, "/api/admin/products", (form) => ({
    name: form.get("name"),
    category: form.get("category"),
    price: form.get("price"),
    stock: form.get("stock"),
  }));
});

assignmentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitForm(assignmentForm, "/api/admin/assignments", (form) => ({
    memberId: form.get("memberId"),
    staffId: form.get("staffId"),
    startDate: form.get("startDate"),
    programDetail: form.get("programDetail"),
  }));
});

saleForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitForm(saleForm, "/api/admin/sales", (form) => ({
    memberId: form.get("memberId"),
    productId: form.get("productId"),
    quantity: form.get("quantity"),
  }));
});

setDefaultDates();
loadAdminData().catch((error) => alert(error.message));
