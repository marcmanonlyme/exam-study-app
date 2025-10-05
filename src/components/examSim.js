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
  // ...existing code...
}
