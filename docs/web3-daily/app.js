// Web3 Daily - Application Logic

// Supabase Configuration
const SUPABASE_URL = 'https://lhepmymamxuuibjpstxs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZXBteW1hbXh1dWlianBzdHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MjMwOTYsImV4cCI6MjA4NjE5OTA5Nn0.CPcKZ9s_wbrsEcFFrQc98lHmISQEOVHWQEZ7WRUZ3cg';

// Initialize Supabase client safely (won't crash if library not loaded)
let supabaseClient = null;
try {
    if (window.supabase) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.warn('Supabase init failed:', e);
}

class Web3Daily {
    constructor() {
        this.currentLesson = null;
        this.lessons = [];
        this.progress = this.loadProgress();
        this.settings = this.loadSettings();
        this.currentView = 'today';
        this.currentLanguage = this.settings.defaultLanguage || 'sv';
        
        this.init();
    }

    async init() {
        await this.loadLessons();
        this.setupEventListeners();
        this.renderCurrentView();
        this.updateStreak();
        this.setTodayDate();
    }

    // Data Loading
    async loadLessons() {
        try {
            const response = await fetch('lessons/index.json');
            const data = await response.json();
            this.lessons = data.lessons || [];
            this.currentLesson = this.getTodayLesson();
        } catch (error) {
            console.log('No lessons found yet, showing placeholder');
            this.currentLesson = this.getPlaceholderLesson();
        }
    }

    getTodayLesson() {
        const today = new Date().toISOString().split('T')[0];
        return this.lessons.find(l => l.date === today) || this.getPlaceholderLesson();
    }

    getPlaceholderLesson() {
        return {
            id: 'placeholder',
            date: new Date().toISOString().split('T')[0],
            title: 'Första lektionen kommer snart!',
            subtitle: 'Din Web3-resa börjar imorgon',
            whyThisMatters: {
                sv: 'Välkommen till Web3 Daily! Här kommer du få dagliga lektioner om blockchain, tokenisering, DeFi, och allt annat inom Web3-världen. Varje dag får du ett kurerat program på ~45 minuter som bygger på tidigare lektioner. Imorgon börjar vi på riktigt! 🚀',
                en: 'Welcome to Web3 Daily! Here you\'ll get daily lessons about blockchain, tokenization, DeFi, and everything else in the Web3 world. Every day you\'ll get a curated ~45 minute program that builds on previous lessons. Tomorrow we start for real! 🚀'
            },
            content: [],
            keyTakeaways: {
                sv: ['Plattformen är redo', 'Du får påminnelser via Slack', 'Första riktiga lektionen kommer imorgon 09:30'],
                en: ['Platform is ready', 'You\'ll get reminders via Slack', 'First real lesson arrives tomorrow 09:30']
            },
            questions: {
                sv: ['Vad vill du lära dig mest inom Web3?', 'Vilka utmaningar ser du för din kund inom blockchain & sjukvård?'],
                en: ['What do you want to learn most about Web3?', 'What challenges do you see for your client in blockchain & healthcare?']
            },
            deepDive: {
                intro: {
                    sv: 'Medan du väntar kan du läsa på om grunderna:',
                    en: 'While you wait, you can read up on the basics:'
                },
                resources: [
                    {
                        type: 'article',
                        title: 'What is Web3?',
                        url: 'https://ethereum.org/en/web3/',
                        duration: '10 min'
                    }
                ]
            },
            timeEstimate: 15
        };
    }

    // Progress Management
    loadProgress() {
        const saved = localStorage.getItem('web3daily_progress');
        return saved ? JSON.parse(saved) : {
            completedLessons: [],
            streak: 0,
            lastCompletedDate: null,
            answers: {}
        };
    }

    saveProgress() {
        localStorage.setItem('web3daily_progress', JSON.stringify(this.progress));
    }

    loadSettings() {
        const saved = localStorage.getItem('web3daily_settings');
        return saved ? JSON.parse(saved) : {
            defaultLanguage: 'sv',
            remindersEnabled: true,
            difficultyLevel: 'beginner'
        };
    }

