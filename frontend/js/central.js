// =====================================================
// PROTEÇÃO DE ROTA — só admin logado acessa essa página
// =====================================================
(function checarAcesso() {
  const token = localStorage.getItem("nippon_token");
  if (!token) {
    window.location.href = "index.html";
  }
})();

document.getElementById("admin-username").textContent =
  localStorage.getItem("nippon_username") || "Admin";

// =====================================================
// HELPER: headers com token de autenticação
// =====================================================
function authHeaders(comJson = true) {
  const headers = { Authorization: `Bearer ${localStorage.getItem("nippon_token")}` };
  if (comJson) headers["Content-Type"] = "application/json";
  return headers;
}

// se a API responder 401 (token expirado/inválido), manda pro login de novo
function tratarRespostaAuth(resp) {
  if (resp.status === 401) {
    localStorage.removeItem("nippon_token");
    localStorage.removeItem("nippon_username");
    window.location.href = "index.html";
    return true;
  }
  return false;
}

// =====================================================
// MODAIS — genérico (abrir/fechar por id)
// =====================================================
function abrirModal(id) {
  document.getElementById(id).classList.add("show");
}
function fecharModal(id) {
  document.getElementById(id).classList.remove("show");
}

// =====================================================
// CONFIRMAÇÃO GENÉRICA (usada por apagar em qualquer tela)
// =====================================================
let acaoConfirmadaCallback = null;

function pedirConfirmacao(titulo, callback) {
  document.getElementById("confirm-title").textContent = titulo;
  acaoConfirmadaCallback = callback;
  document.getElementById("confirm-overlay").classList.add("show");
}

function fecharConfirm() {
  document.getElementById("confirm-overlay").classList.remove("show");
  acaoConfirmadaCallback = null;
}

function confirmarAcaoAtual() {
  if (acaoConfirmadaCallback) acaoConfirmadaCallback();
  fecharConfirm();
}

// =====================================================
// VEÍCULOS
// =====================================================
let todosVeiculos = [];
let todosClientes = [];
let modoVeiculo = "none"; // "none" | "edit" | "del"
let filtroAtivoVeiculo = "todos"; // "todos" | "ativos" | "inativos"

// --- carregar clientes (pro select do modal de novo veículo) ---
async function carregarClientesParaSelect() {
  try {
    const resp = await fetch(`${API_URL}/client/get/all`, { headers: authHeaders(false) });
    if (tratarRespostaAuth(resp)) return;
    const dados = await resp.json();
    todosClientes = resp.ok ? (Array.isArray(dados) ? dados : dados.message || []) : [];

    const select = document.getElementById("v-client-id");
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    todosClientes.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.client_id;
      opt.textContent = c.name;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Erro ao carregar clientes:", err);
  }
}

// --- carregar veículos da API e desenhar os cards ---
async function carregarVeiculos() {
  try {
    const resp = await fetch(`${API_URL}/vehicle/get/all`, { headers: authHeaders(false) });
    if (tratarRespostaAuth(resp)) return;
    const dados = await resp.json();

    if (resp.ok) {
      todosVeiculos = Array.isArray(dados) ? dados : dados.message || [];
    } else {
      todosVeiculos = [];
    }

    renderizarVeiculos();
  } catch (err) {
    console.error("Erro ao carregar veículos:", err);
  }
}

// --- o "molde" (cookie cutter): recebe 1 veículo, devolve o HTML do card ---
function moldeCardVeiculo(v) {
  const badge = v.active
    ? '<span class="badge badge-ativo">Ativo</span>'
    : '<span class="badge badge-inativo">Inativo</span>';

  return `
    <div class="item-card" data-id="${v.vehicle_id}" onclick="cliqueCardVeiculo(${v.vehicle_id})">
      <div class="item-card-icon"><i class="ti ti-car"></i></div>
      <h4>${v.model}</h4>
      <p>${v.plate}</p>
      <p>${v.kind || "—"}</p>
      <div class="item-card-footer">${badge}</div>
    </div>
  `;
}

// --- junta: pega a lista, aplica o filtro, aplica o molde em cada item, joga no grid ---
function renderizarVeiculos() {
  const busca = document.getElementById("v-busca").value.toLowerCase();
  const tipo = document.getElementById("v-filtro-kind").value;

  let lista = todosVeiculos.filter((v) => {
    const bateBusca =
      v.model.toLowerCase().includes(busca) || v.plate.toLowerCase().includes(busca);
    const bateTipo = !tipo || v.kind === tipo;
    const bateStatus =
      filtroAtivoVeiculo === "todos" ||
      (filtroAtivoVeiculo === "ativos" && v.active) ||
      (filtroAtivoVeiculo === "inativos" && !v.active);
    return bateBusca && bateTipo && bateStatus;
  });

  // .map() aplica o molde em cada veículo da lista, e .join("") cola tudo num texto só
  const htmlCards = lista.map(moldeCardVeiculo).join("");

  // o card "+" de adicionar novo vem sempre primeiro
  const cardNovo = `
    <div class="item-card add-new" onclick="abrirModalVeiculo()">
      <i class="ti ti-plus"></i>
      <span>Novo veículo</span>
    </div>
  `;

  document.getElementById("veiculos-grid").innerHTML = cardNovo + htmlCards;

  // reaplica a classe visual do modo atual em todos os cards recém-criados
  aplicarClasseModoNosCards();
}

function filtrarVeiculos() {
  renderizarVeiculos();
}

function setFiltroAtivoVeiculo(valor, botaoClicado) {
  filtroAtivoVeiculo = valor;
  document.querySelectorAll("#view-veiculos .filter-btn").forEach((b) => b.classList.remove("active"));
  botaoClicado.classList.add("active");
  renderizarVeiculos();
}

// --- controle do modo editar/apagar (o "guarda de trânsito") ---
function setModoVeiculo(modo) {
  modoVeiculo = modo;

  document.getElementById("v-btn-edit").classList.remove("active-edit");
  document.getElementById("v-btn-del").classList.remove("active-del");

  const warningBar = document.getElementById("v-warning-bar");
  warningBar.classList.remove("show", "del");

  if (modo === "edit") {
    document.getElementById("v-btn-edit").classList.add("active-edit");
    warningBar.classList.add("show");
    document.getElementById("v-warning-text").textContent =
      "Modo edição ativo — clique num veículo para editá-lo.";
  } else if (modo === "del") {
    document.getElementById("v-btn-del").classList.add("active-del");
    warningBar.classList.add("show", "del");
    document.getElementById("v-warning-text").textContent =
      "Modo apagar ativo — clique num veículo para excluí-lo.";
  }

  aplicarClasseModoNosCards();
}

function aplicarClasseModoNosCards() {
  document.querySelectorAll("#veiculos-grid .item-card:not(.add-new)").forEach((card) => {
    card.classList.remove("modo-edit", "modo-del");
    if (modoVeiculo === "edit") card.classList.add("modo-edit");
    if (modoVeiculo === "del") card.classList.add("modo-del");
  });
}

// --- o "guarda de trânsito": decide o que fazer com o clique, baseado no modo atual ---
function cliqueCardVeiculo(id) {
  if (modoVeiculo === "edit") {
    abrirModalEditarVeiculo(id);
  } else if (modoVeiculo === "del") {
    const veiculo = todosVeiculos.find((v) => v.vehicle_id === id);
    pedirConfirmacao(`Apagar "${veiculo.model}"?`, () => apagarVeiculo(id));
  } else {
    abrirDetalheVeiculo(id);
  }
}

