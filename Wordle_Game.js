// ---- LOGIN STATE (from localStorage) ----
window.isLoggedIn = localStorage.getItem("loggedIn") === "true";
window.userId = localStorage.getItem("userId");
console.log("Wordle: isLoggedIn =", window.isLoggedIn, "userId =", window.userId);


document.addEventListener("DOMContentLoaded", () => {
  const playButton = document.getElementById("play-button");
  const menuOverlay = document.getElementById("menu-overlay");
  const themeSelect = document.getElementById("theme");
  const difficultySelect = document.getElementById("difficulty");
  const gameFrame = document.getElementById("game-frame");

  playButton.addEventListener("click", () => {
    const chosenTheme = themeSelect.value.toLowerCase();
    const chosenDifficulty = difficultySelect.value;

    menuOverlay.style.display = "none";

    // Set background colours per theme
    switch (chosenTheme) {
      case "food":
        gameFrame.style.backgroundColor = "#ffcccb"; 
        break;
      case "animals":
        gameFrame.style.backgroundColor = "#c2e5d3"; 
        break;
      case "sports":
        gameFrame.style.backgroundColor = "#d0e8ff"; 
        break;
      default:
        gameFrame.style.backgroundColor = "#e8ebee"; 
        break;
    }

    // Dynamic heading
    const emojiMap = { animals: "🐾", food: "🍫", sports: "🏅", normal: "🧠" };
    const formattedTheme = chosenTheme.charAt(0).toUpperCase() + chosenTheme.slice(1);
    const formattedDifficulty = chosenDifficulty.charAt(0).toUpperCase() + chosenDifficulty.slice(1);

    const gameInfo = document.createElement("h2");
    const message = document.createElement("p");
    gameInfo.textContent = `${emojiMap[chosenTheme]} ${formattedTheme} – ${formattedDifficulty} Mode`;
    message.textContent = "Type your guesses below!";

    gameFrame.innerHTML = "";
    gameFrame.appendChild(gameInfo);
    gameFrame.appendChild(message);



    startGame(chosenTheme, chosenDifficulty);
  });
});

let currentStreak = parseInt(localStorage.getItem("currentStreak")) || 0;
let topStreak = parseInt(localStorage.getItem("topStreak")) || 0;

function updateStreakDisplay() {
	document.getElementById("currentStreakValue").textContent = currentStreak;
	document.getElementById("topStreakValue").textContent = topStreak;
}

  
  
 // ---- LOAD USER'S BEST STREAK FROM DATABASE ----
if (window.userId) {
  fetch(`http://localhost:3000/api/wordle-best/${window.userId}`)
    .then(res => res.json())
    .then(data => {
      topStreak = data.best || 0;
      updateStreakDisplay();
    })
    .catch(err => console.error("Best streak load error:", err));
}

  
function saveWordleScore(streak) {
    const userId = localStorage.getItem("userId");
	
	if(!userId){
		console.warn("No userId found - not saving score");
		return;
	}
	
	fetch("http://localhost:3000/api/save-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            userId: userId,
            gameId: 1,        // Wordle = 1
            score: streak
        })
    })
    .then(res => res.json())
    .then(data => console.log("Score saved:", data))
    .catch(err => console.error("Save error:", err));
}


// Call this once at the start so the leaderboard shows saved streaks
document.addEventListener("DOMContentLoaded", updateStreakDisplay);

function startGame(topic, difficulty) {
  // Save current settings for replay
  window.currentTopic = topic;
  window.currentDifficulty = difficulty;

  
    // Fetch random word from database via backend API
fetch(`http://localhost:3000/api/words?topic=${topic}&difficulty=${difficulty}`)
  .then(response => response.json())
  .then(data => {
    if (Array.isArray(data) && data.length > 0) {
      const randomWord = data[Math.floor(Math.random() * data.length)].toUpperCase();
      window.currentWord = randomWord;
      initializeGame(randomWord);
    } else {
      alert("No words found for this selection!");
    }
  })
  .catch(err => {
    console.error('Error fetching word:', err);
    alert('Error getting word from server.');
  });
} 


