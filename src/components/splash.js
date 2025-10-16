// Handles splash screen and countdown
import { modules } from '../modules.js';

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
    // Prefer aggregated stats if available
    let correct = 0, incorrect = 0, notAnswered = 0, total = 0;
    try {
      const agg = JSON.parse(localStorage.getItem(`stats_${mod.name}`) || 'null');
      if (agg && typeof agg.correct === 'number' && typeof agg.total === 'number') {
        correct = agg.correct;
        total = agg.total;
        incorrect = total - correct;
        notAnswered = 0;
      } else {
        for (const sec of mod.sections) {
          const key = `resultado_${mod.name}_seccion${sec}`;
          const res = localStorage.getItem(key);
          if (res) {
            const obj = JSON.parse(res);
            correct += obj.score;
            incorrect += (obj.total - obj.score);
            total += obj.total;
          } else {
            // fetch the section JSON to count questions
            try {
              const resp = await fetch(`data/${mod.name}/seccion${sec}.json`);
              const jd = await resp.json();
              const count = Array.isArray(jd) ? jd.length : Array.isArray(jd.preguntas) ? jd.preguntas.length : 0;
              notAnswered += count;
              total += count;
            } catch (e) {
              // if fetch fails, assume 0
            }
          }
        }
      }
    } catch (e) {
      // fallback to per-section computation on error
      for (const sec of mod.sections) {
        const key = `resultado_${mod.name}_seccion${sec}`;
        const res = localStorage.getItem(key);
        if (res) {
          const obj = JSON.parse(res);
          correct += obj.score;
          incorrect += (obj.total - obj.score);
          total += obj.total;
        } else {
          try {
            const resp = await fetch(`data/${mod.name}/seccion${sec}.json`);
            const jd = await resp.json();
            const count = Array.isArray(jd) ? jd.length : Array.isArray(jd.preguntas) ? jd.preguntas.length : 0;
            notAnswered += count;
            total += count;
          } catch (e2) {
            // ignore
          }
        }
      }
    }
    html += `<tr><td>${mod.name}</td><td>${correct}</td><td>${incorrect}</td><td>${notAnswered}</td></tr>`;
  }
  html += '</table>';
  document.getElementById('stats').innerHTML = html;
}
