let selectedRole = null;

function showForm(role) {
  selectedRole = role;
  document.getElementById("auth-selection").classList.add("hidden");
  document.getElementById("auth-forms").classList.remove("hidden");

  document.getElementById("form-title").innerText =
    role === "doctor" ? "Doctor Login / Sign Up" : "Patient Login / Sign Up";

  // Set role for hidden inputs
  document.getElementById("role-input-login").value = role;
  document.getElementById("role-input-signup").value = role;
}

function goBack() {
  document.getElementById("auth-forms").classList.add("hidden");
  document.getElementById("auth-selection").classList.remove("hidden");
}

function toggleAuth(type) {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const loginBtn = document.getElementById("login-btn");
  const signupBtn = document.getElementById("signup-btn");

  if (type === "login") {
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
    loginBtn.classList.add("active");
    signupBtn.classList.remove("active");
  } else {
    loginForm.classList.add("hidden");
    signupForm.classList.remove("hidden");
    signupBtn.classList.add("active");
    loginBtn.classList.remove("active");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // server injects these into the template as globals (see below)
  if (window.__EVURA_ROLE) {
    showForm(window.__EVURA_ROLE);
    // active tab: "login" or "signup"
    if (window.__EVURA_ACTIVE) toggleAuth(window.__EVURA_ACTIVE);
  }
});
