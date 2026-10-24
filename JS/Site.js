// Shared behaviour for every page
document.addEventListener("DOMContentLoaded", function () {
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Start audio players at a comfortable volume
  document.querySelectorAll("audio").forEach(function (audio) {
    audio.volume = 0.4;
  });
});
