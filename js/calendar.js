// Calendar Page Logic

// State
let currentMonth = new Date(2026, 7); // August 2026 (month is 0-indexed)
let calendarData = {};
let selectedDate = null;

// DOM Elements
const calendarGrid = document.getElementById('calendarGrid');
const calendarTitle = document.getElementById('calendarTitle');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const dayDetailModal = document.getElementById('dayDetailModal');
const modalDate = document.getElementById('modalDate');
const modalContent = document.getElementById('modalContent');
const closeModalBtn = document.getElementById('closeModalBtn');

// Initialize calendar
async function initCalendar() {
    try {
        // Load calendar data
        await loadCalendarData();
        
        // Set up event listeners
        prevMonthBtn.addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() - 1);
            renderCalendar();
        });
        
        nextMonthBtn.addEventListener('click', () => {
            currentMonth.setMonth(currentMonth.getMonth() + 1);
            renderCalendar();
        });
        
        closeModalBtn.addEventListener('click', () => {
            dayDetailModal.classList.add('hidden');
        });
        
        // Close modal on outside click
        dayDetailModal.addEventListener('click', (e) => {
            if (e.target === dayDetailModal) {
                dayDetailModal.classList.add('hidden');
            }
        });
        
        // Render initial calendar
        renderCalendar();
        
    } catch (error) {
        console.error('Error initializing calendar:', error);
        calendarGrid.innerHTML = '<div class="col-span-7 text-center text-red-500 py-8">Error loading calendar</div>';
    }
}

// Load calendar data for the year
async function loadCalendarData() {
    try {
        const config = getConfig();
        const assignments = await fetchAssignments(config.startDate, config.endDate);
        
        // Group by date
        const grouped = {};
        for (const a of assignments) {
            if (!grouped[a.date]) {
                grouped[a.date] = [];
            }
            grouped[a.date].push(a);
        }
        
        calendarData = grouped;
        console.log('Loaded calendar data for', Object.keys(calendarData).length, 'days');
    } catch (error) {
        console.error('Error loading calendar data:', error);
        calendarData = {};
    }
}

// Render calendar
function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Update title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    calendarTitle.textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    // Get days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // Build calendar grid
    let html = '';
    const today = new Date().toISOString().split('T')[0];
    
    // Previous month days
    const prevMonthStart = daysInPrevMonth - startDayOfWeek + 1;
    for (let i = prevMonthStart; i <= daysInPrevMonth; i++) {
        const dateObj = new Date(year, month - 1, i);
        const dateStr = dateObj.toISOString().split('T')[0];
        html += createDayCell(dateStr, true);
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
        const dateObj = new Date(year, month, i);
        const dateStr = dateObj.toISOString().split('T')[0];
        const isTodayDate = dateStr === today;
        html += createDayCell(dateStr, false, isTodayDate);
    }
    
    // Next month days
    const totalCells = startDayOfWeek + daysInMonth;
    const remainingCells = 42 - totalCells; // 6 rows * 7 columns
    for (let i = 1; i <= remainingCells; i++) {
        const dateObj = new Date(year, month + 1, i);
        const dateStr = dateObj.toISOString().split('T')[0];
        html += createDayCell(dateStr, true);
    }
    
    calendarGrid.innerHTML = html;
}

// Create a calendar day cell
function createDayCell(dateStr, isOtherMonth = false, isTodayDate = false) {
    const day = new Date(dateStr + 'T00:00:00').getDate();
    const tasks = calendarData[dateStr] || [];
    
    // Get task icons/dots
    const taskDots = [];
    const taskColors = {
        'water': 'water',
        'bathroom': 'bathroom',
        'garbage': 'garbage'
    };
    
    for (const task of tasks) {
        const color = taskColors[task.responsibility_id] || 'water';
        taskDots.push(`<span class="task-dot ${color}"></span>`);
    }
    
    const classes = [
        'calendar-day',
        isOtherMonth ? 'other-month' : '',
        isTodayDate ? 'today' : ''
    ].filter(Boolean).join(' ');
    
    return `
        <div class="${classes}" data-date="${dateStr}" onclick="showDayDetail('${dateStr}')">
            <div class="text-sm ${isTodayDate ? 'font-bold text-blue-600' : ''}">${day}</div>
            <div class="flex flex-wrap gap-0.5 mt-1">
                ${taskDots.join('')}
            </div>
        </div>
    `;
}

// Show day detail modal
async function showDayDetail(dateStr) {
    try {
        const assignments = calendarData[dateStr] || [];
        const dateDisplay = formatDate(dateStr);
        
        modalDate.textContent = dateDisplay;
        
        if (assignments.length === 0) {
            modalContent.innerHTML = '<p class="text-gray-500 text-center py-4">No tasks scheduled for this day</p>';
        } else {
            let html = '<div class="space-y-3">';
            const responsibilities = getResponsibilities();
            
            // Get completion status
            const assignmentIds = assignments.map(a => a.id || a.assignment_id || generateId());
            const completions = await fetchCompletions(assignmentIds);
            
            for (const a of assignments) {
                const resp = responsibilities.find(r => r.id === a.responsibility_id);
                const isCompleted = completions[a.id || a.assignment_id]?.completed;
                const statusIcon = isCompleted ? '✅' : '⏳';
                const statusColor = isCompleted ? 'text-green-600' : 'text-yellow-600';
                
                html += `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div class="flex items-center">
                            <span class="text-2xl mr-3">${resp ? resp.icon : '📋'}</span>
                            <div>
                                <div class="font-medium">${resp ? resp.name : 'Task'}</div>
                                <div class="text-sm text-gray-600">→ ${a.person_id}</div>
                            </div>
                        </div>
                        <span class="${statusColor}">${statusIcon}</span>
                    </div>
                `;
            }
            
            html += '</div>';
            modalContent.innerHTML = html;
        }
        
        dayDetailModal.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error showing day detail:', error);
        modalContent.innerHTML = '<p class="text-red-500 text-center py-4">Error loading day details</p>';
    }
}

// Navigate to today
function goToToday() {
    const today = new Date();
    currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    renderCalendar();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initCalendar);

// Expose functions globally
window.showDayDetail = showDayDetail;
window.goToToday = goToToday;