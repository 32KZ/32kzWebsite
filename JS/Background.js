// Particle constellation drawn behind every page
(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var canvas, ctx, dots = [], mouse = null, frame = 0, width = 0, height = 0, scale = 1;

  var LINK_DISTANCE = 130;
  var MOUSE_DISTANCE = 170;

  function resize() {
    scale = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);

    // Fewer dots on small screens so phones stay smooth
    var count = Math.min(110, Math.round((width * height) / 11000));
    while (dots.length < count) {
      dots.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4
      });
    }
    dots.length = count;
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;

    for (var i = 0; i < dots.length; i++) {
      var a = dots[i];
      for (var j = i + 1; j < dots.length; j++) {
        var b = dots[j];
        var d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK_DISTANCE) {
          ctx.strokeStyle = "rgba(157, 140, 255, " + (1 - d / LINK_DISTANCE) * 0.45 + ")";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      if (mouse) {
        var m = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (m < MOUSE_DISTANCE) {
          ctx.strokeStyle = "rgba(255, 113, 217, " + (1 - m / MOUSE_DISTANCE) * 0.7 + ")";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = "rgba(207, 199, 255, 0.85)";
    for (var k = 0; k < dots.length; k++) {
      ctx.beginPath();
      ctx.arc(dots[k].x, dots[k].y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function step() {
    for (var i = 0; i < dots.length; i++) {
      var a = dots[i];
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0 || a.x > width) a.vx *= -1;
      if (a.y < 0 || a.y > height) a.vy *= -1;
    }
    draw();
    frame = requestAnimationFrame(step);
  }

  // Only animate while the tab is visible and motion is allowed
  function update() {
    var run = !document.hidden && !reduceMotion.matches;
    if (run && !frame) frame = requestAnimationFrame(step);
    if (!run && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  function start() {
    canvas = document.createElement("canvas");
    canvas.className = "bg-particles";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);
    ctx = canvas.getContext("2d");

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", function (e) {
      mouse = { x: e.clientX, y: e.clientY };
      if (!frame) draw();
    });
    document.documentElement.addEventListener("pointerleave", function () {
      mouse = null;
      if (!frame) draw();
    });
    document.addEventListener("visibilitychange", update);
    if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", update);
    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
