// Handles quiz logic and UI
export function loadQuiz(mainContent, moduleName, sectionNum) {
  fetch(`data/${moduleName}/seccion${sectionNum}.json`)
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