    saveSettings() {
        localStorage.setItem('web3daily_settings', JSON.stringify(this.settings));
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.switchView(view);
            });
        });

        // Language toggle
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentLanguage = btn.dataset.lang;
                document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderTodayView();
            });
        });

        // Mark complete
        const completeBtn = document.getElementById('markCompleteBtn');
        if (completeBtn) {
            completeBtn.addEventListener('click', () => this.markLessonComplete());
        }

        // Modal close
        const closeModal = document.getElementById('closeModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                document.getElementById('completionModal').classList.remove('active');
            });
        }

        // Submit answers
        const submitBtn = document.getElementById('submitAnswersBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.showSubmitModal());
        }

        const cancelSubmit = document.getElementById('cancelSubmit');
        if (cancelSubmit) {
            cancelSubmit.addEventListener('click', () => {
                document.getElementById('submitModal').classList.remove('active');
            });
        }

        const copyAndSubmit = document.getElementById('copyAndSubmit');
        if (copyAndSubmit) {
            copyAndSubmit.addEventListener('click', () => this.copyAndSubmitAnswers());
        }

        // Settings
        const langSelect = document.getElementById('defaultLanguage');
        if (langSelect) {
            langSelect.value = this.settings.defaultLanguage;
            langSelect.addEventListener('change', (e) => {
                this.settings.defaultLanguage = e.target.value;
                this.currentLanguage = e.target.value;
                this.saveSettings();
            });
        }

        const remindersToggle = document.getElementById('remindersEnabled');
        if (remindersToggle) {
            remindersToggle.checked = this.settings.remindersEnabled;
            remindersToggle.addEventListener('change', (e) => {
                this.settings.remindersEnabled = e.target.checked;
                this.saveSettings();
            });
        }

        const difficultySelect = document.getElementById('difficultyLevel');
        if (difficultySelect) {
            difficultySelect.value = this.settings.difficultyLevel;
            difficultySelect.addEventListener('change', (e) => {
                this.settings.difficultyLevel = e.target.value;
                this.saveSettings();
            });
        }
    }

    // View Management
    switchView(view) {
        this.currentView = view;
        
        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });
        
        // Update views
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}View`).classList.add('active');
        
        this.renderCurrentView();
    }

    renderCurrentView() {
        switch(this.currentView) {
            case 'today':
                this.renderTodayView();
                break;
            case 'archive':
                this.renderArchiveView();
                break;
            case 'progress':
                this.renderProgressView();
                break;
        }
    }

    // Today View
    renderTodayView() {
        const lesson = this.currentLesson;
        if (!lesson) return;

        const lang = this.currentLanguage;

        // Title & subtitle
        document.getElementById('lessonTitle').textContent = lesson.title;
        document.getElementById('lessonSubtitle').textContent = lesson.subtitle || '';
        document.getElementById('timeEstimate').innerHTML = `
            <span class="time-icon">⏱️</span>
            <span>~${lesson.timeEstimate || 45} min</span>
        `;

        // Why this matters
        const whyText = typeof lesson.whyThisMatters === 'object' 
            ? lesson.whyThisMatters[lang] || lesson.whyThisMatters.sv 
            : lesson.whyThisMatters;
        document.getElementById('whyThisMatters').textContent = whyText;

        // Content list
        const contentList = document.getElementById('contentList');
        if (lesson.content && lesson.content.length > 0) {
            contentList.innerHTML = lesson.content.map(item => this.renderContentItem(item, lang)).join('');
        } else {
            contentList.innerHTML = '<p style="color: var(--text-secondary);">Inget innehåll ännu - första lektionen kommer snart!</p>';
        }

        // Key takeaways
        const takeaways = typeof lesson.keyTakeaways === 'object'
            ? lesson.keyTakeaways[lang] || lesson.keyTakeaways.sv
            : lesson.keyTakeaways;
        document.getElementById('keyTakeaways').innerHTML = takeaways
            .map(t => `<li>${t}</li>`)
            .join('');

        // Questions
        const questions = typeof lesson.questions === 'object'
            ? lesson.questions[lang] || lesson.questions.sv
            : lesson.questions;
        document.getElementById('questionsContainer').innerHTML = questions
            .map((q, i) => `
                <div class="question-item">
                    <h4>${q}</h4>
                    <textarea placeholder="${lang === 'sv' ? 'Skriv ditt svar här...' : 'Write your answer here...'}" 
                              data-question="${i}"
                              onchange="app.saveAnswer(${i}, this.value)"></textarea>
                </div>
            `)
            .join('');

        // Load saved answers
        if (this.progress.answers[lesson.id]) {
            Object.entries(this.progress.answers[lesson.id]).forEach(([idx, answer]) => {
                const textarea = document.querySelector(`textarea[data-question="${idx}"]`);
                if (textarea) textarea.value = answer;
            });
        }

        // Deep dive
        if (lesson.deepDive) {
            const introText = typeof lesson.deepDive.intro === 'object'
                ? lesson.deepDive.intro[lang] || lesson.deepDive.intro.sv
                : lesson.deepDive.intro;
            document.getElementById('deepDiveIntro').textContent = introText;
            document.getElementById('deepDiveContent').innerHTML = lesson.deepDive.resources
                .map(r => this.renderContentItem(r, lang))
                .join('');
        }

        // Update complete button state
        const isCompleted = this.progress.completedLessons.includes(lesson.id);
        const completeBtn = document.getElementById('markCompleteBtn');
        if (completeBtn) {
            completeBtn.disabled = isCompleted;
            completeBtn.textContent = isCompleted ? '✓ Klarmarkerad' : '✓ Markera som klar';
        }
    }

    renderContentItem(item, lang) {
        const typeEmoji = {
            'video': '🎬',
            'article': '📄',
            'podcast': '🎙️',
            'thread': '🧵',
            'interactive': '🎮'
        };

        return `
            <div class="content-item">
                <span class="content-type">${typeEmoji[item.type] || '📄'}</span>
                <div class="content-info">
                    <h3>${item.title}</h3>
                    <p>${item.description || ''}</p>
                    <div class="content-meta">
                        <span>⏱️ ${item.duration}</span>
                        ${item.source ? `<span>📍 ${item.source}</span>` : ''}
                    </div>
                </div>
                <a href="${item.url}" target="_blank" class="content-link">
                    ${lang === 'sv' ? 'Öppna' : 'Open'} →
                </a>
            </div>
        `;
    }

    // Archive View
    renderArchiveView() {
        const archiveList = document.getElementById('archiveList');
        
        if (this.lessons.length === 0) {
            archiveList.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1;">Inga tidigare lektioner ännu.</p>';
            return;
        }

        archiveList.innerHTML = this.lessons
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(lesson => {
                const isCompleted = this.progress.completedLessons.includes(lesson.id);
                return `
                    <div class="archive-item ${isCompleted ? 'completed' : ''}" onclick="app.loadLesson('${lesson.id}')">
                        <div class="archive-date">${this.formatDate(lesson.date)}</div>
                        <div class="archive-title">${lesson.title}</div>
                        <span class="archive-status ${isCompleted ? 'completed' : ''}">
                            ${isCompleted ? '✓ Klar' : '○ Ej klar'}
                        </span>
                    </div>
                `;
            })
            .join('');
    }

    // Progress View
    renderProgressView() {
        const completed = this.progress.completedLessons.length;
        const hours = Math.round(completed * 0.75 * 10) / 10; // ~45 min per lesson
        
        document.getElementById('totalLessons').textContent = completed;
        document.getElementById('totalHours').textContent = hours;
        document.getElementById('currentStreak').textContent = this.progress.streak;
        document.getElementById('topicsCount').textContent = this.getUniqueTopics();

        // Render calendar
        this.renderActivityCalendar();
    }

    renderActivityCalendar() {
        const calendar = document.getElementById('activityCalendar');
        const today = new Date();
        const days = [];
        
        // Last 28 days
        for (let i = 27; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const lesson = this.lessons.find(l => l.date === dateStr);
            const isCompleted = lesson && this.progress.completedLessons.includes(lesson.id);
            const isToday = i === 0;
            
            days.push(`
                <div class="calendar-day ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}">
                    ${date.getDate()}
                </div>
            `);
        }
        
        calendar.innerHTML = days.join('');
    }

    // Actions
    markLessonComplete() {
        if (!this.currentLesson || this.currentLesson.id === 'placeholder') return;
        
        const lessonId = this.currentLesson.id;
        if (!this.progress.completedLessons.includes(lessonId)) {
            this.progress.completedLessons.push(lessonId);
            this.updateStreak();
            this.progress.lastCompletedDate = new Date().toISOString().split('T')[0];
            this.saveProgress();
            
            // Show modal
            document.getElementById('modalStreakCount').textContent = this.progress.streak;
            document.getElementById('completionModal').classList.add('active');
            
            // Update button
            const btn = document.getElementById('markCompleteBtn');
            btn.disabled = true;
            btn.textContent = '✓ Klarmarkerad';
        }
    }

    saveAnswer(questionIndex, answer) {
        if (!this.currentLesson) return;
        
        if (!this.progress.answers[this.currentLesson.id]) {
            this.progress.answers[this.currentLesson.id] = {};
        }
        this.progress.answers[this.currentLesson.id][questionIndex] = answer;
        this.saveProgress();
    }

    loadLesson(lessonId) {
        const lesson = this.lessons.find(l => l.id === lessonId);
        if (lesson) {
            this.currentLesson = lesson;
            this.switchView('today');
        }
    }

    // Helpers
    updateStreak() {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        if (this.progress.lastCompletedDate === today) {
            // Already completed today, streak maintained
        } else if (this.progress.lastCompletedDate === yesterday) {
            // Completed yesterday, streak continues
            this.progress.streak++;
        } else if (this.progress.lastCompletedDate) {
            // Streak broken
            this.progress.streak = 1;
        } else {
            // First completion
            this.progress.streak = 1;
        }
        
        document.getElementById('streakCount').textContent = this.progress.streak;
        this.saveProgress();
    }

    setTodayDate() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const lang = this.currentLanguage === 'sv' ? 'sv-SE' : 'en-US';
        document.getElementById('todayDate').textContent = new Date().toLocaleDateString(lang, options);
    }

    formatDate(dateStr) {
        const options = { month: 'short', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString('sv-SE', options);
    }

    getUniqueTopics() {
        const topics = new Set();
        this.lessons.forEach(l => {
            if (l.topics) l.topics.forEach(t => topics.add(t));
        });
        return topics.size || this.progress.completedLessons.length;
    }

    // Submit functionality
    showSubmitModal() {
        const lesson = this.currentLesson;
        if (!lesson) return;

        const lang = this.currentLanguage;
        const questions = typeof lesson.questions === 'object'
            ? lesson.questions[lang] || lesson.questions.sv
            : lesson.questions;

        const answers = this.progress.answers[lesson.id] || {};
        
        // Format the submission
        let formatted = `📚 Web3 Daily - ${lesson.title}\n`;
        formatted += `📅 ${new Date().toLocaleDateString('sv-SE')}\n\n`;
        formatted += `🤔 Mina reflektioner:\n\n`;

        questions.forEach((q, i) => {
            const answer = answers[i] || '(inget svar)';
            formatted += `❓ ${q}\n`;
            formatted += `💬 ${answer}\n\n`;
        });

        formatted += `---\nSkickat från Web3 Daily`;

        // Store for copying
        this.pendingSubmission = formatted;

        // Show preview
        document.getElementById('submitPreview').textContent = formatted;
        document.getElementById('submitSuccess').style.display = 'none';
        document.getElementById('submitModal').classList.add('active');
    }

    async copyAndSubmitAnswers() {
        if (!this.currentLesson) return;

        const lesson = this.currentLesson;
        const lang = this.currentLanguage;
        const questions = typeof lesson.questions === 'object'
            ? lesson.questions[lang] || lesson.questions.sv
            : lesson.questions;
        const answers = this.progress.answers[lesson.id] || {};

        // Save to Supabase
        if (supabaseClient) {
            try {
                const submissions = questions.map((q, i) => ({
                    lesson_id: lesson.id,
                    lesson_title: lesson.title,
                    question: q,
                    answer: answers[i] || ''
                }));

                const { error } = await supabaseClient
                    .from('lesson_responses')
                    .insert(submissions);

                if (error) {
                    console.error('Supabase error:', error);
                } else {
                    console.log('Saved to Supabase!');
                }
            } catch (err) {
                console.error('Failed to save to Supabase:', err);
            }
        }

        // Show success
        document.getElementById('submitSuccess').style.display = 'flex';
        document.getElementById('copyAndSubmit').textContent = '✅ Skickat!';
        
        // Mark as submitted in progress
        if (!this.progress.submittedLessons) {
            this.progress.submittedLessons = [];
        }
        if (!this.progress.submittedLessons.includes(lesson.id)) {
            this.progress.submittedLessons.push(lesson.id);
        }
        this.saveProgress();

        // Close modal after delay
        setTimeout(() => {
            document.getElementById('submitModal').classList.remove('active');
            document.getElementById('copyAndSubmit').textContent = '📤 Skicka svar';
        }, 2000);
    }
}

// Initialize app
const app = new Web3Daily();
