// app.js

import { modules } from './components/modules.js';
import { renderSidebar } from './components/sidebar.js';
import { renderSplashScreen } from './components/splash.js';
import { loadQuiz } from './components/quiz.js';
import { renderAdminPage } from './components/admin.js';
import { renderExamSimConfig, startExamSim } from './components/examSim.js';

const mainContent = document.getElementById("mainContent");
const menuList = document.getElementById("menuList");
const inicioBtn = document.getElementById("inicioBtn");
const adminBtn = document.getElementById("adminBtn");
const examSimBtn = document.getElementById("examSimBtn");

// Wire up navigation
inicioBtn.onclick = () => renderSplashScreen(mainContent);
adminBtn.onclick = () => renderAdminPage(mainContent, modules);
examSimBtn.onclick = () => renderExamSimConfig(mainContent, modules);

// Initial render
renderSidebar(mainContent, modules, (mod, sec) => loadQuiz(mainContent, mod, sec));
renderSplashScreen(mainContent);
