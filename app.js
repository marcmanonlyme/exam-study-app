// app.js


const mainContent = document.getElementById("mainContent");
const menuList = document.getElementById("menuList");
const inicioBtn = document.getElementById("inicioBtn");
const adminBtn = document.getElementById("adminBtn");
const examSimBtn = document.getElementById("examSimBtn");

// Lista de módulos y secciones
const modules = [
  { name: "Modulo1", sections: [1,2,3,4,5] },
  { name: "Modulo2", sections: [1,2,3,4,5] },
  { name: "Modulo3", sections: [1,2,3,4,5] },
  { name: "Modulo4", sections: [1,2,3,4,5] },
  { name: "Modulo5", sections: [1,2,3,4,5] }
];

// Render sidebar menu
function renderSidebar() {
  // Remove old module items
  menuList.querySelectorAll('.module-entry').forEach(e => e.remove());
  modules.forEach(mod => {
    const modLi = document.createElement('li');
    modLi.className = 'module-entry';
    modLi.innerHTML = `<strong>${mod.name}</strong>`;
    const secUl = document.createElement('ul');
    secUl.style.listStyle = 'none';
    secUl.style.paddingLeft = '10px';
    mod.sections.forEach(sec => {
      const secLi = document.createElement('li');
      const btn = document.createElement('button');
      btn.textContent = `Sección ${sec}`;
      btn.style.width = '100%';
      btn.onclick = () => loadQuiz(mod.name, sec);
      secLi.appendChild(btn);
      secUl.appendChild(secLi);
    });
    modLi.appendChild(secUl);
    menuList.appendChild(modLi);
  });
}

// Splash screen rendering
function renderSplashScreen() {
  mainContent.innerHTML = `<h1>🧠 Cuestionarios por Módulo</h1>
    <div id="countdown" style="font-size:1.2em; margin-bottom:20px;"></div>
    <div id="stats"></div>`;
  renderCountdown();
  renderStats();
}

// Countdown to exam
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

// Stats per module
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

// Load quiz for module/section
function loadQuiz(moduleName, sectionNum) {
  fetch(`Modulos/${moduleName}/seccion${sectionNum}.json`)
    .then(response => response.json())
    .then(data => {
      let currentIndex = 0;
      let userAnswers = Array(data.length).fill(null);

      function renderQuestion() {
        mainContent.innerHTML = `
          <h2>${moduleName} - Sección ${sectionNum}</h2>
          <div id="progress" style="margin-bottom:16px; font-weight:500; color:#4f8cff;">Pregunta ${currentIndex + 1} de ${data.length}</div>
          <form id="quizForm" tabindex="0"></form>
          <div style="margin-top:18px; display:flex; gap:10px;">
            <button id="prevBtn" ${currentIndex === 0 ? 'disabled' : ''}>Anterior</button>
            <button id="nextBtn" ${currentIndex === data.length - 1 ? 'disabled' : ''}>Siguiente</button>
            <button id="submitBtn" style="display:${currentIndex === data.length - 1 ? 'inline-block' : 'none'};">Enviar respuestas</button>
          </div>
          <div id="results" class="result"></div>
        `;
        const quizForm = document.getElementById("quizForm");
        const q = data[currentIndex];
        let optionsHtml = '';
        q.options.forEach((opt, i) => {
          optionsHtml += `
            <label tabindex="0">
              <input type="radio" name="q${currentIndex}" value="${i}" ${userAnswers[currentIndex] === i ? 'checked' : ''}>
              ${opt}
            </label><br>
          `;
        });
        quizForm.innerHTML = `<div class="question"><p>${q.question}</p>${optionsHtml}</div>`;

        // Keyboard shortcuts for options (1-5)
        quizForm.onkeydown = function(e) {
          if (e.key >= '1' && e.key <= String(q.options.length)) {
            const idx = Number(e.key) - 1;
            const radios = quizForm.querySelectorAll('input[type="radio"]');
            if (radios[idx]) {
              radios[idx].checked = true;
              userAnswers[currentIndex] = idx;
            }
          }
        };

        // Option change
        quizForm.querySelectorAll('input[type="radio"]').forEach((radio, idx) => {
          radio.onchange = () => {
            userAnswers[currentIndex] = idx;
          };
        });

        document.getElementById("prevBtn").onclick = () => {
          if (currentIndex > 0) { currentIndex--; renderQuestion(); }
        };
        document.getElementById("nextBtn").onclick = () => {
          if (currentIndex < data.length - 1) { currentIndex++; renderQuestion(); }
        };
        document.getElementById("submitBtn").onclick = function(e) {
          e.preventDefault();
          checkAnswersModal(moduleName, sectionNum, data, userAnswers);
        };
      }
      renderQuestion();
    })
    .catch(err => {
      mainContent.innerHTML = `<p style='color:red;'>Error al cargar el módulo: ${err}</p>`;
    });
}

