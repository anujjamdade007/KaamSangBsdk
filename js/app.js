// KaamSangBsdk - Main Application

// State
let currentPerson = null;
let todayAssignments = [];
let allAssignments = [];
let completionMap = {};

// DOM Elements
const personSelect = document.getElementById('personSelect');
const todayDateEl = document.getElementById('todayDate');
const personalDashboard = document.getElementById('personalDashboard');
const greeting = document.getElementById('greeting');
const tasksContainer = document.getElementById('tasksContainer');
const nextDutyContainer = document.getElementById('nextDutyContainer');
const flatSchedule = document.getElementById('flatSchedule');

// Initialize the app
async function initApp() {
    try {
        // Set up Supabase
        initSupabase();
        
        // Populate person selector
        populatePersonSelector();
        
        // Set today's date
        const today = new Date().toISOString().split('T')[0];
        todayDateEl.textContent = formatDate(today);
        
        // Load saved person preference
        const savedPerson = localStorage.getItem('selectedBsdk');
        if (savedPerson && getPeople().includes(savedPerson)) {
            personSelect.value = savedPerson;
            currentPerson = savedPerson;
            await loadDashboard(savedPerson);
        }
        
        // Event listeners
        personSelect.addEventListener('change', async function() {
            const person = this.value;
            if (person) {
                localStorage.setItem('selectedBsdk', person);
                currentPerson = person;
                await loadDashboard(person);
            } else {
                personalDashboard.classList.add('hidden');
                flatSchedule.innerHTML = '<p class="text-gray-500 text-sm">Select your name to see your BSDK duties</p>';
            }
        });
        
        // Load flat schedule
        await loadFlatSchedule();
        
        console.log('🔥 KaamSangBsdk loaded successfully!');
        console.log('💪 "BSDK sang, kaam sang!"');
        
    } catch (error) {
        console.error('Error initializing KaamSangBsdk:', error);
    }
}

// Load dashboard for a specific person
async function loadDashboard(person) {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Show dashboard
        personalDashboard.classList.remove('hidden');
        
        // Random BSDK greeting
        const greetings = [
            `Hello, ${person} BSDK! 👋`,
            `Kya re ${person} BSDK! 🔥`,
            `${person} - The Ultimate BSDK! 😎`,
            `${person} teri duty aaj! 💪`,
            `${person} bada aaya BSDK! 😂`
        ];
        greeting.textContent = greetings[Math.floor(Math.random() * greetings.length)];
        
        // Get today's assignments
        const assignments = await fetchAssignmentsForDate(today);
        todayAssignments = assignments;
        
        // Get completion status
        const assignmentIds = assignments.map(a => a.id || a.assignment_id || generateId());
        completionMap = await fetchCompletions(assignmentIds);
        
        // Render tasks
        renderTasks(person, assignments);
        
        // Render next duty
        await renderNextDuty(person, today);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        tasksContainer.innerHTML = '<p class="text-red-500 text-sm">Error loading your BSDK duties. Please try again.</p>';
    }
}

