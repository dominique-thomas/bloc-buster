let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById("install-btn");
  if (installBtn) installBtn.style.display = "block";
});

document.getElementById("install-btn").addEventListener("click", () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(choice => {
      if (choice.outcome === "accepted") {
        document.getElementById("install-btn").style.display = "none";
        deferredPrompt = null;
      }
    });
  }
});

document.getElementById("start-btn").addEventListener("click", () => {
  window.location.href = "game.html";
});