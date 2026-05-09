const loginForm = document.querySelector("#login-form");
const loginPlaceholder = document.querySelector("#login-placeholder");
const memberPanel = document.querySelector("#member-panel");
const logoutButton = document.querySelector("#logout-button");
const roleButtons = document.querySelectorAll(".role-tabs button");
const loginMessage = document.querySelector("#login-message");

const fields = {
  name: document.querySelector("#member-name"),
  avatar: document.querySelector("#member-avatar"),
  membershipEnd: document.querySelector("#membership-end"),
  lastWeight: document.querySelector("#last-weight"),
  programDays: document.querySelector("#program-days"),
  todayProgram: document.querySelector("#today-program-text"),
};

const testMemberData = {
  name: "Uysal Efe Yüce",
  initials: "UE",
  membership_end: "10.05.2026",
  last_weight: "68",
  program_days: "4",
  today_program: "Göğüs, omuz ve triceps odaklı antrenman.",
};

roleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    roleButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
  });
});

function showMessage(message) {
  loginMessage.textContent = message;
}

function fillMemberPanel(data) {
  fields.name.textContent = data.name || "Üye";
  fields.avatar.textContent = data.initials || "Ü";
  fields.membershipEnd.textContent = data.membership_end || "-";
  fields.lastWeight.textContent = data.last_weight ? `${data.last_weight} kg` : "-";
  fields.programDays.textContent = data.program_days ? `${data.program_days} Gün` : "-";
  fields.todayProgram.textContent = data.today_program || "Bugün için program bulunamadı.";
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  showMessage("");
  fillMemberPanel(testMemberData);
  loginPlaceholder.classList.add("is-hidden");
  memberPanel.classList.remove("is-hidden");
});

logoutButton.addEventListener("click", () => {
  memberPanel.classList.add("is-hidden");
  loginPlaceholder.classList.remove("is-hidden");
  loginForm.reset();
  showMessage("");
});