function initializeGame(word) {
  const gameFrame = document.getElementById("game-frame");
  const rows = 6;
  const cols = word.length;

  const grid = document.createElement("div");
  grid.id = "wordle-grid";

  const gridContainer = document.createElement("div");
gridContainer.id = "grid-container";

const leftGrid = document.createElement("div");
leftGrid.classList.add("half-grid");

const rightGrid = document.createElement("div");
rightGrid.classList.add("half-grid");

for (let r = 0; r < rows; r++) {
  const row = document.createElement("div");
  row.classList.add("wordle-row");

  for (let c = 0; c < cols; c++) {
    const cell = document.createElement("div");
    cell.classList.add("wordle-cell");
    row.appendChild(cell);
  }

  // First 3 rows on left, next 3 on right
  if (r < 3) leftGrid.appendChild(row);
  else rightGrid.appendChild(row);
}

gridContainer.appendChild(leftGrid);
gridContainer.appendChild(rightGrid);
gameFrame.appendChild(gridContainer);

  gameFrame.appendChild(grid);
  createKeyboard();
}

function createKeyboard() {
  const gameFrame = document.getElementById("game-frame");

  const keyboardContainer = document.createElement("div");
  keyboardContainer.id = "keyboard-container";

  const keysLayout = [
    "QWERTYUIOP",
    "ASDFGHJKL",
    "ZXCVBNM"
  ];

  keysLayout.forEach(row => {
    const rowDiv = document.createElement("div");
    rowDiv.classList.add("keyboard-row");

    row.split("").forEach(letter => {
      const key = document.createElement("button");
      key.classList.add("keyboard-key");
      key.textContent = letter;
      key.addEventListener("click", () => handleVirtualKey(letter));
      rowDiv.appendChild(key);
    });

    keyboardContainer.appendChild(rowDiv);
  });

  // Add Enter and Backspace buttons
  const specialRow = document.createElement("div");
  specialRow.classList.add("keyboard-row");

  const enterKey = document.createElement("button");
  enterKey.classList.add("keyboard-key", "wide-key");
  enterKey.textContent = "Enter";
  enterKey.addEventListener("click", () => handleVirtualKey("ENTER"));

  const backKey = document.createElement("button");
  backKey.classList.add("keyboard-key", "wide-key");
  backKey.textContent = "Back";
  backKey.addEventListener("click", () => handleVirtualKey("BACKSPACE"));

  specialRow.appendChild(enterKey);
  specialRow.appendChild(backKey);
  keyboardContainer.appendChild(specialRow);

  gameFrame.appendChild(keyboardContainer);
}

function updateKeyboardKey(letter, color) {
  const allKeys = document.querySelectorAll(".keyboard-key");
  allKeys.forEach(key => {
    if (key.textContent === letter) {
      const currentColor = key.style.backgroundColor;
      // Prevent downgrading: green > yellow > grey
      if (currentColor === "rgb(106, 170, 100)" && color !== "#6aaa64") return; // already green
      if (currentColor === "rgb(201, 180, 88)" && color === "#787c7e") return; // already yellow
      key.style.backgroundColor = color;
      key.style.color = "white";
    }
  });
}

function handleVirtualKey(key) {
  // Reuse the same logic as physical keys
  handleKeyPress({ key });
}

let currentRow = 0;
let currentCol = 0;
let currentGuess = [];

document.addEventListener("keydown", handleKeyPress);

// Dictionary check (API)
async function isRealWord(word) {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
    return response.ok;
  } catch (err) {
    console.error("Dictionary check failed:", err);
    return false;
  }
}

async function handleKeyPress(e) {
  const key = e.key.toUpperCase();
  const gridContainer = document.getElementById("grid-container");
  const rows = gridContainer.getElementsByClassName("wordle-row");
  const activeRow = rows[currentRow];
  const cells = activeRow.getElementsByClassName("wordle-cell");

  if (/^[A-Z]$/.test(key) && currentCol < window.currentWord.length) {
    cells[currentCol].textContent = key;
    currentGuess.push(key);
    currentCol++;
  } 
  else if (key === "BACKSPACE" && currentCol > 0) {
    currentCol--;
    cells[currentCol].textContent = "";
    currentGuess.pop();
  } 
  else if (key === "ENTER") {
    if (currentGuess.length === window.currentWord.length) {
      const guessWord = currentGuess.join("");
      const valid = await isRealWord(guessWord);

      if (!valid) {
        showPersistentMessage("Unfortunately, not a valid word!");
        clearCurrentRow();
        return;
      }

      checkGuess();
    } else {
      showPersistentMessage("Not enough letters!");
    }
  }
}