// Check answers and save stats
// Modal/toast for feedback

function showExamResultsPage(html) {
  mainContent.innerHTML = `<div style='max-width:700px;margin:auto;'>${html}<br><button id='backToSplashBtn' style='margin-top:18px; background:#4f8cff; color:#fff; border:none; border-radius:8px; padding:10px 32px; font-size:1em; cursor:pointer;'>Volver al inicio</button></div>`;
  document.getElementById('backToSplashBtn').onclick = renderSplashScreen;
}

function checkAnswersModal(moduleName, sectionNum, questions, userAnswers) {
  let score = 0;
  let feedback = "";
  questions.forEach((q, index) => {
    const userAnswer = userAnswers[index];
    const correct = q.answer;
    if (userAnswer === correct) {
      score++;
      feedback += `<p class="correct">✅ Pregunta ${index + 1}: Correcta<br>${q.explanation}</p>`;
    } else {
      feedback += `<p class="incorrect">❌ Pregunta ${index + 1}: Incorrecta<br>${q.explanation}</p>`;
    }
  });
  // Guardar en localStorage
  const key = `resultado_${moduleName}_seccion${sectionNum}`;
  localStorage.setItem(key, JSON.stringify({ score, total: questions.length, timestamp: new Date().toISOString() }));
  showModal(`<h2>Resultado: ${score} de ${questions.length}</h2>${feedback}`);
}


// Data Administration page
function renderAdminPage() {
  let html = `<h1>Administración de Datos</h1>
    <div style='margin-bottom:24px;'>
      <button id='resetAllBtn' style='background:#ff4136;color:#fff;padding:12px 32px;border:none;border-radius:8px;font-size:1em;cursor:pointer;margin-bottom:18px;'>Resetear todos los puntajes</button>
    </div>
    <div id='adminModules'></div>
    <div id='adminResult' style='margin-top:18px;color:#2ecc40;font-weight:500;'></div>`;
  mainContent.innerHTML = html;
  const adminModules = document.getElementById('adminModules');
  modules.forEach(mod => {
    let modHtml = `<div style='margin-bottom:18px;padding:16px 12px;background:#f0f6ff;border-radius:10px;'>
      <strong>${mod.name}</strong>
      <button class='resetModuloBtn' data-mod='${mod.name}' style='margin-left:12px;background:#ffb347;color:#fff;padding:8px 18px;border:none;border-radius:8px;font-size:0.95em;cursor:pointer;'>Resetear módulo</button>
      <ul style='list-style:none;padding-left:10px;margin-top:10px;'>`;
    mod.sections.forEach(sec => {
      modHtml += `<li style='margin-bottom:6px;'>Sección ${sec} <button class='resetSeccionBtn' data-mod='${mod.name}' data-sec='${sec}' style='margin-left:8px;background:#4f8cff;color:#fff;padding:6px 14px;border:none;border-radius:8px;font-size:0.9em;cursor:pointer;'>Resetear sección</button></li>`;
    });
    modHtml += '</ul></div>';
    adminModules.innerHTML += modHtml;
  });

  // Reset all
  document.getElementById('resetAllBtn').onclick = () => {
    let count = 0;
    modules.forEach(mod => {
      mod.sections.forEach(sec => {
        const key = `resultado_${mod.name}_seccion${sec}`;
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          count++;
        }
      });
    });
    document.getElementById('adminResult').textContent = `Se han reseteado ${count} puntajes.`;
  };

  // Reset modulo
  document.querySelectorAll('.resetModuloBtn').forEach(btn => {
    btn.onclick = () => {
      const modName = btn.getAttribute('data-mod');
      let count = 0;
      const mod = modules.find(m => m.name === modName);
      mod.sections.forEach(sec => {
        const key = `resultado_${modName}_seccion${sec}`;
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          count++;
        }
      });
      document.getElementById('adminResult').textContent = `Se han reseteado ${count} puntajes de ${modName}.`;
    };
  });

  // Reset seccion
  document.querySelectorAll('.resetSeccionBtn').forEach(btn => {
    btn.onclick = () => {
      const modName = btn.getAttribute('data-mod');
      const secNum = btn.getAttribute('data-sec');
      const key = `resultado_${modName}_seccion${secNum}`;
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        document.getElementById('adminResult').textContent = `Se ha reseteado el puntaje de ${modName} - Sección ${secNum}.`;
      } else {
        document.getElementById('adminResult').textContent = `No hay puntaje guardado para ${modName} - Sección ${secNum}.`;
      }
    };
  });
}


