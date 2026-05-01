// CodeLib Knowledge System - Load JSON và render HTML
class KnowledgeSystem {
    constructor() {
        this.curriculum = {};
        this.currentLang = 'cpp';
        this.currentLesson = null;
        this.progress = this.loadProgress();

        this.init();
    }

    async init() {
        await this.loadCurriculum();
        this.setupEventListeners();
        this.renderSidebar();
        this.showWelcome();
    }

    async loadCurriculum() {
        try {
            const response = await fetch('./curriculum.json');
            this.curriculum = await response.json();
            console.log('Curriculum loaded successfully');
        } catch (error) {
            console.error('Failed to load curriculum:', error);
            this.showError('Không thể tải dữ liệu bài học');
        }
    }

    setupEventListeners() {
        // Language tabs
        document.querySelectorAll('.kl-lang-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchLanguage(e.target.dataset.lang);
            });
        });

        // Sidebar navigation - Fixed event delegation
        document.getElementById('sidebarNav').addEventListener('click', (e) => {
            const navItem = e.target.closest('.kl-nav-item');
            if (navItem) {
                const lessonId = navItem.dataset.lesson;
                this.showLesson(lessonId);
            }
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            window.location.href = '../Login and register/html/login.html';
        });
    }

    switchLanguage(lang) {
        if (!this.curriculum[lang]) return;

        this.currentLang = lang;

        // Update active tab
        document.querySelectorAll('.kl-lang-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.lang === lang);
        });

        this.renderSidebar();
        this.showWelcome();
        this.updateProgress();
    }

    renderSidebar() {
        const nav = document.getElementById('sidebarNav');
        const lessons = this.curriculum[this.currentLang] || [];

        nav.innerHTML = lessons.map(lesson => `
            <div class="kl-nav-item ${this.isCompleted(lesson.id) ? 'completed' : ''}"
                 data-lesson="${lesson.id}">
                <div class="kl-nav-title">${lesson.title}</div>
                ${this.isCompleted(lesson.id) ? '<i class="fa-solid fa-check"></i>' : ''}
            </div>
        `).join('');

        this.updateProgress();
    }

    showWelcome() {
        const content = document.getElementById('contentArea');
        const langNames = {
            cpp: 'C++',
            python: 'Python',
            pascal: 'Pascal'
        };

        content.innerHTML = `
            <div class="kl-welcome">
                <div class="kl-welcome-header">
                    <h1>Chào mừng đến với ${langNames[this.currentLang]}</h1>
                    <p class="kl-welcome-subtitle">Học lập trình một cách có hệ thống và hiệu quả</p>
                </div>

                <div class="kl-stats-grid">
                    <div class="kl-stat-card">
                        <div class="kl-stat-number">${this.curriculum[this.currentLang]?.length || 0}</div>
                        <div class="kl-stat-label">Bài học</div>
                    </div>
                    <div class="kl-stat-card">
                        <div class="kl-stat-number">${this.getCompletedCount()}</div>
                        <div class="kl-stat-label">Hoàn thành</div>
                    </div>
                    <div class="kl-stat-card">
                        <div class="kl-stat-number">${this.getProgressPercentage()}%</div>
                        <div class="kl-stat-label">Tiến độ</div>
                    </div>
                </div>

                <div class="kl-welcome-content">
                    <h3>Bắt đầu học ${langNames[this.currentLang]}</h3>
                    <p>Chọn một bài học từ sidebar bên trái để bắt đầu. Mỗi bài học bao gồm:</p>
                    <ul>
                        <li><i class="fa-solid fa-book"></i> Giải thích chi tiết với ví dụ</li>
                        <li><i class="fa-solid fa-code"></i> Code mẫu và bài tập thực hành</li>
                        <li><i class="fa-solid fa-link"></i> Tài liệu tham khảo từ nguồn uy tín</li>
                    </ul>
                </div>
            </div>
        `;
    }

    showLesson(lessonId) {
        const lesson = this.curriculum[this.currentLang]?.find(l => l.id === lessonId);
        if (!lesson) return;

        this.currentLesson = lessonId;
        const content = document.getElementById('contentArea');

        content.innerHTML = `
            <div class="kl-lesson-content">
                ${lesson.content}
                <div class="kl-lesson-actions">
                    <button class="btn btn-success" onclick="knowledgeSystem.markCompleted('${lessonId}')">
                        <i class="fa-solid fa-check"></i> Đánh dấu hoàn thành
                    </button>
                </div>
            </div>
        `;

        // Highlight code blocks
        this.highlightCodeBlocks();

        // Update navigation
        document.querySelectorAll('.kl-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.lesson === lessonId);
        });
    }

    highlightCodeBlocks() {
        // Simple syntax highlighting for code blocks
        document.querySelectorAll('pre code').forEach(block => {
            // Add language class if not present
            if (!block.className) {
                const lang = block.textContent.includes('#include') ? 'cpp' :
                           block.textContent.includes('def ') ? 'python' :
                           block.textContent.includes('program ') ? 'pascal' : '';
                if (lang) block.className = `language-${lang}`;
            }
        });
    }

    markCompleted(lessonId) {
        if (!this.progress[this.currentLang]) {
            this.progress[this.currentLang] = [];
        }

        if (!this.progress[this.currentLang].includes(lessonId)) {
            this.progress[this.currentLang].push(lessonId);
            this.saveProgress();
            this.renderSidebar();
            this.showLesson(lessonId); // Refresh to show completed state
        }
    }

    isCompleted(lessonId) {
        return this.progress[this.currentLang]?.includes(lessonId) || false;
    }

    getCompletedCount() {
        return this.progress[this.currentLang]?.length || 0;
    }

    getProgressPercentage() {
        const total = this.curriculum[this.currentLang]?.length || 0;
        const completed = this.getCompletedCount();
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    }

    updateProgress() {
        const percentage = this.getProgressPercentage();
        const bar = document.getElementById('masteryBar');
        const pct = document.getElementById('masteryPct');
        const title = document.getElementById('masteryTitle');

        if (bar) bar.style.width = `${percentage}%`;
        if (pct) pct.textContent = `${percentage}%`;
        if (title) title.textContent = `${this.currentLang.toUpperCase()} Fundamentals`;
    }

    loadProgress() {
        const saved = localStorage.getItem('codelib_progress');
        return saved ? JSON.parse(saved) : {};
    }

    saveProgress() {
        localStorage.setItem('codelib_progress', JSON.stringify(this.progress));
    }

    showError(message) {
        const content = document.getElementById('contentArea');
        content.innerHTML = `
            <div class="alert alert-danger">
                <i class="fa-solid fa-exclamation-triangle"></i>
                ${message}
            </div>
        `;
    }
}

// Utility functions for content rendering
function codeBlock(code, lang, filename) {
    const langClass = lang ? `language-${lang}` : '';
    const fileInfo = filename ? `<div class="kl-code-filename">${filename}</div>` : '';
    return `<div class="kl-code-block">${fileInfo}<pre><code class="${langClass}">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre></div>`;
}

function infoBox(type, icon, html) {
    const typeClass = type === 'warning' ? 'alert-warning' :
                     type === 'tip' ? 'alert-info' :
                     type === 'error' ? 'alert-danger' : 'alert-info';
    return `<div class="alert ${typeClass} kl-info-box"><i class="fa-solid fa-${icon}"></i> ${html}</div>`;
}

function creditBox(lang, url) {
    return `<div class="kl-credit"><i class="fa-solid fa-link"></i> <a href="${url}" target="_blank">${lang} Documentation</a></div>`;
}

// Initialize when DOM is ready
let knowledgeSystem;
document.addEventListener('DOMContentLoaded', () => {
    knowledgeSystem = new KnowledgeSystem();
});