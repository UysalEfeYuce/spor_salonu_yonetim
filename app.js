const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const welcomeScreen = $("#welcome-screen");
const loginModal = $("#login-modal");
const modalSteps = $$(".modal-step");
const modalCloseButton = $("#modal-close");
const modalBackButton = $("#modal-back");
const programModal = $("#program-modal");
const programModalCloseButton = $("#program-modal-close");
const programModalTitle = $("#program-modal-title");
const programModalSubtitle = $("#program-modal-subtitle");
const programFormModal = $("#program-form-modal");
const programFormCloseButton = $("#program-form-close");
const programForm = $("#program-form");
const programFormSubtitle = $("#program-form-subtitle");
const programTitleInput = $("#program-title-input");
const programDateInput = $("#program-date-input");
const programDetailInput = $("#program-detail-input");
const progressModal = $("#progress-modal");
const progressModalCloseButton = $("#progress-modal-close");
const progressModalTitle = $("#progress-modal-title");
const progressModalSubtitle = $("#progress-modal-subtitle");
const progressFormModal = $("#progress-form-modal");
const progressFormCloseButton = $("#progress-form-close");
const progressForm = $("#progress-form");
const progressFormSubtitle = $("#progress-form-subtitle");
const progressDateInput = $("#progress-date-input");
const progressWeightInput = $("#progress-weight-input");
const progressHeightInput = $("#progress-height-input");
const progressFatInput = $("#progress-fat-input");
const progressNoteInput = $("#progress-note-input");
const openLoginButtons = [$("#open-login-button"), $("#hero-login-button")];
const roleCards = $$(".role-card[data-role]");
const loginForm = $("#login-form");
const loginTitle = $("#login-title");
const loginMessage = $("#login-message");
const memberPanel = $("#member-panel");
const coachPanel = $("#coach-panel");
const newPurchaseButton = $("#new-purchase-button");
const purchaseModal = $("#purchase-modal");
const purchaseModalCloseButton = $("#purchase-modal-close");
const purchaseForm = $("#purchase-form");
const purchaseProductInput = $("#purchase-product-input");
const purchaseQuantityInput = $("#purchase-quantity-input");
const memberPurchasesBody = $("#member-purchases-body");
const logoutButtons = $$(".logout-button");
const loginSubmitButton = loginForm.querySelector('button[type="submit"]');

const fields = {
  name: $("#member-name"),
  avatar: $("#member-avatar"),
  memberId: $("#member-id"),
  fullName: $("#member-fullname"),
  phone: $("#member-phone"),
  registered: $("#member-registered"),
  membershipPackage: $("#membership-package"),
  membershipEnd: $("#membership-end"),
  membershipEndInline: $("#membership-end-inline"),
  remaining: $("#membership-remaining"),
  programName: $("#program-name"),
  programCoach: $("#program-coach"),
  programCoachName: $("#program-coach-name"),
  totalSpending: $("#total-spending"),
  memberProgramTitle: $("#member-program-title"),
  memberProgramDetail: $("#member-program-detail"),
};

const coachFields = {
  name: $("#coach-name"),
  avatar: $("#coach-avatar"),
  assignedCount: $("#assigned-count"),
  assignedButton: $("#show-assigned-members"),
  assignedCard: $("#assigned-members-card"),
  assignedList: $("#assigned-members-list"),
  progressList: $("#progress-members-list"),
  programDetail: $("#program-detail"),
  progressStatus: $("#selected-progress-status"),
  progressBody: $("#coach-progress-body"),
};

const demoMember = {
  name: "Uysal Efe Yüce",
  initials: "UE",
  member_id: "1042",
  full_name: "Uysal Efe Yüce",
  phone: "0544 222 33 44",
  registered: "12.01.2026",
  membership_package: "Aylık",
  membership_end: "31.05.2026",
  program_name: "4 Gün Hipertrofi",
  program_detail: "Pazartesi göğüs ve omuz, çarşamba sırt ve biceps, cuma bacak, cumartesi core.",
  coach: "Burak Koç",
  total_spending: "1.900 TL",
};

