// Your ICS file URL (via CORS proxy)
const icsUrl = "https://corsproxy.io/?" + encodeURIComponent("https://api.veracross.com/lville/subscribe/AD7CE871-D819-415A-AA22-78A85A7C66B6.ics?uid=187A2F39-7FBE-4818-857F-515AFB8DEC1D");

// DOM elements
const todoListElement = document.getElementById("todo-list");
const prevWeekButton = document.getElementById("prev-week");
const nextWeekButton = document.getElementById("next-week");

let tasks = [];
let currentDate = new Date(); // Start at the current date

// Function to fetch and parse ICS file
async function loadTasks() {
    try {
        const response = await fetch(icsUrl);
        if (!response.ok) {
            throw new Error("Failed to fetch calendar data.");
        }
        const icsText = await response.text();
        tasks = parseICS(icsText);
        renderTasksForCurrentWeek();
    } catch (error) {
        todoListElement.innerHTML = `<p class="error">Error loading tasks: ${error.message}</p>`;
    }
}

// Function to parse ICS text and extract events
function parseICS(icsText) {
    const filteredKeywords = ["KAC.21", "ADV.120", "Boys Junior Varsity Squash"];
    const tasks = [];
    const events = icsText.split("BEGIN:VEVENT");

    events.forEach((event, index) => {
        // Match the SUMMARY field (handles multiline values)
        const summaryMatch = event.match(/SUMMARY:(.*(?:\n .*)*)/);
        // Match the DTSTART field (handles optional TZID parameter)
        const dateMatch = event.match(/DTSTART(;TZID=[^:]+)?:([\dT]+)/);

        if (summaryMatch && dateMatch) {
            // Extract and clean up the event title
            const title = summaryMatch[1].replace(/\n /g, "").trim();
            if (filteredKeywords.some(keyword => title.includes(keyword))) return; // Skip unwanted events

            // Extract and parse the date
            const dateRaw = dateMatch[2]; // The second group contains the actual date value
            const date = new Date(
                `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}T${dateRaw.slice(9, 11)}:${dateRaw.slice(11, 13)}:${dateRaw.slice(13, 15)}`
            );

            // Add the task to the list
            tasks.push({ title, date });
            console.log(`Parsed event ${index}:`, { title, date });
        } else {
            console.warn(`Skipped event ${index}: Missing SUMMARY or DTSTART`, event);
        }
    });

    console.log("All parsed tasks:", tasks);
    return tasks.sort((a, b) => a.date - b.date); // Sort tasks by date
}

function renderTasksForCurrentWeek() {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of the week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of the week (Saturday)

    const tasksThisWeek = tasks.filter(task => {
        const taskDateOnly = new Date(task.date.toDateString()); // Remove time
        return taskDateOnly >= startOfWeek && taskDateOnly <= endOfWeek;
    });

    console.log("Tasks this week:", tasksThisWeek); // Debugging log

    if (tasksThisWeek.length === 0) {
        todoListElement.innerHTML = `<p>No tasks found for this week.</p>`;
        return;
    }

    // Group tasks by date (using only the date, ignoring time)
    const groupedTasks = tasksThisWeek.reduce((groups, task) => {
        const dateKey = task.date.toDateString(); // Group by date only
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(task.title);
        return groups;
    }, {});

    console.log("Grouped tasks by date:", groupedTasks); // Debugging log

    // Clear the current content
    todoListElement.innerHTML = "";

    for (const [date, titles] of Object.entries(groupedTasks)) {
        const groupElement = document.createElement("div");
        groupElement.className = "task-group";

        const groupTitle = document.createElement("div");
        groupTitle.className = "task-group-title";
        groupTitle.textContent = new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        groupElement.appendChild(groupTitle);

        titles.forEach((title, taskIndex) => {
            const taskElement = document.createElement("div");
            taskElement.className = "task";

            // Task title with checkbox
            const taskTitle = document.createElement("div");
            taskTitle.className = "task-title";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = `task-${date}-${taskIndex}`;

            // Optional: Load saved checkbox state from localStorage
            const checkboxStorageKey = `task-completed-${date}-${taskIndex}`;
            const savedCheckboxState = localStorage.getItem(checkboxStorageKey);
            if (savedCheckboxState === 'true') {
                checkbox.checked = true;
            }

            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    // Optionally, you can add styles to indicate completion
                    label.style.textDecoration = "line-through";
                } else {
                    label.style.textDecoration = "none";
                }
                // Save checkbox state to localStorage
                localStorage.setItem(checkboxStorageKey, checkbox.checked);
            });

            const label = document.createElement("label");
            label.htmlFor = checkbox.id;
            label.textContent = title;

            // Apply initial style based on saved checkbox state
            if (checkbox.checked) {
                label.style.textDecoration = "line-through";
            }

            taskTitle.appendChild(checkbox);
            taskTitle.appendChild(label);

            // Task note input field
            const taskNote = document.createElement("textarea");
            taskNote.className = "task-note";
            taskNote.placeholder = "Add a note...";

            // Optional: Load saved notes from localStorage
            const storageKey = `task-note-${date}-${taskIndex}`;
            const savedNote = localStorage.getItem(storageKey);
            if (savedNote) {
                taskNote.value = savedNote;
            }

            taskNote.addEventListener('input', () => {
                if (taskNote.value.trim() !== '') {
                    localStorage.setItem(storageKey, taskNote.value.trim());
                } else {
                    localStorage.removeItem(storageKey);
                }
            });

            taskElement.appendChild(taskTitle);
            taskElement.appendChild(taskNote);

            groupElement.appendChild(taskElement);
        });

        todoListElement.appendChild(groupElement);
    }
}

// Event listeners for week navigation
prevWeekButton.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() - 7);
    renderTasksForCurrentWeek();
});

nextWeekButton.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() + 7);
    renderTasksForCurrentWeek();
});

// Load tasks on page load
loadTasks();
