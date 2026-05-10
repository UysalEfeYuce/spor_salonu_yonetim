const welcomeScreen = document.querySelector("#welcome-screen");
const loginModal = document.querySelector("#login-modal");
const modalSteps = loginModal.querySelectorAll(".modal-step");
const modalCloseButton = document.querySelector("#modal-close");
const modalBackButton = document.querySelector("#modal-back");
const programModal = document.querySelector("#program-modal");
const programModalCloseButton = document.querySelector("#program-modal-close");
const programModalTitle = document.querySelector("#program-modal-title");
const programModalSubtitle = document.querySelector("#program-modal-subtitle");
const progressModal = document.querySelector("#progress-modal");
const progressModalCloseButton = document.querySelector("#progress-modal-close");
const progressModalTitle = document.querySelector("#progress-modal-title");
const progressModalSubtitle = document.querySelector("#progress-modal-subtitle");
const openLoginButtons = [
  document.querySelector("#open-login-button"),
  document.querySelector("#hero-login-button"),
];
const roleCards = document.querySelectorAll(".role-card[data-role]");
const loginForm = document.querySelector("#login-form");
const loginTitle = document.querySelector("#login-title");
const loginMessage = document.querySelector("#login-message");
const memberPanel = document.querySelector("#member-panel");
const coachPanel = document.querySelector("#coach-panel");
const logoutButtons = document.querySelectorAll(".logout-button");
const loginSubmitButton = loginForm.querySelector('button[type="submit"]');

const fields = {
  name: document.querySelector("#member-name"),
  avatar: document.querySelector("#member-avatar"),
  memberId: document.querySelector("#member-id"),
  fullName: document.querySelector("#member-fullname"),
  phone: document.querySelector("#member-phone"),
  registered: document.querySelector("#member-registered"),
  membershipPackage: document.querySelector("#membership-package"),
  membershipEnd: document.querySelector("#membership-end"),
  membershipEndInline: document.querySelector("#membership-end-inline"),
  remaining: document.querySelector("#membership-remaining"),
  programName: document.querySelector("#program-name"),
  programCoach: document.querySelector("#program-coach"),
  programCoachName: document.querySelector("#program-coach-name"),
  totalSpending: document.querySelector("#total-spending"),
};

const coachFields = {
  name: document.querySelector("#coach-name"),
  avatar: document.querySelector("#coach-avatar"),
  assignedCount: document.querySelector("#assigned-count"),
  assignedButton: document.querySelector("#show-assigned-members"),
  assignedCard: document.querySelector("#assigned-members-card"),
  assignedList: document.querySelector("#assigned-members-list"),
  progressList: document.querySelector("#progress-members-list"),
  programDetail: document.querySelector("#program-detail"),
  progressStatus: document.querySelector("#selected-progress-status"),
  progressBody: document.querySelector("#coach-progress-body"),
};

const testMemberData = {
  name: "Uysal Efe Yüce",
  initials: "UE",
  member_id: "#1042",
  full_name: "Uysal Efe Yüce",
  phone: "0544 222 33 44",
  registered: "12.01.2026",
  membership_package: "Premium · Aylık",
  membership_end: "10.05.2026",
  program_name: "Hipertrofi - 4 Gün",
  coach: "Burak Koç",
  total_spending: "2.560 TL",
};

const demoCoachData = {
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
          title: "Hipertrofi - 4 Gün",
          details: "Pazartesi göğüs, omuz ve triceps; Salı sırt ve biceps; Perşembe bacak; Cuma omuz ve karın. Ana hareketlerde kontrollü tempo, son sette 1-2 tekrar yedek bırakılacak.",
          days: "4",
          date: "05.05.2026",
        },
      ],
      progress: [
        {
          date: "05.05.2026",
          weight: "68",
          body_fat: "15",
          waist: "78",
          note: "Kilo düşüşü kontrollü, kuvvet korunuyor.",
        },
        {
          date: "28.04.2026",
          weight: "68.5",
          body_fat: "15.4",
          waist: "79",
          note: "Beslenme uyumu iyi.",
        },
        {
          date: "21.04.2026",
          weight: "69.2",
          body_fat: "16",
          waist: "80",
          note: "Kardiyo süresi artırıldı.",
        },
      ],
    },
  ],
};