const demoCoach = {
  coach: {
    id: 1,
    name: "Burak Koç",
    initials: "BK",
  },
  assigned_members: [
    {
      id: 1042,
      name: "Uysal Efe Yüce",
      phone: "0544 222 33 44",
      programs: [
        {
          id: 7,
          title: "4 Gün Hipertrofi",
          details: "Pazartesi göğüs ve omuz, çarşamba sırt ve biceps, cuma bacak, cumartesi core.",
          days: "4",
          date: "05.05.2026",
        },
      ],
      progress: [
        {
          date: "05.05.2026",
          weight: "68",
          height: "176",
          body_fat: "15",
          note: "Gidişat iyi.",
        },
        {
          date: "28.04.2026",
          weight: "68.5",
          height: "176",
          body_fat: "15.4",
          note: "Takip devam.",
        },
      ],
    },
    {
      id: 1043,
      name: "Ayşe Kaya",
      phone: "0533 444 55 66",
      programs: [
        {
          id: 8,
          title: "3 Gün Yağ Yakımı",
          details: "Full body kuvvet ve düşük tempo kardiyo.",
          days: "3",
          date: "03.05.2026",
        },
      ],
      progress: [
        {
          date: "06.05.2026",
          weight: "74.2",
          height: "168",
          body_fat: "27.5",
          note: "Hedef aralıkta.",
        },
      ],
    },
  ],
};

const products = {
  whey: {
    name: "Whey Protein",
    price: 1250,
  },
  kreatin: {
    name: "Kreatin",
    price: 650,
  },
  shaker: {
    name: "Shaker",
    price: 180,
  },
};

let selectedRole = "member";
let currentCoachMembers = [];
let selectedCoachMember = null;
let memberTotalSpending = 0;

