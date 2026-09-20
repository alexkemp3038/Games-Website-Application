const problemEl = document.getElementById("problem");
const optionButtons = [
  document.getElementById("option1"),
  document.getElementById("option2"),
  document.getElementById("option3")
];
const feedbackEl = document.getElementById("feedback");
const playButton = document.getElementById("play-button");
const menuOverlay = document.getElementById("menu-overlay");
const appContainer = document.querySelector(".app-container");
const levelEl = document.getElementById("level");
const timerEl = document.getElementById("timer");
const scoreEl = document.getElementById("score");
const gameOverEl = document.getElementById("game-over");
const finalScoreEl = document.getElementById("finalScore");
const playAgainBtn = document.getElementById("play-again");

// "Your best score: <span id='bestScoreValue'>None</span>"
const bestScoreEl = document.getElementById("bestScoreValue");

appContainer.style.display = "none";

let correctAnswer = null;
let score = 0;
let timeLeft = 0;
let initialTimeLimit = 0;
let timerInterval = null;
let level = "simple";
let roundActive = false;
let answered = false;
let bestScore = 0;

// ---- SAVE SCORE TO DB ----
function saveMathsScore(score) {
  const userId = localStorage.getItem("userId");

  if (!userId) {
    console.warn("User not logged in — score not saved");
    return;
  }

  fetch("http://localhost:3000/api/save-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: userId,
      gameId: 2,   // Maths game
      score: score
    })
  })
    .then(res => res.json())
    .then(data => console.log("Maths Score Saved:", data))
    .catch(err => console.error("Maths Score Save Error:", err));
}

// ---- LOAD MATHS SETTINGS FROM DB ----
const LEVELS = {
  simple: { points: 0, penalty: 0 },
  medium: { points: 6, penalty: 2 },
  hard: { points: 9, penalty: 3 }
};

fetch("http://localhost:3000/api/maths-settings")
  .then(res => res.json())
  .then(settings => {
    initialTimeLimit = settings.TimeLimit;
    timeLeft = initialTimeLimit;
    LEVELS.simple.points = settings.SimplePoints;
    LEVELS.simple.penalty = settings.SimplePenalty;
    LEVELS.medium.points = settings.MediumPoints;
    LEVELS.medium.penalty = settings.MediumPenalty;
	LEVELS.hard.points   = settings.HardPoints;
    LEVELS.hard.penalty  = settings.HardPenalty;
    updateHUD();
  })
  .catch(err => console.error("Math settings load error:", err));


// ---- LOAD USER'S BEST SCORE FROM DB ----
const userId = localStorage.getItem("userId");

if (userId) {
  fetch(`http://localhost:3000/api/maths-best/${userId}`)
    .then(res => res.json())
    .then(data => {
      bestScore = data.best || 0;
      bestScoreEl.textContent = bestScore === 0 ? "None" : bestScore;
    })
    .catch(err => console.error("Best score load error:", err));
} else {
  bestScoreEl.textContent = "None";
}


// ---- HELPER FUNCTIONS ----
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---- PROBLEM GENERATION ----
function generateProblem() {
  let a, b, op;

  if (level === "simple") {
    a = randInt(1, 9);
    b = randInt(1, 9);
    op = pick(["+", "-"]);
    if (op === "-" && a < b) [a, b] = [b, a];
    correctAnswer = op === "+" ? a + b : a - b;
  } else if (level === "medium") {
    if (Math.random() < 0.5) {
      a = randInt(10, 99);
      b = randInt(10, 99);
      op = pick(["+", "-"]);
      if (op === "-" && a < b) [a, b] = [b, a];
      correctAnswer = op === "+" ? a + b : a - b;
    } else {
      a = randInt(1, 9);
      b = randInt(1, 9);
      op = "×";
      correctAnswer = a * b;
    }
  } else {
    if (Math.random() < 0.5) {
      a = randInt(100, 999);
      b = randInt(10, 99);
      op = pick(["+", "-"]);
      if (op === "-" && a < b) [a, b] = [b, a];
      correctAnswer = op === "+" ? a + b : a - b;
    } else {
      a = randInt(10, 99);
      b = randInt(1, 9);
      op = "×";
      correctAnswer = a * b;
    }
  }

  problemEl.textContent = `${a} ${op} ${b} = ?`;
  generateOptions();
  feedbackEl.textContent = "";
  answered = false;
}

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
    btn.disabled = false;
    btn.onclick = () => checkAnswer(Number(btn.textContent));
  });
}

// ---- ANSWER CHECKING ----
function checkAnswer(selected) {
  if (answered) return;
  answered = true;

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

  optionButtons.forEach(b => (b.disabled = true));

  if (roundActive) {
    setTimeout(generateProblem, 1000);
  }
}

// ---- TIMER ----
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

function updateHUD() {
  timerEl.textContent = `Time: ${timeLeft}s`;
  scoreEl.textContent = `Score: ${score}`;
}

// ---- ROUND CONTROL ----
function startRound() {
  level = levelEl.value;
  score = 0;
  timeLeft = initialTimeLimit;  // reset timer properly
  roundActive = true;
  gameOverEl.classList.add("hidden");
  updateHUD();
  generateProblem();
  startTimer();
}

function endRound() {
  roundActive = false;
  finalScoreEl.textContent = `Final Score: ${score}`;
  gameOverEl.classList.remove("hidden");

  if (window.isLoggedIn) {
    saveMathsScore(score);
  }

  // Local best (UI) update
  if (score > bestScore) {
    bestScore = score;
    if (bestScoreEl) {
      bestScoreEl.textContent = bestScore;
    }
  }
}

// ---- BUTTON HOOKS ----
playButton.addEventListener("click", () => {
  menuOverlay.style.display = "none";
  appContainer.style.display = "flex";
  startRound();
});

playAgainBtn.addEventListener("click", () => {
  menuOverlay.style.display = "flex";
  appContainer.style.display = "none";
});

problemEl.textContent = "Press Start to begin!";

// ---- GLOBAL LEADERBOARD (bottom table) ----
document.addEventListener("DOMContentLoaded", loadMathsLeaderboard);

function loadMathsLeaderboard() {
  fetch("http://localhost:3000/api/leaderboard/maths")
    .then(res => res.json())
    .then(data => {
      console.log("Maths Leaderboard Loaded:", data);
      updateMathsLeaderboardTable(data);
    })
    .catch(err => console.error("Leaderboard error:", err));
}

function updateMathsLeaderboardTable(entries) {
  for (let i = 0; i < 10; i++) {
    const row = document.querySelector(`.rank-${i + 1}`);
    if (!row) continue;

    if (entries[i]) {
      row.querySelector(".user").textContent = entries[i].UserName;
      row.querySelector(".score").textContent = entries[i].TopScore;
    } else {
      row.querySelector(".user").textContent = "None";
      row.querySelector(".score").textContent = "None";
    }
  }
}

