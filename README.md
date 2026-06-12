# ⚡ CodeCollab
**Real-Time Collaborative Workspace & Execution Sandbox**

CodeCollab is a distributed, real-time algorithmic competition platform. Engineered from scratch, it features a custom browser-based JavaScript execution sandbox, WebSockets for bidirectional state synchronization, and an automated Continuous Integration (CI) style testing pipeline to evaluate head-to-head coding matches.

## 🚀 System Architecture & Features
* **Real-Time State Management:** Utilizes WebSocket protocols (`Socket.io`) across isolated namespaces. Handles live presence, room generation, real-time code mirroring, and graceful disconnects.
* **Browser-Native Execution Sandbox:** Bypasses the need for expensive external compilation APIs by utilizing the native V8 engine in the browser to evaluate untrusted user code locally and securely.
* **Automated CI Grading Engine:** Features a multi-stage testing pipeline. When a user submits a solution, the engine rapidly evaluates the code against an array of hidden test cases, immediately halting on failures.
* **Dynamic Gamification Layer:** Implements asynchronous progress tracking. Spectators see real-time scalable progress badges (e.g., `[2/3 ⚡]`) and debounced toast notifications.

## 💻 Tech Stack
* **Frontend:** Vanilla JavaScript (SPA Routing), HTML5, CSS3
* **Backend:** Node.js, Express.js
* **Networking:** WebSockets (Socket.io)

## 🔗 Live Demo
* **Frontend:** https://cc-algorithmic.netlify.app/
* **Backend:** https://codecollab-d5pn.onrender.com/