function setText(element, value) {
  if (element) {
    element.textContent = value ?? "-";
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function withUnit(value, unit) {
  if (value === null || value === undefined || value === "") return "-";
  const text = String(value);
  return text.includes(unit) ? text : `${text} ${unit}`;
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function inputDateToDisplay(value) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("tr-TR")} TL`;
}

function parseMoney(value) {
  const normalized = String(value || "")
    .replaceAll(".", "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");

  return Number(normalized) || 0;
}

function todayDisplayValue() {
  return new Date().toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function displayDateToInput(value) {
  if (!value || !value.includes(".")) return todayInputValue();
  const [day, month, year] = value.split(".");
  return `${year}-${month}-${day}`;
}

function calcRemainingDays(dateStr) {
  if (!dateStr) return "-";

  const parts = dateStr.split(".");
  if (parts.length !== 3) return "-";

  const target = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = Math.round((target - today) / 86400000);
  if (Number.isNaN(diff)) return "-";

  return diff > 0 ? `${diff} gün` : "Süresi doldu";
}

function showOnly(panel) {
  [welcomeScreen, memberPanel, coachPanel].forEach((item) => item.classList.add("is-hidden"));
  panel.classList.remove("is-hidden");
}

function showModalStep(stepName) {
  modalSteps.forEach((step) => {
    step.classList.toggle("is-hidden", step.dataset.step !== stepName);
  });
}

function openModal(modal) {
  modal.classList.remove("is-hidden");
  document.body.classList.add("modal-open");
}

function closeModal(modal) {
  modal.classList.add("is-hidden");

  const anyModalOpen = [loginModal, purchaseModal, programModal, programFormModal, progressModal, progressFormModal]
    .some((item) => item && !item.classList.contains("is-hidden"));

  document.body.classList.toggle("modal-open", anyModalOpen);
}

function openLoginModal() {
  openModal(loginModal);
  showModalStep("role");
  roleCards.forEach((item) => item.classList.remove("active"));
  setText(loginMessage, "");
}

function fillMemberPanel(data) {
  setText(fields.name, data.name || "Üye");
  setText(fields.avatar, data.initials || "Ü");
  setText(fields.memberId, data.member_id || "-");
  setText(fields.fullName, data.full_name || data.name || "-");
  setText(fields.phone, data.phone || "-");
  setText(fields.registered, data.registered || "-");
  setText(fields.membershipPackage, data.membership_package || "-");
  setText(fields.membershipEnd, data.membership_end || "-");
  setText(fields.membershipEndInline, data.membership_end || "-");
  setText(fields.remaining, calcRemainingDays(data.membership_end));
  setText(fields.programName, data.program_name || "-");
  setText(fields.programCoach, data.coach ? `Hoca: ${data.coach}` : "Hoca: -");
  setText(fields.programCoachName, data.coach || "-");
  setText(fields.totalSpending, data.total_spending || "-");
  memberTotalSpending = parseMoney(data.total_spending);
  setText(fields.memberProgramTitle, data.program_name || "Program Detayı");
  setText(fields.memberProgramDetail, data.program_detail || "Hoca tarafından yazılan program burada görünür.");
}

function emptyState(message) {
  return `<p class="empty-state">${escapeHtml(message)}</p>`;
}

function resetCoachPanel() {
  selectedCoachMember = null;
  currentCoachMembers = [];
  setText(coachFields.name, "Hoca");
  setText(coachFields.avatar, "H");
  setText(coachFields.assignedCount, "0 üye");
  setText(coachFields.assignedButton, "Atanmış Üyeleri Göster");
  coachFields.assignedCard.classList.add("is-hidden");
  coachFields.assignedList.innerHTML = emptyState("Girişten sonra üyeler listelenir.");
  coachFields.progressList.innerHTML = emptyState("Girişten sonra gelişim listesi görünür.");
  coachFields.programDetail.innerHTML = emptyState("Bir üye için programı göster.");
  setText(programModalTitle, "Program Detayı");
  setText(programModalSubtitle, "Seçilen üyenin programı.");
  setText(progressModalTitle, "Gelişim Kayıtları");
  setText(progressModalSubtitle, "Seçilen üyenin ölçüm kayıtları.");
  setText(coachFields.progressStatus, "Liste");
  coachFields.progressBody.innerHTML = '<tr><td colspan="5">Bir üye için gelişimi göster.</td></tr>';
  closeModal(programModal);
  closeModal(purchaseModal);
  closeModal(programFormModal);
  closeModal(progressModal);
  closeModal(progressFormModal);
}

function addPurchaseRow(product, quantity) {
  const total = product.price * quantity;
  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${escapeHtml(todayDisplayValue())}</td>
    <td>${escapeHtml(product.name)}</td>
    <td>${escapeHtml(quantity)}</td>
    <td><strong>${escapeHtml(formatMoney(total))}</strong></td>
  `;

  memberPurchasesBody.prepend(row);
  memberTotalSpending += total;
  setText(fields.totalSpending, formatMoney(memberTotalSpending));
}

function savePurchase(event) {
  event.preventDefault();

  const product = products[purchaseProductInput.value];
  const quantity = Math.max(1, Number(purchaseQuantityInput.value) || 1);

  if (!product) return;

  addPurchaseRow(product, quantity);
  purchaseQuantityInput.value = "1";
  closeModal(purchaseModal);
}

function renderProgramDetail(member) {
  const programs = Array.isArray(member.programs) ? member.programs : [];
  setText(programModalTitle, `${member.name || "Üye"} Programı`);
  setText(programModalSubtitle, "Hoca tarafından yazılan program detayı.");

  if (!programs.length) {
    coachFields.programDetail.innerHTML = emptyState("Bu üye için program bulunamadı.");
    openModal(programModal);
    return;
  }

  coachFields.programDetail.innerHTML = programs.map((program) => `
    <section class="program-card">
      <h3>${escapeHtml(program.title || "Program")}</h3>
      <dl class="program-meta">
        <div>
          <dt>Gün</dt>
          <dd>${escapeHtml(program.days || "-")}</dd>
        </div>
        <div>
          <dt>Başlangıç</dt>
          <dd>${escapeHtml(program.date || "-")}</dd>
        </div>
      </dl>
      <p>${escapeHtml(program.details || "Program detayı girilmemiş.")}</p>
    </section>
  `).join("");

  openModal(programModal);
}

function openProgramForm(member) {
  selectedCoachMember = member;
  const latestProgram = Array.isArray(member.programs) && member.programs.length ? member.programs[0] : {};

  setText(programFormSubtitle, `${member.name || "Üye"} için program detayı gir.`);
  programTitleInput.value = latestProgram.title || "";
  programDateInput.value = displayDateToInput(latestProgram.date);
  programDetailInput.value = latestProgram.details || "";
  openModal(programFormModal);
}

function saveProgram(event) {
  event.preventDefault();
  if (!selectedCoachMember) return;

  const program = {
    id: selectedCoachMember.programs?.[0]?.id || Date.now(),
    title: programTitleInput.value.trim() || "Antrenman Programı",
    details: programDetailInput.value.trim() || "Program detayı girilmedi.",
    days: "-",
    date: inputDateToDisplay(programDateInput.value),
  };

  selectedCoachMember.programs = [program];
  renderCoachMembers(currentCoachMembers);
  closeModal(programFormModal);
  renderProgramDetail(selectedCoachMember);
}

function renderProgressTable(member) {
  const progress = Array.isArray(member.progress) ? member.progress : [];
  setText(progressModalTitle, `${member.name || "Üye"} Gelişimi`);
  setText(progressModalSubtitle, "Ölçüm ve gelişim kayıtları.");

  if (!progress.length) {
    coachFields.progressBody.innerHTML = `<tr><td colspan="5">${escapeHtml(member.name || "Üye")} için kayıt bulunamadı.</td></tr>`;
    openModal(progressModal);
    return;
  }

  coachFields.progressBody.innerHTML = progress.map((row) => `
    <tr>
      <td>${escapeHtml(row.date || "-")}</td>
      <td><strong>${escapeHtml(withUnit(row.weight, "kg"))}</strong></td>
      <td>${escapeHtml(withUnit(row.height, "cm"))}</td>
      <td>${escapeHtml(withUnit(row.body_fat, "%"))}</td>
      <td>${escapeHtml(row.note || "-")}</td>
    </tr>
  `).join("");

  openModal(progressModal);
}

function openProgressForm(member) {
  selectedCoachMember = member;
  setText(progressFormSubtitle, `${member.name || "Üye"} için yeni ölçüm gir.`);
  progressDateInput.value = todayInputValue();
  progressWeightInput.value = "";
  progressHeightInput.value = "";
  progressFatInput.value = "";
  progressNoteInput.value = "";
  openModal(progressFormModal);
}

function saveProgress(event) {
  event.preventDefault();
  if (!selectedCoachMember) return;

  const row = {
    date: inputDateToDisplay(progressDateInput.value),
    weight: progressWeightInput.value,
    height: progressHeightInput.value,
    body_fat: progressFatInput.value,
    note: progressNoteInput.value.trim(),
  };

  selectedCoachMember.progress = [row, ...(selectedCoachMember.progress || [])];
  renderCoachMembers(currentCoachMembers);
  closeModal(progressFormModal);
  renderProgressTable(selectedCoachMember);
}

function renderCoachMembers(members) {
  if (!members.length) {
    coachFields.assignedList.innerHTML = emptyState("Atanmış üye bulunamadı.");
    coachFields.progressList.innerHTML = emptyState("Gelişim kaydı gösterilecek üye bulunamadı.");
    return;
  }

  coachFields.assignedList.innerHTML = "";
  coachFields.progressList.innerHTML = "";

  members.forEach((member) => {
    const latestProgram = Array.isArray(member.programs) && member.programs.length ? member.programs[0] : null;
    const latestProgress = Array.isArray(member.progress) && member.progress.length ? member.progress[0] : null;

    const item = document.createElement("div");
    item.className = "coach-member-item";
    item.innerHTML = `
      <div>
        <h3>${escapeHtml(member.name || "Üye")}</h3>
        <small>${escapeHtml(latestProgram?.title || "Program bekliyor")}</small>
      </div>
      <div class="item-actions">
        <button class="outline-button small" type="button" data-action="show-program">Göster</button>
        <button class="primary-button small" type="button" data-action="write-program">Program Yaz</button>
      </div>
    `;
    item.querySelector('[data-action="show-program"]').addEventListener("click", () => renderProgramDetail(member));
    item.querySelector('[data-action="write-program"]').addEventListener("click", () => openProgramForm(member));
    coachFields.assignedList.appendChild(item);

    const progressItem = document.createElement("div");
    progressItem.className = "progress-member-item";
    progressItem.innerHTML = `
      <div>
        <strong>${escapeHtml(member.name || "Üye")}</strong>
        <small>${escapeHtml(latestProgress ? `${withUnit(latestProgress.weight, "kg")} - ${latestProgress.date}` : "Ölçüm yok")}</small>
      </div>
      <div class="item-actions">
        <button class="outline-button small" type="button" data-action="show-progress">Göster</button>
        <button class="primary-button small" type="button" data-action="add-progress">Ölçüm Ekle</button>
      </div>
    `;
    progressItem.querySelector('[data-action="show-progress"]').addEventListener("click", () => renderProgressTable(member));
    progressItem.querySelector('[data-action="add-progress"]').addEventListener("click", () => openProgressForm(member));
    coachFields.progressList.appendChild(progressItem);
  });
}

function fillCoachPanel(data) {
  const coach = data.coach || {};
  currentCoachMembers = Array.isArray(data.assigned_members) ? data.assigned_members : [];

  setText(coachFields.name, coach.name || "Hoca");
  setText(coachFields.avatar, coach.initials || "H");
  setText(coachFields.assignedCount, `${currentCoachMembers.length} üye`);
  setText(coachFields.assignedButton, `Atanmış Üyeleri Göster (${currentCoachMembers.length})`);
  coachFields.assignedCard.classList.add("is-hidden");
  renderCoachMembers(currentCoachMembers);
}

async function requestPanelData(endpoint) {
  const formData = new FormData(loginForm);
  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Giriş başarısız.");
  }

  return payload.data;
}