function calcRemainingDays(dateStr) {
  if (!dateStr) return "-";
  const parts = dateStr.split(".");
  if (parts.length !== 3) return "-";
  const target = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (Number.isNaN(diff)) return "-";
  return diff > 0 ? `${diff} gün` : "Süresi doldu";
}

let selectedRole = "member";

function showOnly(panel) {
  [welcomeScreen, memberPanel, coachPanel].forEach((item) => {
    item.classList.add("is-hidden");
  });
  panel.classList.remove("is-hidden");
}

function showModalStep(stepName) {
  modalSteps.forEach((step) => {
    if (step.dataset.step === stepName) {
      step.classList.remove("is-hidden");
    } else {
      step.classList.add("is-hidden");
    }
  });
}

function openLoginModal() {
  loginModal.classList.remove("is-hidden");
  document.body.classList.add("modal-open");
  showModalStep("role");
  roleCards.forEach((item) => item.classList.remove("active"));
  loginMessage.textContent = "";
  requestAnimationFrame(() => {
    loginModal.classList.add("is-visible");
  });
}

function closeLoginModal() {
  loginModal.classList.remove("is-visible");
  document.body.classList.remove("modal-open");
  setTimeout(() => {
    loginModal.classList.add("is-hidden");
  }, 200);
}

function openProgramModal() {
  programModal.classList.remove("is-hidden");
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => {
    programModal.classList.add("is-visible");
  });
}

function closeProgramModal() {
  programModal.classList.remove("is-visible");
  document.body.classList.remove("modal-open");
  setTimeout(() => {
    programModal.classList.add("is-hidden");
  }, 200);
}

function openProgressModal() {
  progressModal.classList.remove("is-hidden");
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => {
    progressModal.classList.add("is-visible");
  });
}

function closeProgressModal() {
  progressModal.classList.remove("is-visible");
  document.body.classList.remove("modal-open");
  setTimeout(() => {
    progressModal.classList.add("is-hidden");
  }, 200);
}

