const defaultTechniques = {
    anxious: {
        name: "Box Breathing",
        phases: [
            { text: "Inhale", duration: 4, scale: 1.8 },
            { text: "Hold", duration: 4, scale: 1.8 },
            { text: "Exhale", duration: 4, scale: 1.0 },
            { text: "Hold", duration: 4, scale: 1.0 }
        ],
        defaultCycles: 4
    },
    stressed: {
        name: "Extended Exhale",
        phases: [
            { text: "Inhale", duration: 4, scale: 1.7 },
            { text: "Exhale", duration: 7, scale: 0.75 }
        ],
        defaultCycles: 5
    },
    scattered: {
        name: "Coherent Breathing",
        phases: [
            { text: "Inhale", duration: 5, scale: 1.8 },
            { text: "Exhale", duration: 5, scale: 0.75 }
        ],
        defaultCycles: 5
    },
    energize: {
        name: "Energizing Breath",
        phases: [
            { text: "Inhale", duration: 4, scale: 1.7 },
            { text: "Hold", duration: 2, scale: 1.7 },
            { text: "Exhale", duration: 4, scale: 1.0},
            { text: "Hold", duration: 1, scale: 1.0 }
        ],
        defaultCycles: 5
    }
};

// DOM Elements
const selectionScreen = document.getElementById('selection-screen');
const sanctuaryScreen = document.getElementById('sanctuary-screen');
const emotionCards = document.querySelectorAll('.emotion-card');
const backBtn = document.getElementById('back-btn');
const activeStateTitle = document.getElementById('active-state-title');
const breathingCircle = document.getElementById('breathingCircle');
const expandingRing = document.getElementById('expandingRing');
const instructionText = document.getElementById('instructionText');
const timerText = document.getElementById('timerText');
const cycleText = document.getElementById('cycleText');

// Modals
const configModal = document.getElementById('config-modal');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const cycleInput = document.getElementById('cycleInput');
const cancelConfigBtn = document.getElementById('cancel-config-btn');
const startSessionBtn = document.getElementById('start-session-btn');

const customModal = document.getElementById('custom-modal');
const openCustomBtn = document.getElementById('open-custom-btn');
const closeCustomBtn = document.getElementById('close-custom-btn');
const saveCustomBtn = document.getElementById('save-custom-btn');
const savedCustomList = document.getElementById('saved-custom-list');

let selectedTechniqueKey = null;
let customRoutines = JSON.parse(localStorage.getItem('rtb_custom_routines')) || [];

let currentTechnique = null;
let targetCycles = 5;
let currentCycle = 1;
let currentPhaseIndex = 0;
let timeoutId = null;
let intervalId = null;
let isRunning = false;

// Event Listeners for Emotions
emotionCards.forEach(card => {
    card.addEventListener('click', () => {
        selectedTechniqueKey = card.getAttribute('data-state');
        const tech = defaultTechniques[selectedTechniqueKey];
        
        modalTitle.textContent = tech.name;
        modalSubtitle.textContent = "Configure your session parameters";
        cycleInput.value = tech.defaultCycles;
        
        configModal.classList.add('active');
    });
});

cancelConfigBtn.addEventListener('click', () => {
    configModal.classList.remove('active');
});

startSessionBtn.addEventListener('click', () => {
    targetCycles = parseInt(cycleInput.value) || 5;
    configModal.classList.remove('active');
    
    const tech = defaultTechniques[selectedTechniqueKey];
    startGetReadyCountdown(tech);
});

// Custom Routines Management
openCustomBtn.addEventListener('click', () => {
    renderSavedCustomRoutines();
    customModal.classList.add('active');
});

closeCustomBtn.addEventListener('click', () => {
    customModal.classList.remove('active');
});

saveCustomBtn.addEventListener('click', () => {
    const name = document.getElementById('customName').value.trim() || "My Routine";
    const inhale = parseInt(document.getElementById('customInhale').value) || 4;
    const hold1 = parseInt(document.getElementById('customHold1').value) || 0;
    const exhale = parseInt(document.getElementById('customExhale').value) || 4;
    const hold2 = parseInt(document.getElementById('customHold2').value) || 0;
    const cycles = parseInt(document.getElementById('customCycles').value) || 4;

    const phases = [{ text: "Inhale", duration: inhale, scale: 1.8 }];
    if (hold1 > 0) phases.push({ text: "Hold", duration: hold1, scale: 1.8 });
    phases.push({ text: "Exhale", duration: exhale, scale: 0.5 });
    if (hold2 > 0) phases.push({ text: "Hold", duration: hold2, scale: 1.0 });

    const newRoutine = { name, phases, defaultCycles: cycles };
    customRoutines.push(newRoutine);
    localStorage.setItem('rtb_custom_routines', JSON.stringify(customRoutines));

    customModal.classList.remove('active');
    startGetReadyCountdown(newRoutine);
});

