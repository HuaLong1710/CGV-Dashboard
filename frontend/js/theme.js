function applyTheme() {
  const theme = localStorage.getItem("theme") || "dark";
  document.body.classList.toggle("light-mode", theme === "light");

  const icon = document.getElementById("themeIcon");
  if (icon) {
    icon.textContent = theme === "light" ? "☀" : "☾";
  }
}

function toggleTheme() {
  const isLight = document.body.classList.contains("light-mode");
  localStorage.setItem("theme", isLight ? "dark" : "light");
  applyTheme();
}

document.addEventListener("DOMContentLoaded", applyTheme);