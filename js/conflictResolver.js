// Conflict Resolver - Handles double-duty detection and resolution

class ConflictResolver {
    constructor(config) {
        this.config = config;
        this.people = config.people;
        this.responsibilities = config.responsibilities;
        this.startDate = config.startDate;
        this.endDate = config.endDate;
        
        // Track assignment counts per task per person
        this.taskCounts = {};
        this.responsibilities.forEach(resp => {
            this.taskCounts[resp.id] = {};
            this.people.forEach(person => {
                this.taskCounts[resp.id][person] = 0;
            });
        });
        
        // Track last assignment date per task per person
        this.lastAssigned = {};
        this.responsibilities.forEach(resp => {
            this.lastAssigned[resp.id] = {};
            this.people.forEach(person => {
                this.lastAssigned[resp.id][person] = null;
            });
        });
    }

    // Resolve all conflicts in the schedule
    resolveAllConflicts(idealSchedule) {
        console.log('Resolving conflicts in schedule...');
        
        // Reset counts
        this.resetCounts();
        
        const finalSchedule = {};
        const dates = Object.keys(idealSchedule).sort();
        
        // Process dates chronologically
        for (const date of dates) {
            const idealAssignments = idealSchedule[date];
            const finalAssignments = this.resolveDayConflicts(date, idealAssignments);
            finalSchedule[date] = finalAssignments;
            
            // Update counts for this day's assignments
            this.updateCounts(date, finalAssignments);
        }
        
        console.log('Conflict resolution complete');
        return finalSchedule;
    }

    // Resolve conflicts for a single day
    resolveDayConflicts(date, idealAssignments) {
        // If there are no tasks, return empty
        if (!idealAssignments || Object.keys(idealAssignments).length === 0) {
            return {};
        }
        
        // Check for conflicts (same person assigned to multiple tasks)
        const personAssignments = {};
        const taskList = Object.keys(idealAssignments);
        
        // Map person -> tasks assigned
        for (const taskId of taskList) {
            const person = idealAssignments[taskId];
            if (!personAssignments[person]) {
                personAssignments[person] = [];
            }
            personAssignments[person].push(taskId);
        }
        
        // Check if anyone has multiple tasks
        let hasConflict = false;
        const conflictPeople = [];
        
        for (const person in personAssignments) {
            if (personAssignments[person].length > 1) {
                hasConflict = true;
                conflictPeople.push(person);
            }
        }
        
        if (!hasConflict) {
            // No conflicts, return ideal assignments
            return { ...idealAssignments };
        }
        
        // Resolve conflicts
        const finalAssignments = { ...idealAssignments };
        
        // For each person with multiple tasks, keep one and reassign others
        for (const person of conflictPeople) {
            const tasks = personAssignments[person];
            
            // Keep the first task (in priority order: water > bathroom > garbage)
            // Or keep the one with higher priority
            const keepTask = this.selectTaskToKeep(tasks);
            const tasksToReassign = tasks.filter(t => t !== keepTask);
            
            // Reassign each conflicting task
            for (const taskId of tasksToReassign) {
                const newPerson = this.findBestAlternative(date, taskId, finalAssignments);
                if (newPerson) {
                    finalAssignments[taskId] = newPerson;
                    
                    // Update personAssignments map
                    if (!personAssignments[newPerson]) {
                        personAssignments[newPerson] = [];
                    }
                    personAssignments[newPerson].push(taskId);
                } else {
                    // Fallback: keep original (should not happen with 5 people and 3 tasks)
                    console.warn('Could not find alternative for', taskId, 'on', date);
                }
            }
        }
        
        // Final check: ensure no one has multiple tasks
        const finalCheck = {};
        for (const taskId in finalAssignments) {
            const person = finalAssignments[taskId];
            if (!finalCheck[person]) {
                finalCheck[person] = [];
            }
            finalCheck[person].push(taskId);
        }
        
        // If conflicts still exist (shouldn't happen with 3 tasks and 5 people)
        // resolve them again
        for (const person in finalCheck) {
            if (finalCheck[person].length > 1) {
                console.warn('Still have conflicts after resolution for', person, 'on', date);
                // Handle remaining conflicts
                const tasks = finalCheck[person];
                for (let i = 1; i < tasks.length; i++) {
                    const taskId = tasks[i];
                    const available = this.findAvailablePerson(date, finalAssignments);
                    if (available) {
                        finalAssignments[taskId] = available;
                    }
                }
            }
        }
        
        return finalAssignments;
    }

    // Select which task to keep when a person has multiple
    selectTaskToKeep(tasks) {
        // Priority: water (1) > bathroom (2) > garbage (3)
        // But also consider task importance/frequency
        const priority = {
            'water': 1,
            'bathroom': 2,
            'garbage': 3
        };
        
        let bestTask = tasks[0];
        let bestPriority = 999;
        
        for (const taskId of tasks) {
            const p = priority[taskId] || 999;
            if (p < bestPriority) {
                bestPriority = p;
                bestTask = taskId;
            }
        }
        
        return bestTask;
    }

