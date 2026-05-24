const form = document.querySelector("#accessForm");
const input = document.querySelector("#accessKey");
const button = document.querySelector("#accessButton");
const statusMessage = document.querySelector("#statusMessage");
const loginPanel = document.querySelector("#loginPanel");
const dashboard = document.querySelector("#dashboard");
const logoutButton = document.querySelector("#logoutButton");
const licenseExpiry = document.querySelector("#licenseExpiry");
const deviceCount = document.querySelector("#deviceCount");

const ENDPOINT =
  "https://rglewxexywrxuqtehfbd.supabase.co/functions/v1/validate-key";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnbGV3eGV4eXdyeHVxdGVoZmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NDc0MjIsImV4cCI6MjA5MjAyMzQyMn0.KUxSQUPkrxycH3fw1WQrko73TfcBMpUevqc5TpRUwvA";
const DEVICE_ID_KEY = "panel_device_id";
const SESSION_KEY = "panel_session";

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

  const id =
    crypto.randomUUID?.() ||
    `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

function getErrorMessage(error, data) {
  const messages = {
    invalid_payload: "Payload invalido. Confira o formato da key.",
    revoked: "Sua key foi revogada pelo administrador.",
    device_limit: "Essa key ja foi usada no numero maximo de dispositivos.",
    not_found: "Key invalida.",
    expired: "Sua key expirou. Solicite renovacao.",
  };

  if (error === "device_limit" && data?.max_devices) {
    return `${messages.device_limit} (${data.devices_used}/${data.max_devices})`;
  }

  return messages[error] || "Key nao validada. Tente novamente.";
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
      key,
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

function formatExpiry(data) {
  if (data.duration_days === 0) return "Vitalicia";
  if (!data.expires_at) return "--";

  const expires = new Date(data.expires_at);
  return expires.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function showDashboard(data, key) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      key,
      data,
      validated_at: new Date().toISOString(),
    }),
  );

  licenseExpiry.textContent = formatExpiry(data);
  deviceCount.textContent = `${data.devices_used}/${data.max_devices}`;
  loginPanel.classList.add("hidden");
  dashboard.classList.remove("hidden");
}

function showLogin(message) {
  dashboard.classList.add("hidden");
  loginPanel.classList.remove("hidden");

  if (message) {
    statusMessage.textContent = message;
    statusMessage.className = "status error";
  }
}

async function submitKey(key) {
  button.disabled = true;
  button.textContent = "Validando...";
  statusMessage.textContent = "Validando key no servidor...";
  statusMessage.className = "status";

  try {
    const result = await validateKey(key);

    if (result.ok) {
      statusMessage.textContent = "";
      showDashboard(result.data, key);
      return;
    }

    showLogin(result.message);
  } catch {
    showLogin("Erro de rede. Key nao validada.");
  } finally {
    button.textContent = "Acessar";
    button.disabled = input.value.length !== 22;
  }
}

input.addEventListener("input", () => {
  input.value = formatKey(input.value);
  button.disabled = input.value.length !== 22;
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
