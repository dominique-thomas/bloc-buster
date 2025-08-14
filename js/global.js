/*
  Project: Bloc Buster
  Description: Global script for all game pages.
  Author: Dominique Thomas (github.com/dominique-thomas)
  License: Shared publicly for demonstration purposes only. Reuse or redistribution not permitted without permission.
*/
//----------------------------------
//  Misc
//----------------------------------
// Apply nudge to arcade container
(() => {
  const W = 1024; 
  const CUT_X = 192;
  const container = document.querySelector(".arcade-container");
  const windowEl = document.querySelector(".arcade-window");

  const snapCutoutX = () => {
    const cab = container.getBoundingClientRect();
    const cutoutExpectedLeft = (CUT_X / W) * cab.width;
    const actualLeft = windowEl.getBoundingClientRect().left - cab.left;
    const delta = Math.round(cutoutExpectedLeft - actualLeft);

    container.style.setProperty("--cab-nudge-x", `${delta}px`);
  };
  window.addEventListener("load", snapCutoutX);
  window.addEventListener("resize", snapCutoutX);
})();