function renderSavedCustomRoutines() {
    savedCustomList.innerHTML = '';
    if (customRoutines.length === 0) {
        savedCustomList.innerHTML = '<span style="font-size:0.85rem; color: var(--text-secondary);">No custom routines saved yet.</span>';
        return;
    }

    customRoutines.forEach((routine, index) => {
        const item = document.createElement('div');
        item.className = 'saved-routine-item';
        item.innerHTML = `<span><strong>${routine.name}</strong> (${routine.defaultCycles} cycles)</span>`;
        item.addEventListener('click', () => {
            customModal.classList.remove('active');
            startGetReadyCountdown(routine);
        });
        savedCustomList.appendChild(item);
    });
}

backBtn.addEventListener('click', () => {
    stopSession();
    switchScreen(sanctuaryScreen, selectionScreen);
});

function switchScreen(fromScreen, toScreen) {
    fromScreen.classList.remove('active');
    toScreen.classList.add('active');
}

function stopSession() {
    isRunning = false;
    clearTimeout(timeoutId);
    clearInterval(intervalId);
    breathingCircle.style.transform = 'scale(1)';
    breathingCircle.style.transition = 'none';
    expandingRing.style.transform = 'scale(1)';
    expandingRing.style.transition = 'none';
    expandingRing.style.opacity = '0';
}

// 3, 2, 1 Get Ready Countdown
function startGetReadyCountdown(technique) {
    currentTechnique = technique;
    currentCycle = 1;
    currentPhaseIndex = 0;

    switchScreen(selectionScreen, sanctuaryScreen);
    activeStateTitle.textContent = technique.name;
    breathingCircle.style.transform = 'scale(1)';
    breathingCircle.style.transition = 'none';

    let count = 3;
    instructionText.textContent = "Get Ready";
    timerText.textContent = count;
    cycleText.textContent = "";

    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            timerText.textContent = count;
        } else {
            clearInterval(countdownInterval);
            isRunning = true;
            runPhase();
        }
    }, 1000);
}

function runPhase() {
    if (!isRunning) return;

    const technique = currentTechnique;
    const phase = technique.phases[currentPhaseIndex];

    // Update UI text
    instructionText.textContent = phase.text;
    cycleText.textContent = `Cycle ${currentCycle} of ${targetCycles}`;

    // Apply smooth CSS transition
    breathingCircle.style.transition = `transform ${phase.duration}s cubic-bezier(0.4, 0, 0.2, 1)`;
    breathingCircle.style.transform = `scale(${phase.scale})`;

    // Check if current phase is Exhale to trigger the expanding ring effect
    if (phase.text === "Exhale") {
        expandingRing.style.transition = 'none';
        expandingRing.style.transform = 'scale(1)';
        expandingRing.style.opacity = '0.4'; // Low transparency thick ring

        // Force a brief reflow, then animate outward matching the exhale duration
        void expandingRing.offsetWidth;
        expandingRing.style.transition = `transform ${phase.duration}s cubic-bezier(0.1, 0.8, 0.3, 1), opacity ${phase.duration}s ease-out`;
        expandingRing.style.transform = 'scale(1.4)'; // Expands outward past the outer ring boundary
        expandingRing.style.opacity = '0'; // Fades out completely as it expands
    } else {
        // Hide during Inhale or Holds
        expandingRing.style.transition = 'none';
        expandingRing.style.opacity = '0';
        expandingRing.style.transform = 'scale(1)';
    }

    // Countdown timer
    let timeLeft = phase.duration;
    timerText.textContent = timeLeft;
    
    clearInterval(intervalId);
    intervalId = setInterval(() => {
        timeLeft--;
        if (timeLeft >= 0) {
            timerText.textContent = timeLeft;
        }
    }, 1000);

    // Schedule next phase
    timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        currentPhaseIndex++;

        if (currentPhaseIndex >= technique.phases.length) {
            currentPhaseIndex = 0;
            currentCycle++;

            if (currentCycle > targetCycles) {
                instructionText.textContent = "Session Complete ✨";
                timerText.textContent = "";
                cycleText.textContent = "Take a moment to notice how you feel";
                breathingCircle.style.transform = 'scale(1)';
                isRunning = false;
                return;
            }
        }

        runPhase();
    }, phase.duration * 1000);
}