// Handles Exam Simulator logic
export function renderExamSimConfig(mainContent, modules) {
  mainContent.innerHTML = `<h1>Simulador de Examen</h1>
    <form id='examConfigForm' style='margin-bottom:32px;'>
      <label>Tiempo de examen (minutos, 0 = ilimitado): <input type='number' id='examTime' min='0' value='0' style='width:80px;'></label><br><br>
      <label>Número de preguntas: <input type='number' id='examNumQuestions' min='1' value='10' style='width:80px;'></label><br><br>
      <button id='startExamBtn' style='background:#2d6cdf;color:#fff;padding:12px 32px;border:none;border-radius:8px;font-size:1em;cursor:pointer;'>Comenzar Examen</button>
    </form>
    <h2>Intentos anteriores</h2>
    <table id='examScoresTable' style='width:100%;margin-top:12px;border-collapse:collapse;'>
      <thead><tr style='background:#eaf4ff;'>
        <th id='sortCorrect' style='cursor:pointer;'>Correctas <span id='arrowCorrect'></span></th>
        <th id='sortTotal' style='cursor:pointer;'>Preguntas <span id='arrowTotal'></span></th>
        <th id='sortDuration' style='cursor:pointer;'>Duración <span id='arrowDuration'></span></th>
      </tr></thead>
      <tbody></tbody>
    </table>`;
  // Sorting state
  window.examSimSortState = { column: null, asc: true };
  renderExamScoresTable();
  // Update visual cues after rendering
  function updateSortArrows() {
    const sortState = window.examSimSortState || { column: null, asc: true };
    const arrows = {
      asc: '&#x25B2;', // ▲
      desc: '&#x25BC;' // ▼
    };
    document.getElementById('arrowCorrect').innerHTML = sortState.column === 'correct' ? arrows[sortState.asc ? 'asc' : 'desc'] : '';
    document.getElementById('arrowTotal').innerHTML = sortState.column === 'total' ? arrows[sortState.asc ? 'asc' : 'desc'] : '';
    document.getElementById('arrowDuration').innerHTML = sortState.column === 'duration' ? arrows[sortState.asc ? 'asc' : 'desc'] : '';
    // Highlight sorted column
    ['sortCorrect','sortTotal','sortDuration'].forEach(id => {
      document.getElementById(id).style.background = '';
      document.getElementById(id).style.color = '';
    });
    if (sortState.column) {
      const colId = sortState.column === 'correct' ? 'sortCorrect' : sortState.column === 'total' ? 'sortTotal' : 'sortDuration';
      document.getElementById(colId).style.background = '#d0e6ff';
      document.getElementById(colId).style.color = '#2d6cdf';
    }
  }
  updateSortArrows();
  // Add sorting event listeners
  document.getElementById('sortCorrect').onclick = function() {
    window.examSimSortState = { column: 'correct', asc: window.examSimSortState.column === 'correct' ? !window.examSimSortState.asc : true };
    renderExamScoresTable();
    updateSortArrows();
  };
  document.getElementById('sortTotal').onclick = function() {
    window.examSimSortState = { column: 'total', asc: window.examSimSortState.column === 'total' ? !window.examSimSortState.asc : true };
    renderExamScoresTable();
    updateSortArrows();
  };
  document.getElementById('sortDuration').onclick = function() {
    window.examSimSortState = { column: 'duration', asc: window.examSimSortState.column === 'duration' ? !window.examSimSortState.asc : true };
    renderExamScoresTable();
    updateSortArrows();
  };
  document.getElementById('startExamBtn').onclick = function(e) {
    e.preventDefault();
    const timeLimit = parseInt(document.getElementById('examTime').value, 10);
    const numQuestions = parseInt(document.getElementById('examNumQuestions').value, 10);
    startExamSim(mainContent, modules, timeLimit, numQuestions);
  };
}

function renderExamScoresTable() {
  const tbody = document.querySelector('#examScoresTable tbody');
  tbody.innerHTML = '';
  let scores = JSON.parse(localStorage.getItem('examSimScores') || '[]');
  // Sort if needed
  const sortState = window.examSimSortState || { column: null, asc: true };
  if (sortState.column) {
    scores = scores.slice();
    scores.sort((a, b) => {
      if (sortState.column === 'duration') {
        // Parse mm:ss
        const parseTime = t => {
          const [m, s] = t.split(':').map(Number);
          return m * 60 + s;
        };
        return sortState.asc ? parseTime(a.duration) - parseTime(b.duration) : parseTime(b.duration) - parseTime(a.duration);
      } else {
        return sortState.asc ? a[sortState.column] - b[sortState.column] : b[sortState.column] - a[sortState.column];
      }
    });
  }
  scores.forEach((score, idx) => {
    tbody.innerHTML += `<tr>
      <td>${score.correct}</td>
      <td>${score.total}</td>
      <td>${score.duration}</td>
      <td><button class='deleteScoreBtn' data-idx='${idx}' style='background:#ff4136;color:#fff;border:none;border-radius:6px;padding:4px 12px;cursor:pointer;'>Eliminar</button></td>
    </tr>`;
  });
  // Add event listeners for delete buttons
  tbody.querySelectorAll('.deleteScoreBtn').forEach(btn => {
    btn.onclick = function() {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const scores = JSON.parse(localStorage.getItem('examSimScores') || '[]');
      scores.splice(idx, 1);
      localStorage.setItem('examSimScores', JSON.stringify(scores));
      renderExamScoresTable();
    };
  });
}

export async function startExamSim(mainContent, modules, timeLimit, numQuestions) {
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

  function showExamResultsPage(html) {
    mainContent.innerHTML = `<div style='max-width:700px;margin:auto;'>${html}<br><button id='backToSplashBtn' style='margin-top:18px; background:#4f8cff; color:#fff; border:none; border-radius:8px; padding:10px 32px; font-size:1em; cursor:pointer;'>Volver al inicio</button></div>`;
    document.getElementById('backToSplashBtn').onclick = () => window.location.reload();
  }

  renderExamQuestion();
  if (timeLimit > 0) {
    timerInterval = setInterval(renderExamQuestion, 1000);
  }
}
