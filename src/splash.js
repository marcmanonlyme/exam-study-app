// Handles splash screen and countdown
import { modules } from './modules.js';

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

function renderStats() {
  let html = '<h2>Estadísticas por módulo</h2><table border="1" cellpadding="6"><tr><th>Módulo</th><th>Correctas</th><th>Incorrectas</th><th>No respondidas</th></tr>';
  modules.forEach(mod => {
    let correct = 0, incorrect = 0, notAnswered = 0, total = 0;
    mod.sections.forEach(sec => {
      const key = `resultado_${mod.name}_seccion${sec}`;
      const res = localStorage.getItem(key);
      if (res) {
        const obj = JSON.parse(res);
        correct += obj.score;
        incorrect += (obj.total - obj.score);
        total += obj.total;
      } else {
        notAnswered += 5; // Assume 5 questions per section if not answered
        total += 5;
      }
    });
    html += `<tr><td>${mod.name}</td><td>${correct}</td><td>${incorrect}</td><td>${notAnswered}</td></tr>`;
  });
  html += '</table>';
  document.getElementById('stats').innerHTML = html;
}