function abrirDetalheVeiculo(id) {
  const v = todosVeiculos.find((v) => v.vehicle_id === id);
  if (!v) return;
  const cliente = todosClientesLista.find((c) => c.client_id === v.client_id);
  const servicosDoVeiculo = todosServicos.filter((s) => s.vehicle_id === id);

  document.getElementById("detalhe-titulo").textContent = v.model;
  document.getElementById("detalhe-corpo").innerHTML = `
    <div class="detalhe-linha"><span class="detalhe-label">Placa</span><span class="detalhe-valor">${v.plate}</span></div>
    <div class="detalhe-linha"><span class="detalhe-label">Tipo</span><span class="detalhe-valor">${v.kind || "—"}</span></div>
    <div class="detalhe-linha"><span class="detalhe-label">Cliente</span><span class="detalhe-valor">${cliente ? cliente.name : "—"}</span></div>
    <div class="detalhe-linha"><span class="detalhe-label">Status</span><span class="detalhe-valor">${v.active ? "Ativo" : "Inativo"}</span></div>
    <div class="detalhe-subtitulo">Serviços (${servicosDoVeiculo.length})</div>
    ${
      servicosDoVeiculo.length
        ? servicosDoVeiculo
            .map(
              (s) => `
        <div class="detalhe-lista-item" onclick="fecharModal('modal-detalhe'); cliqueCardServico(${s.service_id})">
          <span>${s.title}</span>
          ${s.finish ? '<span class="badge badge-done">Concluído</span>' : '<span class="badge badge-pend">Pendente</span>'}
        </div>`
            )
            .join("")
        : '<p style="font-size:12.5px; color: var(--text-inativo);">Nenhum serviço registrado ainda.</p>'
    }
  `;
  document.getElementById("detalhe-footer").innerHTML = `
    <button class="btn-outline" onclick="fecharModal('modal-detalhe')">Fechar</button>
    <button class="btn-outline ${v.active ? "btn-toggle-off" : "btn-toggle-on"}" onclick="toggleAtivoVeiculo(${v.vehicle_id}, ${!v.active})">
      <i class="ti ti-power"></i> ${v.active ? "Desativar" : "Ativar"}
    </button>
    <button class="btn-outline" onclick="fecharModal('modal-detalhe'); abrirModalEditarVeiculo(${v.vehicle_id})"><i class="ti ti-pencil"></i> Editar</button>
    <button class="btn-red" onclick="fecharModal('modal-detalhe'); abrirModalServico(${v.vehicle_id})"><i class="ti ti-tool"></i> Registrar serviço</button>
  `;
  abrirModal("modal-detalhe");
}

async function toggleAtivoVeiculo(id, novoValor) {
  try {
    const resp = await fetch(`${API_URL}/vehicle/update/active/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ active: novoValor }),
    });
    if (tratarRespostaAuth(resp)) return;

    if (!resp.ok) {
      const erro = await resp.json().catch(() => ({}));
      console.error(`Erro ao alternar status do veículo — status ${resp.status}:`, erro);
      alert("Não foi possível alterar o status do veículo. Veja o console para detalhes.");
      return;
    }

    fecharModal("modal-detalhe");
    carregarVeiculos();
  } catch (err) {
    console.error("Erro ao alternar status do veículo:", err);
  }
}

// --- CRUD: criar ---
function abrirModalVeiculo(clientIdPreset = null) {
  document.getElementById("v-error").classList.remove("show");
  document.getElementById("v-model").value = "";
  document.getElementById("v-kind").value = "Carro";
  document.getElementById("v-plate").value = "";
  carregarClientesParaSelect().then(() => {
    document.getElementById("v-client-id").value = clientIdPreset || "";
  });
  abrirModal("modal-veiculo");
}

async function salvarVeiculo() {
  const client_id = document.getElementById("v-client-id").value;
  const model = document.getElementById("v-model").value.trim();
  const kind = document.getElementById("v-kind").value;
  const plate = document.getElementById("v-plate").value.trim();

  if (!client_id || !model || !plate) {
    mostrarErroEm("v-error", "Preencha cliente, modelo e placa.");
    return;
  }

  const textoOriginal = travarBotaoSalvar("btn-salvar-veiculo");
  try {
    const resp = await fetch(`${API_URL}/vehicle/register`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ client_id: Number(client_id), model, kind, plate }),
    });
    if (tratarRespostaAuth(resp)) return;

    if (!resp.ok) {
      await mostrarErroApiEm("v-error", resp, "Não foi possível cadastrar o veículo.");
      return;
    }

    fecharModal("modal-veiculo");
    carregarVeiculos();
  } catch (err) {
    mostrarErroEm("v-error", "Não foi possível conectar ao servidor.");
  } finally {
    destravarBotaoSalvar("btn-salvar-veiculo", textoOriginal);
  }
}

// --- CRUD: editar ---
function abrirModalEditarVeiculo(id) {
  const v = todosVeiculos.find((v) => v.vehicle_id === id);
  if (!v) return;

  document.getElementById("ev-error").classList.remove("show");
  document.getElementById("ev-id").value = v.vehicle_id;
  document.getElementById("ev-model").value = v.model;
  document.getElementById("ev-kind").value = v.kind || "Carro";
  document.getElementById("ev-plate").value = mascararPlaca(v.plate);

  abrirModal("modal-editar-veiculo");
}

async function salvarEdicaoVeiculo() {
  const id = document.getElementById("ev-id").value;
  const model = document.getElementById("ev-model").value.trim();
  const kind = document.getElementById("ev-kind").value;
  const plate = document.getElementById("ev-plate").value.trim();

  if (!model || !plate) {
    mostrarErroEm("ev-error", "Preencha modelo e placa.");
    return;
  }

  const textoOriginal = travarBotaoSalvar("btn-salvar-edicao-veiculo");
  try {
    const resp = await fetch(`${API_URL}/vehicle/update/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ model, kind, plate }),
    });
    if (tratarRespostaAuth(resp)) return;

    if (!resp.ok) {
      await mostrarErroApiEm("ev-error", resp, "Não foi possível salvar as alterações.");
      return;
    }

    fecharModal("modal-editar-veiculo");
    setModoVeiculo("none");
    carregarVeiculos();
  } catch (err) {
    mostrarErroEm("ev-error", "Não foi possível conectar ao servidor.");
  } finally {
    destravarBotaoSalvar("btn-salvar-edicao-veiculo", textoOriginal);
  }
}

// --- CRUD: apagar ---
async function apagarVeiculo(id) {
  try {
    const resp = await fetch(`${API_URL}/vehicle/delete/${id}`, {
      method: "DELETE",
      headers: authHeaders(false),
    });
    if (tratarRespostaAuth(resp)) return;

    setModoVeiculo("none");
    carregarVeiculos();
  } catch (err) {
    console.error("Erro ao apagar veículo:", err);
  }
}

// trava o botão de salvar (evita duplo clique) e troca o texto por "Salvando..."
function travarBotaoSalvar(btnId) {
  const btn = document.getElementById(btnId);
  if (!btn) return null;
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader-2 spin"></i> Salvando...';
  return original;
}

// devolve o botão pro estado normal (sempre chamado no finally, dá certo ou errado)
function destravarBotaoSalvar(btnId, textoOriginal) {
  const btn = document.getElementById(btnId);
  if (!btn || textoOriginal == null) return;
  btn.disabled = false;
  btn.innerHTML = textoOriginal;
}

// lê o "detail" que o FastAPI manda no corpo do erro e mostra a mensagem específica
// (CPF duplicado, placa duplicada, cliente não encontrado, etc.) em vez de um texto genérico
async function mostrarErroApiEm(elId, resp, mensagemPadrao) {
  let mensagem = mensagemPadrao;
  try {
    const dados = await resp.json();
    if (typeof dados.detail === "string") {
      // erro "de negócio" que a gente mesmo lança no backend (HTTPException) — já vem pronto pro usuário
      mensagem = dados.detail;
    } else if (Array.isArray(dados.detail) && dados.detail.length) {
      // erro 422 de validação automática do Pydantic (ex: campo com tipo errado) — pega a primeira mensagem
      mensagem = dados.detail[0].msg || mensagemPadrao;
    }
  } catch (err) {
    // resposta sem corpo JSON — mantém a mensagem padrão mesmo
  }
  mostrarErroEm(elId, mensagem);
}