function normalizeMemberData(apiData) {
  return {
    ...demoMember,
    name: apiData.name || demoMember.name,
    initials: apiData.initials || demoMember.initials,
    full_name: apiData.name || demoMember.full_name,
    membership_end: apiData.membership_end || demoMember.membership_end,
    program_name: apiData.today_program || demoMember.program_name,
    program_detail: apiData.today_program || demoMember.program_detail,
  };
}

async function loginMember() {
  try {
    const apiData = await requestPanelData("member_dashboard.php");
    fillMemberPanel(normalizeMemberData(apiData));
  } catch (error) {
    fillMemberPanel(demoMember);
  }

  closeModal(loginModal);
  showOnly(memberPanel);
}

async function loginCoach() {
  try {
    const apiData = await requestPanelData("coach_dashboard.php");
    fillCoachPanel(apiData);
  } catch (error) {
    fillCoachPanel(demoCoach);
  }

  closeModal(loginModal);
  showOnly(coachPanel);
}

openLoginButtons.forEach((button) => {
  button?.addEventListener("click", openLoginModal);
});

coachFields.assignedButton.addEventListener("click", () => {
  const shouldOpen = coachFields.assignedCard.classList.contains("is-hidden");
  coachFields.assignedCard.classList.toggle("is-hidden", !shouldOpen);
  setText(
    coachFields.assignedButton,
    shouldOpen ? "Atanmış Üyeleri Gizle" : `Atanmış Üyeleri Göster (${currentCoachMembers.length})`,
  );
});

