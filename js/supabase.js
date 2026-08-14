// Supabase Configuration
// IMPORTANT: Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://acgtgbbwnzmjwfifxkyl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjZ3RnYmJ3bnptandmaWZ4a3lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MjA5MDQsImV4cCI6MjEwMjI5NjkwNH0.dXSxHn8kKNWqQ5syWeaYo87qnZXsjaNV-ZXKouyJgf4';

// Supabase client initialization
let supabaseClient = null;

// Initialize Supabase
function initSupabase() {
    if (typeof supabase === 'undefined') {
        console.warn('Supabase library not loaded. Using mock mode.');
        return null;
    }
    
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseClient;
}

// Mock data for development (when Supabase is not available)
const MOCK_ASSIGNMENTS = [];
let mockCompletionRecords = {};

// Configuration
const FLAT_CONFIG = {
    startDate: '2026-08-17',
    endDate: '2027-08-17',
    people: ['Anuj', 'Gaurav', 'Om', 'Chandu', 'Atherv'],
    responsibilities: [
        { id: 'water', name: 'Bring Water', interval: 2, icon: '🚰' },
        { id: 'bathroom', name: 'Clean Bathroom & Toilet', interval: 3, icon: '🧹' },
        { id: 'garbage', name: 'Throw Garbage', interval: 1, icon: '🗑️' }
    ]
};

// ===== Supabase Operations =====

// Fetch all assignments for a date range
async function fetchAssignments(startDate, endDate) {
    if (!supabaseClient) {
        // Return mock data
        return getMockAssignments(startDate, endDate);
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('assignments')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate);
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching assignments:', error);
        return getMockAssignments(startDate, endDate);
    }
}

// Fetch assignments for a specific date
async function fetchAssignmentsForDate(date) {
    if (!supabaseClient) {
        return getMockAssignmentsForDate(date);
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('assignments')
            .select('*')
            .eq('date', date);
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching assignments for date:', error);
        return getMockAssignmentsForDate(date);
    }
}

// Save assignments (batch insert)
async function saveAssignments(assignments) {
    if (!supabaseClient) {
        // Store in mock
        MOCK_ASSIGNMENTS.push(...assignments);
        console.log('Mock save:', assignments.length, 'assignments');
        return { success: true, count: assignments.length };
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('assignments')
            .upsert(assignments, { onConflict: 'date,responsibility_id' });
            
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error saving assignments:', error);
        return { success: false, error: error.message };
    }
}

// Mark task as completed
async function markTaskCompleted(assignmentId, personName) {
    if (!supabaseClient) {
        // Mock completion
        mockCompletionRecords[assignmentId] = {
            completed: true,
            completed_at: new Date().toISOString(),
            completed_by: personName
        };
        return { success: true };
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('completions')
            .upsert({
                assignment_id: assignmentId,
                completed: true,
                completed_at: new Date().toISOString(),
                completed_by: personName
            }, { onConflict: 'assignment_id' });
            
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error marking task completed:', error);
        return { success: false, error: error.message };
    }
}

// Fetch completion status
async function fetchCompletions(assignmentIds) {
    if (!supabaseClient) {
        // Return mock completions
        const completions = {};
        assignmentIds.forEach(id => {
            if (mockCompletionRecords[id]) {
                completions[id] = mockCompletionRecords[id];
            }
        });
        return completions;
    }
    
    try {
        const { data, error } = await supabaseClient
            .from('completions')
            .select('*')
            .in('assignment_id', assignmentIds);
            
        if (error) throw error;
        
        const completionMap = {};
        (data || []).forEach(record => {
            completionMap[record.assignment_id] = record;
        });
        return completionMap;
    } catch (error) {
        console.error('Error fetching completions:', error);
        return {};
    }
}

// Get all people
function getPeople() {
    return FLAT_CONFIG.people;
}

// Get all responsibilities
function getResponsibilities() {
    return FLAT_CONFIG.responsibilities;
}

// Get config
function getConfig() {
    return FLAT_CONFIG;
}

// ===== Mock Data Functions =====

// Generate mock assignments (for development)
function generateMockAssignments() {
    if (MOCK_ASSIGNMENTS.length > 0) return;
    
    console.log('Generating mock assignments...');
    const scheduler = new Scheduler(FLAT_CONFIG);
    const resolver = new ConflictResolver(FLAT_CONFIG);
    
    const assignments = scheduler.generateYearlySchedule();
    const finalAssignments = resolver.resolveAllConflicts(assignments);
    
    // Convert to Supabase format
    const dbAssignments = [];
    for (const date in finalAssignments) {
        for (const taskId in finalAssignments[date]) {
            dbAssignments.push({
                date: date,
                responsibility_id: taskId,
                person_id: finalAssignments[date][taskId],
                assignment_type: 'scheduled'
            });
        }
    }
    
    MOCK_ASSIGNMENTS.length = 0;
    MOCK_ASSIGNMENTS.push(...dbAssignments);
    console.log('Mock assignments generated:', MOCK_ASSIGNMENTS.length);
}

function getMockAssignments(startDate, endDate) {
    generateMockAssignments();
    return MOCK_ASSIGNMENTS.filter(a => a.date >= startDate && a.date <= endDate);
}

function getMockAssignmentsForDate(date) {
    generateMockAssignments();
    return MOCK_ASSIGNMENTS.filter(a => a.date === date);
}

// ===== Utility Functions =====

// Generate a unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Format date
function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Format date for display (short)
function formatDateShort(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}

// Get day of week
function getDayOfWeek(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short' });
}

// Check if date is today
function isToday(dateStr) {
    const today = new Date().toISOString().split('T')[0];
    return dateStr === today;
}

// Add days to date
function addDays(dateStr, days) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

// Get date difference in days
function daysBetween(date1, date2) {
    const d1 = new Date(date1 + 'T00:00:00');
    const d2 = new Date(date2 + 'T00:00:00');
    const diff = d2.getTime() - d1.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Export for use in other files
window.FLAT_CONFIG = FLAT_CONFIG;
window.initSupabase = initSupabase;
window.fetchAssignments = fetchAssignments;
window.fetchAssignmentsForDate = fetchAssignmentsForDate;
window.saveAssignments = saveAssignments;
window.markTaskCompleted = markTaskCompleted;
window.fetchCompletions = fetchCompletions;
window.getPeople = getPeople;
window.getResponsibilities = getResponsibilities;
window.getConfig = getConfig;
window.formatDate = formatDate;
window.formatDateShort = formatDateShort;
window.getDayOfWeek = getDayOfWeek;
window.isToday = isToday;
window.addDays = addDays;
window.daysBetween = daysBetween;
window.generateId = generateId;