// util local pra mostrar erro em qualquer .modal-error pelo id
function mostrarErroEm(elId, mensagem) {
  const el = document.getElementById(elId);
  el.textContent = mensagem;
  el.classList.add("show");
}

// =====================================================
// MÁSCARAS DE INPUT (CPF, telefone)
// =====================================================
function mascararCPF(valor) {
  return valor
    .replace(/\D/g, "") // remove tudo que não é dígito
    .slice(0, 11) // CPF tem no máximo 11 números
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function mascararTelefone(valor) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11) // DDD + 9 dígitos
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

function mascararCEP(valor) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

function mascararPlaca(valor) {
  // remove tudo que não é letra/número e força maiúsculo
  let v = valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
  // formato antigo (3 letras + 4 números) ganha hífen: ABC-1234
  if (/^[A-Z]{3}[0-9]{4}$/.test(v)) {
    return v.replace(/^([A-Z]{3})([0-9]{4})$/, "$1-$2");
  }
  // formato Mercosul (ABC1D23) não usa hífen
  return v;
}

// =====================================================
// CLIENTES
// =====================================================
let todosClientesLista = [];
let modoCliente = "none";
let filtroAtivoCliente = "todos"; // todos | ativos | inativos (expired)

async function carregarClientes() {
  try {
    const resp = await fetch(`${API_URL}/client/get/all`, { headers: authHeaders(false) });
    if (tratarRespostaAuth(resp)) return;
    const dados = await resp.json();

    if (resp.ok) {
      todosClientesLista = Array.isArray(dados) ? dados : dados.message || [];
    } else {
      todosClientesLista = [];
    }

    todosClientes = todosClientesLista; // mantém o select de veículos atualizado também
    renderizarClientes();
    atualizarStatsDashboard();
  } catch (err) {
    console.error("Erro ao carregar clientes:", err);
  }
}

function moldeCardCliente(c) {
  const badge = c.expired
    ? '<span class="badge badge-inativo">Inativo</span>'
    : '<span class="badge badge-ativo">Ativo</span>';
  return `
    <div class="item-card" data-id="${c.client_id}" onclick="cliqueCardCliente(${c.client_id})">
      <div class="item-card-icon"><i class="ti ti-user"></i></div>
      <h4>${c.name}</h4>
      <p>${c.cpf}</p>
      <p>${c.tel || "sem telefone"}</p>
      <div class="item-card-footer">${badge}</div>
    </div>
  `;
}

function renderizarClientes() {
  const busca = document.getElementById("c-busca").value.toLowerCase();

  let lista = todosClientesLista.filter((c) => {
    const bateBusca = c.name.toLowerCase().includes(busca) || c.cpf.includes(busca);
    const bateStatus =
      filtroAtivoCliente === "todos" ||
      (filtroAtivoCliente === "ativos" && !c.expired) ||
      (filtroAtivoCliente === "inativos" && c.expired);
    return bateBusca && bateStatus;
  });

  const htmlCards = lista.map(moldeCardCliente).join("");
  const cardNovo = `
    <div class="item-card add-new" onclick="abrirModalCliente()">
      <i class="ti ti-plus"></i>
      <span>Novo cliente</span>
    </div>
  `;
  document.getElementById("clientes-grid").innerHTML = cardNovo + htmlCards;
  aplicarClasseModoGenerico("clientes-grid", modoCliente);
}

function filtrarClientes() {
  renderizarClientes();
}

function setFiltroAtivoCliente(valor, botao) {
  filtroAtivoCliente = valor;
  document.querySelectorAll("#view-clientes .filter-btn").forEach((b) => b.classList.remove("active"));
  botao.classList.add("active");
  renderizarClientes();
}

function setModoCliente(modo) {
  modoCliente = modo;
  document.getElementById("c-btn-edit").classList.remove("active-edit");
  document.getElementById("c-btn-del").classList.remove("active-del");
  const warningBar = document.getElementById("c-warning-bar");
  warningBar.classList.remove("show", "del");

  if (modo === "edit") {
    document.getElementById("c-btn-edit").classList.add("active-edit");
    warningBar.classList.add("show");
    document.getElementById("c-warning-text").textContent = "Modo edição ativo — clique num cliente para editá-lo.";
  } else if (modo === "del") {
    document.getElementById("c-btn-del").classList.add("active-del");
    warningBar.classList.add("show", "del");
    document.getElementById("c-warning-text").textContent = "Modo apagar ativo — clique num cliente para excluí-lo.";
  }
  aplicarClasseModoGenerico("clientes-grid", modoCliente);
}

function cliqueCardCliente(id) {
  if (modoCliente === "edit") {
    abrirModalEditarCliente(id);
  } else if (modoCliente === "del") {
    const cliente = todosClientesLista.find((c) => c.client_id === id);
    pedirConfirmacao(`Apagar "${cliente.name}"?`, () => apagarCliente(id));
  } else {
    abrirDetalheCliente(id);
  }
}

function abrirDetalheCliente(id) {
  const c = todosClientesLista.find((c) => c.client_id === id);
  if (!c) return;
  const veiculosDoCliente = todosVeiculos.filter((v) => v.client_id === id);

  document.getElementById("detalhe-titulo").textContent = c.name;
  document.getElementById("detalhe-corpo").innerHTML = `
    <div class="detalhe-linha"><span class="detalhe-label">CPF</span><span class="detalhe-valor">${c.cpf}</span></div>
    <div class="detalhe-linha"><span class="detalhe-label">Telefone</span><span class="detalhe-valor">${c.tel || "—"}</span></div>
    <div class="detalhe-linha"><span class="detalhe-label">E-mail</span><span class="detalhe-valor">${c.email || "—"}</span></div>
    <div class="detalhe-linha"><span class="detalhe-label">Endereço</span><span class="detalhe-valor">${c.address || "—"}</span></div>
    <div class="detalhe-linha"><span class="detalhe-label">Status</span><span class="detalhe-valor">${c.expired ? "Inativo" : "Ativo"}</span></div>
    <div class="detalhe-subtitulo">Veículos (${veiculosDoCliente.length})</div>
    ${
      veiculosDoCliente.length
        ? veiculosDoCliente
            .map(
              (v) => `
        <div class="detalhe-lista-item" onclick="fecharModal('modal-detalhe'); cliqueCardVeiculo(${v.vehicle_id})">
          <span>${v.model} · ${v.plate}</span>
          ${v.active ? '<span class="badge badge-ativo">Ativo</span>' : '<span class="badge badge-inativo">Inativo</span>'}
        </div>`
            )
            .join("")
        : '<p style="font-size:12.5px; color: var(--text-inativo);">Nenhum veículo cadastrado ainda.</p>'
    }
  `;
  document.getElementById("detalhe-footer").innerHTML = `
    <button class="btn-outline" onclick="fecharModal('modal-detalhe')">Fechar</button>
    <button class="btn-outline ${c.expired ? "btn-toggle-on" : "btn-toggle-off"}" onclick="toggleAtivoCliente(${c.client_id}, ${!c.expired})">
      <i class="ti ti-power"></i> ${c.expired ? "Ativar" : "Desativar"}
    </button>
    <button class="btn-outline" onclick="fecharModal('modal-detalhe'); abrirModalEditarCliente(${c.client_id})"><i class="ti ti-pencil"></i> Editar</button>
    <button class="btn-red" onclick="fecharModal('modal-detalhe'); abrirModalVeiculo(${c.client_id})"><i class="ti ti-plus"></i> Novo veículo</button>
  `;
  abrirModal("modal-detalhe");
}

