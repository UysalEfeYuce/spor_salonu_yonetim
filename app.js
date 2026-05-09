const welcomeScreen = document.querySelector("#welcome-screen");
const loginModal = document.querySelector("#login-modal");
const modalSteps = loginModal.querySelectorAll(".modal-step");
const modalCloseButton = document.querySelector("#modal-close");
const modalBackButton = document.querySelector("#modal-back");
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

openLoginButtons.forEach((button) => {
  if (!button) return;
  button.addEventListener("click", () => {
    openLoginModal();
  });
});

modalCloseButton.addEventListener("click", closeLoginModal);

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

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !loginModal.classList.contains("is-hidden")) {
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

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loginMessage.textContent = "";

  closeLoginModal();

  if (selectedRole === "coach") {
    showOnly(coachPanel);
    return;
  }

  fillMemberPanel(testMemberData);
  showOnly(memberPanel);
});

logoutButtons.forEach((button) => {
  button.addEventListener("click", () => {
    loginForm.reset();
    roleCards.forEach((item) => item.classList.remove("active"));
    selectedRole = "member";
    showOnly(welcomeScreen);
  });
});
