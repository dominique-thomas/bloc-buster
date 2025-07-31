const DEV_MODE = true;
const params = new URLSearchParams(window.location.search);
const result = params.has("win") ? "You Win!" : params.has("fail") ? "Game Over" : "Finished";
const defaultScores = [
  { name: "DOM", score: 6000 },
  { name: "BOB", score: 5200 },
  { name: "CHIP", score: 4800 },
  { name: "XYZ", score: 4400 },
  { name: "LOL", score: 4000 },
  { name: "BOT", score: 3500 },
  { name: "AAA", score: 3000 },
  { name: "GAMER", score: 2500 },
  { name: "XYZ", score: 2000 },
  { name: "TET", score: 1500 },
];

const score = Number(localStorage.getItem("blocbuster_score")) || 0;
const name = "DOM"; 
const entry = { name, score };
let scores = JSON.parse(localStorage.getItem("blocbuster_leaderboard")) || [];

if (!scores || !Array.isArray(scores) || scores.length === 0) {
  localStorage.setItem("blocbuster_leaderboard", JSON.stringify(defaultScores));
  scores = defaultScores;
}

scores.unshift(entry);
scores.sort((a, b) => b.score - a.score);

const top10 = scores.slice(0, 10);
const lowestTopScore = top10[top10.length - 1]?.score || 0;
const qualifies = score >= lowestTopScore || top10.length < 10;

// Made top 10?
if (qualifies) {
  document.getElementById("name-entry").classList.remove("hidden");
}else {
  document.getElementById("name-entry").classList.add("hidden");
}

localStorage.setItem("blocbuster_leaderboard", JSON.stringify(top10));

document.getElementById("game-result").textContent = result;
document.getElementById("final-score").textContent = `Final Score: ${score}`;

const board = document.getElementById("leaderboard");
board.innerHTML = `
  <h3>Top Scores</h3>
  <table class="score-table">
    <thead>
      <tr><th></th><th></th></tr>
    </thead>
    <tbody>
      ${top10.map(e => `
        <tr>
          <td class="name">${e.name}</td>
          <td class="score">${e.score}</td>
        </tr>`).join("")}
    </tbody>
  </table>
`;

document.getElementById("back-btn").addEventListener("click", () => {
  window.location.href = "index.html";
});

document.getElementById("save-name").addEventListener("click", () => {
  const nameInput = document.getElementById("name-input").value.trim().toUpperCase() || "???";
  const updatedEntry = { name: nameInput, score };

  const scores = JSON.parse(localStorage.getItem("blocbuster_leaderboard")) || [];
  scores.unshift(updatedEntry);
  scores.sort((a, b) => b.score - a.score);
  const top10 = scores.slice(0, 10);
  localStorage.setItem("blocbuster_leaderboard", JSON.stringify(top10));

    document.getElementById("name-entry").classList.add("hidden");

  window.location.reload(); 
});

if(DEV_MODE){
    document.getElementById("clear-storage").classList.remove("hidden");
}

document.getElementById("clear-storage").addEventListener("click", () => {
  localStorage.clear();
  window.location.reload();
});