async function toggleAtivoCliente(id, novoExpired) {
  try {
    const resp = await fetch(`${API_URL}/client/update/expired/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ expired: novoExpired }),
    });
    if (tratarRespostaAuth(resp)) return;

    if (!resp.ok) {
      const erro = await resp.json().catch(() => ({}));
      console.error(`Erro ao alternar status do cliente — status ${resp.status}:`, erro);
      alert("Não foi possível alterar o status do cliente. Veja o console para detalhes.");
      return;
    }

    fecharModal("modal-detalhe");
    carregarClientes();
  } catch (err) {
    console.error("Erro ao alternar status do cliente:", err);
  }
}

function abrirModalCliente() {
  document.getElementById("cliente-modal-titulo").textContent = "Novo cliente";
  document.getElementById("c-error").classList.remove("show");
  document.getElementById("c-id").value = "";
  ["c-name", "c-cpf", "c-address", "c-cep", "c-tel", "c-email"].forEach((id) => (document.getElementById(id).value = ""));
  abrirModal("modal-cliente");
}

function abrirModalEditarCliente(id) {
  const c = todosClientesLista.find((c) => c.client_id === id);
  if (!c) return;
  document.getElementById("cliente-modal-titulo").textContent = "Editar cliente";
  document.getElementById("c-error").classList.remove("show");
  document.getElementById("c-id").value = c.client_id;
  document.getElementById("c-name").value = c.name;
  document.getElementById("c-cpf").value = mascararCPF(c.cpf);
  document.getElementById("c-address").value = c.address || "";
  document.getElementById("c-cep").value = c.cep ? mascararCEP(c.cep) : "";
  document.getElementById("c-tel").value = c.tel ? mascararTelefone(c.tel) : "";
  document.getElementById("c-email").value = c.email || "";
  abrirModal("modal-cliente");
}

async function salvarCliente() {
  const id = document.getElementById("c-id").value;
  const name = document.getElementById("c-name").value.trim();
  const cpf = document.getElementById("c-cpf").value.trim();
  const address = document.getElementById("c-address").value.trim();
  const cep = document.getElementById("c-cep").value.trim();
  const tel = document.getElementById("c-tel").value.trim();
  const email = document.getElementById("c-email").value.trim();

  if (!name || !cpf) {
    mostrarErroEm("c-error", "Nome e CPF são obrigatórios.");
    return;
  }

  const payload = { name, cpf, address, cep, tel, email };
  const editando = !!id;
  const url = editando ? `${API_URL}/client/update/${id}` : `${API_URL}/client/register`;
  const method = editando ? "PUT" : "POST";

  const textoOriginal = travarBotaoSalvar("btn-salvar-cliente");
  try {
    const resp = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
    if (tratarRespostaAuth(resp)) return;
    if (!resp.ok) {
      await mostrarErroApiEm("c-error", resp, "Não foi possível salvar o cliente.");
      return;
    }
    fecharModal("modal-cliente");
    setModoCliente("none");
    carregarClientes();
  } catch (err) {
    mostrarErroEm("c-error", "Não foi possível conectar ao servidor.");
  } finally {
    destravarBotaoSalvar("btn-salvar-cliente", textoOriginal);
  }
}

async function apagarCliente(id) {
  try {
    const resp = await fetch(`${API_URL}/client/delete/${id}`, { method: "DELETE", headers: authHeaders(false) });
    if (tratarRespostaAuth(resp)) return;
    setModoCliente("none");
    carregarClientes();
  } catch (err) {
    console.error("Erro ao apagar cliente:", err);
  }
}

// =====================================================
// MATERIAIS
// =====================================================
let todosMateriais = [];
let modoMaterial = "none";
let filtroDisponivelMaterial = "todos"; // todos | disponiveis | indisponiveis

async function carregarMateriais() {
  try {
    const resp = await fetch(`${API_URL}/material/get/all`, { headers: authHeaders(false) });
    if (tratarRespostaAuth(resp)) return;
    const dados = await resp.json();

    if (resp.ok) {
      todosMateriais = Array.isArray(dados) ? dados : dados.message || [];
    } else {
      todosMateriais = [];
    }

    renderizarMateriais();
    atualizarStatsDashboard();
  } catch (err) {
    console.error("Erro ao carregar materiais:", err);
  }
}

function moldeCardMaterial(m) {
  const badge = m.available
    ? '<span class="badge badge-ativo">Disponível</span>'
    : '<span class="badge badge-inativo">Indisponível</span>';
  return `
    <div class="item-card" data-id="${m.material_id}" onclick="cliqueCardMaterial(${m.material_id})">
      <div class="item-card-icon"><i class="ti ti-package"></i></div>
      <h4>${m.name}</h4>
      <p>${m.mark} · ${m.quantity} un.</p>
      <p>R$ ${Number(m.value).toFixed(2)} / un.</p>
      <div class="item-card-footer">${badge}</div>
    </div>
  `;
}

function renderizarMateriais() {
  const busca = document.getElementById("m-busca").value.toLowerCase();

  let lista = todosMateriais.filter((m) => {
    const bateBusca = m.name.toLowerCase().includes(busca) || m.mark.toLowerCase().includes(busca);
    const bateStatus =
      filtroDisponivelMaterial === "todos" ||
      (filtroDisponivelMaterial === "disponiveis" && m.available) ||
      (filtroDisponivelMaterial === "indisponiveis" && !m.available);
    return bateBusca && bateStatus;
  });

  const htmlCards = lista.map(moldeCardMaterial).join("");
  const cardNovo = `
    <div class="item-card add-new" onclick="abrirModalMaterial()">
      <i class="ti ti-plus"></i>
      <span>Novo material</span>
    </div>
  `;
  document.getElementById("materiais-grid").innerHTML = cardNovo + htmlCards;
  aplicarClasseModoGenerico("materiais-grid", modoMaterial);
}

function filtrarMateriais() {
  renderizarMateriais();
}

function setFiltroDisponivelMaterial(valor, botao) {
  filtroDisponivelMaterial = valor;
  document.querySelectorAll("#view-materiais .filter-btn").forEach((b) => b.classList.remove("active"));
  botao.classList.add("active");
  renderizarMateriais();
}

function setModoMaterial(modo) {
  modoMaterial = modo;
  document.getElementById("m-btn-edit").classList.remove("active-edit");
  document.getElementById("m-btn-del").classList.remove("active-del");
  const warningBar = document.getElementById("m-warning-bar");
  warningBar.classList.remove("show", "del");

  if (modo === "edit") {
    document.getElementById("m-btn-edit").classList.add("active-edit");
    warningBar.classList.add("show");
    document.getElementById("m-warning-text").textContent = "Modo edição ativo — clique num material para editá-lo.";
  } else if (modo === "del") {
    document.getElementById("m-btn-del").classList.add("active-del");
    warningBar.classList.add("show", "del");
    document.getElementById("m-warning-text").textContent = "Modo apagar ativo — clique num material para excluí-lo.";
  }
  aplicarClasseModoGenerico("materiais-grid", modoMaterial);
}

function cliqueCardMaterial(id) {
  if (modoMaterial === "edit") {
    abrirModalEditarMaterial(id);
  } else if (modoMaterial === "del") {
    const material = todosMateriais.find((m) => m.material_id === id);
    pedirConfirmacao(`Apagar "${material.name}"?`, () => apagarMaterial(id));
  } else {
    abrirDetalheMaterial(id);
  }
}

function abrirDetalheMaterial(id) {
  const m = todosMateriais.find((m) => m.material_id === id);
  if (!m) return;
  const dataFmt = m.date_available ? new Date(m.date_available).toLocaleDateString("pt-BR") : "sem validade";

  document.getElementById("detalhe-titulo").textContent = m.name;
  document.getElementById("detalhe-corpo").innerHTML = `
    <div class="detalhe-linha"><span class="detalhe-label">Marca</span><span class="detalhe-valor">${m.mark}</span></div>
    <div class="detalhe-linha"><span class="detalhe-label">Quantidade em estoque</span><span class="detalhe-valor">${m.quantity} un.</span></div>
    <div class="detalhe-linha"><span class="detalhe-label">Valor unitário</span><span class="detalhe-valor">R$ ${Number(m.value).toFixed(2)}</span></div>
    <div class="detalhe-linha"><span class="detalhe-label">Valor total em estoque</span><span class="detalhe-valor">R$ ${Number(m.total_value ?? m.value * m.quantity).toFixed(2)}</span></div>
    <div class="detalhe-linha"><span class="detalhe-label">Validade</span><span class="detalhe-valor">${dataFmt}</span></div>
    <div class="detalhe-linha"><span class="detalhe-label">Disponível</span><span class="detalhe-valor">${m.available ? "Sim" : "Não"}</span></div>
    <div class="detalhe-linha"><span class="detalhe-label">Expirado</span><span class="detalhe-valor">${m.expired ? "Sim" : "Não"}</span></div>
  `;
  document.getElementById("detalhe-footer").innerHTML = `
    <button class="btn-outline" onclick="fecharModal('modal-detalhe')">Fechar</button>
    <button class="btn-outline ${m.available ? "btn-toggle-off" : "btn-toggle-on"}" onclick="toggleDisponivelMaterial(${m.material_id}, ${!m.available})">
      <i class="ti ti-power"></i> ${m.available ? "Marcar indisponível" : "Marcar disponível"}
    </button>
    <button class="btn-red" onclick="fecharModal('modal-detalhe'); abrirModalEditarMaterial(${m.material_id})"><i class="ti ti-pencil"></i> Editar</button>
  `;
  abrirModal("modal-detalhe");
}

async function toggleDisponivelMaterial(id, novoValor) {
  try {
    const resp = await fetch(`${API_URL}/material/update/available/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ available: novoValor }),
    });
    if (tratarRespostaAuth(resp)) return;

    if (!resp.ok) {
      const erro = await resp.json().catch(() => ({}));
      console.error(`Erro ao alternar disponibilidade — status ${resp.status}:`, erro);
      alert("Não foi possível alterar a disponibilidade. Veja o console para detalhes.");
      return;
    }

    fecharModal("modal-detalhe");
    carregarMateriais();
  } catch (err) {
    console.error("Erro ao alternar disponibilidade do material:", err);
  }
}

