// 1. Setup & Globals
const socket = io("http://localhost:3001");
let currentRoomId = null; 
let editor; 
let isReceiving = false; 


// 3. UI Routing & Room Management
const landingView = document.getElementById('landing-view');
const workspaceView = document.getElementById('workspace-view');
const roomIdDisplay = document.getElementById('room-id-display');
const joinRoomInput = document.getElementById('join-room-input');
const arenaPanel = document.getElementById('arena-panel');

function showWorkspace(mode, id) {
    landingView.classList.replace('view-active', 'view-hidden');
    workspaceView.classList.replace('view-hidden', 'view-active');
    arenaPanel.classList.add('panel-hidden');
    
    currentRoomId = id; 

    if (mode === 'solo') {
        roomIdDisplay.innerText = "Offline Sandbox";
        roomIdDisplay.style.color = "#aaaaaa";
    } else if (mode === 'arena') {
        roomIdDisplay.innerText = `Arena: ${id}`;
        roomIdDisplay.style.color = "#d4af37"; 
        arenaPanel.classList.remove('panel-hidden'); 
    } else {
        roomIdDisplay.innerText = id;
        roomIdDisplay.style.color = "#4af626";
    }
}

function showLanding() {
    workspaceView.classList.replace('view-active', 'view-hidden');
    landingView.classList.replace('view-hidden', 'view-active');
    currentRoomId = null;
}

// Button Listeners
document.getElementById('btn-create-room').addEventListener('click', () => {
    const newRoomId = Math.random().toString(36).substring(2, 8); 
    showWorkspace('collab', newRoomId);
    socket.emit('join-room', newRoomId);
});

document.getElementById('btn-arena-mode').addEventListener('click', () => {
    const newRoomId = 'arena-' + Math.random().toString(36).substring(2, 8); 
    showWorkspace('arena', newRoomId);
    socket.emit('join-room', newRoomId); 
});

document.getElementById('btn-join-room').addEventListener('click', () => {
    const id = joinRoomInput.value.trim();
    if (!id) return;
    
    if (id.startsWith('arena-')) { 
        showWorkspace('arena', id); 
    } else { 
        showWorkspace('collab', id); 
    }
    
    socket.emit('join-room', id);
});

document.getElementById('btn-solo-sandbox').addEventListener('click', () => {
    showWorkspace('solo', null);
});

document.getElementById('btn-leave-room').addEventListener('click', () => {
    showLanding();
});

// Global Toast Function
function showToast(message, type = "info") {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    if (type === "success") toast.style.borderLeftColor = "#4af626";
    if (type === "error") toast.style.borderLeftColor = "#ff5555";
    if (type === "warning") toast.style.borderLeftColor = "#f1c40f";
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Copy Button Logic
document.getElementById('copy-btn').addEventListener('click', () => {
    if (currentRoomId) {
        navigator.clipboard.writeText(currentRoomId);
        showToast(`Room ID copied: ${currentRoomId}`, "success");
    }
});

// 4. Monaco Editor & Code Sync
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.48.0/min/vs' }});

require(['vs/editor/editor.main'], function() {
    editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: `// Welcome to CodeCollab\nfunction helloWorld() {\n    console.log("System Ready");\n}\n\nhelloWorld();`,
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true
    });

    editor.onDidChangeModelContent((event) => {
        if (isReceiving || !currentRoomId) return; 
        
        const currentCode = editor.getValue();

        if (currentRoomId.startsWith('arena-')) {
            socket.emit('arena-progress', { roomId: currentRoomId, length: currentCode.length });
            return; 
        }

        socket.emit('code-update', { roomId: currentRoomId, code: currentCode });
    });
});

socket.on('code-receive', (incomingCode) => {
    if (currentRoomId && currentRoomId.startsWith('arena-')) return;

    if (editor) {
        isReceiving = true; 
        const position = editor.getPosition(); 
        editor.setValue(incomingCode);
        if (position) editor.setPosition(position); 
        isReceiving = false; 
    }
});

// 5. Local Execution Sandbox
const runBtn = document.getElementById('run-btn');
const outputScreen = document.getElementById('output-screen');
const languageSelector = document.getElementById('language-selector');

