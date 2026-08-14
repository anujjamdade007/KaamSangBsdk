// Statistics Page Logic

// Initialize statistics
async function initStatistics() {
    try {
        const config = getConfig();
        const assignments = await fetchAssignments(config.startDate, config.endDate);
        
        // Get completions
        const assignmentIds = assignments.map(a => a.id || a.assignment_id || generateId());
        const completions = await fetchCompletions(assignmentIds);
        
        // Generate statistics
        const stats = generateStatistics(assignments, completions, config);
        
        // Render statistics
        renderStatistics(stats);
        
    } catch (error) {
        console.error('Error initializing statistics:', error);
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('statsContainer').classList.add('hidden');
        document.querySelector('main').innerHTML += `
            <div class="text-center py-12">
                <div class="text-4xl mb-4">❌</div>
                <p class="text-red-500">Error loading statistics. Please try again.</p>
            </div>
        `;
    }
}

// Generate statistics from data
function generateStatistics(assignments, completions, config) {
    const people = config.people;
    const responsibilities = config.responsibilities;
    
    // Initialize stats structure
    const stats = {
        taskCounts: {},
        completionCounts: {},
        totalTasks: 0,
        totalCompleted: 0
    };
    
    // Initialize per task
    for (const resp of responsibilities) {
        stats.taskCounts[resp.id] = {};
        stats.completionCounts[resp.id] = {};
        for (const person of people) {
            stats.taskCounts[resp.id][person] = 0;
            stats.completionCounts[resp.id][person] = 0;
        }
    }
    
    // Count assignments
    for (const a of assignments) {
        const taskId = a.responsibility_id;
        const person = a.person_id;
        
        if (stats.taskCounts[taskId] && stats.taskCounts[taskId][person] !== undefined) {
            stats.taskCounts[taskId][person]++;
            stats.totalTasks++;
        }
        
        // Check if completed
        const completion = completions[a.id || a.assignment_id];
        if (completion && completion.completed) {
            if (stats.completionCounts[taskId] && stats.completionCounts[taskId][person] !== undefined) {
                stats.completionCounts[taskId][person]++;
                stats.totalCompleted++;
            }
        }
    }
    
    // Calculate totals per person
    stats.totals = {};
    for (const person of people) {
        stats.totals[person] = {
            total: 0,
            completed: 0
        };
        for (const resp of responsibilities) {
            stats.totals[person].total += stats.taskCounts[resp.id][person] || 0;
            stats.totals[person].completed += stats.completionCounts[resp.id][person] || 0;
        }
    }
    
    // Calculate fairness metrics
    stats.fairness = {};
    for (const resp of responsibilities) {
        const counts = Object.values(stats.taskCounts[resp.id]);
        const avg = counts.reduce((a, b) => a + b, 0) / people.length;
        const max = Math.max(...counts);
        const min = Math.min(...counts);
        stats.fairness[resp.id] = {
            avg: avg,
            max: max,
            min: min,
            range: max - min,
            isFair: max - min <= 1 // Fair if within 1 of each other
        };
    }
    
    return stats;
}

// Render statistics
function renderStatistics(stats) {
    // Hide loading, show container
    document.getElementById('loadingState').classList.add('hidden');
    const container = document.getElementById('statsContainer');
    container.classList.remove('hidden');
    
    // Render water stats
    renderTaskStats('waterStats', 'water', stats);
    
    // Render bathroom stats
    renderTaskStats('bathroomStats', 'bathroom', stats);
    
    // Render garbage stats
    renderTaskStats('garbageStats', 'garbage', stats);
    
    // Render summary
    renderSummary(stats);
    
    // Render completion stats
    renderCompletionStats(stats);
}

// Render statistics for a specific task
function renderTaskStats(containerId, taskId, stats) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const config = getConfig();
    const resp = config.responsibilities.find(r => r.id === taskId);
    const people = config.people;
    const counts = stats.taskCounts[taskId] || {};
    const completions = stats.completionCounts[taskId] || {};
    const fairness = stats.fairness[taskId];
    
    const maxCount = Math.max(...Object.values(counts), 1);
    
    let html = '';
    for (const person of people) {
        const count = counts[person] || 0;
        const completed = completions[person] || 0;
        const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
        const completionRate = count > 0 ? Math.round((completed / count) * 100) : 0;
        
        html += `
            <div class="flex items-center gap-3">
                <span class="w-20 font-medium text-gray-700 text-sm">${person}</span>
                <div class="flex-1">
                    <div class="progress-bar">
                        <div class="progress-fill bg-blue-500" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <span class="text-sm font-medium text-gray-800 w-12 text-right">${count}</span>
                <span class="text-xs text-gray-500 w-16">${completionRate}% done</span>
            </div>
        `;
    }
    
    // Add fairness indicator
    const fairnessIcon = fairness && fairness.isFair ? '✅' : '⚠️';
    const fairnessText = fairness && fairness.isFair 
        ? `Fair distribution (range: ${fairness.range})` 
        : `Range: ${fairness.range} - slight imbalance`;
    
    html += `
        <div class="mt-2 pt-2 border-t border-gray-100">
            <span class="text-xs text-gray-500">${fairnessIcon} ${fairnessText}</span>
            <span class="text-xs text-gray-400 ml-3">Avg: ${Math.round(fairness.avg * 10) / 10}</span>
        </div>
    `;
    
    container.innerHTML = html;
}

// Render summary statistics
function renderSummary(stats) {
    const container = document.getElementById('summaryStats');
    if (!container) return;
    
    const config = getConfig();
    const people = config.people;
    
    let html = '';
    for (const person of people) {
        const data = stats.totals[person] || { total: 0, completed: 0 };
        const rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
        
        html += `
            <div class="bg-white bg-opacity-20 rounded-lg p-3">
                <div class="font-medium text-white">${person}</div>
                <div class="text-2xl font-bold">${data.total}</div>
                <div class="text-sm text-blue-100">tasks • ${rate}% done</div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Render completion statistics
function renderCompletionStats(stats) {
    const container = document.getElementById('completionStats');
    if (!container) return;
    
    const config = getConfig();
    const people = config.people;
    const responsibilities = config.responsibilities;
    
    const totalTasks = stats.totalTasks || 1;
    const totalCompleted = stats.totalCompleted || 0;
    const overallRate = Math.round((totalCompleted / totalTasks) * 100);
    
    let html = `
        <div class="flex items-center justify-between mb-4">
            <div>
                <div class="text-2xl font-bold text-gray-800">${overallRate}%</div>
                <div class="text-sm text-gray-500">${totalCompleted} of ${totalTasks} tasks completed</div>
            </div>
            <div class="w-24 h-24 rounded-full border-4 border-blue-500 flex items-center justify-center">
                <span class="text-2xl font-bold text-blue-600">${overallRate}%</span>
            </div>
        </div>
    `;
    
    // Show per-person completion rates
    html += '<div class="space-y-2">';
    for (const person of people) {
        const data = stats.totals[person] || { total: 0, completed: 0 };
        const rate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
        const color = rate >= 80 ? 'text-green-600' : rate >= 50 ? 'text-yellow-600' : 'text-red-600';
        
        html += `
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700">${person}</span>
                <div class="flex items-center gap-2">
                    <div class="w-32 progress-bar">
                        <div class="progress-fill ${rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}" 
                             style="width: ${rate}%"></div>
                    </div>
                    <span class="text-sm font-medium ${color}">${rate}%</span>
                </div>
            </div>
        `;
    }
    html += '</div>';
    
    container.innerHTML = html;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initStatistics);