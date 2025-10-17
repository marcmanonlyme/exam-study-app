// Handles splash screen and countdown
import { modules } from '../modules.js';
import { computeModuleStats } from '../utils.js';

export function renderSplashScreen(mainContent) {
  mainContent.innerHTML = `<h1>🧠 Cuestionarios por Módulo</h1>
    <div id="countdown" style="font-size:1.2em; margin-bottom:20px;"></div>
    <div id="stats"></div>`;
  renderCountdown();
  renderStats();
}

function renderCountdown() {
  const examDate = new Date('2025-11-09T00:00:00');
  function updateCountdown() {
    const now = new Date();
    const diff = examDate - now;
    if (diff <= 0) {
      document.getElementById('countdown').textContent = '¡El examen es hoy!';
      return;
    }
    const days = Math.floor(diff / (1000*60*60*24));
    const hours = Math.floor((diff / (1000*60*60)) % 24);
    const mins = Math.floor((diff / (1000*60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    document.getElementById('countdown').textContent = `Faltan ${days} días, ${hours} horas, ${mins} minutos, ${secs} segundos para el examen.`;
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);
}

async function renderStats() {
  let html = '<h2>Estadísticas por módulo</h2><table border="1" cellpadding="6"><tr><th>Módulo</th><th>Correctas</th><th>Incorrectas</th><th>No respondidas</th></tr>';
  for (const mod of modules) {
    // Compute module stats (prefers aggregated stats and falls back to per-section)
    const stats = await computeModuleStats(mod);
    html += `<tr><td>${mod.name}</td><td>${stats.correct}</td><td>${stats.incorrect}</td><td>${stats.notAnswered}</td></tr>`;
  }
  html += '</table>';
  document.getElementById('stats').innerHTML = html;
}
