// Handles sidebar rendering and navigation
export function renderSidebar(mainContent, modules, onNavigate) {
  const menuList = document.getElementById("menuList");
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
      btn.onclick = () => onNavigate(mod.name, sec);
      secLi.appendChild(btn);
      secUl.appendChild(secLi);
    });
    modLi.appendChild(secUl);
    menuList.appendChild(modLi);
  });
}