function fillMemberPanel(data) {
  fields.name.textContent = data.name || "Üye";
  fields.avatar.textContent = data.initials || "Ü";
  fields.memberId.textContent = data.member_id || "-";
  fields.fullName.textContent = data.full_name || data.name || "-";
  fields.phone.textContent = data.phone || "-";
  fields.registered.textContent = data.registered || "-";
  fields.membershipPackage.textContent = data.membership_package || "-";
  fields.membershipEnd.textContent = data.membership_end || "-";
  fields.membershipEndInline.textContent = data.membership_end || "-";
  fields.remaining.textContent = calcRemainingDays(data.membership_end);
  fields.programName.textContent = data.program_name || "-";
  fields.programCoach.textContent = data.coach ? `hoca: ${data.coach}` : "hoca: -";
  fields.programCoachName.textContent = data.coach || "-";
  fields.totalSpending.textContent = data.total_spending || "-";
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

function emptyCoachState(message) {
  return `<p class="empty-state">${escapeHtml(message)}</p>`;
}

function resetCoachPanel() {
  coachFields.name.textContent = "Hoca";
  coachFields.avatar.textContent = "H";
  coachFields.assignedCount.textContent = "0 üye";
  coachFields.assignedButton.textContent = "Atanmış Üyeleri Gör";
  coachFields.assignedCard.classList.add("is-hidden");
  coachFields.assignedList.innerHTML = emptyCoachState("Hoca girişi sonrası atanmış üyeler listelenir.");
  coachFields.progressList.innerHTML = emptyCoachState("Hoca girişi sonrası gelişimi incelenebilecek üyeler listelenir.");
  coachFields.programDetail.innerHTML = emptyCoachState("Bir üye için “Programı Gör” butonuna bas.");
  programModalTitle.textContent = "Program Detayları";
  programModalSubtitle.textContent = "Seçilen üyenin programı.";
  progressModalTitle.textContent = "Gelişim Kayıtları";
  progressModalSubtitle.textContent = "Seçilen üyenin gelişim tablosu.";
  programModal.classList.add("is-hidden");
  programModal.classList.remove("is-visible");
  progressModal.classList.add("is-hidden");
  progressModal.classList.remove("is-visible");
  coachFields.progressStatus.textContent = "Liste";
  coachFields.progressBody.innerHTML = '<tr><td colspan="5">Bir üye için “Gelişimi Göster” butonuna bas.</td></tr>';
}

function renderProgramDetail(member) {
  const programs = Array.isArray(member.programs) ? member.programs : [];
  programModalTitle.textContent = `${member.name || "Üye"} Programı`;
  programModalSubtitle.textContent = "Atanmış program detayları.";

  if (!programs.length) {
    coachFields.programDetail.innerHTML = emptyCoachState(`${member.name || "Seçili üye"} için atanmış program bulunamadı.`);
    openProgramModal();
    return;
  }

  coachFields.programDetail.innerHTML = programs.map((program) => `
    <section class="program-card">
      <div>
        <span class="program-card-label">${escapeHtml(member.name || "Üye")}</span>
        <h3>${escapeHtml(program.title || "Program")}</h3>
      </div>
      <dl class="program-meta">
        <div>
          <dt>Gün</dt>
          <dd>${escapeHtml(program.days || "-")}</dd>
        </div>
        <div>
          <dt>Tarih</dt>
          <dd>${escapeHtml(program.date || "-")}</dd>
        </div>
      </dl>
      <p>${escapeHtml(program.details || "Program detayı girilmemiş.")}</p>
    </section>
  `).join("");
  openProgramModal();
}

function renderProgressTable(member) {
  const progress = Array.isArray(member.progress) ? member.progress : [];
  progressModalTitle.textContent = `${member.name || "Üye"} Gelişimi`;
  progressModalSubtitle.textContent = "Ölçüm ve gelişim kayıtları.";

  if (!progress.length) {
    coachFields.progressBody.innerHTML = `<tr><td colspan="5">${escapeHtml(member.name || "Seçili üye")} için gelişim kaydı bulunamadı.</td></tr>`;
    openProgressModal();
    return;
  }

  coachFields.progressBody.innerHTML = progress.map((row) => `
    <tr>
      <td>${escapeHtml(row.date || "-")}</td>
      <td><strong>${escapeHtml(withUnit(row.weight, "kg"))}</strong></td>
      <td>${escapeHtml(withUnit(row.body_fat, "%"))}</td>
      <td>${escapeHtml(withUnit(row.waist, "cm"))}</td>
      <td>${escapeHtml(row.note || "-")}</td>
    </tr>
  `).join("");
  openProgressModal();
}

function renderCoachMembers(members) {
  if (!members.length) {
    coachFields.assignedList.innerHTML = emptyCoachState("Bu hocaya atanmış üye bulunamadı.");
    coachFields.progressList.innerHTML = emptyCoachState("Gelişim kaydı göstermek için atanmış üye bulunamadı.");
    return;
  }

  coachFields.assignedList.innerHTML = "";
  coachFields.progressList.innerHTML = "";

  members.forEach((member) => {
    const latestProgram = Array.isArray(member.programs) && member.programs.length ? member.programs[0] : null;
    const item = document.createElement("div");
    item.className = "coach-member-item";
    item.innerHTML = `
      <div>
        <h3>${escapeHtml(member.name || "Üye")}</h3>
        <small>${escapeHtml(latestProgram?.title || "Program ataması yok")}</small>
      </div>
      <button class="outline-button small" type="button">Programı Göster</button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      coachFields.assignedList.querySelectorAll(".coach-member-item").forEach((listItem) => {
        listItem.classList.remove("is-selected");
      });
      item.classList.add("is-selected");
      renderProgramDetail(member);
    });
    coachFields.assignedList.appendChild(item);

    const progressItem = document.createElement("div");
    progressItem.className = "progress-member-item";
    progressItem.innerHTML = `
      <div>
        <strong>${escapeHtml(member.name || "Üye")}</strong>
        <small>${escapeHtml((member.progress || []).length)} kayıt</small>
      </div>
      <button class="outline-button small" type="button">Gelişimi Göster</button>
    `;
    progressItem.querySelector("button").addEventListener("click", () => {
      coachFields.progressList.querySelectorAll(".progress-member-item").forEach((listItem) => {
        listItem.classList.remove("is-selected");
      });
      progressItem.classList.add("is-selected");
      renderProgressTable(member);
    });
    coachFields.progressList.appendChild(progressItem);
  });
}

function fillCoachPanel(data) {
  const coach = data.coach || {};
  const members = Array.isArray(data.assigned_members) ? data.assigned_members : [];

  coachFields.name.textContent = coach.name || "Hoca";
  coachFields.avatar.textContent = coach.initials || "H";
  coachFields.assignedCount.textContent = `${members.length} üye`;
  coachFields.assignedButton.textContent = `Atanmış Üyeleri Gör (${members.length})`;
  coachFields.assignedCard.classList.add("is-hidden");
  coachFields.programDetail.innerHTML = emptyCoachState("Bir üye için “Programı Gör” butonuna bas.");
  programModal.classList.add("is-hidden");
  programModal.classList.remove("is-visible");
  progressModal.classList.add("is-hidden");
  progressModal.classList.remove("is-visible");
  coachFields.progressStatus.textContent = "Liste";
  coachFields.progressBody.innerHTML = '<tr><td colspan="5">Bir üye için “Gelişimi Göster” butonuna bas.</td></tr>';
  renderCoachMembers(members);
}

async function loadCoachPanel() {
  loginMessage.textContent = "Demo hoca paneli açılıyor...";
  loginSubmitButton.disabled = true;

  fillCoachPanel(demoCoachData);
  closeLoginModal();
  showOnly(coachPanel);
  loginSubmitButton.disabled = false;
}

openLoginButtons.forEach((button) => {
  if (!button) return;
  button.addEventListener("click", () => {
    openLoginModal();
  });
});

coachFields.assignedButton.addEventListener("click", () => {
  const shouldOpen = coachFields.assignedCard.classList.contains("is-hidden");
  coachFields.assignedCard.classList.toggle("is-hidden", !shouldOpen);
  coachFields.assignedButton.textContent = shouldOpen
    ? "Atanmış Üyeleri Gizle"
    : `Atanmış Üyeleri Gör (${demoCoachData.assigned_members.length})`;
});

modalCloseButton.addEventListener("click", closeLoginModal);
programModalCloseButton.addEventListener("click", closeProgramModal);
progressModalCloseButton.addEventListener("click", closeProgressModal);

modalBackButton.addEventListener("click", () => {
  showModalStep("role");
  roleCards.forEach((item) => item.classList.remove("active"));
  loginMessage.textContent = "";
});

loginModal.addEventListener("click", (event) => {
  if (event.target === loginModal) {
    closeLoginModal();
  }
});

programModal.addEventListener("click", (event) => {
  if (event.target === programModal) {
    closeProgramModal();
  }
});

progressModal.addEventListener("click", (event) => {
  if (event.target === progressModal) {
    closeProgressModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  if (!progressModal.classList.contains("is-hidden")) {
    closeProgressModal();
    return;
  }

  if (!programModal.classList.contains("is-hidden")) {
    closeProgramModal();
    return;
  }

  if (!loginModal.classList.contains("is-hidden")) {
    closeLoginModal();
  }
});

roleCards.forEach((card) => {
  card.addEventListener("click", () => {
    selectedRole = card.dataset.role;
    roleCards.forEach((item) => item.classList.remove("active"));
    card.classList.add("active");
    loginTitle.textContent = selectedRole === "coach" ? "Hoca Girişi" : "Üye Girişi";
    loginMessage.textContent = "";
    showModalStep("login");
  });
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "";

  if (selectedRole === "coach") {
    await loadCoachPanel();
    return;
  }

  closeLoginModal();
  fillMemberPanel(testMemberData);
  showOnly(memberPanel);
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