runBtn.addEventListener('click', () => {
    const sourceCode = editor.getValue();
    const language = languageSelector.value;

    if (!sourceCode.trim()) {
        outputScreen.innerText = "Error: Cannot run empty code.";
        return;
    }

    if (language !== 'javascript') {
        outputScreen.innerText = `Execution for ${language} requires a premium API. Currently, only JavaScript runs locally.`;
        outputScreen.style.color = "#ffaa00"; 
        return;
    }

    let executionOutput = "";
    const originalConsoleLog = console.log;
    
    console.log = (...args) => {
        executionOutput += args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : arg
        ).join(" ") + "\n";
    };

    try {
        const executeUserCode = new Function(sourceCode);
        executeUserCode();

        if (!executionOutput) executionOutput = "Execution finished with no output.";
        outputScreen.innerText = executionOutput;
        outputScreen.style.color = "#4af626";
    } catch (error) {
        executionOutput = error.toString();
        outputScreen.innerText = executionOutput;
        outputScreen.style.color = "#ff5555";
    } finally {
        console.log = originalConsoleLog;
    }

    if (currentRoomId) {
        socket.emit('terminal-update', { 
            roomId: currentRoomId, 
            output: executionOutput, 
            color: outputScreen.style.color 
        });
    }
});

socket.on('terminal-receive', ({ output, color }) => {
    outputScreen.innerText = output;
    outputScreen.style.color = color;
});

// 6. Arena Gamification Logic
let totalTestCases = 0;           
let opponentPassedCount = 0;
let currentChallengeData = null;
const submitBtn = document.getElementById('submit-btn');
const startMatchBtn = document.getElementById('start-match-btn');
const challengeTitle = document.getElementById('challenge-title');
const challengeDesc = document.getElementById('challenge-desc');

startMatchBtn.addEventListener('click', () => {
    if (currentRoomId) {
        socket.emit('start-match', currentRoomId);
    }
});

socket.on('match-started', (challenge) => {
    currentChallengeData = challenge; 
    totalTestCases = challenge.testCases.length; 
    opponentPassedCount = 0; 
    
    challengeTitle.innerText = challenge.title;
    challengeDesc.innerText = challenge.description;
    
    if (editor) editor.setValue(challenge.starterCode);
    
    startMatchBtn.innerText = "Match in Progress!";
    startMatchBtn.disabled = true;
    startMatchBtn.style.backgroundColor = "#555";
    startMatchBtn.style.cursor = "not-allowed";
    
    submitBtn.classList.remove('view-hidden');
    
    updateOpponentProgressUI(); 
});


submitBtn.addEventListener('click', () => {
    if (!currentChallengeData) return;
    
    const sourceCode = editor.getValue();
    let passedCount = 0;
    

    for (let i = 0; i < currentChallengeData.testCases.length; i++) {
        const tc = currentChallengeData.testCases[i];
        
        try {
            const executableCode = sourceCode + `\nreturn ${tc.call};`;
            const testFunction = new Function(executableCode);
            const result = testFunction();
            
            if (result === tc.expected) {
                passedCount++;
                socket.emit('test-case-passed', { roomId: currentRoomId, passedCount });
            } else {
                outputScreen.innerText = `❌ FAILED Test ${i + 1}!\nExpected: ${tc.expected}\nGot: ${result}`;
                outputScreen.style.color = "#ff5555";
                return; 
            }
        } catch (error) {
            outputScreen.innerText = `⚠️ Syntax Error in your code:\n${error.message}`;
            outputScreen.style.color = "#ffaa00";
            return; 
        }
    }
    
    if (passedCount === currentChallengeData.testCases.length) {
        outputScreen.innerText = `✅ SUCCESS! All ${passedCount} test cases passed.`;
        outputScreen.style.color = "#4af626";
        socket.emit('player-won', currentRoomId);
    }
});

