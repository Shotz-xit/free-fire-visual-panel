const form = document.querySelector("#accessForm");
const input = document.querySelector("#accessKey");
const button = document.querySelector("#accessButton");
const statusMessage = document.querySelector("#statusMessage");
const loginPanel = document.querySelector("#loginPanel");
const dashboard = document.querySelector("#dashboard");
const logoutButton = document.querySelector("#logoutButton");
const matrixCanvas = document.querySelector("#matrixCanvas");
const fovRange = document.querySelector("#fovRange");
const fovValue = document.querySelector("#fovValue");
const tabTitle = document.querySelector("#tabTitle");
const tabButtons = [...document.querySelectorAll(".tab-button")];
const tabPages = [...document.querySelectorAll(".tab-page")];
const injectButtons = [...document.querySelectorAll(".inject-button")];
const injectStatus = document.querySelector("#injectStatus");
const terminal = document.querySelector("#terminal");
const terminalLines = document.querySelector("#terminalLines");
const themeButtons = [...document.querySelectorAll(".theme-swatch")];

const ENDPOINT =
  "https://rglewxexywrxuqtehfbd.supabase.co/functions/v1/validate-key";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnbGV3eGV4eXdyeHVxdGVoZmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDc0MjIsImV4cCI6MjA5MjAyMzQyMn0.KUxSQUPkrxycH3fw1WQrko73TfcBMpUevqc5TpRUwvA";
const DEVICE_ID_KEY = "ff_device_id";
const SESSION_KEY = "ff_auth_cache";
const tabNames = ["AIMBOT", "OTIMIZACAO", "INJETAR", "INFO"];
let matrixTimer;

function formatKey(value) {
  const clean = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 19);

  if (!clean) return "";

  const first = clean.slice(0, 7);
  const rest = clean.slice(7).match(/.{1,4}/g) || [];
  return [first, ...rest].join("-");
}

function getDeviceId() {
  const saved = localStorage.getItem(DEVICE_ID_KEY);
  if (saved) return saved;

  const seed = `${navigator.userAgent}-${Date.now()}-${Math.random()}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  const id = `web-${Math.abs(hash).toString(16)}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

function getErrorMessage(error, data) {
  const messages = {
    invalid_payload: "Formato de key invalido.",
    revoked: "Sua key foi revogada pelo administrador.",
    device_limit: "Essa key ja foi usada no numero maximo de dispositivos.",
    not_found: "Key invalida.",
    expired: "Sua key expirou. Solicite renovacao.",
  };

  if (error === "device_limit" && data?.max_devices) {
    return `${messages.device_limit} (${data.devices_used}/${data.max_devices})`;
  }

  return messages[error] || "Erro desconhecido.";
}

async function validateKey(key) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({
      key: key.toUpperCase(),
      device_id: getDeviceId(),
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (response.ok && data.success) {
    return { ok: true, data };
  }

  return {
    ok: false,
    message: getErrorMessage(data.error, data),
  };
}

function setTheme(theme) {
  const themes = {
    red: ["#ff0000", "255, 0, 0"],
    green: ["#00ff00", "0, 255, 0"],
    blue: ["#00aaff", "0, 170, 255"],
    purple: ["#ff00ff", "255, 0, 255"],
  };
  const selected = themes[theme] || themes.red;
  document.documentElement.style.setProperty("--primary", selected[0]);
  document.documentElement.style.setProperty("--primary-rgb", selected[1]);
  themeButtons.forEach((swatch) => swatch.classList.toggle("active", swatch.dataset.theme === theme));
}

function startMatrix() {
  if (matrixTimer) return;

  const context = matrixCanvas.getContext("2d");
  const chars =
    "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモ0123456789";
  const size = 13;
  let columns = 0;
  let drops = [];

  function resize() {
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;
    columns = Math.floor(matrixCanvas.width / size);
    drops = Array(columns).fill(1);
  }

  resize();
  window.addEventListener("resize", resize);

  matrixTimer = setInterval(() => {
    const color = getComputedStyle(document.documentElement)
      .getPropertyValue("--primary-rgb")
      .trim();
    context.fillStyle = "rgba(7, 7, 14, 0.18)";
    context.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    context.font = `bold ${size}px monospace`;

    drops.forEach((drop, index) => {
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = index * size;
      context.fillStyle = `rgba(${color}, 0.95)`;
      context.shadowColor = `rgb(${color})`;
      context.shadowBlur = 8;
      context.fillText(char, x, drop * size);

      if (drop * size > matrixCanvas.height && Math.random() > 0.975) drops[index] = 0;
      drops[index] += 1;
    });
  }, 50);
}

function showDashboard(data, key) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      key,
      ...data,
      cached_at: new Date().toISOString(),
    }),
  );

  loginPanel.classList.add("hidden");
  dashboard.classList.remove("hidden");
  matrixCanvas.classList.remove("hidden");
  startMatrix();
}