// Exam Simulator
function renderExamSimConfig() {
  mainContent.innerHTML = `<h1>Simulador de Examen</h1>
    <form id='examConfigForm' style='margin-bottom:32px;'>
      <label>Tiempo de examen (minutos, 0 = ilimitado): <input type='number' id='examTime' min='0' value='0' style='width:80px;'></label><br><br>
      <label>Número de preguntas: <input type='number' id='examNumQuestions' min='1' value='10' style='width:80px;'></label><br><br>
      <button id='startExamBtn' style='background:#2d6cdf;color:#fff;padding:12px 32px;border:none;border-radius:8px;font-size:1em;cursor:pointer;'>Comenzar Examen</button>
    </form>
    <h2>Intentos anteriores</h2>
    <table id='examScoresTable' style='width:100%;margin-top:12px;border-collapse:collapse;'>
      <thead><tr style='background:#eaf4ff;'><th>Correctas</th><th>Preguntas</th><th>Duración</th></tr></thead>
      <tbody></tbody>
    </table>`;
  renderExamScoresTable();
  document.getElementById('startExamBtn').onclick = function(e) {
    e.preventDefault();
    const timeLimit = parseInt(document.getElementById('examTime').value, 10);
    const numQuestions = parseInt(document.getElementById('examNumQuestions').value, 10);
    startExamSim(timeLimit, numQuestions);
  };
}

function renderExamScoresTable() {
  const tbody = document.querySelector('#examScoresTable tbody');
  tbody.innerHTML = '';
  const scores = JSON.parse(localStorage.getItem('examSimScores') || '[]');
  scores.forEach(score => {
    tbody.innerHTML += `<tr><td>${score.correct}</td><td>${score.total}</td><td>${score.duration}</td></tr>`;
  });
}

