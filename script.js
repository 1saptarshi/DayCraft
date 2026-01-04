 // SERVICE WORKER
if ('serviceWorker' in navigator) {
    const swCode = `const CACHE_NAME='daycraft-v8';self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(['./']))));self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));`;
    const blob = new Blob([swCode], { type: 'application/javascript' });
    window.addEventListener('load', () => navigator.serviceWorker.register(URL.createObjectURL(blob)).catch(() => {}));
}

// MAIN APPLICATION
class DayCraft {
    constructor() {
        this.state = {
            tasks: [], history: [], specialDays: [], notes: [], habitHistory: {},
            settings: { darkMode: false, streak: 0, bestStreak: 0 },
            currentDate: new Date(), selectedDate: new Date(),
            view: 'calendar', filter: { status: 'all', category: 'All' }
        };
        this.quotes = ["The future depends on what you do today.", "Discipline is doing what needs to be done.", "Small steps every day lead to big results.", "Focus on being productive instead of busy."];
        this.badges = [
            { min: 1, max: 5, icon: '🏆', name: 'Bronze Beginner', color: 'text-amber-700' },
            { min: 6, max: 10, icon: '🥈', name: 'Silver Pro', color: 'text-slate-400' },
            { min: 11, max: 20, icon: '🥇', name: 'Gold Expert', color: 'text-amber-400' },
            { min: 21, max: 999, icon: '💎', name: 'Diamond Master', color: 'text-cyan-400' }
        ];
        this.noteColors = {
            indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-500', text: 'text-indigo-700 dark:text-indigo-300' },
            teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-500', text: 'text-teal-700 dark:text-teal-300' },
            green: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' },
            amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-500', text: 'text-amber-700 dark:text-amber-300' },
            rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-500', text: 'text-rose-700 dark:text-rose-300' },
            gray: { bg: 'bg-gray-50 dark:bg-zinc-800/50', border: 'border-gray-500', text: 'text-gray-700 dark:text-gray-300' },
        };
        this.taskColors = {
            indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/10', border: 'border-indigo-500', text: 'text-indigo-700 dark:text-indigo-300', barBg: 'bg-indigo-200 dark:bg-indigo-800', barText: 'text-indigo-800 dark:text-indigo-100' },
            rose: { bg: 'bg-rose-50 dark:bg-rose-900/10', border: 'border-rose-500', text: 'text-rose-700 dark:text-rose-300', barBg: 'bg-rose-200 dark:bg-rose-800', barText: 'text-rose-800 dark:text-rose-100' },
            teal: { bg: 'bg-teal-50 dark:bg-teal-900/10', border: 'border-teal-500', text: 'text-teal-700 dark:text-teal-300', barBg: 'bg-teal-200 dark:bg-teal-800', barText: 'text-teal-800 dark:text-teal-100' },
            amber: { bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-500', text: 'text-amber-700 dark:text-amber-300', barBg: 'bg-amber-200 dark:bg-amber-800', barText: 'text-amber-800 dark:text-amber-100' },
            emerald:{ bg: 'bg-emerald-50 dark:bg-emerald-900/10', border: 'border-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', barBg: 'bg-emerald-200 dark:bg-emerald-800', barText: 'text-emerald-800 dark:text-emerald-100' },
            gray: { bg: 'bg-gray-50 dark:bg-zinc-800/10', border: 'border-gray-500', text: 'text-gray-700 dark:text-gray-300', barBg: 'bg-gray-200 dark:bg-zinc-700', barText: 'text-gray-800 dark:text-gray-100' },
        };
        this.init();
    }

    init() {
        this.loadData();
        this.setupTheme();
        this.updateStreak();
        this.renderCalendar();
        this.renderTasks();
        this.renderQuote();
        this.renderAnalytics();
        this.renderHistory();
        this.renderNotesPage();
        this.applySeasonalTheme();
        // Initial FAB state
        this.toggleFab('calendar');
    }

    // --- DATA MANAGEMENT (PRODUCTION READY) ---
    saveData() {
        localStorage.setItem('daycraft_seasonal_v8', JSON.stringify(this.state));
        this.renderAnalytics();
        this.renderHistory();
        this.renderNotesPage();
        this.renderCalendar();
    }

    loadData() {
        const saved = localStorage.getItem('daycraft_seasonal_v8');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.state.tasks = parsed.tasks || [];
                this.state.history = parsed.history || [];
                this.state.specialDays = parsed.specialDays || [];
                this.state.notes = parsed.notes || [];
                this.state.settings = { ...this.state.settings, ...parsed.settings };
                this.state.habitHistory = parsed.habitHistory || {};
                this.state.tasks.forEach(t => t.dueDate = new Date(t.dueDate));
                this.state.specialDays.forEach(d => d.date = new Date(d.date));
                this.state.notes.forEach(n => n.date = new Date(n.date));
            } catch (e) {
                console.error("Data load error", e);
                this.showToast("Error loading data", true);
            }
        }
    }

    downloadData() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.state, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "daycraft_backup_" + new Date().toISOString().slice(0,10) + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        this.showToast("Data exported successfully");
    }

    uploadData(input) {
        const file = input.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                // Basic validation
                if (!json.tasks || !Array.isArray(json.tasks)) throw new Error("Invalid format");
                
                localStorage.setItem('daycraft_seasonal_v8', JSON.stringify(json));
                location.reload(); // Reload to apply state cleanly
            } catch (err) {
                this.showToast("Invalid JSON file", true);
                console.error(err);
            }
        };
        reader.readAsText(file);
        // Reset input
        input.value = '';
        this.closeModal('data');
    }

    clearAllData() {
        if(confirm("Are you sure? This will delete all tasks, notes, and history permanently.")) {
            localStorage.removeItem('daycraft_seasonal_v8');
            location.reload();
        }
    }

    setupTheme() { if (this.state.settings.darkMode) document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark'); }
    toggleTheme() { this.state.settings.darkMode = !this.state.settings.darkMode; this.setupTheme(); this.saveData(); }
    
    switchView(view) {
        this.state.view = view;
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        const target = document.getElementById(`view-${view}`);
        target.classList.remove('hidden'); target.classList.add('animate-fade-up');
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if(btn.dataset.target === view) {
                btn.classList.add('text-ios-primary', 'border-ios-primary'); btn.classList.remove('text-ios-gray', 'border-transparent');
            } else {
                btn.classList.remove('text-ios-primary', 'border-ios-primary'); btn.classList.add('text-ios-gray', 'border-transparent');
            }
        });

        // Toggle FAB visibility based on view
        this.toggleFab(view);

        if(view === 'analytics') { this.renderCategoryGraph(); this.renderHeatmap(); this.renderWeeklySummary(); }
        if(view === 'tasks') { this.renderTasks(); this.renderNotesPage(); }
        if(view === 'calendar') { this.renderCalendar(); }
    }

    // Logic to show/hide the Floating Action Button
    toggleFab(view) {
        const fab = document.getElementById('fab-add');
        if (view === 'calendar' || view === 'tasks') {
            fab.classList.remove('hidden');
            setTimeout(() => fab.classList.add('animate-bounce-short'), 100); // Small bounce to announce presence
        } else {
            fab.classList.add('hidden');
        }
    }

    showToast(msg, isError = false) {
        const t = document.getElementById('toast');
        const icon = document.getElementById('toast-icon');
        document.getElementById('toast-message').textContent = msg;
        
        if (isError) {
            icon.className = "fa-solid fa-circle-exclamation text-red-500 text-lg sm:text-xl";
        } else {
            icon.className = "fa-solid fa-circle-check text-emerald-500 text-lg sm:text-xl";
        }

        t.classList.remove('translate-y-24', 'opacity-0');
        setTimeout(() => t.classList.add('translate-y-24', 'opacity-0'), 3000);
    }

    // --- PDF EXPORT FEATURE ---
    exportToPDF() {
        const element = document.getElementById('view-analytics');
        const recentActivity = document.getElementById('analytics-recent-activity');
        const originalDisplay = recentActivity.style.display;
        
        // Temporarily hide recent activity
        recentActivity.style.display = 'none';

        // Config for html2pdf
        const opt = {
            margin:       [10, 10, 10, 10], // top, left, bottom, right in mm
            filename:     'DayCraft_Insights_' + new Date().toISOString().slice(0,10) + '.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Generate and save
        html2pdf().set(opt).from(element).save().then(() => {
            // Restore visibility
            recentActivity.style.display = originalDisplay;
            this.showToast("PDF Downloaded");
        }).catch(err => {
            console.error(err);
            recentActivity.style.display = originalDisplay;
            this.showToast("PDF Generation Failed", true);
        });
    }

    // --- SEARCH ---
    handleSearch(query) {
        const container = document.getElementById('search-results');
        if (!query.trim()) { container.classList.add('hidden'); return; }
        const q = query.toLowerCase();
        const results = [];
        this.state.tasks.forEach(t => {
            if (t.title.toLowerCase().includes(q)) results.push({ type: t.isHabit ? 'Habit' : 'Task', title: t.title, date: t.dueDate, id: t.id, colorClass: t.isHabit ? 'text-indigo-400' : 'text-indigo-600 dark:text-indigo-400' });
        });
        this.state.notes.forEach(n => {
            if (n.content.toLowerCase().includes(q)) results.push({ type: 'Note', title: n.content.substring(0, 50) + '...', date: n.date, id: n.id, colorClass: 'text-amber-600 dark:text-amber-400' });
        });
        container.innerHTML = '';
        if (results.length === 0) { container.innerHTML = `<div class="p-4 text-center text-xs sm:text-sm text-ios-gray">No results found</div>`; }
        else {
            results.forEach(res => {
                const el = document.createElement('div');
                const highlighted = this.highlightText(res.title, query);
                el.className = "p-3 sm:p-4 border-b border-gray-100 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700/50 cursor-pointer transition-colors";
                el.onclick = () => this.openSearchResult(res.type, res.id, res.date);
                el.innerHTML = `<div class="flex justify-between items-center"><div class="flex flex-col"><span class="text-[10px] sm:text-xs font-bold uppercase text-gray-400 mb-1">${res.type}</span><span class="font-semibold h-c-text text-xs sm:text-sm">${highlighted}</span></div><span class="text-[10px] sm:text-xs font-mono text-ios-gray">${res.date.toLocaleDateString()}</span></div>`;
                container.appendChild(el);
            });
        }
        container.classList.remove('hidden');
    }

    openSearchResult(type, id, date) {
        const searchInput = document.getElementById('global-search');
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.classList.add('hidden'); searchInput.value = '';
        this.switchView('tasks');
        setTimeout(() => {
            const el = document.getElementById(`${type === 'Note' ? 'note' : 'task'}-card-${id}`);
            if(el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('highlight-pulse'); setTimeout(() => el.classList.remove('highlight-pulse'), 2000); }
            else { this.showToast("Item not found in current view."); }
        }, 100);
    }

    highlightText(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="highlight-match">$1</span>');
    }

    // --- SEASONAL THEME ---
    getSeasonalTheme(month) {
        if (month === 11 || month <= 1) return { name: 'Winter', theme: 'theme-winter', from: 'bg-indigo-600', to: 'bg-cyan-500' };
        if (month >= 2 && month <= 4) return { name: 'Spring', theme: 'theme-spring', from: 'bg-green-500', to: 'bg-sky-400' };
        if (month === 5 || month === 6) return { name: 'Summer', theme: 'theme-summer', from: 'bg-yellow-500', to: 'bg-orange-500' };
        if (month === 7 || month === 8) return { name: 'Monsoon', theme: 'theme-monsoon', from: 'bg-teal-600', to: 'bg-slate-600' };
        return { name: 'Autumn', theme: 'theme-autumn', from: 'bg-orange-600', to: 'bg-amber-800' };
    }

    applySeasonalTheme() {
        const month = this.state.currentDate.getMonth();
        const theme = this.getSeasonalTheme(month);
        const wrapper = document.getElementById('calendar-wrapper');
        const headerBg = document.getElementById('season-bg-gradient');
        const label = document.getElementById('season-label');
        wrapper.classList.remove('theme-spring', 'theme-summer', 'theme-monsoon', 'theme-autumn', 'theme-winter');
        wrapper.classList.add(theme.theme);
        headerBg.className = `absolute inset-0 bg-gradient-to-br ${theme.from} ${theme.to} opacity-90`;
        label.textContent = `${theme.name} Season`;
    }

    getTaskCompletion(task, dateContext) {
        if (!task.isHabit) return task.completed;
        const dateStr = dateContext.toDateString();
        if (!this.state.habitHistory[task.id]) return false;
        return this.state.habitHistory[task.id].includes(dateStr);
    }

    toggleTask(id, dateContext = new Date()) {
        const task = this.state.tasks.find(t => t.id === id);
        if (task) {
            if (task.isHabit) {
                const dateStr = dateContext.toDateString();
                if (!this.state.habitHistory[task.id]) this.state.habitHistory[task.id] = [];
                const idx = this.state.habitHistory[task.id].indexOf(dateStr);
                if (idx > -1) { this.state.habitHistory[task.id].splice(idx, 1); }
                else { this.state.habitHistory[task.id].push(dateStr); this.showToast("Habit Completed!"); this.recordHistory(task); }
            } else {
                task.completed = !task.completed;
                if (task.completed) { this.recordHistory(task); this.showToast("Task Completed!"); }
                else { this.state.history = this.state.history.filter(h => h.taskId !== id); this.updateStreak(); this.saveData(); }
            }
            this.saveData();
            this.renderTasks();
            this.renderCalendar();
            this.renderSelectedDatePanel();
        }
    }

    editTask(id) {
        const task = this.state.tasks.find(t => t.id === id);
        if (!task) return;
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-modal-title').textContent = "Edit Task";
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-date').value = task.dueDate.toISOString().split('T')[0];
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-is-habit').checked = task.isHabit;
        const colorRadios = document.getElementsByName('task-color'); colorRadios.forEach(r => { if(r.value === (task.color || 'indigo')) r.checked = true; });
        const catRadios = document.getElementsByName('category'); catRadios.forEach(r => { if(r.value === task.category) r.checked = true; });
        this.openModal('task');
    }

    // --- CALENDAR ---
    renderCalendar() {
        this.applySeasonalTheme();
        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';
        const year = this.state.currentDate.getFullYear();
        const month = this.state.currentDate.getMonth();
        document.getElementById('current-month-year').textContent = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        for (let i = 0; i < firstDay; i++) {
            const cell = document.createElement('div');
            cell.className = "h-20 sm:h-24 md:h-32 rounded-xl sm:rounded-2xl bg-transparent";
            grid.appendChild(cell);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateStr = date.toDateString();
            const specials = this.state.specialDays.filter(d => d.date.toDateString() === dateStr);
            const notes = this.state.notes.filter(n => n.date.toDateString() === dateStr);
            const isToday = dateStr === today.toDateString();
            const isSelected = dateStr === this.state.selectedDate.toDateString();
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const dayTasks = this.state.tasks.filter(t => t.dueDate.toDateString() === dateStr && !this.getTaskCompletion(t, date));
            const habits = this.state.tasks.filter(t => t.isHabit && t.dueDate.toDateString() === dateStr);

            const cell = document.createElement('div');
            let baseClasses = "cal-cell h-28 md:h-32 flex flex-col items-start gap-1 px-1 sm:px-2 ";
            if (isToday) baseClasses += "cal-today ";
            else if (isWeekend) baseClasses += "cal-cell-weekend bg-white dark:bg-zinc-800 ";
            else baseClasses += "bg-white dark:bg-zinc-800 ";
            if (isSelected) baseClasses += "selected ";
            baseClasses += "hover:shadow-md transition-all border border-gray-100 dark:border-zinc-700";
            cell.className = baseClasses;
            cell.onclick = () => { this.state.selectedDate = date; this.renderCalendar(); this.renderSelectedDatePanel(); };

            let contentHtml = `<span class="text-sm sm:text-lg font-bold h-c-text self-start ml-1">${i}</span>`;
            if (specials.length > 0) contentHtml += `<div class="absolute top-1 sm:top-2 right-1 sm:right-2 text-sm sm:text-lg animate-bounce">${specials[0].icon}</div>`;
            const displayTasks = dayTasks.slice(0, window.innerWidth < 640 ? 2 : 3);
            displayTasks.forEach(task => {
                const colorKey = task.color || 'indigo';
                const colorStyle = this.taskColors[colorKey] || this.taskColors.indigo;
                contentHtml += `<div class="mini-task-bar ${colorStyle.barBg} ${colorStyle.barText}">${task.title}</div>`;
            });
            if (dayTasks.length > (window.innerWidth < 640 ? 2 : 3)) contentHtml += `<div class="mini-task-bar text-[9px] text-gray-400 text-center bg-gray-50 dark:bg-zinc-800">+${dayTasks.length - (window.innerWidth < 640 ? 2 : 3)}</div>`;
            if (habits.length > 0) contentHtml += `<div class="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 text-indigo-400 text-[10px] opacity-70 font-bold uppercase"><i class="fa-solid fa-rotate"></i> Habit</div>`;
            if (notes.length > 0) contentHtml += `<div class="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 text-amber-500 text-xs"><i class="fa-solid fa-note-sticky"></i></div>`;
            cell.innerHTML = contentHtml;
            grid.appendChild(cell);
        }
        this.renderSelectedDatePanel();
    }

    changeMonth(delta) { this.state.currentDate.setMonth(this.state.currentDate.getMonth() + delta); this.renderCalendar(); }
    goToToday() { this.state.currentDate = new Date(); this.state.selectedDate = new Date(); this.renderCalendar(); }

    renderSelectedDatePanel() {
        const container = document.getElementById('selected-date-events');
        const title = document.getElementById('selected-date-title');
        const date = this.state.selectedDate;
        title.textContent = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        container.innerHTML = '';
        const specials = this.state.specialDays.filter(d => d.date.toDateString() === date.toDateString());
        if(specials.length > 0) {
            specials.forEach(sp => {
                const el = document.createElement('div');
                el.className = "bg-amber-50 dark:bg-amber-900/20 p-3 rounded-2xl border border-amber-200 dark:border-amber-800/50 flex items-center justify-between group";
                el.innerHTML = `<div class="flex items-center gap-3 overflow-hidden"><span class="text-lg sm:text-xl">${sp.icon}</span><span class="font-bold text-xs sm:text-sm truncate h-c-text">${sp.text}</span></div><button onclick="app.deleteSpecial('${sp.id}')" class="text-amber-400 hover:text-red-500 transition-colors"><i class="fa-solid fa-trash"></i></button>`;
                container.appendChild(el);
            });
        }
        const allTasks = this.state.tasks.filter(t => t.dueDate.toDateString() === date.toDateString());
        if (allTasks.length === 0 && specials.length === 0) { container.innerHTML = `<div class="text-center py-4 sm:py-8 text-ios-gray text-xs sm:text-sm">No events or tasks.</div>`; return; }
        allTasks.forEach(task => {
            const isCompleted = this.getTaskCompletion(task, date);
            const el = document.createElement('div');
            const isHabit = task.isHabit;
            const colorKey = task.color || 'indigo';
            const colorStyle = this.taskColors[colorKey] || this.taskColors.indigo;
            el.className = `p-3 rounded-xl sm:rounded-2xl border ${isHabit ? 'border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/50 dark:bg-indigo-900/10' : `${colorStyle.border} ${colorStyle.bg}`} flex items-center justify-between`;
            el.innerHTML = `<div class="flex items-center gap-3 overflow-hidden flex-grow"><input type="checkbox" onchange="app.toggleTask('${task.id}', new Date('${date}'))" class="w-4 h-4 accent-ios-primary cursor-pointer rounded" ${isCompleted ? 'checked' : ''}><div class="flex flex-col"><span class="font-medium text-xs sm:text-sm truncate h-c-text ${isCompleted ? 'line-through opacity-50' : ''}">${task.title}</span>${isHabit ? `<span class="text-[9px] sm:text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wide">Daily Habit</span>` : ''}</div></div><div class="flex gap-2"><button onclick="app.editTask('${task.id}')" class="text-ios-gray hover:text-ios-primary transition-colors text-xs"><i class="fa-solid fa-pen"></i></button><button onclick="app.deleteTask('${task.id}')" class="text-ios-gray hover:text-red-500 transition-colors text-xs"><i class="fa-solid fa-trash"></i></button></div>`;
            container.appendChild(el);
        });
        this.renderNotesList('selected-date-notes', date.toDateString());
    }

    // --- NOTES ---
    openNoteModal() { this.openModal('note'); document.getElementById('note-form').reset(); }
    handleNoteSubmit(e) {
        e.preventDefault();
        const content = document.getElementById('note-content').value;
        const color = document.querySelector('input[name="note-color"]:checked').value;
        if (!content) return;
        this.state.notes.push({ id: Date.now().toString(), date: new Date(this.state.selectedDate), content, color });
        this.saveData(); this.renderCalendar(); this.renderSelectedDatePanel(); this.renderNotesPage(); this.closeModal('note'); this.showToast("Note added!");
    }
    deleteNote(id) {
        if(confirm('Delete note?')) {
            this.state.notes = this.state.notes.filter(n => n.id !== id);
            this.saveData(); this.renderCalendar(); this.renderSelectedDatePanel(); this.renderNotesPage();
        }
    }
    renderNotesList(containerId, dateStr) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        const notes = this.state.notes.filter(n => n.date.toDateString() === dateStr);
        if(notes.length === 0) return;
        notes.forEach(note => {
            const colorStyle = this.noteColors[note.color] || this.noteColors.indigo;
            const el = document.createElement('div');
            el.className = `p-3 rounded-xl border-l-4 ${colorStyle.bg} ${colorStyle.border} group relative`;
            el.innerHTML = `<div class="flex justify-between items-start gap-2"><p class="text-xs sm:text-sm font-medium ${colorStyle.text} line-clamp-3">${note.content}</p><button onclick="app.deleteNote('${note.id}')" class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-colors"><i class="fa-solid fa-trash"></i></button></div><div class="text-[10px] opacity-50 mt-1">${note.date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>`;
            container.appendChild(el);
        });
    }
    renderNotesPage() {
        const container = document.getElementById('notes-page-container');
        container.innerHTML = '';
        const allNotes = [...this.state.notes].sort((a,b) => b.date - a.date);
        if(allNotes.length === 0) { container.innerHTML = `<div class="col-span-full text-center py-8 sm:py-10 text-ios-gray text-xs sm:text-sm">No notes yet.</div>`; return; }
        allNotes.forEach(note => {
            const colorStyle = this.noteColors[note.color] || this.noteColors.indigo;
            const el = document.createElement('div');
            el.id = `note-card-${note.id}`;
            el.className = `note-card ios-card p-4 sm:p-5 relative group ${colorStyle.bg} ${colorStyle.border}`;
            el.innerHTML = `<div class="flex justify-between items-start mb-2"><div class="flex flex-col items-center gap-1"><i class="fa-solid fa-note-sticky ${colorStyle.text} text-[10px] sm:text-xs mb-1"></i><span class="text-[9px] sm:text-[10px] font-bold ${colorStyle.text} uppercase">${note.date.toLocaleDateString()}</span></div><button onclick="app.deleteNote('${note.id}')" class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-colors p-1"><i class="fa-solid fa-trash"></i></button></div><p class="text-xs sm:text-sm font-medium ${colorStyle.text} leading-relaxed">${note.content}</p>`;
            container.appendChild(el);
        });
    }

    // --- SPECIAL DAYS ---
    handleSpecialSubmit(e) {
        e.preventDefault();
        const text = document.getElementById('special-text').value;
        const icon = document.querySelector('input[name="icon"]:checked').value;
        if (!text) return;
        this.state.specialDays = this.state.specialDays.filter(d => d.date.toDateString() !== this.state.selectedDate.toDateString());
        this.state.specialDays.push({ id: Date.now().toString(), date: new Date(this.state.selectedDate), text, icon });
        this.saveData(); this.renderCalendar(); this.renderSelectedDatePanel(); this.closeModal('special'); this.showToast("Special day added!");
    }
    deleteSpecial(id) {
        if(confirm('Remove special day?')) {
            this.state.specialDays = this.state.specialDays.filter(d => d.id !== id);
            this.saveData(); this.renderCalendar(); this.renderSelectedDatePanel();
        }
    }

    // --- TASKS ---
    handleTaskSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('task-id').value;
        const title = document.getElementById('task-title').value;
        const date = document.getElementById('task-date').value;
        const priority = document.getElementById('task-priority').value;
        const category = document.querySelector('input[name="category"]:checked').value;
        const isHabit = document.getElementById('task-is-habit').checked;
        const color = document.querySelector('input[name="task-color"]:checked').value;
        if (!title) return;
        if (id) {
            const task = this.state.tasks.find(t => t.id === id);
            task.title = title; task.dueDate = new Date(date); task.priority = priority; task.category = category; task.isHabit = isHabit; task.color = color;
            this.showToast("Task Updated");
        } else {
            this.state.tasks.push({ id: Date.now().toString(), title, dueDate: new Date(date), priority, category, completed: false, isHabit, color });
            this.showToast("Task Created");
        }
        this.saveData(); this.renderTasks(); this.renderCalendar(); this.closeModal('task');
    }
    deleteTask(id) {
        if(confirm('Delete task?')) {
            this.state.tasks = this.state.tasks.filter(t => t.id !== id);
            delete this.state.habitHistory[id];
            this.saveData(); this.renderTasks(); this.renderCalendar();
        }
    }
    filterTasks(status) {
        this.state.filter.status = status;
        document.querySelectorAll('.filter-pill').forEach(btn => { if(btn.textContent.toLowerCase().includes(status)) btn.classList.add('active'); else btn.classList.remove('active'); });
        this.renderTasks();
    }
    filterCategory(category) { this.state.filter.category = category; this.renderTasks(); }
    renderTasks() {
        const container = document.getElementById('task-list-container');
        container.innerHTML = '';
        let list = [...this.state.tasks];
        const todayStr = new Date().toDateString();
        const { status, category } = this.state.filter;
        if (status === 'today') { list = list.filter(t => t.dueDate.toDateString() === todayStr); } 
        if (status === 'pending') { list = list.filter(t => { if(t.isHabit) return !this.state.habitHistory[t.id] || !this.state.habitHistory[t.id].includes(todayStr); else return !t.completed; }); }
        if (category !== 'All') { list = list.filter(t => t.category === category); }
        list.sort((a, b) => a.dueDate - b.dueDate);
        if (list.length === 0) { container.innerHTML = `<div class="col-span-full text-center py-8 sm:py-10 text-ios-gray text-xs sm:text-sm">No tasks found for these filters.</div>`; return; }
        list.forEach(task => {
            const card = document.createElement('div');
            card.id = `task-card-${task.id}`;
            const isHabit = task.isHabit;
            const isCompleted = this.getTaskCompletion(task, new Date());
            const colorKey = task.color || 'indigo';
            const colorStyle = this.taskColors[colorKey] || this.taskColors.indigo;
            card.className = `ios-card p-4 sm:p-5 relative group transition-all ${isCompleted && !isHabit ? 'opacity-50 grayscale' : ''}`;
            let catIcon = 'fa-circle'; let catColor = 'text-ios-gray'; let catBg = 'bg-gray-100 dark:bg-zinc-800';
            if(task.category === 'Work') { catIcon = 'fa-briefcase'; catColor = 'text-indigo-600'; catBg = 'bg-indigo-50 dark:bg-indigo-900/10'; }
            if(task.category === 'Personal') { catIcon = 'fa-user'; catColor = 'text-teal-500'; catBg = 'bg-teal-50 dark:bg-teal-900/10'; }
            if(task.category === 'Study') { catIcon = 'fa-book'; catColor = 'text-amber-500'; catBg = 'bg-amber-50 dark:bg-amber-900/10'; }
            if(task.category === 'Urgent') { catIcon = 'fa-fire'; catColor = 'text-red-500'; catBg = 'bg-red-50 dark:bg-red-900/10'; }
            card.innerHTML = `<div class="flex justify-between items-start mb-3 sm:mb-4"><div class="flex items-center gap-2"><span class="text-[10px] sm:text-[10px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-1 rounded-xl ${catBg} ${catColor}">${task.category}</span>${isHabit ? '<span class="text-[10px] px-2 py-1 rounded-xl bg-indigo-100 text-indigo-600 font-bold uppercase tracking-wider"><i class="fa-solid fa-rotate mr-1"></i>Habit</span>' : ''}</div><div class="flex gap-1"><button onclick="app.editTask('${task.id}')" class="p-2 text-ios-gray hover:text-ios-primary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"><i class="fa-solid fa-pen text-[10px] sm:text-xs"></i></button><button onclick="app.deleteTask('${task.id}')" class="p-2 text-ios-gray hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700"><i class="fa-solid fa-trash text-[10px] sm:text-xs"></i></button></div></div><h4 class="font-bold text-base sm:text-lg mb-2 h-c-text truncate">${task.title}</h4><div class="flex items-center justify-between mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 dark:border-zinc-700"><span class="text-[10px] sm:text-xs font-medium text-ios-gray">${task.dueDate.toLocaleDateString()}</span><button onclick="app.toggleTask('${task.id}')" class="w-8 h-8 rounded-2xl border-2 border-gray-200 dark:border-zinc-700 flex items-center justify-center hover:bg-ios-primary hover:border-ios-primary hover:text-white transition-all">${isCompleted ? '<i class="fa-solid fa-check text-ios-primary"></i>' : ''}</button></div><div class="absolute bottom-0 left-0 w-full h-1 ${colorStyle.border.replace('border', 'bg')}"></div>`;
            container.appendChild(card);
        });
    }
    addEmoji(emoji) { document.getElementById('task-title').value += emoji + " "; document.getElementById('task-title').focus(); }
    openModal(type) {
        const m = document.getElementById(`${type}-modal`); const c = document.getElementById(`${type}-modal-content`);
        m.classList.remove('hidden'); setTimeout(() => { m.classList.remove('opacity-0'); c.classList.remove('scale-95'); c.classList.add('scale-100'); }, 10);
        
        // Smart date setting for FAB
        if(type === 'task' && !document.getElementById('task-id').value) { 
            document.getElementById('task-modal-title').textContent = "New Task"; 
            document.getElementById('task-form').reset(); 
            
            // If opened from FAB and we are on Calendar View, use Selected Date
            // If opened from FAB and we are on Tasks View, use Today
            const dateInput = document.getElementById('task-date');
            if(this.state.view === 'calendar') {
                dateInput.valueAsDate = new Date(this.state.selectedDate);
            } else {
                dateInput.valueAsDate = new Date();
            }
        }
    }
    closeModal(type) {
        const m = document.getElementById(`${type}-modal`); const c = document.getElementById(`${type}-modal-content`);
        m.classList.add('opacity-0'); c.classList.remove('scale-100'); c.classList.add('scale-95');
        setTimeout(() => m.classList.add('hidden'), 300);
        if(type === 'task') { document.getElementById('task-id').value = ''; document.getElementById('task-modal-title').textContent = "New Task"; }
        if(type === 'special') document.getElementById('special-form').reset();
        if(type === 'note') document.getElementById('note-form').reset();
    }

    // --- IMPROVED ANALYTICS ---
    updateStreak() {
        const dates = [...new Set(this.state.history.map(h => h.date))].sort().reverse();
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        let streak = 0;
        if (dates.length > 0) {
            if (dates[0] === today || dates[0] === yesterday) {
                streak = 1;
                for (let i = 0; i < dates.length - 1; i++) {
                    const current = new Date(dates[i]); const next = new Date(dates[i+1]);
                    if ((current - next) / 86400000 === 1) streak++; else break;
                }
            }
        }
        this.state.settings.streak = streak;
        if (streak > this.state.settings.bestStreak) this.state.settings.bestStreak = streak;
        document.getElementById('streak-count').textContent = streak;
    }

    recordHistory(task) {
        this.state.history.push({ date: new Date().toISOString().split('T')[0], timestamp: Date.now(), taskId: task.id, title: task.title, category: task.category, isHabit: task.isHabit });
        this.updateStreak(); this.saveData();
    }

    renderAnalytics() {
        this.updateStreak();
        
        // --- IMPROVED FOCUS SCORE LOGIC ---
        const now = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        
        const tasksDueWeek = this.state.tasks.filter(t => t.dueDate >= oneWeekAgo && t.dueDate <= now);
        const completedWeek = this.state.history.filter(h => new Date(h.date) >= oneWeekAgo && new Date(h.date) <= now);
        
        let score = 0;
        let completedCount = completedWeek.length;
        let remainingCount = tasksDueWeek.length - completedCount;

        if (tasksDueWeek.length > 0) {
            let baseScore = (completedCount / tasksDueWeek.length) * 100;
            let streakBonus = Math.min(this.state.settings.streak * 5, 20);
            score = Math.round((baseScore * 0.8) + streakBonus);
        } else if (completedCount > 0) {
            score = Math.min(completedCount * 10, 100);
        }
        
        score = Math.min(100, Math.max(0, score)); 

        // Update Focus Score UI
        const circle = document.getElementById('focus-circle');
        const circumference = 263.89; 
        const offset = circumference - (score / 100) * circumference;
        
        setTimeout(() => { circle.style.strokeDashoffset = offset; }, 100);
        
        document.getElementById('focus-percentage').textContent = `${score}%`;
        document.getElementById('focus-completed').textContent = completedCount;
        document.getElementById('focus-remaining').textContent = Math.max(0, remainingCount);
        
        const gradeEl = document.getElementById('focus-grade');
        const msgEl = document.getElementById('focus-message');
        let grade = 'F';
        let msg = "Just getting started.";
        let gradeColor = 'text-red-500';

        if (score >= 90) { grade = 'S'; msg = "Laser Focused! Outstanding."; gradeColor = 'text-indigo-600'; }
        else if (score >= 80) { grade = 'A'; msg = "Great momentum! Keep it up."; gradeColor = 'text-green-600'; }
        else if (score >= 60) { grade = 'B'; msg = "Good progress. Stay consistent."; gradeColor = 'text-blue-600'; }
        else if (score >= 40) { grade = 'C'; msg = "Room for improvement."; gradeColor = 'text-amber-600'; }
        else { grade = 'D'; msg = "Time to focus!"; gradeColor = 'text-orange-600'; }

        gradeEl.textContent = grade;
        gradeEl.className = `text-[10px] font-bold mt-1 uppercase tracking-widest ${gradeColor}`;
        msgEl.textContent = msg;

        // XP Level Logic
        const totalDone = this.state.history.length;
        const xp = totalDone * 10;
        const level = Math.floor(xp / 100) + 1;
        const xpInLevel = xp % 100;
        document.getElementById('status-level').textContent = level;
        document.getElementById('status-level-sub').textContent = level;
        document.getElementById('xp-text').textContent = `${xp} Total XP`;
        document.getElementById('xp-percentage-text').textContent = `${xpInLevel}%`;
        document.getElementById('xp-bar').style.width = `${xpInLevel}%`;
        const badge = this.badges.find(b => level >= b.min && level <= b.max) || this.badges[this.badges.length - 1];
        document.getElementById('level-badge-icon').textContent = badge.icon;
        document.getElementById('badge-name').textContent = badge.name;
        document.getElementById('badge-name').className = `text-[10px] sm:text-sm font-bold uppercase tracking-widest transition-colors duration-500 ${badge.color}`;
    }

    renderWeeklySummary() {
        const now = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        const completedLastWeek = this.state.history.filter(h => new Date(h.timestamp) >= oneWeekAgo).length;
        const dayCounts = [0, 0, 0, 0, 0, 0, 0];
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        this.state.history.forEach(h => {
            if (new Date(h.timestamp) >= oneWeekAgo) { dayCounts[new Date(h.timestamp).getDay()]++; }
        });
        const maxCount = Math.max(...dayCounts);
        const bestDayIndex = dayCounts.indexOf(maxCount);
        const bestDayName = (maxCount === 0 || maxCount === -Infinity) ? "-" : dayNames[bestDayIndex];
        const tasksDueLastWeek = this.state.tasks.filter(t => t.dueDate >= oneWeekAgo && t.dueDate <= now);
        const totalDueCount = tasksDueLastWeek.length;
        const rate = totalDueCount === 0 ? 0 : Math.round((completedLastWeek / totalDueCount) * 100);
        document.getElementById('weekly-completed-count').textContent = completedLastWeek;
        document.getElementById('best-day-name').textContent = bestDayName;
        document.getElementById('weekly-rate').textContent = `${rate}%`;
    }

    renderCategoryGraph() {
        const container = document.getElementById('category-bars-container');
        container.innerHTML = '';
        const counts = { Work: 0, Personal: 0, Urgent: 0, Study: 0 };
        const icons = { Work: '💼', Personal: '🏠', Urgent: '🔥', Study: '📚' };
        this.state.history.forEach(h => { if(counts[h.category] !== undefined) counts[h.category]++; });
        const total = this.state.history.length;
        const colors = { Work: 'bg-indigo-500', Personal: 'bg-teal-500', Urgent: 'bg-red-500', Study: 'bg-amber-500' };
        Object.keys(counts).forEach(cat => {
            const count = counts[cat];
            const width = total === 0 ? 0 : Math.round((count/total)*100);
            const row = document.createElement('div'); row.className = "group";
            row.innerHTML = `<div class="flex justify-between text-[10px] sm:text-xs mb-1.5"><span class="font-bold h-c-text flex items-center gap-1">${icons[cat]} ${cat}</span><span class="font-bold text-ios-gray">${count} Tasks</span></div><div class="w-full bg-gray-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden shadow-inner"><div class="${colors[cat]} h-full rounded-full transition-all duration-1000 w-0 shadow-sm" style="width: ${width}%"></div></div>`;
            container.appendChild(row);
            setTimeout(() => row.querySelector('div > div').style.width = `${width}%`, 100);
        });
    }

    renderHeatmap() {
        const container = document.getElementById('heatmap-container');
        container.innerHTML = '';
        const today = new Date();
        const theme = this.getSeasonalTheme(today.getMonth()); 
        
        const weeks = [];
        for (let i = 26; i >= 0; i--) {
            const w = [];
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - (today.getDay() + (i * 7)));
            for (let d = 0; d < 7; d++) {
                const day = new Date(startOfWeek);
                day.setDate(startOfWeek.getDate() + d);
                w.push(day.toISOString().split('T')[0]);
            }
            weeks.push(w);
        }
        weeks.forEach(week => {
            const col = document.createElement('div');
            col.className = "flex flex-col gap-[4px]";
            week.forEach(date => {
                const square = document.createElement('div');
                square.className = "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm transition-all hover:scale-110 cursor-pointer";
                const count = this.state.history.filter(h => h.date === date).length;
                
                // Dynamic coloring logic simplified for PDF compatibility
                let bgClass = "bg-gray-100 dark:bg-zinc-800";
                if (count > 0) bgClass = "bg-indigo-200 dark:bg-indigo-900/50";
                if (count > 2) bgClass = "bg-indigo-400 dark:bg-indigo-700";
                if (count > 4) bgClass = "bg-indigo-600 dark:bg-indigo-600";

                square.classList.add(...bgClass.split(" "));
                square.title = `${date}: ${count} tasks`;
                col.appendChild(square);
            });
            container.appendChild(col);
        });
    }

    renderHistory() {
        const tbody = document.getElementById('history-table-body');
        tbody.innerHTML = '';
        const recent = [...this.state.history].sort((a,b) => b.timestamp - a.timestamp).slice(0, 10);
        if(recent.length === 0) { tbody.innerHTML = '<tr><td colspan="4" class="text-center text-ios-gray py-2 sm:py-4 text-xs sm:text-sm">No history yet.</td></tr>'; return; }
        recent.forEach(h => {
            const row = document.createElement('tr');
            row.className = "border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors";
            let catColor = 'text-ios-gray';
            if(h.category === 'Work') catColor = 'text-indigo-600';
            if(h.category === 'Personal') catColor = 'text-teal-500';
            if(h.category === 'Study') catColor = 'text-amber-500';
            if(h.category === 'Urgent') catColor = 'text-red-500';
            row.innerHTML = `<td class="py-2 sm:py-3 pl-2 font-mono text-[10px] sm:text-xs text-ios-gray">${h.date}</td><td class="py-2 sm:py-3 font-medium h-c-text text-[10px] sm:text-xs hidden sm:table-cell">${new Date(h.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td><td class="py-2 sm:py-3 font-medium h-c-text text-[10px] sm:text-xs hidden sm:table-cell">${h.title}</td><td class="py-2 sm:py-3 pr-2 text-right font-bold text-[9px] sm:text-xs uppercase ${catColor}">${h.category}</td>`;
            tbody.appendChild(row);
        });
    }

    renderQuote() { document.getElementById('daily-quote').textContent = `"${this.quotes[Math.floor(Math.random() * this.quotes.length)]}"`; }
    refreshQuote() { this.renderQuote(); }
}

const app = new DayCraft();