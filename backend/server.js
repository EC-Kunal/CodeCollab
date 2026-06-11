const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.send('CodeCollab Backend is running smoothly!');
});
// --- The Arena Challenge Bank ---
// --- The Arena Challenge Bank (Upgraded) ---
const challenges = [
  {
      title: "Reverse a String",
      description: "Write a function named reverseString that takes a string as input and returns the string reversed.",
      starterCode: "function reverseString(str) {\n    // Your code here\n    \n}\n",
      testCall: "reverseString('CodeCollab')", // What we will test
      expectedOutput: "balloCedoC" // What the answer must be
  },
  {
      title: "Calculate Combinations (nCr)",
      description: "Write a function named calculateCombinations to calculate the binomial coefficient (nCr).",
      starterCode: "function calculateCombinations(n, r) {\n    // Your code here\n    \n}\n",
      testCall: "calculateCombinations(5, 2)",
      expectedOutput: 10
  },
  {
      title: "FizzBuzz Logic",
      description: "Write a function named fizzBuzz that returns 'Fizz' for 3, 'Buzz' for 5, and 'FizzBuzz' for 15.",
      starterCode: "function fizzBuzz(n) {\n    // Your code here\n    \n}\n",
      testCall: "fizzBuzz(15)",
      expectedOutput: "FizzBuzz"
  },
  // ... your existing challenges ...
  {
    title: "Nth Fibonacci Number",
    description: "Write a function named getFibonacci that returns the Nth number in the Fibonacci sequence. Optimize it to handle larger numbers efficiently.",
    starterCode: "function getFibonacci(n) {\n    // Your code here\n    \n}\n",
    testCall: "getFibonacci(12)",
    expectedOutput: 144
},
{
    title: "Valid Anagram",
    description: "Write a function named isAnagram that takes two strings and returns true if they are anagrams of each other, and false otherwise.",
    starterCode: "function isAnagram(str1, str2) {\n    // Your code here\n    \n}\n",
    testCall: "isAnagram('listen', 'silent')",
    expectedOutput: true
},
{
    title: "Sum of Primes",
    description: "Write a function named sumPrimes that takes an integer n and returns the sum of all prime numbers less than or equal to n.",
    starterCode: "function sumPrimes(n) {\n    // Your code here\n    \n}\n",
    testCall: "sumPrimes(10)",
    expectedOutput: 17 // (2 + 3 + 5 + 7)
}
];

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);

    // Count how many users are in this specific room and broadcast it
    const roomSize = io.sockets.adapter.rooms.get(roomId).size;
    io.to(roomId).emit('presence-update', roomSize);
  });

  // 1. Listen for code typing and broadcast it
  socket.on('code-update', ({ roomId, code }) => {
    socket.to(roomId).emit('code-receive', code);
  });

  // 2. Listen for terminal execution and broadcast it
  socket.on('terminal-update', ({ roomId, output, color }) => {
    socket.to(roomId).emit('terminal-receive', { output, color });
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        const room = io.sockets.adapter.rooms.get(roomId);
        if (room) {
          // Broadcast the new room size (current size minus the 1 person leaving)
          io.to(roomId).emit('presence-update', room.size - 1);
        }
      }
    }
  });

  // 3. Listen for Arena Match Start
  socket.on('start-match', (roomId) => {
    // Pick a random challenge from the bank
    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    
    // Broadcast the challenge to EVERYONE in the room (including the person who clicked it)
    io.to(roomId).emit('match-started', randomChallenge);
  });

  // 4. Listen for a Winner
  socket.on('player-won', (roomId) => {
    io.to(roomId).emit('match-over', socket.id);
  });

  // 5. Listen for Arena Code Progress (Character Count)
  socket.on('arena-progress', ({ roomId, length }) => {
    // Broadcast the length to the opponent, NOT the code itself
    socket.to(roomId).emit('opponent-progress', length);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`WebSocket Server running on http://localhost:${PORT}`);
});