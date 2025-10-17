// Handles Data Administration page
export function renderAdminPage(mainContent, modules) {
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
      <button class='resetModuloBtn' data-mod='${mod.name}' style='background:#ffb347;color:#fff;padding:8px 18px;border:none;border-radius:8px;font-size:0.95em;cursor:pointer;margin-left:12px;'>Resetear módulo</button>`;
    mod.sections.forEach(sec => {
      modHtml += ` <button class='resetSeccionBtn' data-mod='${mod.name}' data-sec='${sec}' style='background:#4f8cff;color:#fff;padding:6px 12px;border:none;border-radius:8px;font-size:0.95em;cursor:pointer;margin-left:8px;'>Sección ${sec}</button>`;
    });
    modHtml += '</div>';
    adminModules.innerHTML += modHtml;
  });

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
