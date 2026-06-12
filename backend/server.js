const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.send('CodeCollab Backend is running smoothly!');
});

const challenges = [
  {
      title: "Reverse a String",
      description: "Write a function named reverseString that takes a string as input and returns the string reversed.",
      starterCode: "function reverseString(str) {\n    // Your code here\n    \n}\n",
      testCases: [
          { call: "reverseString('hello')", expected: "olleh" },
          { call: "reverseString('CodeCollab')", expected: "balloCedoC" },
          { call: "reverseString('racecar')", expected: "racecar" }
      ]
  },
  {
      title: "Calculate Combinations (nCr)",
      description: "Write a function named calculateCombinations to calculate the binomial coefficient (nCr).",
      starterCode: "function calculateCombinations(n, r) {\n    // Your code here\n    \n}\n",
      testCases: [
          { call: "calculateCombinations(5, 2)", expected: 10 },
          { call: "calculateCombinations(10, 3)", expected: 120 },
          { call: "calculateCombinations(6, 6)", expected: 1 }
      ]
  },
  {
      title: "FizzBuzz Logic",
      description: "Write a function named fizzBuzz that returns 'Fizz' for 3, 'Buzz' for 5, and 'FizzBuzz' for 15.",
      starterCode: "function fizzBuzz(n) {\n    // Your code here\n    \n}\n",
      testCases: [
          { call: "fizzBuzz(3)", expected: "Fizz" },
          { call: "fizzBuzz(10)", expected: "Buzz" },
          { call: "fizzBuzz(30)", expected: "FizzBuzz" },
          { call: "fizzBuzz(7)", expected: 7 }
      ]
  },
  {
    title: "Valid Palindrome",
    description: "Write a function named isPalindrome that takes a lowercase string and returns true if it reads the same forward and backward, and false otherwise.",
    starterCode: "function isPalindrome(str) {\n    // Your code here\n    \n}\n",
    testCases: [
        { call: "isPalindrome('racecar')", expected: true },
        { call: "isPalindrome('hello')", expected: false },
        { call: "isPalindrome('level')", expected: true }
    ]
},
{
    title: "Nth Fibonacci Number",
    description: "Write a function named fibonacci that returns the nth number in the Fibonacci sequence. Assume the sequence starts: 0, 1, 1, 2, 3...",
    starterCode: "function fibonacci(n) {\n    // Your code here\n    \n}\n",
    testCases: [
        { call: "fibonacci(0)", expected: 0 },
        { call: "fibonacci(5)", expected: 5 },
        { call: "fibonacci(10)", expected: 55 },
        { call: "fibonacci(15)", expected: 610 }
    ]
},
{
    title: "Find the Missing Number",
    description: "Given an array containing n distinct numbers taken from 0, 1, 2, ..., n, write a function missingNumber that returns the missing number. (Hint: Gaussian sum formula).",
    starterCode: "function missingNumber(arr) {\n    // Your code here\n    \n}\n",
    testCases: [
        { call: "missingNumber([3, 0, 1])", expected: 2 },
        { call: "missingNumber([9, 6, 4, 2, 3, 5, 7, 0, 1])", expected: 8 },
        { call: "missingNumber([0, 1])", expected: 2 }
    ]
},
{
    title: "Factorial Trailing Zeroes",
    description: "Write a function trailingZeroes(n) that returns the number of trailing zeroes in n!. Optimize your solution to avoid calculating the massive factorial directly.",
    starterCode: "function trailingZeroes(n) {\n    // Your code here\n    \n}\n",
    testCases: [
        { call: "trailingZeroes(3)", expected: 0 },
        { call: "trailingZeroes(5)", expected: 1 },
        { call: "trailingZeroes(100)", expected: 24 }
    ]
},
{
    title: "Digital Root",
    description: "Write a function digitalRoot(n) that repeatedly adds all the digits of a non-negative integer until the result has only one digit, and returns it.",
    starterCode: "function digitalRoot(n) {\n    // Your code here\n    \n}\n",
    testCases: [
        { call: "digitalRoot(16)", expected: 7 },
        { call: "digitalRoot(942)", expected: 6 },
        { call: "digitalRoot(0)", expected: 0 },
        { call: "digitalRoot(38)", expected: 2 }
    ]
},
{
    title: "Valid Anagram",
    description: "Write a function isAnagram that takes two strings and returns true if the second string is an anagram of the first, and false otherwise.",
    starterCode: "function isAnagram(str1, str2) {\n    // Your code here\n    \n}\n",
    testCases: [
        { call: "isAnagram('anagram', 'nagaram')", expected: true },
        { call: "isAnagram('rat', 'car')", expected: false },
        { call: "isAnagram('listen', 'silent')", expected: true }
    ]
},
{
    title: "Count Vowels",
    description: "Write a function countVowels that returns the number of vowels (a, e, i, o, u) in a given string. Assume the input is always lowercase.",
    starterCode: "function countVowels(str) {\n    // Your code here\n    \n}\n",
    testCases: [
        { call: "countVowels('hello')", expected: 2 },
        { call: "countVowels('codecollab')", expected: 4 },
        { call: "countVowels('xyz')", expected: 0 },
        { call: "countVowels('education')", expected: 5 }
    ]
}
];

const server = http.createServer(app);
const io = require('socket.io')(server, {
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

    const roomSize = io.sockets.adapter.rooms.get(roomId).size;
    io.to(roomId).emit('presence-update', roomSize);
  });

  socket.on('code-update', ({ roomId, code }) => {
    socket.to(roomId).emit('code-receive', code);
  });

  socket.on('terminal-update', ({ roomId, output, color }) => {
    socket.to(roomId).emit('terminal-receive', { output, color });
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        const room = io.sockets.adapter.rooms.get(roomId);
        if (room) {
          io.to(roomId).emit('presence-update', room.size - 1);
        }
      }
    }
  });

  socket.on('start-match', (roomId) => {
    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    
    io.to(roomId).emit('match-started', randomChallenge);
  });

  socket.on('player-won', (roomId) => {
    io.to(roomId).emit('match-over', socket.id);
  });

  socket.on('test-case-passed', ({ roomId, passedCount }) => {
    socket.to(roomId).emit('opponent-progress', passedCount);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`WebSocket Server running on http://localhost:${PORT}`);
});