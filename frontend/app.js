const socket = io("http://localhost:3001");
const roomId = "demo-room-xyz"; 
document.getElementById("room-id-display").innerText = roomId;

let editor; 
let isReceiving = false; 

// --- 1. Editor Setup ---
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.48.0/min/vs' }});

require(['vs/editor/editor.main'], function() {
    editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: `// Welcome to CodeCollab\nfunction helloWorld() {\n    console.log("Local Sandbox activated!");\n}\n\nhelloWorld();`,
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true
    });

    socket.emit('join-room', roomId);

    editor.onDidChangeModelContent((event) => {
        if (isReceiving) return;
        const currentCode = editor.getValue();
        socket.emit('code-update', { roomId, code: currentCode });
    });
});

socket.on('code-receive', (incomingCode) => {
    if (editor) {
        isReceiving = true; 
        const position = editor.getPosition(); 
        editor.setValue(incomingCode);
        if (position) editor.setPosition(position); 
        isReceiving = false; 
    }
});

// --- 2. Local Execution Sandbox ---
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
        outputScreen.innerText = `Execution for ${language} requires a premium backend API. Currently, only JavaScript runs locally in the browser sandbox.`;
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

    // Broadcast the terminal result to other users
    socket.emit('terminal-update', { 
        roomId, 
        output: executionOutput, 
        color: outputScreen.style.color 
    });
});

// Receive the terminal result from other users
socket.on('terminal-receive', ({ output, color }) => {
    outputScreen.innerText = output;
    outputScreen.style.color = color;
});