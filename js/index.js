/*
  Project: Bloc Buster
  Description: Handles entry page functionality.
  Author: Dominique Thomas (github.com/dominique-thomas)
  License: Shared publicly for demonstration purposes only. Reuse or redistribution not permitted without permission.
*/
//----------------------------------
//  Global Variables
//----------------------------------
const installBtn = document.getElementById("install-btn");
let highScoreElement = document.querySelector(".high-score");
let leaderboard = JSON.parse(localStorage.getItem("blocbuster_leaderboard") || "[]");
let deferredPrompt = null;
let topScore;

//----------------------------------
//  Leaderboard Score Handler
//----------------------------------
// Show default score if one isn't available
if (!leaderboard.length) {
  leaderboard = [{ name: "DOM", score: 6000 }];
}

// Get the highest score and display the score
leaderboard.sort((a, b) => b.score - a.score);
topScore = leaderboard[0];
highScoreElement.textContent = `HIGH SCORE ${String(topScore.score).padStart(6, "0")}`;

//----------------------------------
//  Event Listeners
//----------------------------------
// Event listener used to check if the user has installed the PWA 
if (!localStorage.getItem("blocbuster_install_clicked")) {

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); 
    deferredPrompt = e;
    installBtn.classList.remove("hidden");
  });

  // Event listener used to install the PWA and hide the button
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      localStorage.setItem("blocbuster_install_clicked", "1");
      installBtn.classList.add("hidden");
    }
    deferredPrompt = null;
  });
}

// Event listener to start the game
document.getElementById("start-btn").addEventListener("click", () => {
  window.location.href = "game.html";
});

// Event listener that registers the PWA service worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/bloc-buster/sw.js")
        .then(() => console.log("Service Worker Registered"))
        .catch((error) => console.log("Service Worker Registration Failed:", error));
}

// Event listener that hides the install button if it still exists
window.addEventListener("appinstalled", () => {  
  localStorage.setItem("blocbuster_install_clicked", "1");
  const btn = document.getElementById("install-btn");
  if (btn) btn.classList.add("hidden");
});
