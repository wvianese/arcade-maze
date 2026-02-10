const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const response = document.getElementById('response');
const bgAudio = document.getElementById('bgAudio');
const yesAudio = document.getElementById('yesAudio');
const welcome = document.getElementById('welcome');
const enterBtn = document.getElementById('enterBtn');
const photoInline = document.getElementById('photoInline');
const photoImg = document.getElementById('photoImg');
const eyebrow = document.getElementById('eyebrow');
const headline = document.getElementById('headline');
const subhead = document.getElementById('subhead');

const noMessages = [
  "Oh? Think you can catch me?",
  "Not that easy.",
  "Too slow — try again.",
  "Nope. You have to say yes.",
  "C'mon, we both know it's yes.",
];

let noIndex = 0;
let lastMoveTime = 0;
let celebrateDone = false;
let audioStarted = false;
let celebrating = false;
let pendingCelebrations = 0;

const heartsCanvas = document.createElement('canvas');
heartsCanvas.className = 'hearts-canvas';
heartsCanvas.setAttribute('aria-hidden', 'true');
document.body.appendChild(heartsCanvas);
const heartsCtx = heartsCanvas.getContext('2d');
let heartsLastTime = 0;
let heartsAnimating = false;
const hearts = [];

function resizeHeartsCanvas() {
  if (!heartsCtx) return;
  const dpr = window.devicePixelRatio || 1;
  heartsCanvas.width = window.innerWidth * dpr;
  heartsCanvas.height = window.innerHeight * dpr;
  heartsCanvas.style.width = `${window.innerWidth}px`;
  heartsCanvas.style.height = `${window.innerHeight}px`;
  heartsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawHeart(ctx, x, y, size, rotation, color, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(size, size);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -0.6);
  ctx.bezierCurveTo(0.6, -1.3, 1.6, -0.3, 0, 1.3);
  ctx.bezierCurveTo(-1.6, -0.3, -0.6, -1.3, 0, -0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function stepHearts(time) {
  if (!heartsCtx) return;
  if (!heartsLastTime) heartsLastTime = time;
  const dt = Math.min(0.033, (time - heartsLastTime) / 1000);
  heartsLastTime = time;
  heartsCtx.clearRect(0, 0, heartsCanvas.width, heartsCanvas.height);

  for (let i = hearts.length - 1; i >= 0; i -= 1) {
    const p = hearts[i];
    p.life += dt;
    if (p.life >= p.ttl) {
      hearts.splice(i, 1);
      continue;
    }
    p.vx *= p.drag;
    p.vy = p.vy * p.drag + p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rotation += p.spin * dt;
    const alpha = 1 - p.life / p.ttl;
    drawHeart(heartsCtx, p.x, p.y, p.size, p.rotation, p.color, alpha);
  }

  if (hearts.length > 0) {
    requestAnimationFrame(stepHearts);
  } else {
    heartsAnimating = false;
  }
}

function addHeartParticle(particle) {
  hearts.push(particle);
  if (!heartsAnimating) {
    heartsAnimating = true;
    heartsLastTime = 0;
    requestAnimationFrame(stepHearts);
  }
}

resizeHeartsCanvas();
window.addEventListener('resize', resizeHeartsCanvas);

const heartsHaze = document.createElement('div');
heartsHaze.className = 'hearts-haze';
heartsHaze.setAttribute('aria-hidden', 'true');
document.body.appendChild(heartsHaze);

const impact = document.createElement('div');
impact.className = 'impact';
impact.setAttribute('aria-hidden', 'true');
impact.innerHTML = '<div class=\"impact-flash\"></div><div class=\"impact-ring\"></div><div class=\"impact-text\">YES!</div>';
document.body.appendChild(impact);

function tryStartAudio() {
  if (audioStarted || !bgAudio) return;
  bgAudio.currentTime = 150.8;
  bgAudio.volume = 0.6;
  const playPromise = bgAudio.play();
  audioStarted = true;
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {
      audioStarted = false;
    });
  }
}

function enterExperience() {
  if (welcome) {
    welcome.style.display = 'none';
  }
  tryStartAudio();
}

function queueCelebrate() {
  pendingCelebrations += 1;
  if (celebrating) return;
  celebrating = true;

  const run = () => {
    if (pendingCelebrations <= 0) {
      celebrating = false;
      return;
    }
    pendingCelebrations -= 1;
    megaCelebrate();
    // Slight spacing so heavy DOM work doesn't drop frames.
    setTimeout(run, 220);
  };

  requestAnimationFrame(run);
}

function setYesMessage() {
  response.textContent = "You're the Schlidin to my Schlipin!";
  noBtn.disabled = true;
  if (bgAudio) {
    bgAudio.pause();
  }
  if (yesAudio) {
    yesAudio.currentTime = 4;
    yesAudio.volume = 0.8;
    const playPromise = yesAudio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {});
    }
  }
  queueCelebrate();
  if (eyebrow) {
    eyebrow.textContent = '';
  }
  if (headline) {
    headline.innerHTML = 'OHHHHH<br>YEAH!<br><span class="aside">(Chick,</span><br><span class="aside">chicka-chicka)</span>';
  }
  if (subhead) {
    subhead.textContent = '';
  }
  if (photoInline) {
    photoInline.classList.add('swap');
  }
  if (photoImg) {
    photoImg.src = 'IMG_4172.JPG';
  }
  if (!celebrateDone) {
    celebrateDone = true;
  }
}

