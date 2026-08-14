// Scheduler - Handles task scheduling and ideal assignments

class Scheduler {
    constructor(config) {
        this.config = config;
        this.people = config.people;
        this.responsibilities = config.responsibilities;
        this.startDate = config.startDate;
        this.endDate = config.endDate;
        
        // Trackers for each task's rotation position
        this.positionTrackers = {};
        this.responsibilities.forEach(resp => {
            this.positionTrackers[resp.id] = 0;
        });
    }

    // Generate the full yearly schedule
    generateYearlySchedule() {
        console.log('Generating yearly schedule from', this.startDate, 'to', this.endDate);
        
        const schedule = {};
        let currentDate = this.startDate;
        
        // Reset position trackers
        this.responsibilities.forEach(resp => {
            this.positionTrackers[resp.id] = 0;
        });
        
        // First day - assign all tasks starting from first person
        // But we need to handle this properly based on the interval
        this.initializeFirstDay(schedule);
        
        // Generate remaining days
        let dateCount = 0;
        const maxDays = daysBetween(this.startDate, this.endDate) + 1;
        
        currentDate = addDays(this.startDate, 1);
        dateCount = 1;
        
        while (currentDate <= this.endDate && dateCount <= maxDays) {
            schedule[currentDate] = this.getTasksForDate(currentDate);
            currentDate = addDays(currentDate, 1);
            dateCount++;
        }
        
        console.log('Generated schedule for', Object.keys(schedule).length, 'days');
        return schedule;
    }

    // Initialize the first day with proper assignments
    initializeFirstDay(schedule) {
        const tasks = {};
        
        this.responsibilities.forEach(resp => {
            // First day: assign to first person in rotation
            const person = this.people[0];
            tasks[resp.id] = person;
            
            // Advance tracker if this task occurs on day 1
            // For garbage (interval 1) - advance
            // For water (interval 2) - advance to next person for next occurrence
            // For bathroom (interval 3) - advance
            this.positionTrackers[resp.id] = 1;
        });
        
        schedule[this.startDate] = tasks;
    }

    // Get tasks for a specific date (ideal assignments, before conflict resolution)
    getTasksForDate(date) {
        const tasks = {};
        const daysFromStart = daysBetween(this.startDate, date);
        
        this.responsibilities.forEach(resp => {
            // Check if task is due on this date
            if (this.isTaskDue(resp, daysFromStart)) {
                const person = this.getIdealPerson(resp.id);
                tasks[resp.id] = person;
                
                // Advance the tracker for this task
                this.positionTrackers[resp.id] = (this.positionTrackers[resp.id] + 1) % this.people.length;
            }
        });
        
        return tasks;
    }

    // Check if a task is due on a given day
    isTaskDue(responsibility, daysFromStart) {
        // Garbage: every day (interval 1)
        // Water: every 2 days (starting from day 0)
        // Bathroom: every 3 days (starting from day 0)
        
        if (responsibility.interval === 1) {
            return true; // Every day
        }
        
        // For interval 2 and 3: due when daysFromStart is divisible by interval
        // But we need to handle the first day properly
        return daysFromStart % responsibility.interval === 0;
    }

    // Get the ideal person for a task based on current position
    getIdealPerson(taskId) {
        const position = this.positionTrackers[taskId] || 0;
        return this.people[position % this.people.length];
    }

    // Get the current position for a task
    getPosition(taskId) {
        return this.positionTrackers[taskId] || 0;
    }

    // Get the next person in rotation for a task
    getNextPerson(taskId) {
        const position = this.positionTrackers[taskId] || 0;
        const nextPos = (position + 1) % this.people.length;
        return this.people[nextPos];
    }

    // Get the nth next person in rotation
    getNthNextPerson(taskId, n) {
        const position = this.positionTrackers[taskId] || 0;
        const nextPos = (position + n) % this.people.length;
        return this.people[nextPos];
    }

    // Get the distance from ideal position for a person
    getDistanceFromIdeal(taskId, person) {
        const position = this.positionTrackers[taskId] || 0;
        const personIndex = this.people.indexOf(person);
        
        // Calculate distance in rotation
        let distance = (personIndex - position + this.people.length) % this.people.length;
        if (distance > this.people.length / 2) {
            distance = this.people.length - distance;
        }
        return distance;
    }

    // Reset the scheduler (for testing)
    reset() {
        this.responsibilities.forEach(resp => {
            this.positionTrackers[resp.id] = 0;
        });
    }

    // Get all dates in the schedule period
    getAllDates() {
        const dates = [];
        let currentDate = this.startDate;
        
        while (currentDate <= this.endDate) {
            dates.push(currentDate);
            currentDate = addDays(currentDate, 1);
        }
        
        return dates;
    }
}

// Make Scheduler globally available
window.Scheduler = Scheduler;