function showLogin(message) {
  dashboard.classList.add("hidden");
  matrixCanvas.classList.add("hidden");
  loginPanel.classList.remove("hidden");

  if (message) {
    statusMessage.textContent = message;
    statusMessage.className = "status error";
  }
}

async function submitKey(key) {
  button.disabled = true;
  button.textContent = "Validando...";
  statusMessage.textContent = "";
  statusMessage.className = "status";

  try {
    const result = await validateKey(key);

    if (result.ok) {
      showDashboard(result.data, key);
      return;
    }

    showLogin(result.message);
  } catch {
    showLogin("Sem conexao. Verifique sua internet.");
  } finally {
    button.textContent = "Acessar";
    button.disabled = input.value.length < 7;
  }
}

function switchTab(index) {
  tabTitle.textContent = tabNames[index];
  tabButtons.forEach((tab) => tab.classList.toggle("active", Number(tab.dataset.tab) === index));
  tabPages.forEach((page) => page.classList.toggle("active", Number(page.dataset.page) === index));
}

function runInjectionLabel(label) {
  const lines = [
    "> Inicializando modulo...",
    "> Verificando configuracao...",
    `> Selecionado: ${label}`,
    "> Aplicando perfil...",
    "> Status: CONCLUIDO",
  ];

  terminal.classList.remove("hidden");
  terminalLines.innerHTML = "";
  injectStatus.textContent = "Injetando...";
  injectStatus.classList.add("running");

  lines.forEach((line, index) => {
    setTimeout(() => {
      const item = document.createElement("div");
      item.textContent = line;
      terminalLines.appendChild(item);

      if (index === lines.length - 1) {
        injectStatus.textContent = "Aguardando injecao...";
        injectStatus.classList.remove("running");
      }
    }, index * 360);
  });
}

input.addEventListener("input", () => {
  input.value = formatKey(input.value);
  button.disabled = input.value.length < 7;
  statusMessage.textContent = "";
  statusMessage.className = "status";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitKey(input.value);
});

logoutButton.addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  input.value = "";
  button.disabled = true;
  showLogin("");
});

fovRange.addEventListener("input", () => {
  fovValue.textContent = fovRange.value;
});

tabButtons.forEach((tab) => {
  tab.addEventListener("click", () => switchTab(Number(tab.dataset.tab)));
});

injectButtons.forEach((injectButton) => {
  injectButton.addEventListener("click", () => runInjectionLabel(injectButton.dataset.target));
});

themeButtons.forEach((swatch) => {
  swatch.addEventListener("click", () => setTheme(swatch.dataset.theme));
});

window.addEventListener("load", async () => {
  const saved = localStorage.getItem(SESSION_KEY);
  if (!saved) return;

  try {
    const session = JSON.parse(saved);
    if (!session.key) return;
    input.value = session.key;
    button.disabled = false;
    await submitKey(session.key);
  } catch {
    localStorage.removeItem(SESSION_KEY);
  }
});
