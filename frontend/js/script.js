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
  document.getElementById("modal-login").classList.add("show");
  limparErros();
}

function fecharModalLogin() {
  document.getElementById("modal-login").classList.remove("show");
}

function limparErros() {
  document.getElementById("login-error").classList.remove("show");
}

function mostrarErro(elId, mensagem) {
  const el = document.getElementById(elId);
  el.textContent = mensagem;
  el.classList.add("show");
}

// =====================================================
// MÁSCARAS DE INPUT (mesmas do central.js, reaproveitadas aqui pro formulário público)
// =====================================================
function mascararCPF(valor) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function mascararTelefone(valor) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

function mascararPlaca(valor) {
  let v = valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  if (/^[A-Z]{3}[0-9]{4}$/.test(v)) {
    return v.replace(/^([A-Z]{3})([0-9]{4})$/, "$1-$2");
  }
  return v;
}

// =====================================================
// FORMULÁRIO DE ORÇAMENTO → WHATSAPP
// não cadastra nada no banco — só monta a mensagem e abre o WhatsApp do Jeff
// =====================================================
const CATALOGO_SERVICOS_ORCAMENTO = [
  "Lavagem Simples",
  "Lavagem Detalhada",
  "Polimento Técnico",
  "Polimento Comercial",
  "Vitrificação",
  "Higienização Interna",
  "Revitalização de Faróis",
  "Lavagem de Motor",
  "Insulfilm",
  "Customizações",
];

function popularServicosOrcamento() {
  const select = document.getElementById("orc-servico");
  if (!select) return; // esse formulário só existe no index.html
  CATALOGO_SERVICOS_ORCAMENTO.forEach((titulo) => {
    const opt = document.createElement("option");
    opt.value = titulo;
    opt.textContent = titulo;
    select.appendChild(opt);
  });
}

function abrirModalOrcamento() {
  document.getElementById("modal-orcamento").classList.add("show");
  document.getElementById("orc-error").classList.remove("show");
}

function fecharModalOrcamento() {
  document.getElementById("modal-orcamento").classList.remove("show");
}

function enviarOrcamentoWhatsapp() {
  const nome = document.getElementById("orc-nome").value.trim();
  const cpf = document.getElementById("orc-cpf").value.trim();
  const telefone = document.getElementById("orc-telefone").value.trim();
  const email = document.getElementById("orc-email").value.trim();
  const endereco = document.getElementById("orc-endereco").value.trim();
  const modelo = document.getElementById("orc-modelo").value.trim();
  const placa = document.getElementById("orc-placa").value.trim();
  const servico = document.getElementById("orc-servico").value;

  if (!nome || !cpf || !telefone || !email || !endereco || !modelo || !placa || !servico) {
    mostrarErro("orc-error", "Preencha todos os campos antes de continuar.");
    return;
  }

  const mensagem =
    `Olá! Gostaria de um orçamento na Nippon Detail.\n\n` +
    `*Nome:* ${nome}\n` +
    `*CPF:* ${cpf}\n` +
    `*Telefone:* ${telefone}\n` +
    `*E-mail:* ${email}\n` +
    `*Endereço:* ${endereco}\n\n` +
    `*Veículo:* ${modelo} — Placa ${placa}\n` +
    `*Serviço desejado:* ${servico}`;

  const url = `https://wa.me/5511996968893?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank");
  fecharModalOrcamento();
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
// lógica de login extraída em função própria pra ficar fácil de reutilizar se precisar
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
    mostrarErro(elIdErro, "Usuário ou senha incorretos.");
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

// =====================================================
// TEMA (claro/escuro) — só existe na navbar pública
// sempre começa no escuro (não salva preferência entre recarregamentos)
// =====================================================
// =====================================================
// TEMA (claro/escuro) — persiste durante a aba aberta (sessionStorage),
// mas nunca "pra sempre": fechar a aba/navegador reseta pro escuro de novo
// =====================================================
function alternarTema() {
  document.body.classList.toggle("light-mode");
  const claro = document.body.classList.contains("light-mode");
  sessionStorage.setItem("nippon_tema", claro ? "claro" : "escuro");
  atualizarIconeTema();
}

function aplicarTemaSalvo() {
  const tema = sessionStorage.getItem("nippon_tema");
  if (tema === "claro") {
    document.body.classList.add("light-mode");
  }
  atualizarIconeTema();
}

function atualizarIconeTema() {
  const icon = document.getElementById("theme-toggle-icon");
  if (!icon) return; // esse botão só existe no index.html
  const claro = document.body.classList.contains("light-mode");
  icon.className = claro ? "ti ti-moon" : "ti ti-sun";
}

// =====================================================
// MENU MOBILE (hambúrguer)
// =====================================================
function alternarMenuMobile() {
  const menu = document.getElementById("navbar-mobile-menu");
  const icon = document.getElementById("menu-hamburguer-icon");
  if (!menu) return;
  const aberto = menu.classList.toggle("aberto");
  if (icon) icon.className = aberto ? "ti ti-x" : "ti ti-menu-2";
}

function fecharMenuMobile() {
  const menu = document.getElementById("navbar-mobile-menu");
  const icon = document.getElementById("menu-hamburguer-icon");
  if (!menu) return;
  menu.classList.remove("aberto");
  if (icon) icon.className = "ti ti-menu-2";
}

// =====================================================
// SCROLLSPY — atualiza qual link do menu fica "ativo" conforme rola a página
// =====================================================
function inicializarScrollspy() {
  const secoes = document.querySelectorAll("section[id]");
  const links = document.querySelectorAll(".navbar-menu a, .navbar-mobile-menu a");
  if (!secoes.length || !links.length) return; // essa navbar só existe no index.html

  function atualizarLinkAtivo() {
    // soma a altura da navbar fixa (88px) + uma folga, pra trocar um pouco antes de a seção
    // encostar no topo (senão o link troca só quando a seção já tá quase saindo de vista)
    const posicaoAtual = window.scrollY + 88 + 40;
    let idAtual = secoes[0].id;

    secoes.forEach((secao) => {
      if (secao.offsetTop <= posicaoAtual) {
        idAtual = secao.id;
      }
    });

    // se a última seção for mais baixa que a tela, a conta acima nunca "alcança" ela
    // (o navegador não deixa rolar além do necessário) — então força manualmente
    // quando o usuário já está no fim da página, não importa o cálculo de offsetTop
    const chegouNoFim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (chegouNoFim) {
      idAtual = secoes[secoes.length - 1].id;
    }

    links.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${idAtual}`);
    });
  }

  window.addEventListener("scroll", atualizarLinkAtivo);
  atualizarLinkAtivo(); // roda uma vez já na carga (ex: se a página abrir com scroll restaurado)
}

// =====================================================
// ANIMAÇÃO DE ENTRADA AO ROLAR
// toca só na primeira vez que cada seção aparece na tela; não repete
// até a página ser recarregada (o "reset" natural é o F5, não precisa salvar em lugar nenhum)
// =====================================================
function inicializarAnimacaoEntrada() {
  const alvos = document.querySelectorAll(".reveal-esquerda, .reveal-direita");
  if (!alvos.length) return;

  const observer = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("revelado");
          observer.unobserve(entrada.target); // já revelou — não precisa mais ficar de olho nela
        }
      });
    },
    { threshold: 0.15 }
  );

  alvos.forEach((el) => observer.observe(el));
}

checarLogin();
aplicarTemaSalvo();
inicializarScrollspy();
inicializarAnimacaoEntrada();
popularServicosOrcamento();