function showPersistentMessage(msg) {
  const gameFrame = document.getElementById("game-frame");
  let temp = document.getElementById("temp-msg");
  if (!temp) {
    temp = document.createElement("p");
    temp.id = "temp-msg";
    gameFrame.insertBefore(temp, gameFrame.children[1]);
  }
  temp.textContent = msg;
  temp.style.color = "red";
}

function clearCurrentRow() {
  const gridContainer = document.getElementById("grid-container");
  const rows = gridContainer.getElementsByClassName("wordle-row");
  const activeRow = rows[currentRow];
  const cells = activeRow.getElementsByClassName("wordle-cell");

  for (let c = 0; c < cells.length; c++) {
    cells[c].textContent = "";
  }
  currentGuess = [];
  currentCol = 0;
}

function checkGuess() {
  const guessWord = currentGuess.join("");
  const gridContainer = document.getElementById("grid-container");
  const rows = gridContainer.getElementsByClassName("wordle-row");
  const activeRow = rows[currentRow];
  const cells = activeRow.getElementsByClassName("wordle-cell");

  const target = window.currentWord.split("");
  const guess = currentGuess.slice();

  // Step 1: Mark correct letters (green)
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === target[i]) {
      cells[i].style.backgroundColor = "#6aaa64"; 
      updateKeyboardKey(guess[i], "#6aaa64");
      target[i] = null;
      guess[i] = null;
    }
  }

  // Step 2: Mark misplaced (yellow) or wrong (grey)
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] && target.includes(guess[i])) {
      cells[i].style.backgroundColor = "#c9b458"; 
      updateKeyboardKey(guess[i], "#c9b458");
      target[target.indexOf(guess[i])] = null;
    } else if (guess[i]) {
      cells[i].style.backgroundColor = "#787c7e"; 
      updateKeyboardKey(guess[i], "#787c7e");
    }
  }

  // Step 3: Check win/lose
  if (guessWord === window.currentWord) {
    showEndGameMenu(true);
    document.removeEventListener("keydown", handleKeyPress);
  } else {
    currentRow++;
    currentCol = 0;
    currentGuess = [];
    if (currentRow >= 6) {
      showEndGameMenu(false);
      document.removeEventListener("keydown", handleKeyPress);
    } else {
      showPersistentMessage("");
    }
  }
}

function getStreaks() {
  const streakData = JSON.parse(localStorage.getItem("wordGameStreaks")) || {
    current: 0,
    best: 0
  };
  return streakData;
}

function saveStreaks(current, best) {
  localStorage.setItem("wordGameStreaks", JSON.stringify({ current, best }));
}

function updateLeaderboardDisplay() {
  const streaks = getStreaks();
  document.querySelectorAll(".current-and-best")[0].textContent = `Your current streak: ${streaks.current}`;
  document.querySelectorAll(".current-and-best")[1].textContent = `Your top streak: ${streaks.best}`;
}