function abrirModalMaterial() {
  document.getElementById("material-modal-titulo").textContent = "Novo material";
  document.getElementById("m-error").classList.remove("show");
  document.getElementById("m-id").value = "";
  ["m-name", "m-mark", "m-quantity", "m-value", "m-date-available"].forEach((id) => (document.getElementById(id).value = ""));
  abrirModal("modal-material");
}

function abrirModalEditarMaterial(id) {
  const m = todosMateriais.find((m) => m.material_id === id);
  if (!m) return;
  document.getElementById("material-modal-titulo").textContent = "Editar material";
  document.getElementById("m-error").classList.remove("show");
  document.getElementById("m-id").value = m.material_id;
  document.getElementById("m-name").value = m.name;
  document.getElementById("m-mark").value = m.mark;
  document.getElementById("m-quantity").value = m.quantity;
  document.getElementById("m-value").value = m.value;
  document.getElementById("m-date-available").value = m.date_available ? m.date_available.substring(0, 10) : "";
  abrirModal("modal-material");
}

async function salvarMaterial() {
  const id = document.getElementById("m-id").value;
  const name = document.getElementById("m-name").value.trim();
  const mark = document.getElementById("m-mark").value.trim();
  const quantity = Number(document.getElementById("m-quantity").value);
  const value = Number(document.getElementById("m-value").value);
  const date_available = document.getElementById("m-date-available").value || null;

  if (!name || !mark || !document.getElementById("m-quantity").value || !document.getElementById("m-value").value) {
    mostrarErroEm("m-error", "Preencha nome, marca, quantidade e valor.");
    return;
  }

  const editando = !!id;
  let payload;

  if (editando) {
    // "expired" e "available" são obrigatórios no schema — preserva os valores atuais do material
    const materialAtual = todosMateriais.find((m) => m.material_id === Number(id));
    payload = {
      name,
      mark,
      quantity,
      value,
      date_available,
      expired: materialAtual ? materialAtual.expired : false,
      available: materialAtual ? materialAtual.available : true,
    };
  } else {
    payload = { name, mark, quantity, value, date_available, expired: false, available: true };
  }

  const url = editando ? `${API_URL}/material/update/${id}` : `${API_URL}/material/register`;
  const method = editando ? "PUT" : "POST";

  const textoOriginal = travarBotaoSalvar("btn-salvar-material");
  try {
    const resp = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
    if (tratarRespostaAuth(resp)) return;
    if (!resp.ok) {
      await mostrarErroApiEm("m-error", resp, "Não foi possível salvar o material.");
      return;
    }
    fecharModal("modal-material");
    setModoMaterial("none");
    carregarMateriais();
  } catch (err) {
    mostrarErroEm("m-error", "Não foi possível conectar ao servidor.");
  } finally {
    destravarBotaoSalvar("btn-salvar-material", textoOriginal);
  }
}

async function apagarMaterial(id) {
  try {
    const resp = await fetch(`${API_URL}/material/delete/${id}`, { method: "DELETE", headers: authHeaders(false) });
    if (tratarRespostaAuth(resp)) return;
    setModoMaterial("none");
    carregarMateriais();
  } catch (err) {
    console.error("Erro ao apagar material:", err);
  }
}

// =====================================================
// CATÁLOGO DE SERVIÇOS PRÉ-DEFINIDOS (Nippon Detail)
// =====================================================
const CATALOGO_SERVICOS = [
  { titulo: "Lavagem Simples", kind: "Estética", preco: "A partir de R$ 60,00", valor: 60 },
  { titulo: "Lavagem Detalhada", kind: "Estética", preco: "A partir de R$ 150,00", valor: 150 },
  { titulo: "Polimento Técnico", kind: "Estética", preco: "A partir de R$ 1.500,00", valor: 1500 },
  { titulo: "Polimento Comercial", kind: "Estética", preco: "A partir de R$ 600,00", valor: 600 },
  { titulo: "Vitrificação", kind: "Estética", preco: "A partir de R$ 800,00", valor: 800 },
  { titulo: "Higienização Interna", kind: "Estética", preco: "A partir de R$ 200,00", valor: 200 },
  { titulo: "Revitalização de Faróis", kind: "Estética", preco: "A partir de R$ 150,00", valor: 150 },
  { titulo: "Lavagem de Motor", kind: "Estética", preco: "A partir de R$ 150,00", valor: 150 },
  { titulo: "Insulfilm", kind: "Estética", preco: "Consulte valores", valor: null },
  { titulo: "Customizações", kind: "Estética", preco: "Consulte valores", valor: null },
];

function popularCatalogoServico() {
  const select = document.getElementById("s-catalogo");
  select.innerHTML = '<option value="">Personalizado — digite manualmente abaixo</option>';
  CATALOGO_SERVICOS.forEach((s, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = s.titulo;
    select.appendChild(opt);
  });
}

function aplicarCatalogoServico() {
  const indice = document.getElementById("s-catalogo").value;
  const hint = document.getElementById("s-preco-hint");

  if (indice === "") {
    hint.textContent = "";
    return;
  }

  const servico = CATALOGO_SERVICOS[indice];
  document.getElementById("s-title").value = servico.titulo;
  document.getElementById("s-kind").value = servico.kind;
  document.getElementById("s-value").value = servico.valor ?? "";
  // a descrição fica em branco de propósito, pra você detalhar o caso específico
  hint.textContent = `Preço de referência: ${servico.preco}`;
}

// =====================================================
// SERVIÇOS
// =====================================================
let todosServicos = [];
let modoServico = "none";
let filtroStatusServico = "todos"; // todos | pendente | concluido

