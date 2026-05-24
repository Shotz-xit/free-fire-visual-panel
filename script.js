const form = document.querySelector("#accessForm");
const input = document.querySelector("#accessKey");
const button = document.querySelector("#accessButton");
const statusMessage = document.querySelector("#statusMessage");

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

input.addEventListener("input", () => {
  input.value = formatKey(input.value);
  button.disabled = input.value.length < 8;
  statusMessage.textContent = "";
  statusMessage.className = "status";
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  statusMessage.textContent = "Acesso visual liberado. Esta pagina e apenas demonstrativa.";
  statusMessage.className = "status ok";
});
