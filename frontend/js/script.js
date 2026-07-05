// =====================================================
// CONFIG
// =====================================================
const API_URL = "http://localhost:8000";
const AUTOPLAY_MS = 5000;

// =====================================================
// CARROSSEL
// =====================================================
const slides = document.querySelectorAll(".hero-slide");
const dotsContainer = document.getElementById("hero-dots");
const totalSlides = slides.length;
let indiceAtual = 0;
let autoplayTimer = null;

// cria as bolinhas dinamicamente, uma pra cada slide
function criarDots() {
  dotsContainer.innerHTML = "";
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement("div");
    dot.className = "hero-dot" + (i === 0 ? " active" : "");
    dot.onclick = () => irParaSlide(i);
    dotsContainer.appendChild(dot);
  }
}

function atualizarSlides() {
  slides.forEach((slide, i) => {
    slide.classList.toggle("active", i === indiceAtual);
  });
  document.querySelectorAll(".hero-dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === indiceAtual);
  });
}

function carrosselProximo() {
  indiceAtual = (indiceAtual + 1) % totalSlides; // volta pro 0 depois do último
  atualizarSlides();
  resetarAutoplay();
}

function carrosselAnterior() {
  indiceAtual = (indiceAtual - 1 + totalSlides) % totalSlides; // evita número negativo
  atualizarSlides();
  resetarAutoplay();
}

function irParaSlide(i) {
  indiceAtual = i;
  atualizarSlides();
  resetarAutoplay();
}

function iniciarAutoplay() {
  autoplayTimer = setInterval(() => {
    indiceAtual = (indiceAtual + 1) % totalSlides;
    atualizarSlides();
  }, AUTOPLAY_MS);
}

function resetarAutoplay() {
  clearInterval(autoplayTimer);
  iniciarAutoplay();
}

if (dotsContainer) {
  criarDots();
  iniciarAutoplay();
}

// =====================================================
// MODAIS — LOGIN / CADASTRO
// =====================================================
function abrirModalLogin() {
  document.getElementById("modal-cadastro").classList.remove("show");
  document.getElementById("modal-login").classList.add("show");
  limparErros();
}

function fecharModalLogin() {
  document.getElementById("modal-login").classList.remove("show");
}

function abrirModalCadastro() {
  document.getElementById("modal-login").classList.remove("show");
  document.getElementById("modal-cadastro").classList.add("show");
  limparErros();
}

function fecharModalCadastro() {
  document.getElementById("modal-cadastro").classList.remove("show");
}

function limparErros() {
  document.getElementById("login-error").classList.remove("show");
  document.getElementById("cadastro-error").classList.remove("show");
}

function mostrarErro(elId, mensagem) {
  const el = document.getElementById(elId);
  el.textContent = mensagem;
  el.classList.add("show");
}

// fecha modal clicando fora da caixa
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("show");
  });
});

// =====================================================
// AUTENTICAÇÃO
// =====================================================
// lógica de login extraída pra ser reutilizada tanto pelo botão "Entrar"
// quanto automaticamente logo depois de um cadastro bem-sucedido
async function realizarLogin(username, password, elIdErro) {
  const corpo = new URLSearchParams();
  corpo.append("username", username);
  corpo.append("password", password);

  const resp = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: corpo,
  });

  if (!resp.ok) {
    mostrarErro(elIdErro, "Conta criada, mas não foi possível entrar automaticamente. Tente fazer login manualmente.");
    return false;
  }

  const data = await resp.json();
  localStorage.setItem("nippon_token", data.access_token);
  localStorage.setItem("nippon_username", username);
  return true;
}

async function fazerLogin() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;

  if (!username || !password) {
    mostrarErro("login-error", "Preencha usuário e senha.");
    return;
  }

  try {
    const sucesso = await realizarLogin(username, password, "login-error");
    if (!sucesso) return;

    fecharModalLogin();
    irParaCentral();
  } catch (err) {
    mostrarErro("login-error", "Não foi possível conectar ao servidor.");
  }
}

async function fazerCadastro() {
  const username = document.getElementById("cadastro-username").value.trim();
  const password = document.getElementById("cadastro-password").value;
  const role = document.getElementById("cadastro-role").value;

  if (!username || !password) {
    mostrarErro("cadastro-error", "Preencha usuário e senha.");
    return;
  }

  if (username.length < 5) {
    mostrarErro("cadastro-error", "O usuário precisa ter no mínimo 5 caracteres.");
    return;
  }

  if (password.length < 8) {
    mostrarErro("cadastro-error", "A senha precisa ter no mínimo 8 caracteres.");
    return;
  }

  try {
    const resp = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role }),
    });

    if (!resp.ok) {
      mostrarErro("cadastro-error", "Não foi possível criar a conta. Usuário já existe?");
      return;
    }

    // cadastro OK -> loga automaticamente com as mesmas credenciais, sem pedir de novo
    const sucesso = await realizarLogin(username, password, "cadastro-error");
    if (!sucesso) return;

    fecharModalCadastro();
    irParaCentral();
  } catch (err) {
    mostrarErro("cadastro-error", "Não foi possível conectar ao servidor.");
  }
}

function fazerLogout() {
  localStorage.removeItem("nippon_token");
  localStorage.removeItem("nippon_username");
  window.location.reload();
}

function irParaCentral() {
  window.location.href = "central.html";
}

// =====================================================
// CHECAGEM DE LOGIN AO CARREGAR A PÁGINA
// =====================================================
function checarLogin() {
  const token = localStorage.getItem("nippon_token");
  const username = localStorage.getItem("nippon_username");

  const authBox = document.getElementById("navbar-auth");
  const userBox = document.getElementById("navbar-user");

  // essa lógica só existe na navbar pública (index.html) — central.html não tem esses elementos
  if (!authBox || !userBox) return;

  if (token) {
    authBox.style.display = "none";
    userBox.style.display = "flex";
    document.getElementById("navbar-username").textContent = username || "Admin";
  } else {
    authBox.style.display = "flex";
    userBox.style.display = "none";
  }
}

checarLogin();