socket.on('match-over', (winnerId) => {
    if (socket.id === winnerId) {
        challengeTitle.innerText = "🏆 YOU WON!";
        challengeTitle.style.color = "#f1c40f";
    } else {
        challengeTitle.innerText = "💀 OPPONENT WON";
        challengeTitle.style.color = "#e74c3c";
        if (editor) editor.updateOptions({ readOnly: true }); 
    }
    
    challengeDesc.innerText = "Match concluded.";
    submitBtn.classList.add('view-hidden');
    

    setTimeout(() => {
        startMatchBtn.innerText = "Start Rematch";
        startMatchBtn.disabled = false;
        startMatchBtn.style.backgroundColor = "#007acc";
        startMatchBtn.style.cursor = "pointer";
        if (editor) editor.updateOptions({ readOnly: false });
    }, 5000);
});


// 7. Live Room Presence, Progress, & Disconnects
let previousPlayerCount = 1;

function updateOpponentProgressUI() {
    const progressSpan = document.getElementById('opponent-progress');
    if (!progressSpan || totalTestCases === 0) return;

    let statusText = '';
    
    if (opponentPassedCount === 0) {
        statusText = `[0/${totalTestCases} ⏳]`;
        progressSpan.style.color = "#aaaaaa"; 
    } else if (opponentPassedCount < totalTestCases) {
        statusText = `[${opponentPassedCount}/${totalTestCases} ⚡]`;
        progressSpan.style.color = "#f1c40f"; 
    } else {
        statusText = `[${opponentPassedCount}/${totalTestCases} 🏆]`;
        progressSpan.style.color = "#4af626"; 
    }
    
    progressSpan.innerText = ` ${statusText}`;
}

socket.on('presence-update', (playerCount) => {
    if (playerCount > previousPlayerCount && previousPlayerCount !== 0) {
        showToast("A developer joined the room.", "info");
    } else if (playerCount < previousPlayerCount) {
        showToast("A developer left the room.", "error");
    }
    previousPlayerCount = playerCount;

    if (currentRoomId && currentRoomId.startsWith('arena-')) {
        if (startMatchBtn.disabled && playerCount < 2) {
            challengeTitle.innerText = "🏆 YOU WON (Default)!";
            challengeTitle.style.color = "#4af626";
            challengeDesc.innerText = "Opponent disconnected from the arena.";
            submitBtn.classList.add('view-hidden');
            
            setTimeout(() => {
                startMatchBtn.innerText = "Start Rematch";
                startMatchBtn.disabled = false;
                startMatchBtn.style.backgroundColor = "#007acc";
                startMatchBtn.style.cursor = "pointer";
                if (editor) editor.updateOptions({ readOnly: false });
            }, 5000);
        }
        
        if (!startMatchBtn.disabled) {
            if (playerCount > 1) {
                challengeTitle.innerText = "Opponent Joined!";
                challengeDesc.innerText = "Ready to start the match.";
                challengeTitle.style.color = "#4af626"; 
            } else {
                challengeTitle.innerText = "Waiting for players...";
                challengeDesc.innerText = "Invite a friend to start the match.";
                challengeTitle.style.color = "#ffffff";
            }
        }
    }

    const playerList = document.getElementById('player-list');
    if (playerList) {
        playerList.innerHTML = ''; 
        for (let i = 0; i < playerCount; i++) {
            const li = document.createElement('li');
            li.innerHTML = i === 0 ? '🟢 You' : `🔴 Opponent <span id="opponent-progress" class="progress-text"></span>`;
            playerList.appendChild(li);
        }
        updateOpponentProgressUI(); 
    }
});

// Sarcastic Taunt Array 
const sarcasticRemarks = [
    "Are you sleeping?",
    "Is your keyboard unplugged?",
    "Time to wake up!",
    "They are leaving you in the dust.",
    "Might want to type a little faster.",
    "Did you forget how to code?"
];

let toastDebounceTimer;

socket.on('opponent-progress', (passedCount) => {
    opponentPassedCount = passedCount;
    updateOpponentProgressUI();

    clearTimeout(toastDebounceTimer);
    
    toastDebounceTimer = setTimeout(() => {
        if (passedCount > 0 && passedCount < totalTestCases) {
            const remark = sarcasticRemarks[Math.floor(Math.random() * sarcasticRemarks.length)];
            showToast(`Opponent passed ${passedCount}/${totalTestCases} tests. ${remark}`, "warning");
        } 
        else if (passedCount === totalTestCases) {
            showToast(`🚨 ALERT: Opponent passed ALL tests! They are about to win!`, "error");
        }
    }, 150); 
});