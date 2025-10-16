// Handles Exam Simulator logic
export function renderExamSimConfig(mainContent, modules) {
  fetch('src/templates/examSimTableTemplate.html')
    .then(response => response.text())
    .then(tableHTML => {
      mainContent.innerHTML = `<h1>Simulador de Examen</h1>
        <form id='examConfigForm' style='margin-bottom:32px;'>
          <label>Tiempo de examen (minutos, 0 = ilimitado): <input type='number' id='examTime' min='0' value='0' style='width:80px;'></label><br><br>
          <label>Número de preguntas: <input type='number' id='examNumQuestions' min='1' value='10' style='width:80px;'></label><br><br>
          <button id='startExamBtn' style='background:#2d6cdf;color:#fff;padding:12px 32px;border:none;border-radius:8px;font-size:1em;cursor:pointer;'>Comenzar Examen</button>
        </form>
        <h2>Intentos anteriores</h2>
        ${tableHTML}`;
      window.examSimSortState = { column: null, asc: true };
      renderExamScoresTable();
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
    });
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
    const dateStr = score.date ? new Date(score.date).toLocaleString() : '';
    tbody.innerHTML += `<tr>
      <td>${dateStr}</td>
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
  // Gather all questions from all modules
  let allQuestions = [];
  for (const mod of modules) {
    for (const sec of mod.sections) {
      try {
        const res = await fetch(`data/${mod.name}/seccion${sec}.json`);
        const data = await res.json();
        if (Array.isArray(data)) {
          allQuestions = allQuestions.concat(data);
        } else if (Array.isArray(data.preguntas)) {
          allQuestions = allQuestions.concat(data.preguntas);
        }
      } catch (e) {
        // Ignore missing files
      }
    }
  }
  // Shuffle and select questions
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  const questions = shuffle(allQuestions).slice(0, numQuestions);
  let currentIndex = 0;
  let userAnswers = Array(questions.length).fill(null);
  let startTime = Date.now();
  let timerId = null;
  let timeLeft = timeLimit > 0 ? timeLimit * 60 : null;

  function renderExamQuestion() {
    let timerHtml = '';
    if (timeLimit > 0) {
      const min = Math.floor(timeLeft / 60);
      const sec = timeLeft % 60;
      timerHtml = `<div id="examTimer" style="font-size:1.2em;color:#2d6cdf;margin-bottom:12px;">Tiempo restante: ${min}:${sec.toString().padStart(2,'0')}</div>`;
    }
    mainContent.innerHTML = `
      <h2>Simulador de Examen</h2>
      ${timerHtml}
      <div id="progress" style="margin-bottom:16px; font-weight:500; color:#4f8cff;">Pregunta ${currentIndex + 1} de ${questions.length}</div>
      <form id="examForm" tabindex="0"></form>
      <div style="margin-top:18px; display:flex; gap:10px;">
        <button id="prevExamBtn" ${currentIndex === 0 ? 'disabled' : ''}>Anterior</button>
        <button id="nextExamBtn" ${currentIndex === questions.length - 1 ? 'disabled' : ''}>Siguiente</button>
        <button id="skipExamBtn" type="button">Saltar</button>
        <button id="finishExamBtn" type="button">Finalizar</button>
        <button id="submitExamBtn" style="display:${currentIndex === questions.length - 1 ? 'inline-block' : 'none'};">Enviar examen</button>
      </div>
      <div id="examResult" class="result"></div>
    `;
    const examForm = document.getElementById("examForm");
    const q = questions[currentIndex];
    let optionsHtml = '';
    (q.options || q.opciones).forEach((opt, i) => {
      optionsHtml += `
        <label tabindex="0">
          <input type="radio" name="q${currentIndex}" value="${i}" ${userAnswers[currentIndex] === i ? 'checked' : ''}>
          ${opt}
        </label><br>
      `;
    });
    examForm.innerHTML = `<div class="question"><p>${q.question || q.pregunta}</p>${optionsHtml}</div>`;
    examForm.onkeydown = function(e) {
      if (e.key >= '1' && e.key <= String((q.options || q.opciones).length)) {
        const idx = Number(e.key) - 1;
        const radios = examForm.querySelectorAll('input[type="radio"]');
        if (radios[idx]) {
          radios[idx].checked = true;
          userAnswers[currentIndex] = idx;
        }
      }
    };
    examForm.querySelectorAll('input[type="radio"]').forEach((radio, idx) => {
      radio.onchange = () => {
        userAnswers[currentIndex] = idx;
      };
    });
    document.getElementById("prevExamBtn").onclick = () => {
      if (currentIndex > 0) { currentIndex--; renderExamQuestion(); }
    };
    document.getElementById("nextExamBtn").onclick = () => {
      // Validate that an option is selected before moving to next
      if (userAnswers[currentIndex] === null) {
        const resultDiv = document.getElementById("examResult");
        resultDiv.textContent = "Por favor selecciona una opción antes de continuar.";
        resultDiv.style.color = "#ff4136";
        return;
      }
      // If on last question, submitting/finishing
      if (currentIndex >= questions.length - 1) {
        finishExam();
        return;
      }
      currentIndex++;
      renderExamQuestion();
    };
    document.getElementById("skipExamBtn").onclick = () => {
      userAnswers[currentIndex] = null;
      // If skipping last question, finish
      if (currentIndex >= questions.length - 1) {
        finishExam();
        return;
      }
      currentIndex++;
      renderExamQuestion();
    };
    document.getElementById("finishExamBtn").onclick = () => {
      finishExam();
    };
    document.getElementById("submitExamBtn").onclick = function(e) {
      e.preventDefault();
      finishExam();
    };
  }

  function finishExam() {
    // Check for skipped questions
    const skippedIndexes = userAnswers.map((ans, idx) => ans === null ? idx : -1).filter(idx => idx !== -1);
    if (skippedIndexes.length > 0) {
      // Cycle through skipped questions before showing results
      let skippedCurrent = 0;
      function renderSkippedQuestion() {
        const idx = skippedIndexes[skippedCurrent];
        const q = questions[idx];
        mainContent.innerHTML = `
          <h2>Pregunta saltada (${skippedCurrent + 1} de ${skippedIndexes.length})</h2>
          <div class="question"><p>${q.question || q.pregunta}</p></div>
          <form id="skippedForm"></form>
          <div style="margin-top:18px; display:flex; gap:10px;">
            <button id="prevSkippedBtn" ${skippedCurrent === 0 ? 'disabled' : ''}>Anterior</button>
            <button id="nextSkippedBtn" ${skippedCurrent === skippedIndexes.length - 1 ? 'disabled' : ''}>Siguiente</button>
            <button id="saveSkippedBtn">Guardar respuesta</button>
            <button id="finishSkippedBtn">Finalizar examen</button>
          </div>
          <div id="skippedResult" class="result"></div>
        `;
        let optionsHtml = '';
        (q.options || q.opciones).forEach((opt, i) => {
          optionsHtml += `
            <label tabindex="0">
              <input type="radio" name="qSkipped${idx}" value="${i}" ${userAnswers[idx] === i ? 'checked' : ''}>
              ${opt}
            </label><br>
          `;
        });
        document.getElementById("skippedForm").innerHTML = optionsHtml;
        document.getElementById("prevSkippedBtn").onclick = () => {
          if (skippedCurrent > 0) { skippedCurrent--; renderSkippedQuestion(); }
        };
        document.getElementById("nextSkippedBtn").onclick = () => {
          if (skippedCurrent < skippedIndexes.length - 1) { skippedCurrent++; renderSkippedQuestion(); }
        };
        document.getElementById("saveSkippedBtn").onclick = () => {
          const radios = document.querySelectorAll(`input[name='qSkipped${idx}']`);
          let selected = null;
          radios.forEach((radio, i) => { if (radio.checked) selected = i; });
          if (selected === null) {
            const resultDiv = document.getElementById("skippedResult");
            resultDiv.textContent = "Por favor selecciona una opción antes de guardar.";
            resultDiv.style.color = "#ff4136";
            return;
          }
          userAnswers[idx] = selected;
          const resultDiv = document.getElementById("skippedResult");
          resultDiv.textContent = "Respuesta guardada.";
          resultDiv.style.color = "#2d6cdf";
        };
        document.getElementById("finishSkippedBtn").onclick = () => {
          // Remove any remaining skipped indexes and show results
          for (let i = 0; i < skippedIndexes.length; i++) {
            if (userAnswers[skippedIndexes[i]] === null) userAnswers[skippedIndexes[i]] = null;
          }
          showExamResult();
        };
      }
      renderSkippedQuestion();
      return;
    }
    showExamResult();
    function showExamResult() {
      let correct = 0;
      questions.forEach((q, i) => {
        const ans = userAnswers[i];
        if (ans !== null && ((q.answer !== undefined && ans === q.answer) || (q.respuesta !== undefined && (q.opciones ? q.opciones[ans] : q.options[ans]) === q.respuesta))) {
          correct++;
        }
      });
      const total = questions.length;
      const durationSec = Math.floor((Date.now() - startTime) / 1000);
      const min = Math.floor(durationSec / 60);
      const sec = durationSec % 60;
      const durationStr = `${min}:${sec.toString().padStart(2,'0')}`;
      // Save score
      let scores = JSON.parse(localStorage.getItem('examSimScores') || '[]');
      scores.push({ correct, total, duration: durationStr, date: new Date().toISOString() });
      localStorage.setItem('examSimScores', JSON.stringify(scores));
      // Show result with wrong answers and explanations
      let reviewHtml = '';
      questions.forEach((q, i) => {
        const ans = userAnswers[i];
        const isCorrect = ans !== null && ((q.answer !== undefined && ans === q.answer) || (q.respuesta !== undefined && (q.opciones ? q.opciones[ans] : q.options[ans]) === q.respuesta));
        if (!isCorrect) {
          let correctText = '';
          if (q.answer !== undefined) {
            correctText = (q.options || q.opciones)[q.answer];
          } else if (q.respuesta !== undefined) {
            correctText = q.respuesta;
          }
          let explanation = q.explanation || q.explicacion || '';
          reviewHtml += `<div style="background:#ffeaea;border-radius:8px;padding:12px;margin-bottom:12px;">
            <strong>Pregunta ${i+1}:</strong> ${(q.question || q.pregunta)}<br>
            <span style="color:#ff4136;">Tu respuesta: ${ans !== null ? (q.options || q.opciones)[ans] : 'Sin responder'}</span><br>
            <span style="color:#2d6cdf;">Respuesta correcta: ${correctText}</span><br>
            ${explanation ? `<div style='margin-top:6px;'><em>Explicación:</em> ${explanation}</div>` : ''}
          </div>`;
        }
      });
      mainContent.innerHTML = `<h2>Resultado del Examen</h2>
        <div style="font-size:1.3em;color:#2d6cdf;margin-bottom:18px;">${correct} de ${total} correctas</div>
        <div>Duración: ${durationStr}</div>
        <div>Fecha y Hora: ${new Date().toLocaleString()}</div>
        <button id="volverSimBtn" style="margin-top:24px;background:#4f8cff;color:#fff;padding:12px 32px;border:none;border-radius:8px;font-size:1em;cursor:pointer;">Volver al Simulador</button>
        <div style='margin-top:32px;'>
          <h3 style='color:#ff4136;'>Respuestas incorrectas y explicaciones</h3>
          ${reviewHtml || '<div style=\'color:#2d6cdf;\'>¡Todas las respuestas son correctas!</div>'}
        </div>
      `;
      document.getElementById("volverSimBtn").onclick = () => {
        renderExamSimConfig(mainContent, modules);
      };
    }
  }

  // Timer logic
  if (timeLimit > 0) {
    timerId = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(timerId);
        finishExam();
      } else {
        const timerDiv = document.getElementById("examTimer");
        if (timerDiv) {
          const min = Math.floor(timeLeft / 60);
          const sec = timeLeft % 60;
          timerDiv.textContent = `Tiempo restante: ${min}:${sec.toString().padStart(2,'0')}`;
        }
      }
    }, 1000);
  }
  renderExamQuestion();
}
