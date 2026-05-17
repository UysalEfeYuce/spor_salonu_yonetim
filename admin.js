const $ = (selector) => document.querySelector(selector);

const adminSidebar = $("#admin-sidebar");
const adminApp = $("#admin-app");
const adminLogoutButton = $("#admin-logout-button");
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
const memberStaffSelect = $("#member-staff-select");
const membersSearch = $("#members-search");
const membersTableBody = $("#members-table-body");
const staffTableBody = $("#staff-table-body");
const productsTableBody = $("#products-table-body");
let staffList = [];
let membersList = [];
const memberPanel = $("#member-detail-panel");
const memberPanelClose = $("#member-detail-close");
const memberPanelBackdrop = $("#member-detail-backdrop");
const memberDetailName = $("#member-detail-name");
const memberDetailPhone = $("#member-detail-phone");
const memberDetailCoach = $("#member-detail-coach");
const memberDetailRegistered = $("#member-detail-registered");
const memberDetailMembershipEnd = $("#member-detail-membership-end");
const memberDetailProgram = $("#member-detail-program");
const memberDetailMeasurements = $("#member-detail-measurements");
const summaryValues = document.querySelectorAll(".summary-card strong");
const API_URL = window.location.port === "3000" ? "" : "http://localhost:3000";
const ADMIN_LOGIN_KEY = "sporSalonuAdminLoggedIn";

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
      throw new Error("Backend eski cevap döndü. Terminalde npm start'i kapatıp tekrar aç.");
    }

    if (error instanceof TypeError) {
      throw new Error("Backend çalışmıyor. Terminalde npm start komutunu çalıştır.");
    }

    throw error;
  }
}

function showAdminPanel() {
  adminSidebar.classList.remove("is-hidden");
  adminApp.classList.remove("is-hidden");
}

function goHome() {
  window.location.href = "index.html";
}

async function startAdminPanel() {
  showAdminPanel();
  setDefaultDates();
  await loadAdminData();
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
      <td>
        <span class="status ok">Aktif</span>
        <button class="small-button danger remove-staff" data-staff-id="${row.id}">Çıkart</button>
      </td>
    </tr>
  `).join("");
}

if (staffTableBody) {
  staffTableBody.addEventListener("click", async (e) => {
    const target = e.target;
    if (!target.classList.contains("remove-staff")) return;
    const staffId = target.dataset && target.dataset.staffId;
    if (!confirm("Personeli çıkarmak istediğinize emin misiniz? Bu işlem hocayı ilişkili programlardan kaldırır.")) return;
    try {
      await api(`/api/admin/staff/${staffId}`, { method: "DELETE" });
      await loadAdminData();
      alert("Personel çıkarıldı ve ilişkili programlar güncellendi.");
    } catch (err) {
      alert(err.message);
    }
  });
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
  summaryValues[3].textContent = `${summary.lowStockCount} Ürün`;

  fillSelect(assignmentMemberSelect, members, (row) => row.name);
  fillSelect(saleMemberSelect, members, (row) => row.name);
  fillSelect(assignmentStaffSelect, staff, (row) => row.name);
  if (memberStaffSelect) fillSelect(memberStaffSelect, staff, (row) => row.name);
  staffList = staff;
  membersList = members;
  renderMembers(membersList);
  fillSelect(saleProductSelect, products, (row) => `${row.name} - ${formatMoney(row.price)}`);
  renderStaff(staff);
  renderProducts(products);
}

function renderMembers(rows) {
  if (!membersTableBody) return;
  membersTableBody.innerHTML = rows
    .map((row) => `
      <tr>
        <td>${row.id}</td>
        <td class="member-name">${row.name}</td>
        <td>${row.phone || "-"}</td>
        <td>${row.coach || "-"}</td>
        <td>
          <button class="small-button view-member" data-member-id="${row.id}">Detay</button>
          <button class="small-button danger delete-member" data-member-id="${row.id}">Sil</button>
        </td>
      </tr>
    `).join("");
}

if (membersSearch) {
  membersSearch.addEventListener("input", (e) => {
    const q = String(e.target.value || "").toLowerCase().trim();
    if (!q) return renderMembers(membersList);
    renderMembers(membersList.filter((m) => (m.name || "").toLowerCase().includes(q)));
  });
}

if (membersTableBody) {
  membersTableBody.addEventListener("click", async (e) => {
    const target = e.target;
    const memberId = target.dataset && target.dataset.memberId;

    if (target.classList.contains("delete-member")) {
      if (!confirm("Üyeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
      try {
        await api(`/api/admin/members/${memberId}`, { method: "DELETE" });
        await loadAdminData();
        alert("Üye silindi.");
      } catch (err) {
        alert(err.message);
      }
      return;
    }

    

    if (target.classList.contains("view-member")) {
      try {
        const data = await api(`/api/members/${memberId}`);
        openMemberPanel(data);
      } catch (err) {
        alert(err.message);
      }
    }
  });
}

function openMemberPanel(data) {
  if (!memberPanel) {
    alert(`Üye: ${data.name}\nTelefon: ${data.phone}`);
    return;
  }

  memberDetailName.textContent = data.name || "Üye Detayı";
  memberDetailPhone.textContent = data.phone || "-";
  memberDetailCoach.textContent = data.coach || "-";
  memberDetailRegistered.textContent = data.registered || "-";
  memberDetailMembershipEnd.textContent = data.membership_end || "-";
  memberDetailProgram.textContent = data.program_detail || "-";

  if (Array.isArray(data.measurements) && data.measurements.length) {
    memberDetailMeasurements.innerHTML = data.measurements
      .map((m) => `<div class="measurement"><strong>${m.date}</strong>: ${m.weight || "-"}kg, ${m.height || "-"}cm, Yağ ${m.body_fat || "-"}%</div>`)
      .join("");
  } else {
    memberDetailMeasurements.textContent = "-";
  }

  memberPanel.setAttribute("aria-hidden", "false");
  memberPanel.classList.add("open");
  document.body.classList.add("modal-open");
}

function closeMemberPanel() {
  if (!memberPanel) return;
  memberPanel.setAttribute("aria-hidden", "true");
  memberPanel.classList.remove("open");
  document.body.classList.remove("modal-open");
}

if (memberPanelClose) memberPanelClose.addEventListener("click", closeMemberPanel);
if (memberPanelBackdrop) memberPanelBackdrop.addEventListener("click", closeMemberPanel);

async function submitForm(form, path, getBody) {
  try {
    await api(path, {
      method: "POST",
      body: JSON.stringify(getBody(new FormData(form))),
    });
    form.reset();
    setDefaultDates();
    await loadAdminData();
    alert("İşlem başarılı.");
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
    password: form.get("password"),
    staffId: form.get("staffId"),
    startDate: form.get("startDate"),
    endDate: form.get("endDate"),
  }));
});

staffForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitForm(staffForm, "/api/admin/staff", (form) => ({
    name: form.get("name"),
    salary: form.get("salary"),
    password: form.get("password"),
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

adminLogoutButton.addEventListener("click", () => {
  sessionStorage.removeItem(ADMIN_LOGIN_KEY);
  goHome();
});

if (sessionStorage.getItem(ADMIN_LOGIN_KEY) === "1") {
  startAdminPanel().catch((error) => alert(error.message));
} else {
  goHome();
}