modalCloseButton.addEventListener("click", () => closeModal(loginModal));
newPurchaseButton.addEventListener("click", () => openModal(purchaseModal));
purchaseModalCloseButton.addEventListener("click", () => closeModal(purchaseModal));
purchaseForm.addEventListener("submit", savePurchase);
programModalCloseButton.addEventListener("click", () => closeModal(programModal));
programFormCloseButton.addEventListener("click", () => closeModal(programFormModal));
progressModalCloseButton.addEventListener("click", () => closeModal(progressModal));
progressFormCloseButton.addEventListener("click", () => closeModal(progressFormModal));
programForm.addEventListener("submit", saveProgram);
progressForm.addEventListener("submit", saveProgress);

modalBackButton.addEventListener("click", () => {
  showModalStep("role");
  roleCards.forEach((item) => item.classList.remove("active"));
  setText(loginMessage, "");
});

[loginModal, purchaseModal, programModal, programFormModal, progressModal, progressFormModal].forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  [progressFormModal, progressModal, programFormModal, programModal, purchaseModal, loginModal].forEach((modal) => {
    if (!modal.classList.contains("is-hidden")) {
      closeModal(modal);
    }
  });
});

roleCards.forEach((card) => {
  card.addEventListener("click", () => {
    selectedRole = card.dataset.role;
    roleCards.forEach((item) => item.classList.remove("active"));
    card.classList.add("active");
    setText(loginTitle, selectedRole === "coach" ? "Hoca Girişi" : "Üye Girişi");
    setText(loginMessage, "");
    showModalStep("login");
  });
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setText(loginMessage, "Giriş yapılıyor...");
  loginSubmitButton.disabled = true;

  if (selectedRole === "coach") {
    await loginCoach();
  } else {
    await loginMember();
  }

  loginSubmitButton.disabled = false;
  setText(loginMessage, "");
});

logoutButtons.forEach((button) => {
  button.addEventListener("click", () => {
    loginForm.reset();
    roleCards.forEach((item) => item.classList.remove("active"));
    selectedRole = "member";
    resetCoachPanel();
    showOnly(welcomeScreen);
  });
});

resetCoachPanel();
