let adShown = false;

document.addEventListener("DOMContentLoaded", function () {
  const backHomeBtn = document.getElementById("back-home");
  const overlay = document.getElementById("ad-overlay");
  const closeBtn = document.getElementById("close-overlay");

  if (!backHomeBtn || !overlay || !closeBtn) return;

  backHomeBtn.addEventListener("click", function (e) {
    if (!adShown) {
      e.preventDefault();
      let seconds = 5;
      overlay.style.display = "flex";
      closeBtn.textContent = `Please wait ${seconds}s...`;
      closeBtn.disabled = true;
      closeBtn.style.cursor = "not-allowed";

      const interval = setInterval(() => {
        seconds--;
        closeBtn.textContent = seconds > 0 ? `Please wait ${seconds}s...` : "X Close";
        if (seconds === 0) {
          clearInterval(interval);
          closeBtn.disabled = false;
          closeBtn.style.cursor = "pointer";
        }
      }, 1000);

      closeBtn.addEventListener("click", () => {
        overlay.style.display = "none";
        adShown = true;
        window.location.href = "/";
      });
    } else {
      window.location.href = "/";
    }
  });
});