function setNoMessage() {
  noIndex = Math.min(noIndex + 1, noMessages.length - 1);
  response.textContent = noMessages[noIndex];
}

function placeNoButton() {
  const rect = noBtn.getBoundingClientRect();
  if (noBtn.style.position !== 'fixed') {
    noBtn.style.position = 'fixed';
    noBtn.style.left = `${rect.left}px`;
    noBtn.style.top = `${rect.top}px`;
  }
}

function moveNoButtonAway(pointerX, pointerY) {
  placeNoButton();

  const now = Date.now();
  if (now - lastMoveTime < 30) return;
  lastMoveTime = now;

  const rect = noBtn.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const padding = 16;
  const maxX = window.innerWidth - rect.width - padding;
  const maxY = window.innerHeight - rect.height - padding;

  // If the button is corner-trapped, teleport to the opposite diagonal.
  const nearLeft = rect.left <= padding + 4;
  const nearRight = rect.left >= maxX - 4;
  const nearTop = rect.top <= padding + 4;
  const nearBottom = rect.top >= maxY - 4;
  if ((nearLeft && nearTop) || (nearRight && nearBottom) || (nearLeft && nearBottom) || (nearRight && nearTop)) {
    const targetX = nearLeft ? maxX : padding;
    const targetY = nearTop ? maxY : padding;
    noBtn.style.transitionDuration = '0.18s';
    noBtn.style.left = `${targetX}px`;
    noBtn.style.top = `${targetY}px`;
    return;
  }

  const dx = centerX - pointerX;
  const dy = centerY - pointerY;
  const distance = Math.max(1, Math.hypot(dx, dy));

  const closeness = Math.max(0, 220 - distance);
  const push = 90 + closeness * 0.9;
  const scale = push / distance;

  const targetX = centerX + dx * scale;
  const targetY = centerY + dy * scale;
  const clampedX = Math.min(maxX, Math.max(padding, targetX - rect.width / 2));
  const clampedY = Math.min(maxY, Math.max(padding, targetY - rect.height / 2));

  const duration = Math.max(0.08, Math.min(0.38, distance / 500));
  noBtn.style.transitionDuration = `${duration}s`;
  noBtn.style.left = `${clampedX}px`;
  noBtn.style.top = `${clampedY}px`;
}

function spawnBurst() {
  const rect = yesBtn.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const total = 120;
  for (let i = 0; i < total; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 220 + Math.random() * 380;
    const size = 5 + Math.random() * 7;
    const hue = 330 + Math.random() * 25;
    addHeartParticle({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 5,
      life: 0,
      ttl: 1.2 + Math.random() * 0.6,
      gravity: 220,
      drag: 0.98,
      color: `hsl(${hue} 85% 65%)`,
    });
  }
}

function rainHearts() {
  const count = 240;
  for (let i = 0; i < count; i += 1) {
    const size = 4 + Math.random() * 6;
    const hue = 325 + Math.random() * 30;
    addHeartParticle({
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 30,
      vy: 120 + Math.random() * 240,
      size,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 2,
      life: 0,
      ttl: 2.2 + Math.random() * 1.2,
      gravity: 180,
      drag: 0.995,
      color: `hsl(${hue} 85% 65%)`,
    });
  }
}

function floatHearts() {
  const count = 140;
  for (let i = 0; i < count; i += 1) {
    const size = 4 + Math.random() * 7;
    const hue = 335 + Math.random() * 25;
    addHeartParticle({
      x: Math.random() * window.innerWidth,
      y: window.innerHeight + 40 + Math.random() * 120,
      vx: (Math.random() - 0.5) * 20,
      vy: -80 - Math.random() * 140,
      size,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 2,
      life: 0,
      ttl: 2 + Math.random() * 1.2,
      gravity: -20,
      drag: 0.995,
      color: `hsl(${hue} 85% 70%)`,
    });
  }
}

function megaCelebrate() {
  spawnBurst();
  rainHearts();
  floatHearts();
  impact.classList.remove('active');
  void impact.offsetWidth;
  impact.classList.add('active');
  heartsHaze.classList.remove('active');
  void heartsHaze.offsetWidth;
  heartsHaze.classList.add('active');
  setTimeout(() => {
    spawnBurst();
    rainHearts();
    floatHearts();
  }, 600);
  setTimeout(() => {
    spawnBurst();
    rainHearts();
    floatHearts();
  }, 1200);
}

function tease(e) {
  e.preventDefault();
  e.stopPropagation();
  setNoMessage();
  moveNoButtonAway(e.clientX, e.clientY);
}

yesBtn.addEventListener('click', setYesMessage);

if (enterBtn) {
  enterBtn.addEventListener('click', () => {
    enterExperience();
  });
}

['mouseenter', 'pointerenter', 'pointerdown', 'touchstart', 'focus', 'click'].forEach((event) => {
  noBtn.addEventListener(event, (e) => {
    const point = e.touches?.[0] || e;
    setNoMessage();
    moveNoButtonAway(point.clientX, point.clientY);
    e.preventDefault();
    e.stopPropagation();
  });
});

window.addEventListener('resize', () => {
  if (noBtn.style.position === 'fixed') {
    moveNoButtonAway(window.innerWidth / 2, window.innerHeight / 2);
  }
});
