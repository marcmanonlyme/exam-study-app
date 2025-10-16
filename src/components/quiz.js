// Handles quiz logic and UI
export function loadQuiz(mainContent, moduleName, sectionNum) {
  fetch(`data/${moduleName}/seccion${sectionNum}.json`)
    .then(response => response.json())
    .then(data => {
      let currentIndex = 0;
      let userAnswers = Array(data.length).fill(null);

      // Show results modal / view when submitting answers
      function checkAnswersModal(moduleName, sectionNum, data, userAnswers) {
        let correct = 0;
        let reviewHtml = '';
        data.forEach((q, i) => {
          const ans = userAnswers[i];
          const isCorrect = ans !== null && ((q.answer !== undefined && ans === q.answer) || (q.respuesta !== undefined && (q.opciones ? q.opciones[ans] : q.options[ans]) === q.respuesta));
          if (isCorrect) {
            correct++;
          } else {
            let correctText = '';
            if (q.answer !== undefined) correctText = (q.options || q.opciones)[q.answer];
            else if (q.respuesta !== undefined) correctText = q.respuesta;
            const userText = ans !== null ? (q.options || q.opciones)[ans] : 'Sin responder';
            const explanation = q.explanation || q.explicacion || '';
            reviewHtml += `<div style="background:#ffeaea;border-radius:8px;padding:12px;margin-bottom:12px;">
              <strong>Pregunta ${i+1}:</strong> ${(q.question || q.pregunta)}<br>
              <span style="color:#ff4136;">Tu respuesta: ${userText}</span><br>
              <span style="color:#2d6cdf;">Respuesta correcta: ${correctText}</span><br>
              ${explanation ? `<div style='margin-top:6px;'><em>Explicación:</em> ${explanation}</div>` : ''}
            </div>`;
          }
        });
        // Persist section result so splash statistics update
        try {
          const key = `resultado_${moduleName}_seccion${sectionNum}`;
          const obj = { score: correct, total: data.length, date: new Date().toISOString() };
          localStorage.setItem(key, JSON.stringify(obj));
        } catch (e) {
          // ignore storage errors
        }

        mainContent.innerHTML = `
          <h2>Resultado - ${moduleName} Sección ${sectionNum}</h2>
          <div style="font-size:1.2em;color:#2d6cdf;margin-bottom:12px;">${correct} de ${data.length} correctas</div>
          <div style='margin-top:18px;'>
            <h3>Revisión</h3>
            ${reviewHtml || '<div style="color:#2d6cdf;">¡Todas las respuestas son correctas!</div>'}
          </div>
          <div style="margin-top:18px;"><button id="volverBtn" style="background:#4f8cff;color:#fff;padding:8px 16px;border:none;border-radius:6px;">Volver al módulo</button></div>
        `;
        document.getElementById('volverBtn').onclick = () => {
          // reload the quiz section
          loadQuiz(mainContent, moduleName, sectionNum);
        };
      }

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
