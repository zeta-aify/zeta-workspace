// AIFY Project Dashboard - Main Application

class Dashboard {
    constructor() {
        this.projects = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        await this.loadProjects();
        this.setupEventListeners();
        this.render();
    }

    async loadProjects() {
        try {
            const response = await fetch('projects.json');
            const data = await response.json();
            this.projects = data.projects;
        } catch (error) {
            console.error('Failed to load projects:', error);
            this.projects = [];
        }
    }

    setupEventListeners() {
        // Navigation filter
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = item.dataset.filter;
                this.setFilter(filter);
            });
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.filter === filter);
        });
        
        this.render();
    }

    getFilteredProjects() {
        if (this.currentFilter === 'all') {
            return this.projects;
        }
        return this.projects.filter(p => p.status === this.currentFilter);
    }

    getStatusLabel(status) {
        const labels = {
            'running': 'Aktiv',
            'development': 'Utveckling',
            'stopped': 'Pausad'
        };
        return labels[status] || status;
    }

    getStatusEmoji(status) {
        const emojis = {
            'running': '●',
            'development': '◐',
            'stopped': '○'
        };
        return emojis[status] || '○';
    }

    calculateTotalTimeSaved() {
        return this.projects
            .filter(p => p.status === 'running')
            .reduce((total, p) => total + (p.timeSavedHours || 0), 0);
    }

    renderProject(project) {
        const techBadges = project.tech 
            ? project.tech.map(t => `<span class="tech-badge">${t}</span>`).join('')
            : '';

        return `
            <article class="project-card" data-status="${project.status}">
                <div class="project-header">
                    <h3 class="project-title">${project.name}</h3>
                    <span class="project-status status-${project.status}">
                        ${this.getStatusEmoji(project.status)} ${this.getStatusLabel(project.status)}
                    </span>
                </div>
                <p class="project-description">${project.description}</p>
                <div class="project-meta">
                    ${project.timeSavedHours ? `
                        <div class="meta-item time-saved">
                            <span class="meta-icon">⏱️</span>
                            <span>${project.timeSavedHours}h ${project.timeSavedPeriod || 'sparad'}</span>
                        </div>
                    ` : ''}
                    ${project.repo ? `
                        <a href="${project.repo}" target="_blank" class="meta-item">
                            <span class="meta-icon">📁</span>
                            <span>Repo</span>
                        </a>
                    ` : ''}
                    <div class="meta-item">
                        <span class="meta-icon">📅</span>
                        <span>${project.updatedAt}</span>
                    </div>
                </div>
            </article>
        `;
    }

    render() {
        const grid = document.getElementById('projectsGrid');
        const filteredProjects = this.getFilteredProjects();

        if (filteredProjects.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3>Inga projekt hittades</h3>
                    <p>Det finns inga projekt som matchar detta filter.</p>
                </div>
            `;
        } else {
            grid.innerHTML = filteredProjects.map(p => this.renderProject(p)).join('');
        }

        // Update stats
        document.getElementById('totalProjects').textContent = this.projects.length;
        document.getElementById('activeProjects').textContent = 
            this.projects.filter(p => p.status === 'running').length;
        document.getElementById('totalTimeSaved').textContent = 
            `${this.calculateTotalTimeSaved()}h/v`;
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});
