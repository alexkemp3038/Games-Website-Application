// Elements
const problemEl = document.getElementById("problem");
const optionButtons = [document.getElementById("option1"), document.getElementById("option2"), document.getElementById("option3")];
const feedbackEl = document.getElementById("feedback");
const nextBtn = document.getElementById("next-button");
const startBtn = document.getElementById("start-button");
const playerNameEl = document.getElementById("playerName");
const levelEl = document.getElementById("level");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const gameOverEl = document.getElementById("game-over");
const finalScoreEl = document.getElementById("finalScore");
const playAgainBtn = document.getElementById("play-again");

// State
let correctAnswer = null;
let score = 0;
let timeLeft = 180;
let timerInterval = null;
let level = "simple";
let roundActive = false;

// Config
const LEVELS = {
  simple: { points: 3, penalty: 1 },
  medium: { points: 6, penalty: 2 },
  hard: { points: 9, penalty: 3 }
};

// Helpers
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Generate problem
function generateProblem() {
  let a, b, op;
  if (level === "simple") {
    // single-digit add/sub
    a = randInt(1, 9);
    b = randInt(1, 9);
    op = pick(["+", "-"]);
    if (op === "-" && a < b) [a, b] = [b, a];
    correctAnswer = op === "+" ? a + b : a - b;
  } else if (level === "medium") {
    if (Math.random() < 0.5) {
      // double-digit add/sub
      a = randInt(10, 99);
      b = randInt(10, 99);
      op = pick(["+", "-"]);
      if (op === "-" && a < b) [a, b] = [b, a];
      correctAnswer = op === "+" ? a + b : a - b;
    } else {
      // single-digit multiplication
      a = randInt(1, 9);
      b = randInt(1, 9);
      op = "×";
      correctAnswer = a * b;
    }
  } else if (level === "hard") {
    if (Math.random() < 0.5) {
      // triple-digit ± double-digit
      a = randInt(100, 999);
      b = randInt(10, 99);
      op = pick(["+", "-"]);
      if (op === "-" && a < b) [a, b] = [b, a];
      correctAnswer = op === "+" ? a + b : a - b;
    } else {
      // double-digit × single-digit
      a = randInt(10, 99);
      b = randInt(1, 9);
      op = "×";
      correctAnswer = a * b;
    }
  }

  problemEl.textContent = `${a} ${op} ${b} = ?`;
  generateOptions();
  feedbackEl.textContent = "";
}

// Generate multiple-choice options
function generateOptions() {
  const optionsArray = [correctAnswer];
  while (optionsArray.length < 3) {
    let wrong = correctAnswer + randInt(-10, 10);
    if (wrong !== correctAnswer && wrong >= 0 && !optionsArray.includes(wrong)) {
      optionsArray.push(wrong);
    }
  }
  optionsArray.sort(() => Math.random() - 0.5);
  optionButtons.forEach((btn, i) => {
    btn.textContent = optionsArray[i];
    btn.style.background = "#4caf50";
    btn.onclick = () => checkAnswer(Number(btn.textContent));
  });
}

// Check answer
function checkAnswer(selected) {
  const cfg = LEVELS[level];
  if (selected === correctAnswer) {
    score += cfg.points;
    feedbackEl.textContent = `Correct! +${cfg.points}`;
    feedbackEl.style.color = "green";
  } else {
    score -= cfg.penalty;
    feedbackEl.textContent = `Wrong! -${cfg.penalty} (Correct: ${correctAnswer})`;
    feedbackEl.style.color = "red";
  }
  updateHUD();
}

// Timer
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateHUD();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endRound();
    }
  }, 1000);
}

// HUD
function updateHUD() {
  timerEl.textContent = `Time: ${timeLeft}s`;
  scoreEl.textContent = `Score: ${score}`;
}

// Round control
function startRound() {
  level = levelEl.value;
  score = 0; timeLeft = 180; roundActive = true;
  gameOverEl.classList.add("hidden");
  updateHUD();
  generateProblem();
  startTimer();
}
function endRound() {
  roundActive = false;
  finalScoreEl.textContent = `Final Score: ${score}`;
  gameOverEl.classList.remove("hidden");
}

// Events
startBtn.addEventListener("click", startRound);
nextBtn.addEventListener("click", () => { if (roundActive) generateProblem(); });
playAgainBtn.addEventListener("click", startRound);

// Init
problemEl.textContent = "Press Start to begin!";