async function carregarServicos() {
  try {
    const resp = await fetch(`${API_URL}/services/get/all`, { headers: authHeaders(false) });
    if (tratarRespostaAuth(resp)) return;
    const dados = await resp.json();

    // sua API às vezes devolve a lista pura, às vezes embrulhada em { message: [...] }
    // — aqui a gente aceita os dois formatos
    if (resp.ok) {
      todosServicos = Array.isArray(dados) ? dados : dados.message || [];
    } else {
      // um 404 aqui geralmente só significa "nenhum serviço cadastrado ainda"
      todosServicos = [];
    }

    renderizarServicos();
    renderizarTabelaStatus();
    atualizarStatsDashboard();
    renderizarProximosDashboard();
    if (typeof renderizarCalendario === "function" && document.getElementById("calendario-mes")) {
      renderizarCalendario();
    }
  } catch (err) {
    console.error("Erro ao carregar serviços:", err);
  }
}

async function carregarVeiculosParaSelect() {
  try {
    const resp = await fetch(`${API_URL}/vehicle/get/all`, { headers: authHeaders(false) });
    if (tratarRespostaAuth(resp)) return;
    const dados = await resp.json();
    const veiculos = resp.ok ? (Array.isArray(dados) ? dados : dados.message || []) : [];
    const select = document.getElementById("s-vehicle-id");
    select.innerHTML = '<option value="">Selecione um veículo</option>';
    veiculos.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v.vehicle_id;
      opt.dataset.clientId = v.client_id;
      opt.textContent = `${v.model} · ${v.plate}`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Erro ao carregar veículos p/ select:", err);
  }
}

function nomeVeiculoServico(vehicle_id) {
  const v = todosVeiculos.find((v) => v.vehicle_id === vehicle_id);
  return v ? `${v.model} (${v.plate})` : `Veículo #${vehicle_id}`;
}

function moldeCardServico(s) {
  const badge = s.finish
    ? '<span class="badge badge-done">Concluído</span>'
    : '<span class="badge badge-pend">Pendente</span>';
  const dataFmt = s.date_release ? new Date(s.date_release).toLocaleDateString("pt-BR") : "sem data";
  const valorFmt = s.value ? `R$ ${Number(s.value).toFixed(2)}` : "sem valor definido";
  return `
    <div class="item-card" data-id="${s.service_id}" onclick="cliqueCardServico(${s.service_id})">
      <div class="item-card-icon"><i class="ti ti-tool"></i></div>
      <h4>${s.title}</h4>
      <p>${nomeVeiculoServico(s.vehicle_id)}</p>
      <p>Entrega: ${dataFmt} · ${valorFmt}</p>
      <div class="item-card-footer">${badge}</div>
    </div>
  `;
}

function renderizarServicos() {
  const busca = document.getElementById("s-busca").value.toLowerCase();

  let lista = todosServicos.filter((s) => {
    const bateBusca = s.title.toLowerCase().includes(busca);
    const bateStatus =
      filtroStatusServico === "todos" ||
      (filtroStatusServico === "pendente" && !s.finish) ||
      (filtroStatusServico === "concluido" && s.finish);
    return bateBusca && bateStatus;
  });

  const htmlCards = lista.map(moldeCardServico).join("");
  const cardNovo = `
    <div class="item-card add-new" onclick="abrirModalServico()">
      <i class="ti ti-plus"></i>
      <span>Novo serviço</span>
    </div>
  `;
  document.getElementById("servicos-grid").innerHTML = cardNovo + htmlCards;
  aplicarClasseModoGenerico("servicos-grid", modoServico);
}

function filtrarServicos() {
  renderizarServicos();
}

function setFiltroStatusServico(valor, botao) {
  filtroStatusServico = valor;
  document.querySelectorAll("#view-servicos .filter-btn").forEach((b) => b.classList.remove("active"));
  botao.classList.add("active");
  renderizarServicos();
}

function setModoServico(modo) {
  modoServico = modo;
  document.getElementById("s-btn-edit").classList.remove("active-edit");
  document.getElementById("s-btn-del").classList.remove("active-del");
  const warningBar = document.getElementById("s-warning-bar");
  warningBar.classList.remove("show", "del");

  if (modo === "edit") {
    document.getElementById("s-btn-edit").classList.add("active-edit");
    warningBar.classList.add("show");
    document.getElementById("s-warning-text").textContent = "Modo edição ativo — clique num serviço para editá-lo.";
  } else if (modo === "del") {
    document.getElementById("s-btn-del").classList.add("active-del");
    warningBar.classList.add("show", "del");
    document.getElementById("s-warning-text").textContent = "Modo apagar ativo — clique num serviço para excluí-lo.";
  }
  aplicarClasseModoGenerico("servicos-grid", modoServico);
}

function cliqueCardServico(id) {
  if (modoServico === "edit") {
    abrirModalEditarServico(id);
  } else if (modoServico === "del") {
    const servico = todosServicos.find((s) => s.service_id === id);
    pedirConfirmacao(`Apagar "${servico.title}"?`, () => apagarServico(id));
  } else {
    abrirDetalheServico(id);
  }
}

function abrirDetalheServico(id) {
  const s = todosServicos.find((s) => s.service_id === id);
  if (!s) return;

  const dataFmt = s.date_release ? new Date(s.date_release).toLocaleDateString("pt-BR") : "sem data definida";
  const valorFmt = s.value ? `R$ ${Number(s.value).toFixed(2)}` : "sem valor definido";

  document.getElementById("detalhe-titulo").textContent = s.title;
  document.getElementById("detalhe-corpo").innerHTML = `
    <div class="detalhe-linha"><span class="detalhe-label">Veículo</span><span class="detalhe-valor">${nomeVeiculoServico(s.vehicle_id)}</span></div>
    <div class="detalhe-linha"><span class="detalhe-label">Tipo</span><span class="detalhe-valor">${s.kind}</span></div>
    <div class="detalhe-linha"><span class="detalhe-label">Valor</span><span class="detalhe-valor">${valorFmt}</span></div>
    <div class="detalhe-linha"><span class="detalhe-label">Data prevista</span><span class="detalhe-valor">${dataFmt}</span></div>
    <div class="detalhe-linha"><span class="detalhe-label">Status</span><span class="detalhe-valor">${s.finish ? "Concluído" : "Pendente"}</span></div>
    <div class="detalhe-subtitulo">Descrição</div>
    <p style="font-size: 13px; color: var(--text-primario); line-height: 1.5;">${s.desc}</p>
  `;
  document.getElementById("detalhe-footer").innerHTML = `
    <button class="btn-outline" onclick="fecharModal('modal-detalhe')">Fechar</button>
    <button class="btn-outline ${s.finish ? "btn-toggle-off" : "btn-toggle-on"}" onclick="toggleFinalizarServico(${s.service_id}); fecharModal('modal-detalhe')">
      <i class="ti ti-check"></i> ${s.finish ? "Marcar pendente" : "Marcar concluído"}
    </button>
    <button class="btn-red" onclick="fecharModal('modal-detalhe'); abrirModalEditarServico(${s.service_id})"><i class="ti ti-pencil"></i> Editar</button>
  `;
  abrirModal("modal-detalhe");
}