    // Find the best alternative person for a task
    findBestAlternative(date, taskId, currentAssignments) {
        const candidates = this.getAvailableCandidates(date, taskId, currentAssignments);
        
        if (candidates.length === 0) {
            // No available candidates, return null
            return null;
        }
        
        // Score candidates based on fairness criteria
        const scored = candidates.map(person => ({
            person: person,
            score: this.scoreCandidate(date, taskId, person, currentAssignments)
        }));
        
        // Sort by score (lower is better)
        scored.sort((a, b) => a.score - b.score);
        
        // Return the best candidate
        return scored[0].person;
    }

    // Get available candidates (not already assigned on this day)
    getAvailableCandidates(date, taskId, currentAssignments) {
        const assignedPeople = new Set();
        for (const tid in currentAssignments) {
            if (tid !== taskId) {
                assignedPeople.add(currentAssignments[tid]);
            }
        }
        
        return this.people.filter(p => !assignedPeople.has(p));
    }

    // Score a candidate for a task
    scoreCandidate(date, taskId, person, currentAssignments) {
        let score = 0;
        
        // Factor 1: How many times has this person done this task? (lower = better)
        const count = this.taskCounts[taskId][person] || 0;
        score += count * 10;
        
        // Factor 2: When did they last do this task? (longer ago = better)
        const lastDate = this.lastAssigned[taskId][person];
        if (lastDate) {
            const daysSince = daysBetween(lastDate, date);
            score -= daysSince * 2; // Lower score = better
        }
        
        // Factor 3: Distance from ideal position (smaller = better)
        // We need a scheduler instance to calculate this properly
        // For now, use a simplified version
        const personIndex = this.people.indexOf(person);
        const idealIndex = 0; // Simplified
        const distance = Math.abs(personIndex - idealIndex);
        score += distance * 5;
        
        // Factor 4: Ensure fairness across all tasks
        // Check if this person has more total assignments than others
        const totalCounts = {};
        for (const p of this.people) {
            let total = 0;
            for (const resp of this.responsibilities) {
                total += this.taskCounts[resp.id][p] || 0;
            }
            totalCounts[p] = total;
        }
        
        const avgTotal = Object.values(totalCounts).reduce((a, b) => a + b, 0) / this.people.length;
        const personTotal = totalCounts[person] || 0;
        
        if (personTotal > avgTotal) {
            score += (personTotal - avgTotal) * 3;
        } else {
            score -= (avgTotal - personTotal) * 2;
        }
        
        return score;
    }

    // Update counts after assigning tasks
    updateCounts(date, assignments) {
        for (const taskId in assignments) {
            const person = assignments[taskId];
            if (!this.taskCounts[taskId]) {
                this.taskCounts[taskId] = {};
            }
            if (!this.taskCounts[taskId][person]) {
                this.taskCounts[taskId][person] = 0;
            }
            this.taskCounts[taskId][person]++;
            this.lastAssigned[taskId][person] = date;
        }
    }

    // Find any available person for a task (fallback)
    findAvailablePerson(date, currentAssignments) {
        const assignedPeople = new Set();
        for (const tid in currentAssignments) {
            assignedPeople.add(currentAssignments[tid]);
        }
        
        const available = this.people.filter(p => !assignedPeople.has(p));
        return available.length > 0 ? available[0] : null;
    }

    // Reset all counts
    resetCounts() {
        this.responsibilities.forEach(resp => {
            this.taskCounts[resp.id] = {};
            this.lastAssigned[resp.id] = {};
            this.people.forEach(person => {
                this.taskCounts[resp.id][person] = 0;
                this.lastAssigned[resp.id][person] = null;
            });
        });
    }

    // Get fairness report for all tasks
    getFairnessReport(schedule) {
        const report = {};
        
        // Reset counts
        this.resetCounts();
        
        // Process all assignments
        for (const date in schedule) {
            this.updateCounts(date, schedule[date]);
        }
        
        // Build report
        for (const resp of this.responsibilities) {
            report[resp.id] = {
                name: resp.name,
                icon: resp.icon,
                counts: { ...this.taskCounts[resp.id] }
            };
        }
        
        return report;
    }

    // Check if a schedule is valid (no double duties)
    validateSchedule(schedule) {
        const errors = [];
        
        for (const date in schedule) {
            const assignments = schedule[date];
            const personTasks = {};
            
            for (const taskId in assignments) {
                const person = assignments[taskId];
                if (!personTasks[person]) {
                    personTasks[person] = [];
                }
                personTasks[person].push(taskId);
            }
            
            for (const person in personTasks) {
                if (personTasks[person].length > 1) {
                    errors.push({
                        date: date,
                        person: person,
                        tasks: personTasks[person]
                    });
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

// Make ConflictResolver globally available
window.ConflictResolver = ConflictResolver;