// Render tasks for a person
function renderTasks(person, assignments) {
    if (!assignments || assignments.length === 0) {
        tasksContainer.innerHTML = `
            <div class="bsdk-card rounded-xl p-6 text-center">
                <div class="text-6xl mb-4">🎉</div>
                <p class="text-gray-400">No duties assigned for today!</p>
                <p class="text-sm text-gray-500 mt-2">Enjoy your free day, BSDK! 😎</p>
            </div>
        `;
        return;
    }
    
    const responsibilities = getResponsibilities();
    let html = '';
    
    // Show all responsibilities, marking which are assigned to this person
    for (const resp of responsibilities) {
        const assigned = assignments.find(a => a.responsibility_id === resp.id);
        const isAssigned = assigned && assigned.person_id === person;
        const isCompleted = assigned && completionMap[assigned.id || assigned.assignment_id]?.completed;
        
        let statusClass = 'not-assigned';
        let statusText = '— Not assigned';
        let statusIcon = '😴';
        let statusColor = 'text-gray-500';
        
        if (isAssigned) {
            if (isCompleted) {
                statusClass = 'completed';
                statusText = '✅ Completed!';
                statusIcon = '🏆';
                statusColor = 'text-green-400';
            } else {
                statusClass = 'assigned';
                statusText = '🔥 Your duty!';
                statusIcon = '⚡';
                statusColor = 'text-red-400';
            }
        }
        
        const taskId = assigned?.id || assigned?.assignment_id || generateId();
        
        html += `
            <div class="task-card-bsdk ${statusClass} fade-in">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <span class="text-3xl">${resp.icon}</span>
                        <div>
                            <div class="font-semibold text-white">${resp.name}</div>
                            <div class="text-sm ${isAssigned ? statusColor : 'text-gray-500'}">
                                ${isAssigned ? `→ ${person} (${statusText})` : '😴 Not your duty'}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        <span class="text-2xl">${statusIcon}</span>
                        ${isAssigned && !isCompleted ? `
                            <button onclick="handleCompleteTask('${taskId}', '${person}')" 
                                    class="bsdk-btn bsdk-btn-success text-sm py-1 px-3 rounded-lg">
                                ✅ Complete
                            </button>
                        ` : ''}
                        ${isCompleted ? `
                            <span class="text-green-400 text-sm font-bold">✓ DONE</span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    tasksContainer.innerHTML = html;
}

// Handle task completion
async function handleCompleteTask(assignmentId, personName) {
    try {
        const result = await markTaskCompleted(assignmentId, personName);
        if (result.success) {
            await loadDashboard(currentPerson);
            await loadFlatSchedule();
            showToast(`✅ ${personName} completed their duty! What a responsible BSDK! 🎉`, 'success');
        } else {
            showToast('❌ Failed to mark task as completed. Try again, BSDK!', 'error');
        }
    } catch (error) {
        console.error('Error completing task:', error);
        showToast('❌ An error occurred. Don\'t be a lazy BSDK, try again!', 'error');
    }
}

// Render next duty for a person
async function renderNextDuty(person, today) {
    try {
        const endDate = addDays(today, 30);
        const assignments = await fetchAssignments(today, endDate);
        
        let nextDuty = null;
        for (const a of assignments) {
            if (a.person_id === person && a.date !== today) {
                if (!nextDuty || a.date < nextDuty.date) {
                    nextDuty = a;
                }
            }
        }
        
        if (nextDuty) {
            const resp = getResponsibilities().find(r => r.id === nextDuty.responsibility_id);
            const dateDisplay = formatDateShort(nextDuty.date);
            const dayDisplay = getDayOfWeek(nextDuty.date);
            
            nextDutyContainer.innerHTML = `
                <div class="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div>
                        <span class="text-3xl mr-3">${resp ? resp.icon : '📋'}</span>
                        <span class="font-bold text-white">${resp ? resp.name : 'Task'}</span>
                        <div class="text-sm text-gray-400 mt-1">${dayDisplay}, ${dateDisplay}</div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="text-red-400">🔥</span>
                        <span class="text-sm text-red-400 font-medium">Upcoming</span>
                    </div>
                </div>
            `;
        } else {
            nextDutyContainer.innerHTML = `
                <p class="text-gray-500 text-sm">No upcoming duties! You're a free BSDK! 🎉</p>
            `;
        }
    } catch (error) {
        console.error('Error loading next duty:', error);
        nextDutyContainer.innerHTML = '<p class="text-gray-500 text-sm">Error loading next duty</p>';
    }
}

// Load the flat schedule for today
async function loadFlatSchedule() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const assignments = await fetchAssignmentsForDate(today);
        
        if (!assignments || assignments.length === 0) {
            flatSchedule.innerHTML = '<p class="text-gray-500 text-sm">No tasks scheduled for today. Party time! 🎉</p>';
            return;
        }
        
        // Group by responsibility
        const grouped = {};
        for (const a of assignments) {
            if (!grouped[a.responsibility_id]) {
                grouped[a.responsibility_id] = [];
            }
            grouped[a.responsibility_id].push(a);
        }
        
        const responsibilities = getResponsibilities();
        let html = '';
        
        for (const resp of responsibilities) {
            const items = grouped[resp.id] || [];
            const person = items.length > 0 ? items[0].person_id : '—';
            const isCompleted = items.length > 0 && items[0].completed;
            
            html += `
                <div class="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                    <div class="flex items-center space-x-3">
                        <span class="text-2xl">${resp.icon}</span>
                        <span class="font-medium text-white">${resp.name}</span>
                    </div>
                    <div class="flex items-center space-x-3">
                        <span class="text-sm font-semibold ${person !== '—' ? 'text-red-400' : 'text-gray-500'}">
                            ${person !== '—' ? `→ ${person}` : '😴'}
                        </span>
                        ${isCompleted ? '<span class="text-green-400 text-sm">✅</span>' : ''}
                        ${!isCompleted && person !== '—' ? '<span class="text-yellow-400 text-sm">⏳</span>' : ''}
                    </div>
                </div>
            `;
        }
        
        flatSchedule.innerHTML = html;
    } catch (error) {
        console.error('Error loading flat schedule:', error);
        flatSchedule.innerHTML = '<p class="text-red-500 text-sm">Error loading schedule. Maybe the BSDK server is down?</p>';
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container fixed bottom-20 left-0 right-0 flex justify-center px-4 z-50';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';
    toast.className = `toast-bsdk ${bgColor} text-white px-6 py-3 rounded-xl shadow-2xl max-w-sm text-center fade-in`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// Populate person selector
function populatePersonSelector() {
    const people = getPeople();
    personSelect.innerHTML = '<option value="">👤 Select your name</option>';
    people.forEach(person => {
        const option = document.createElement('option');
        option.value = person;
        option.textContent = `🔥 ${person}`;
        personSelect.appendChild(option);
    });
}

// Auto-refresh every minute
setInterval(() => {
    if (currentPerson) {
        loadDashboard(currentPerson);
        loadFlatSchedule();
    }
}, 60000);

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Expose functions globally
window.handleCompleteTask = handleCompleteTask;
window.loadFlatSchedule = loadFlatSchedule;
window.loadDashboard = loadDashboard;

console.log('🔥 KaamSangBsdk Initialized!');
console.log('💪 "BSDK sang, kaam sang!"');