async function toggleFinalizarServico(id) {
  const servico = todosServicos.find((s) => s.service_id === id);
  if (!servico) return;
  try {
    const resp = await fetch(`${API_URL}/service/update/finish/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ finish: !servico.finish }),
    });
    if (tratarRespostaAuth(resp)) return;

    if (!resp.ok) {
      const erro = await resp.json().catch(() => ({}));
      console.error(`Erro ao alternar status do serviço — status ${resp.status}:`, erro);
      alert("Não foi possível alterar o status do serviço. Veja o console para detalhes.");
      return;
    }

    carregarServicos();
  } catch (err) {
    console.error("Erro ao alternar status do serviço:", err);
  }
}

async function abrirModalServico(vehicleIdPreset = null) {
  document.getElementById("servico-modal-titulo").textContent = "Novo serviço";
  document.getElementById("s-error").classList.remove("show");
  document.getElementById("s-id").value = "";
  document.getElementById("s-catalogo").value = "";
  document.getElementById("s-preco-hint").textContent = "";
  ["s-title", "s-kind", "s-desc", "s-date", "s-value"].forEach((id) => (document.getElementById(id).value = ""));
  await carregarVeiculosParaSelect();
  document.getElementById("s-vehicle-id").value = vehicleIdPreset || "";
  abrirModal("modal-servico");
}

async function abrirModalEditarServico(id) {
  const s = todosServicos.find((s) => s.service_id === id);
  if (!s) return;
  document.getElementById("servico-modal-titulo").textContent = "Editar serviço";
  document.getElementById("s-error").classList.remove("show");
  document.getElementById("s-id").value = s.service_id;
  document.getElementById("s-catalogo").value = "";
  document.getElementById("s-preco-hint").textContent = "";
  await carregarVeiculosParaSelect();
  document.getElementById("s-vehicle-id").value = s.vehicle_id;
  document.getElementById("s-title").value = s.title;
  document.getElementById("s-kind").value = s.kind;
  document.getElementById("s-desc").value = s.desc;
  document.getElementById("s-value").value = s.value ?? "";
  document.getElementById("s-date").value = s.date_release ? s.date_release.substring(0, 10) : "";
  abrirModal("modal-servico");
}

async function salvarServico() {
  const id = document.getElementById("s-id").value;
  const vehicle_id = document.getElementById("s-vehicle-id").value;
  const title = document.getElementById("s-title").value.trim();
  const kind = document.getElementById("s-kind").value.trim();
  const desc = document.getElementById("s-desc").value.trim();
  const date_release = document.getElementById("s-date").value || null;
  const valorInput = document.getElementById("s-value").value;
  const value = valorInput ? Number(valorInput) : null;

  if (!vehicle_id || !title || !kind || !desc) {
    mostrarErroEm("s-error", "Preencha veículo, título, tipo e descrição.");
    return;
  }

  const editando = !!id;
  let payload;

  if (editando) {
    payload = { title, kind, desc, date_release, value };
  } else {
    // na criação, o backend exige também o client_id — pegamos do veículo selecionado
    const selectEl = document.getElementById("s-vehicle-id");
    const client_id = selectEl.options[selectEl.selectedIndex].dataset.clientId;
    payload = { vehicle_id: Number(vehicle_id), client_id: Number(client_id), title, kind, desc, date_release, value };
  }

  const url = editando ? `${API_URL}/service/update/${id}` : `${API_URL}/service/register`;
  const method = editando ? "PUT" : "POST";

  const textoOriginal = travarBotaoSalvar("btn-salvar-servico");
  try {
    const resp = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
    if (tratarRespostaAuth(resp)) return;
    if (!resp.ok) {
      await mostrarErroApiEm("s-error", resp, "Não foi possível salvar o serviço.");
      return;
    }
    fecharModal("modal-servico");
    setModoServico("none");
    carregarServicos();
  } catch (err) {
    mostrarErroEm("s-error", "Não foi possível conectar ao servidor.");
  } finally {
    destravarBotaoSalvar("btn-salvar-servico", textoOriginal);
  }
}

async function apagarServico(id) {
  try {
    const resp = await fetch(`${API_URL}/service/delete/${id}`, { method: "DELETE", headers: authHeaders(false) });
    if (tratarRespostaAuth(resp)) return;
    setModoServico("none");
    carregarServicos();
  } catch (err) {
    console.error("Erro ao apagar serviço:", err);
  }
}

// =====================================================
// STATUS (tabela geral de serviços)
// =====================================================
let filtroStatusTabela = "todos";

function setFiltroStatusTabela(valor, botao) {
  filtroStatusTabela = valor;
  document.querySelectorAll("#view-status .filter-btn").forEach((b) => b.classList.remove("active"));
  botao.classList.add("active");
  renderizarTabelaStatus();
}

function renderizarTabelaStatus() {
  let lista = todosServicos.filter((s) => {
    return (
      filtroStatusTabela === "todos" ||
      (filtroStatusTabela === "pendente" && !s.finish) ||
      (filtroStatusTabela === "concluido" && s.finish)
    );
  });

  const linhas = lista
    .map((s) => {
      const badge = s.finish
        ? '<span class="badge badge-done">Concluído</span>'
        : '<span class="badge badge-pend">Pendente</span>';
      const dataFmt = s.date_release ? new Date(s.date_release).toLocaleDateString("pt-BR") : "—";
      return `
        <tr>
          <td>${s.title}</td>
          <td>${s.kind}</td>
          <td>${nomeVeiculoServico(s.vehicle_id)}</td>
          <td>${dataFmt}</td>
          <td>${badge}</td>
        </tr>
      `;
    })
    .join("");

  document.getElementById("status-tabela-body").innerHTML = linhas;
}

// =====================================================
// DASHBOARD
// =====================================================
function atualizarStatsDashboard() {
  document.getElementById("stat-clientes").textContent = todosClientesLista.length || 0;
  document.getElementById("stat-veiculos").textContent = todosVeiculos.length || 0;
  document.getElementById("stat-pendentes").textContent = todosServicos.filter((s) => !s.finish).length;
  document.getElementById("stat-concluidos").textContent = todosServicos.filter((s) => s.finish).length;
  document.getElementById("stat-materiais").textContent = todosMateriais.length || 0;
}

function renderizarProximosDashboard() {
  // pega só os pendentes, ordena pela data mais próxima, mostra os 4 primeiros
  const proximos = todosServicos
    .filter((s) => !s.finish && s.date_release)
    .sort((a, b) => new Date(a.date_release) - new Date(b.date_release))
    .slice(0, 4);

  document.getElementById("dashboard-proximos").innerHTML =
    proximos.map(moldeCardServico).join("") ||
    '<p class="view-placeholder">Nenhum serviço pendente com data definida.</p>';
}

// =====================================================
// util genérica: aplica classe visual do modo em qualquer grid
// =====================================================
function aplicarClasseModoGenerico(gridId, modo) {
  document.querySelectorAll(`#${gridId} .item-card:not(.add-new)`).forEach((card) => {
    card.classList.remove("modo-edit", "modo-del");
    if (modo === "edit") card.classList.add("modo-edit");
    if (modo === "del") card.classList.add("modo-del");
  });
}

// =====================================================
// CARREGAMENTO INICIAL — busca tudo assim que a página abre
// =====================================================
async function carregarTudo() {
  popularCatalogoServico();
  await carregarClientes();
  await carregarVeiculos();
  await carregarServicos();
  await carregarMateriais();
  esconderLoadingInicial();
}

function esconderLoadingInicial() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.classList.add("escondido");
}

// =====================================================
// CALENDÁRIO
// =====================================================
const NOMES_MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const NOMES_MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// paleta de cores pros avatares — cada cliente sempre cai na mesma cor (hash pelo id)
const PALETA_AVATAR = ["#4f8ef7", "#f78e4f", "#37b893", "#a05ff2", "#f24f8e", "#e0b400", "#4fc7f7", "#f2734f", "#7a5ff2", "#5ff2b0"];

let calMesAtual = new Date().getMonth(); // 0-11
let calAnoAtual = new Date().getFullYear();
let calModo = "mes"; // "mes" | "ano"

function corPorId(id) {
  return PALETA_AVATAR[id % PALETA_AVATAR.length];
}

