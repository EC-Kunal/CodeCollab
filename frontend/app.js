// 1. Update the UI text immediately so the user knows JavaScript is running
const roomId = "demo-room-xyz"; 
document.getElementById("room-id-display").innerText = roomId;

// 2. Then initiate network connections
const socket = io("http://localhost:3001");
let editor; 
let isReceiving = false; 

// Configure RequireJS to fetch Monaco Editor from CDN
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.48.0/min/vs' }});

require(['vs/editor/editor.main'], function() {
    editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: `// Welcome to CodeCollab\nfunction helloWorld() {\n    console.log("Hello Real-Time!");\n}`,
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