// app.js

import { modules } from './modules.js';
import { renderSidebar } from './sidebar.js';
import { renderSplashScreen } from './splash.js';
import { loadQuiz } from './quiz.js';
import { renderAdminPage } from './admin.js';
import { renderExamSimConfig, startExamSim } from './examSim.js';

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
