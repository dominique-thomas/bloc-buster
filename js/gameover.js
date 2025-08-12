/*
  Project: Bloc Buster
  Description: Handles game over screen functionality.
  Author: Dominique Thomas (github.com/dominique-thomas)
  License: Shared publicly for demonstration purposes only. Reuse or redistribution not permitted without permission.
*/
//----------------------------------
//  Global Variables
//----------------------------------
const DEV_MODE = false;
const params = new URLSearchParams(window.location.search);
const score = Number(localStorage.getItem("blocbuster_score")) || 0;
const name = "DOM";
const entry = { name, score };
const audio = {
  gameOver: new Audio('sfx/gameover.wav'),
};
const defaultScores = [
  { name: "DOM", score: 6000 },
  { name: "CHD", score: 5200 },
  { name: "BOB", score: 4800 },
  { name: "XYZ", score: 4400 },
  { name: "LOL", score: 4000 },
  { name: "BOT", score: 3500 },
  { name: "AAA", score: 3000 },
  { name: "GAM", score: 2500 },
  { name: "XYZ", score: 2000 },
  { name: "CPU", score: 1500 },
];
let scores = JSON.parse(localStorage.getItem("blocbuster_leaderboard")) || [];


//----------------------------------
//  Audio Handler
//----------------------------------
// Play the game over audio
audio.gameOver.volume = 0.4;
audio.gameOver.play().catch(() => {
  document.body.addEventListener("click", () => {
    audio.gameOver.play();
  }, { once: true });
});


//----------------------------------
//  Leaderboard Handlers
//----------------------------------
// Set the leaderboard & sort the scores
if (!scores || !Array.isArray(scores) || scores.length === 0) {
  localStorage.setItem("blocbuster_leaderboard", JSON.stringify(defaultScores));
  scores = defaultScores;
}

scores.unshift(entry);
scores.sort((a, b) => b.score - a.score);

const topScores = scores.slice(0, 5);
const lowestTopScore = topScores[topScores.length - 1]?.score || 0;
const qualifies = score >= lowestTopScore || topScores.length < 5;

// Determine who's in the top 5
if (qualifies) {
  const nameEntry = document.getElementById("name-entry");
  nameEntry.classList.remove("hidden");

  // Auto-focus the input field
  const nameInput = document.getElementById("name-input");
  nameInput.focus();
} else {
  document.getElementById("name-entry").classList.add("hidden");
}

// Update leaderboard & show the user's score
localStorage.setItem("blocbuster_leaderboard", JSON.stringify(topScores));
document.getElementById("final-score").textContent = `SCORE ${String(score).padStart(6, "0")}`;

// Render the leaderboard
const board = document.getElementById("leaderboard");
board.innerHTML = `
  <h3 class="text-glow">TOP SCORES</h3>
  <table class="score-table">
    <thead>
      <tr><th></th><th></th></tr>
    </thead>
    <tbody>
      ${topScores.map(e => `
        <tr>
          <td class="name text-glow">${e.name}</td>
          <td class="score text-glow">${String(e.score).padStart(6, "0")}</td>
        </tr>`).join("")}
    </tbody>
  </table>
`;

//----------------------------------
//  Event Listeners
//----------------------------------
// Event listener to return to the index page
document.getElementById("back-btn").addEventListener("click", () => {
  window.location.href = "index.html";
});

// Event listener to save the user's name to the leaderboard
document.getElementById("save-name").addEventListener("click", () => {
  const nameInput = document.getElementById("name-input").value.trim().toUpperCase() || "???";
  const updatedEntry = { name: nameInput, score };
  const scores = JSON.parse(localStorage.getItem("blocbuster_leaderboard")) || [];

  scores.unshift(updatedEntry);
  scores.sort((a, b) => b.score - a.score);

  const topScores = scores.slice(0, 10);
  localStorage.setItem("blocbuster_leaderboard", JSON.stringify(top10));
  document.getElementById("name-entry").classList.add("hidden");
  window.location.reload();
});

// Clear the local storage; for testing purposes only
document.getElementById("clear-storage").addEventListener("click", () => {
  localStorage.removeItem("blocbuster_leaderboard");
  localStorage.removeItem("blocbuster_score");
  localStorage.removeItem("blocbuster_install_clicked");
  window.location.reload();
});

//----------------------------------
//  Misc Handlers
//----------------------------------
// Show clear storage button
if (DEV_MODE) {
  document.getElementById("clear-storage").classList.remove("hidden");
}