function iniciaisCliente(nome) {
  if (!nome) return "?";
  const partes = nome.trim().split(" ").filter(Boolean);
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function nomeClienteServico(client_id) {
  const c = todosClientes.find((c) => c.client_id === client_id);
  return c ? c.name : `Cliente #${client_id}`;
}

// agrupa os serviços pendentes por dia, chave "YYYY-MM-DD" — mesmo formato que sai do date_release
function agruparServicosPorDia() {
  const grupos = {};
  todosServicos
    .filter((s) => s.date_release && !s.finish)
    .forEach((s) => {
      const chave = s.date_release.substring(0, 10);
      if (!grupos[chave]) grupos[chave] = [];
      grupos[chave].push(s);
    });
  return grupos;
}

function chaveDia(ano, mes, dia) {
  const mm = String(mes + 1).padStart(2, "0");
  const dd = String(dia).padStart(2, "0");
  return `${ano}-${mm}-${dd}`;
}

function inicializarCalendario() {
  const selMes = document.getElementById("cal-select-mes");
  const selAno = document.getElementById("cal-select-ano");

  selMes.innerHTML = NOMES_MESES.map((nome, i) => `<option value="${i}">${nome}</option>`).join("");

  const anoBase = new Date().getFullYear();
  let opcoesAno = "";
  for (let y = anoBase - 3; y <= anoBase + 5; y++) {
    opcoesAno += `<option value="${y}">${y}</option>`;
  }
  selAno.innerHTML = opcoesAno;

  renderizarCalendario();
}

function calAnterior() {
  if (calModo === "mes") calMesAnterior();
  else calAnoAnterior();
}

function calProximo() {
  if (calModo === "mes") calMesProximo();
  else calAnoProximo();
}

function calMesAnterior() {
  calMesAtual--;
  if (calMesAtual < 0) {
    calMesAtual = 11;
    calAnoAtual--;
  }
  renderizarCalendario();
}

function calMesProximo() {
  calMesAtual++;
  if (calMesAtual > 11) {
    calMesAtual = 0;
    calAnoAtual++;
  }
  renderizarCalendario();
}

function calAnoAnterior() {
  calAnoAtual--;
  renderizarCalendario();
}

function calAnoProximo() {
  calAnoAtual++;
  renderizarCalendario();
}

function calSetarMes(valor) {
  calMesAtual = Number(valor);
  renderizarCalendario();
}

function calSetarAno(valor) {
  calAnoAtual = Number(valor);
  renderizarCalendario();
}

function calAlternarModoAno() {
  calModo = calModo === "mes" ? "ano" : "mes";
  document.getElementById("cal-btn-modo").innerHTML =
    calModo === "mes"
      ? '<i class="ti ti-layout-grid"></i> Ver ano completo'
      : '<i class="ti ti-calendar-event"></i> Voltar ao mês';
  document.getElementById("cal-select-mes").style.display = calModo === "mes" ? "" : "none";
  renderizarCalendario();
}

function calAbrirMes(m) {
  calMesAtual = m;
  calModo = "mes";
  document.getElementById("cal-btn-modo").innerHTML = '<i class="ti ti-layout-grid"></i> Ver ano completo';
  document.getElementById("cal-select-mes").style.display = "";
  renderizarCalendario();
}

function renderizarCalendario() {
  document.getElementById("cal-select-mes").value = calMesAtual;
  document.getElementById("cal-select-ano").value = calAnoAtual;
  document.getElementById("cal-titulo").textContent =
    calModo === "mes" ? `${NOMES_MESES[calMesAtual]} ${calAnoAtual}` : `${calAnoAtual}`;

  document.getElementById("calendario-mes").style.display = calModo === "mes" ? "" : "none";
  document.getElementById("calendario-ano").style.display = calModo === "ano" ? "" : "none";

  if (calModo === "mes") renderizarMesCalendario();
  else renderizarAnoCalendario();
}

function renderizarMesCalendario() {
  const grupos = agruparServicosPorDia();
  const grid = document.getElementById("calendario-mes");
  let html = DIAS_SEMANA.map((d) => `<div class="cal-dow">${d}</div>`).join("");

  const primeiroDiaSemana = new Date(calAnoAtual, calMesAtual, 1).getDay();
  const diasNoMes = new Date(calAnoAtual, calMesAtual + 1, 0).getDate();
  const hoje = new Date();
  const ehMesAtual = hoje.getFullYear() === calAnoAtual && hoje.getMonth() === calMesAtual;

  for (let i = 0; i < primeiroDiaSemana; i++) {
    html += `<div class="cal-dia cal-dia-vazio"></div>`;
  }

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const chave = chaveDia(calAnoAtual, calMesAtual, dia);
    const servicosDoDia = grupos[chave] || [];
    const ehHoje = ehMesAtual && hoje.getDate() === dia;

    const avatares = servicosDoDia
      .slice(0, 4)
      .map((s) => {
        const cliente = nomeClienteServico(s.client_id);
        const veiculo = nomeVeiculoServico(s.vehicle_id);
        return `<div class="cal-avatar" style="background:${corPorId(s.client_id)}"
                  onmouseenter="mostrarTooltipCal(event, ${s.service_id})"
                  onmousemove="posicionarTooltipCal(event)"
                  onmouseleave="esconderTooltipCal()"
                  onclick="abrirDetalheServico(${s.service_id})">${iniciaisCliente(cliente)}</div>`;
      })
      .join("");

    const extra = servicosDoDia.length > 4 ? `<div class="cal-mais">+${servicosDoDia.length - 4}</div>` : "";

    html += `
      <div class="cal-dia ${ehHoje ? "cal-dia-hoje" : ""}">
        <span class="cal-dia-num">${dia}</span>
        <div class="cal-avatares">${avatares}${extra}</div>
      </div>`;
  }

  grid.innerHTML = html;
}

function renderizarAnoCalendario() {
  const grupos = agruparServicosPorDia();
  const cont = document.getElementById("calendario-ano");
  let html = "";

  for (let m = 0; m < 12; m++) {
    const diasNoMes = new Date(calAnoAtual, m + 1, 0).getDate();
    const primeiroDiaSemana = new Date(calAnoAtual, m, 1).getDay();

    let diasHtml = "";
    for (let i = 0; i < primeiroDiaSemana; i++) diasHtml += `<span></span>`;
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const chave = chaveDia(calAnoAtual, m, dia);
      const temServico = !!(grupos[chave] && grupos[chave].length);
      diasHtml += `<span class="${temServico ? "cal-mini-dia-com-servico" : ""}">${dia}</span>`;
    }

    html += `
      <div class="cal-mini-mes" onclick="calAbrirMes(${m})">
        <div class="cal-mini-titulo">${NOMES_MESES_ABREV[m]}</div>
        <div class="cal-mini-grid">${diasHtml}</div>
      </div>`;
  }

  cont.innerHTML = html;
}

function mostrarTooltipCal(evt, serviceId) {
  const s = todosServicos.find((s) => s.service_id === serviceId);
  if (!s) return;
  const cliente = nomeClienteServico(s.client_id);
  const veiculo = nomeVeiculoServico(s.vehicle_id);

  const tip = document.getElementById("cal-tooltip");
  tip.textContent = `${cliente} · ${veiculo} · ${s.title}`;
  tip.style.display = "block";
  posicionarTooltipCal(evt);
}

function posicionarTooltipCal(evt) {
  const tip = document.getElementById("cal-tooltip");
  tip.style.left = evt.pageX + 14 + "px";
  tip.style.top = evt.pageY + 14 + "px";
}

function esconderTooltipCal() {
  document.getElementById("cal-tooltip").style.display = "none";
}

carregarTudo();
inicializarCalendario();
const titulosPorView = {
  dashboard: "Central",
  calendario: "Calendário",
  clientes: "Clientes",
  veiculos: "Veículos",
  servicos: "Serviços",
  materiais: "Materiais",
  status: "Status",
};

function trocarView(nomeView, linkClicado) {
  // esconde todas as views
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  // mostra só a que foi pedida
  document.getElementById(`view-${nomeView}`).classList.add("active");

  // atualiza qual link do menu está "ativo" visualmente
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
  linkClicado.classList.add("active");

  // atualiza o título do topbar
  document.getElementById("page-title").textContent = titulosPorView[nomeView];

  return false; // evita o link "#" rolar a página pro topo
}