async function startExamSim(timeLimit, numQuestions) {
  // Gather all questions from all modules/sections
  let allQuestions = [];
  for (const mod of modules) {
    for (const sec of mod.sections) {
      try {
        const res = await fetch(`Modulos/${mod.name}/seccion${sec}.json`);
        const data = await res.json();
        allQuestions = allQuestions.concat(data.map(q => ({...q, mod: mod.name, sec})));
      } catch {}
    }
  }
  // Shuffle and select questions
  allQuestions = allQuestions.sort(() => Math.random() - 0.5);
  const selectedQuestions = allQuestions.slice(0, numQuestions);
  let skippedIndexes = [];
  let userAnswers = Array(selectedQuestions.length).fill(null);
  let currentIndex = 0;
  let startTime = Date.now();
  let timerInterval = null;
  let timeExpired = false;

  function renderExamQuestion() {
    let timeDisplay = '';
    if (timeLimit > 0) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, timeLimit * 60 - elapsed);
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      timeDisplay = `<div style='font-weight:500;color:#ff4136;margin-bottom:10px;'>Tiempo restante: ${mins}:${secs.toString().padStart(2,'0')}</div>`;
      if (remaining === 0) {
        timeExpired = true;
        finishExam();
        return;
      }
    }
    mainContent.innerHTML = `
      <h2>Simulador de Examen</h2>
      ${timeDisplay}
      <div id='progress' style='margin-bottom:16px; font-weight:500; color:#4f8cff;'>Pregunta ${currentIndex + 1} de ${selectedQuestions.length}</div>
      <form id='examQuizForm' tabindex='0'></form>
      <div style='margin-top:18px; display:flex; gap:10px;'>
        <button id='nextExamBtn' ${currentIndex === selectedQuestions.length - 1 ? 'disabled' : ''}>Siguiente</button>
        <button id='skipExamBtn'>Saltar</button>
        <button id='finishExamBtn' style='background:#ff4136;color:#fff;'>Terminar Examen</button>
      </div>
    `;
    const quizForm = document.getElementById('examQuizForm');
    const q = selectedQuestions[currentIndex];
    let optionsHtml = '';
    q.options.forEach((opt, i) => {
      optionsHtml += `
        <label tabindex='0'>
          <input type='radio' name='q${currentIndex}' value='${i}' ${userAnswers[currentIndex] === i ? 'checked' : ''}>
          ${opt}
        </label><br>
      `;
    });
    quizForm.innerHTML = `<div class='question'><p>${q.question}</p>${optionsHtml}</div>`;
    quizForm.onkeydown = function(e) {
      if (e.key >= '1' && e.key <= String(q.options.length)) {
        const idx = Number(e.key) - 1;
        const radios = quizForm.querySelectorAll('input[type="radio"]');
        if (radios[idx]) {
          radios[idx].checked = true;
          userAnswers[currentIndex] = idx;
        }
      }
    };
    quizForm.querySelectorAll('input[type="radio"]').forEach((radio, idx) => {
      radio.onchange = () => {
        userAnswers[currentIndex] = idx;
      };
    });
    document.getElementById('nextExamBtn').onclick = () => {
      if (currentIndex < selectedQuestions.length - 1) {
        currentIndex++;
        renderExamQuestion();
      }
    };
    document.getElementById('skipExamBtn').onclick = () => {
      if (!skippedIndexes.includes(currentIndex)) skippedIndexes.push(currentIndex);
      if (currentIndex < selectedQuestions.length - 1) {
        currentIndex++;
        renderExamQuestion();
      } else {
        // If reached end, cycle through skipped
        cycleSkipped();
      }
    };
    document.getElementById('finishExamBtn').onclick = () => {
      finishExam();
    };
  }

  function cycleSkipped() {
    // If there are skipped questions, cycle through them
    if (skippedIndexes.length > 0) {
      currentIndex = skippedIndexes.shift();
      renderExamQuestion();
    } else {
      finishExam();
    }
  }

  function finishExam() {
    if (timerInterval) clearInterval(timerInterval);
    const endTime = Date.now();
    const durationSec = Math.floor((endTime - startTime) / 1000);
    const mins = Math.floor(durationSec / 60);
    const secs = durationSec % 60;
    let score = 0;
    let incorrectList = [];
    selectedQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.answer) {
        score++;
      } else {
        incorrectList.push({
          question: q.question,
          explanation: q.explanation,
          userAnswer: userAnswers[idx] !== null ? q.options[userAnswers[idx]] : 'Sin respuesta',
          correctAnswer: q.options[q.answer]
        });
      }
    });
    // Save score
    const scores = JSON.parse(localStorage.getItem('examSimScores') || '[]');
    scores.push({ correct: score, total: selectedQuestions.length, duration: `${mins}:${secs.toString().padStart(2,'0')}` });
    localStorage.setItem('examSimScores', JSON.stringify(scores));
    // Show breakdown
    let html = `<h2>Resultado del Examen</h2>
      <p>Correctas: ${score} / ${selectedQuestions.length}</p>
      <p>Duración: ${mins}:${secs.toString().padStart(2,'0')}</p>
      <h3>Preguntas Incorrectas</h3>`;
    if (incorrectList.length === 0) {
      html += '<p>¡Todas las respuestas son correctas!</p>';
    } else {
      html += '<ul style="text-align:left;">';
      incorrectList.forEach(item => {
        html += `<li style='margin-bottom:12px;'><strong>${item.question}</strong><br>
        <span style='color:#ff4136;'>Tu respuesta: ${item.userAnswer}</span><br>
        <span style='color:#2ecc40;'>Respuesta correcta: ${item.correctAnswer}</span><br>
        <span style='color:#4f8cff;'>Explicación: ${item.explanation}</span></li>`;
      });
      html += '</ul>';
    }
  showExamResultsPage(html);
  }

  renderExamQuestion();
  if (timeLimit > 0) {
    timerInterval = setInterval(renderExamQuestion, 1000);
  }
}

// Event listeners
inicioBtn.onclick = renderSplashScreen;
adminBtn.onclick = renderAdminPage;
examSimBtn.onclick = renderExamSimConfig;
renderSidebar();
renderSplashScreen();