function showEndGameMenu(isWin) {
  const keyboardContainer = document.getElementById("keyboard-container");
  if (keyboardContainer) keyboardContainer.remove(); // remove keyboard

  const gameFrame = document.getElementById("game-frame");
  const gridContainer = document.getElementById("grid-container");
  
  if (isWin) {
  currentStreak++;
  if (currentStreak > topStreak) {
    topStreak = currentStreak;
  }
} else {
  currentStreak = 0;
}

localStorage.setItem("currentStreak", currentStreak);
localStorage.setItem("topStreak", topStreak);

updateStreakDisplay();

if (window.isLoggedIn){
	saveWordleScore(topStreak);
}


  // Remove old message if it exists
  const oldMsg = document.getElementById("temp-msg");
  if (oldMsg) oldMsg.remove();

  // Create wrapper for message + buttons
  const endMenuWrapper = document.createElement("div");
  endMenuWrapper.id = "end-menu-wrapper";
  endMenuWrapper.style.display = "flex";
  endMenuWrapper.style.flexDirection = "column";
  endMenuWrapper.style.alignItems = "center";
  endMenuWrapper.style.marginTop = "20px";

  const endMessage = document.createElement("p");
  endMessage.id = "end-message";
  endMessage.textContent = isWin
    ? "Congratulations! You got it!"
    : `Sorry! The word was ${window.currentWord}`;
  endMessage.style.fontSize = "18px";
  endMessage.style.marginBottom = "15px";
  endMessage.style.color = isWin ? "#6aaa64" : "#d21404";
  endMessage.style.textAlign = "center";

  // Buttons container
  const buttonRow = document.createElement("div");
  buttonRow.style.display = "flex";
  buttonRow.style.justifyContent = "center";
  buttonRow.style.gap = "20px";

  // Play Again button
  const playAgainBtn = document.createElement("button");
  playAgainBtn.textContent = "Play Again";
  playAgainBtn.classList.add("menu-button");
  playAgainBtn.style.padding = "10px 20px";
  playAgainBtn.style.fontSize = "16px";
  playAgainBtn.style.borderRadius = "10px";
  playAgainBtn.style.cursor = "pointer";
  playAgainBtn.style.backgroundColor = "#6aaa64";
  playAgainBtn.style.color = "white";
  playAgainBtn.style.border = "none";

  // Return to Menu button
  const returnMenuBtn = document.createElement("button");
  returnMenuBtn.textContent = "Return to Menu";
  returnMenuBtn.classList.add("menu-button");
  returnMenuBtn.style.padding = "10px 20px";
  returnMenuBtn.style.fontSize = "16px";
  returnMenuBtn.style.borderRadius = "10px";
  returnMenuBtn.style.cursor = "pointer";
  returnMenuBtn.style.backgroundColor = "#787c7e";
  returnMenuBtn.style.color = "white";
  returnMenuBtn.style.border = "none";

  playAgainBtn.addEventListener("click", () => {
    const theme = window.currentTopic;
    const difficulty = window.currentDifficulty;

    // Reset all round variables
    currentRow = 0;
    currentCol = 0;
    currentGuess = [];

    // Clear and restart
    gameFrame.innerHTML = "";
    startGame(theme, difficulty);

    // Re-enable typing
    document.addEventListener("keydown", handleKeyPress);
  });

 returnMenuBtn.addEventListener("click", () => {
  const menuOverlay = document.getElementById("menu-overlay");
  const gameFrame = document.getElementById("game-frame");

  // Clear the game frame content
  gameFrame.innerHTML = "";

  // Reset round variables
  currentRow = 0;
  currentCol = 0;
  currentGuess = [];

  // Restore the frame background
  gameFrame.style.backgroundColor = "#e8ebee";

  if (menuOverlay) {
    menuOverlay.style.display = "flex";
    menuOverlay.style.justifyContent = "center";
    menuOverlay.style.alignItems = "center";
    menuOverlay.style.opacity = "1";
    menuOverlay.style.zIndex = "10";
    menuOverlay.style.position = "absolute";
    menuOverlay.style.top = "150px";
    menuOverlay.style.left = "0";
    menuOverlay.style.width = "100%";
    menuOverlay.style.height = "100%";
    menuOverlay.style.backgroundColor = "opaque";
  } else {
    console.error("Menu overlay not found!");
  }

  // Disable keyboard input until next game
  document.removeEventListener("keydown", handleKeyPress);
});

  // Assemble
  buttonRow.appendChild(playAgainBtn);
  buttonRow.appendChild(returnMenuBtn);
  endMenuWrapper.appendChild(endMessage);
  endMenuWrapper.appendChild(buttonRow);

  // Append right below the grid
  gridContainer.insertAdjacentElement("afterend", endMenuWrapper);
}

document.addEventListener("DOMContentLoaded", loadLeaderboard);

function loadLeaderboard() {
    fetch("http://localhost:3000/api/leaderboard/wordle")
        .then(res => res.json())
        .then(data => {
            console.log("Leaderboard loaded:", data);
            updateLeaderboardTable(data);
        })
        .catch(err => console.error("Leaderboard error:", err));
}

function updateLeaderboardTable(entries) {
    for (let i = 0; i < 10; i++) {
        const row = document.querySelector(`.rank-${i + 1}`);

        if (!row) continue;

        if (entries[i]) {
            row.querySelector(".user").textContent = entries[i].UserName;
            row.querySelector(".score").textContent = entries[i].TopStreak;
        } else {
            row.querySelector(".user").textContent = "None";
            row.querySelector(".score").textContent = "None";
        }
    }
}

