// Timetable Page Logic

// State
let currentWeekOffset = 0;
let allTimetableData = [];
let filteredData = [];
let visibleRows = 20;

// DOM Elements
const timetableBody = document.getElementById('timetableBody');
const prevWeekBtn = document.getElementById('prevWeekBtn');
const nextWeekBtn = document.getElementById('nextWeekBtn');
const weekLabel = document.getElementById('weekLabel');
const filterPerson = document.getElementById('filterPerson');
const filterTask = document.getElementById('filterTask');
const loadMoreBtn = document.getElementById('loadMoreBtn');

// Initialize timetable
async function initTimetable() {
    try {
        // Populate filters
        populateFilters();
        
        // Load data
        await loadTimetableData();
        
        // Set up event listeners
        prevWeekBtn.addEventListener('click', () => {
            currentWeekOffset--;
            renderTimetable();
        });
        
        nextWeekBtn.addEventListener('click', () => {
            currentWeekOffset++;
            renderTimetable();
        });
        
        filterPerson.addEventListener('change', renderTimetable);
        filterTask.addEventListener('change', renderTimetable);
        
        loadMoreBtn.addEventListener('click', () => {
            visibleRows += 20;
            renderTimetable();
        });
        
        // Initial render
        renderTimetable();
        
    } catch (error) {
        console.error('Error initializing timetable:', error);
        timetableBody.innerHTML = '<tr><td colspan="5" class="text-center text-red-500 py-4">Error loading timetable</td></tr>';
    }
}

// Populate filter dropdowns
function populateFilters() {
    // People filter
    const people = getPeople();
    filterPerson.innerHTML = '<option value="all">All Residents</option>';
    people.forEach(person => {
        const option = document.createElement('option');
        option.value = person;
        option.textContent = person;
        filterPerson.appendChild(option);
    });
    
    // Task filter
    const responsibilities = getResponsibilities();
    filterTask.innerHTML = '<option value="all">All Tasks</option>';
    responsibilities.forEach(resp => {
        const option = document.createElement('option');
        option.value = resp.id;
        option.textContent = `${resp.icon} ${resp.name}`;
        filterTask.appendChild(option);
    });
}

// Load timetable data
async function loadTimetableData() {
    try {
        const config = getConfig();
        const assignments = await fetchAssignments(config.startDate, config.endDate);
        allTimetableData = assignments;
        console.log('Loaded', allTimetableData.length, 'timetable entries');
    } catch (error) {
        console.error('Error loading timetable data:', error);
        allTimetableData = [];
    }
}

// Render timetable
function renderTimetable() {
    try {
        // Apply filters
        const filtered = applyFilters(allTimetableData);
        filteredData = filtered;
        
        // Group by date
        const grouped = groupByDate(filtered);
        const dates = Object.keys(grouped).sort();
        
        if (dates.length === 0) {
            timetableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-8">No data available</td></tr>';
            weekLabel.textContent = 'No data';
            return;
        }
        
        // Calculate week range
        const startIdx = currentWeekOffset * 7;
        const endIdx = startIdx + 7;
        const weekDates = dates.slice(startIdx, endIdx);
        
        // Update week label
        if (weekDates.length > 0) {
            const firstDate = formatDateShort(weekDates[0]);
            const lastDate = formatDateShort(weekDates[weekDates.length - 1]);
            weekLabel.textContent = `${firstDate} - ${lastDate}`;
        } else {
            weekLabel.textContent = 'No data';
        }
        
        // Render rows
        let html = '';
        const rowsToShow = Math.min(weekDates.length, visibleRows);
        
        for (let i = 0; i < rowsToShow; i++) {
            const date = weekDates[i];
            const dayData = grouped[date] || [];
            const row = createTimetableRow(date, dayData);
            html += row;
        }
        
        if (weekDates.length === 0) {
            html = '<tr><td colspan="5" class="text-center text-gray-500 py-8">No data for this week</td></tr>';
        }
        
        timetableBody.innerHTML = html;
        
        // Show/hide load more button
        if (rowsToShow >= weekDates.length) {
            loadMoreBtn.classList.add('hidden');
        } else {
            loadMoreBtn.classList.remove('hidden');
        }
        
    } catch (error) {
        console.error('Error rendering timetable:', error);
        timetableBody.innerHTML = '<tr><td colspan="5" class="text-center text-red-500 py-4">Error rendering timetable</td></tr>';
    }
}

// Apply filters to data
function applyFilters(data) {
    const personFilter = filterPerson.value;
    const taskFilter = filterTask.value;
    
    let filtered = [...data];
    
    if (personFilter !== 'all') {
        filtered = filtered.filter(a => a.person_id === personFilter);
    }
    
    if (taskFilter !== 'all') {
        filtered = filtered.filter(a => a.responsibility_id === taskFilter);
    }
    
    return filtered;
}

// Group data by date
function groupByDate(data) {
    const grouped = {};
    for (const item of data) {
        if (!grouped[item.date]) {
            grouped[item.date] = [];
        }
        grouped[item.date].push(item);
    }
    return grouped;
}

// Create a timetable row
function createTimetableRow(date, dayData) {
    const dayName = getDayOfWeek(date);
    const dateDisplay = formatDate(date);
    
    // Get assignments for each task
    const water = dayData.find(a => a.responsibility_id === 'water');
    const bathroom = dayData.find(a => a.responsibility_id === 'bathroom');
    const garbage = dayData.find(a => a.responsibility_id === 'garbage');
    
    const waterPerson = water ? water.person_id : '—';
    const bathroomPerson = bathroom ? bathroom.person_id : '—';
    const garbagePerson = garbage ? garbage.person_id : '—';
    
    // Highlight today
    const isTodayDate = isToday(date);
    const rowClass = isTodayDate ? 'bg-blue-50' : '';
    
    return `
        <tr class="timetable-row ${rowClass} border-b border-gray-100 hover:bg-gray-50">
            <td class="px-4 py-2 text-sm font-medium">${dateDisplay}</td>
            <td class="px-4 py-2 text-sm text-gray-600">${dayName}</td>
            <td class="px-4 py-2 text-sm ${waterPerson !== '—' ? 'text-blue-600 font-medium' : 'text-gray-400'}">
                ${waterPerson}
            </td>
            <td class="px-4 py-2 text-sm ${bathroomPerson !== '—' ? 'text-purple-600 font-medium' : 'text-gray-400'}">
                ${bathroomPerson}
            </td>
            <td class="px-4 py-2 text-sm ${garbagePerson !== '—' ? 'text-yellow-600 font-medium' : 'text-gray-400'}">
                ${garbagePerson}
            </td>
        </tr>
    `;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initTimetable);