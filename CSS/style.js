// -----------------------------
// GIF paths (your folder names)
// -----------------------------
const GIFS = {
    hope: "GIF/hope.gif",
    cry: "GIF/cry.gif",
    scared: "GIF/scared.gif",
    angry: "GIF/angry.gif",
    superangry: "GIF/superangry.gif",
    gun: "GIF/gun.gif",
    love: "GIF/love.gif",
};

// -----------------------------
// Elements
// -----------------------------
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");

const headerBox = document.getElementById("headerBox");
const moodBox = document.getElementById("moodBox");

const dock = document.getElementById("dock");
const dockGif = document.getElementById("dockGif");
const dockTitle = document.getElementById("dockTitle");
const dockSub = document.getElementById("dockSub");
const dockClose = document.getElementById("dockClose");

const moodLabel = document.getElementById("moodLabel");
const moodCount = document.getElementById("moodCount");
const moodFill = document.getElementById("moodFill");

const success = document.getElementById("success");
const againBtn = document.getElementById("againBtn");

const gunOverlay = document.getElementById("gunOverlay");

const particles = document.getElementById("particles");

// confetti
const confettiCanvas = document.getElementById("confetti");
const ctx = confettiCanvas.getContext("2d");

// no hint
const noHint = document.getElementById("noHint");

// -----------------------------
// State
// -----------------------------
let noAttempts = 0;
let celebrating = false;
let gunStage = false;
let noRemovedByGun = false;

// smaller = less “big border” around NO
let dangerRadius = 80;

// throttle
let lastAttemptTime = 0;
const ATTEMPT_COOLDOWN_MS = 420;

// mood thresholds (slow)
const T_SCARED = 6;
const T_ANGRY = 13;
const T_SUPER = 21;
const EXTRA_FOR_GUN = 5;

// NO roaming state (IMPORTANT: prevents disappearing outside card)
let noFloating = false;
let noOriginalParent = null;
let noOriginalNext = null;
let hintOriginalParent = null;
let hintOriginalNext = null;

// -----------------------------
// Helpers
// -----------------------------
function viewport() {
    // more reliable than only window.innerWidth/Height
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    return { vw, vh };
}

function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
}

function rect(el) {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
}

function intersects(a, b) {
    return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

// -----------------------------
// Mood / hint / dock
// -----------------------------
function hintForMood() {
    if (noAttempts === 0) return "are you sure? 🙂";
    if (noAttempts < T_SCARED) return "pls don’t… 🥺";
    if (noAttempts < T_ANGRY) return "stop chasing! 😤";
    if (noAttempts < T_SUPER) return "i’m getting MAD 😡";
    return "LAST WARNING 😈";
}

function dockForMood() {
    if (noAttempts === 0) {
        return { gif: GIFS.hope, title: "hopeful 😌", sub: "say yes plss 💗" };
    }
    if (noAttempts < T_SCARED) {
        return { gif: GIFS.cry, title: "pls don’t 😭", sub: "don’t break my heart…" };
    }
    if (noAttempts < T_ANGRY) {
        return { gif: GIFS.scared, title: "wait wait 😨", sub: "why are you coming closer??" };
    }
    if (noAttempts < T_SUPER) {
        return { gif: GIFS.angry, title: "BRO 😤", sub: "STOP chasing the NO button" };
    }
    return { gif: GIFS.superangry, title: "SUPER ANGRY 😡", sub: "okay enough. press YES." };
}

function updateMoodUI() {
    moodCount.textContent = `No tries: ${noAttempts}`;

    let label = "Mood: hopeful 💗";
    let pct = 12;

    if (noAttempts >= 1 && noAttempts < T_SCARED) { label = "Mood: cry 😭"; pct = 32; }
    if (noAttempts >= T_SCARED && noAttempts < T_ANGRY) { label = "Mood: scared 😳"; pct = 58; }
    if (noAttempts >= T_ANGRY && noAttempts < T_SUPER) { label = "Mood: angry 😤"; pct = 72; }
    if (noAttempts >= T_SUPER) { label = "Mood: super angry 😡"; pct = 100; }

    moodLabel.textContent = label;
    moodFill.style.width = `${pct}%`;

    // always show hint
    noHint.textContent = hintForMood();

    const d = dockForMood();
    dockGif.src = d.gif;
    dockTitle.textContent = d.title;
    dockSub.textContent = d.sub;
}

// -----------------------------
// Dock close
// -----------------------------
dockClose.addEventListener("click", () => {
    dock.style.display = "none";
});

// -----------------------------
// Background particles (MAKE THEM VISIBLE)
// - before YES: 💔 after chasing starts
// - after YES: ❤
// -----------------------------
function spawnParticle() {
    const { vw, vh } = viewport();

    const p = document.createElement("div");
    p.className = "particle";

    const size = 14 + Math.random() * 22;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;

    // make it visible (emoji heart), not faint white shapes
    const chasing = (noAttempts > 0 && !celebrating);
    p.textContent = celebrating ? "❤" : (chasing ? "💔" : "❤");

    p.style.background = "transparent";
    p.style.display = "flex";
    p.style.alignItems = "center";
    p.style.justifyContent = "center";
    p.style.fontSize = `${size}px`;
    p.style.lineHeight = "1";
    p.style.opacity = celebrating ? "0.35" : (chasing ? "0.30" : "0.22");
    p.style.color = celebrating
        ? "rgba(255,40,90,0.55)"
        : (chasing ? "rgba(255,40,90,0.45)" : "rgba(255,40,90,0.32)");

    p.style.left = `${Math.random() * vw}px`;
    p.style.top = `${vh + 30}px`;

    const dur = 6 + Math.random() * 7;
    p.style.animationDuration = `${dur}s`;

    particles.style.zIndex = "0"; // ensure visible
    particles.appendChild(p);

    setTimeout(() => p.remove(), dur * 1000);
}
setInterval(spawnParticle, 520);

// -----------------------------
// NO button: make it roam on the FULL SCREEN (never clipped)
// This is the KEY FIX: we re-parent NO + hint to <body>
// so it will NOT disappear when leaving the big box.
// -----------------------------
function ensureNoFloating() {
    if (noFloating) return;

    noOriginalParent = noBtn.parentNode;
    noOriginalNext = noBtn.nextSibling;

    hintOriginalParent = noHint.parentNode;
    hintOriginalNext = noHint.nextSibling;

    // capture current screen position BEFORE moving to body (so first move animates)
    const r0 = noBtn.getBoundingClientRect();

    document.body.appendChild(noBtn);
    document.body.appendChild(noHint);

    // set fixed at current position first (so the FIRST move animates smoothly)
    noBtn.style.position = "fixed";
    noBtn.style.left = `${r0.left}px`;
    noBtn.style.top = `${r0.top}px`;
    noBtn.style.zIndex = "60";

    // smoother + slower move (NOT too fast)
    noBtn.style.transition = "left 0.34s cubic-bezier(0.22, 0.85, 0.25, 1), top 0.34s cubic-bezier(0.22, 0.85, 0.25, 1)";
    noBtn.style.willChange = "left, top";

    noHint.style.display = "block";
    noHint.style.position = "fixed";
    noHint.style.zIndex = "61";

    noHint.style.transition = "left 0.34s cubic-bezier(0.22, 0.85, 0.25, 1), top 0.34s cubic-bezier(0.22, 0.85, 0.25, 1)";
    noHint.style.willChange = "left, top";


    // force reflow so transitions work for the very first move
    void noBtn.getBoundingClientRect();

    noFloating = true;
}

function hardClampNoToViewport() {
    if (!noFloating) return;

    const { vw, vh } = viewport();
    const EDGE = 16;

    const r = noBtn.getBoundingClientRect();
    let x = parseFloat(noBtn.style.left || r.left);
    let y = parseFloat(noBtn.style.top || r.top);

    // if currently offscreen by any reason, push it back
    if (r.left < EDGE) x += (EDGE - r.left);
    if (r.top < EDGE) y += (EDGE - r.top);
    if (r.right > vw - EDGE) x -= (r.right - (vw - EDGE));
    if (r.bottom > vh - EDGE) y -= (r.bottom - (vh - EDGE));

    // final clamp using size
    const w = r.width || 90;
    const h = r.height || 50;

    x = clamp(x, EDGE, vw - w - EDGE);
    y = clamp(y, EDGE, vh - h - EDGE);

    noBtn.style.left = `${x}px`;
    noBtn.style.top = `${y}px`;

    placeHintNearNo(x, y, w, h);
}

function placeHintNearNo(x, y, btnW, btnH) {
    const { vw, vh } = viewport();
    const EDGE = 16;

    noHint.style.display = "block";
    noHint.textContent = hintForMood();

    // measure hint after text update
    const hr = noHint.getBoundingClientRect();
    const hintW = hr.width || 140;
    const hintH = hr.height || 30;

    // --- try to keep it centered on the NO button ---
    let centerX = x + btnW / 2;

    // --- default position: below ---
    let top = y + btnH + 10;

    // if no space below -> place above
    if (top + hintH > vh - EDGE) {
        top = y - hintH - 10;
    }

    // if still no space (very corner case) -> clamp inside viewport
    top = clamp(top, EDGE, vh - hintH - EDGE);

    // keep centerX unless it would go offscreen
    const minCenter = EDGE + hintW / 2;
    const maxCenter = vw - EDGE - hintW / 2;
    centerX = clamp(centerX, minCenter, maxCenter);

    noHint.style.left = `${centerX}px`;
    noHint.style.top = `${top}px`;
}



function pickNewNoPosition(cursorX, cursorY) {
    const { vw, vh } = viewport();
    const EDGE = 16;

    const nr = noBtn.getBoundingClientRect();
    const btnW = nr.width || 90;
    const btnH = nr.height || 50;

    const yesR = rect(yesBtn);
    const YES_PAD = 18;

    // base direction: away from cursor (but add randomness so it doesn't always go same way)
    const curCx = nr.left + btnW / 2;
    const curCy = nr.top + btnH / 2;

    const baseAng = Math.atan2(curCy - cursorY, curCx - cursorX);

    // Try several random candidates
    for (let i = 0; i < 28; i++) {
        const dist = 220 + Math.random() * 110; // NOT too far
        const ang = baseAng + (Math.random() * 2 - 1) * (Math.PI * 0.95); // random directions

        let x = cursorX + Math.cos(ang) * dist - btnW / 2;
        let y = cursorY + Math.sin(ang) * dist - btnH / 2;

        // clamp to screen
        x = clamp(x, EDGE, vw - btnW - EDGE);
        y = clamp(y, EDGE, vh - btnH - EDGE);

        // keep it OUT of the danger radius (so you never catch it)
        const cx = x + btnW / 2;
        const cy = y + btnH / 2;
        if (Math.hypot(cx - cursorX, cy - cursorY) < dangerRadius + 20) continue;

        // only restriction now: do NOT overlap YES
        const cand = { left: x, top: y, right: x + btnW, bottom: y + btnH };
        const yesZone = {
            left: yesR.left - YES_PAD,
            top: yesR.top - YES_PAD,
            right: yesR.right + YES_PAD,
            bottom: yesR.bottom + YES_PAD
        };
        if (intersects(cand, yesZone)) continue;

        return { x, y, btnW, btnH };
    }

    // fallback: random anywhere, still avoid YES + stay on screen
    for (let i = 0; i < 50; i++) {
        let x = Math.random() * (vw - btnW - EDGE * 2) + EDGE;
        let y = Math.random() * (vh - btnH - EDGE * 2) + EDGE;

        const cand = { left: x, top: y, right: x + btnW, bottom: y + btnH };
        const yesZone = {
            left: yesR.left - YES_PAD,
            top: yesR.top - YES_PAD,
            right: yesR.right + YES_PAD,
            bottom: yesR.bottom + YES_PAD
        };
        if (intersects(cand, yesZone)) continue;

        return { x, y, btnW, btnH };
    }

    // final fallback: top-left corner-ish
    return { x: EDGE, y: EDGE + 90, btnW, btnH };
}

function moveNoSmooth(cursorX, cursorY) {
    if (celebrating || gunStage || noRemovedByGun) return;

    ensureNoFloating();

    const pos = pickNewNoPosition(cursorX, cursorY);

    noBtn.style.left = `${pos.x}px`;
    noBtn.style.top = `${pos.y}px`;

    placeHintNearNo(pos.x, pos.y, pos.btnW, pos.btnH);

    // after move finishes, do a hard clamp (guarantees it never ends off-screen)
    setTimeout(() => hardClampNoToViewport(), 520);
}

// -----------------------------
// Attempt handling (slow + controlled)
// -----------------------------
function registerAttempt(cursorX, cursorY) {
    if (celebrating || gunStage || noRemovedByGun) return;

    const now = Date.now();
    if (noAttempts === 1) yesBtn.textContent = "Okay okay… just say YES 😭💞";
    else if (noAttempts === 8) yesBtn.textContent = "Just accept it already 😤💘";
    else if (noAttempts === 16) yesBtn.textContent = "PRESS YES NOW 😈❤️";


    if (now - lastAttemptTime < ATTEMPT_COOLDOWN_MS) {
        moveNoSmooth(cursorX, cursorY);
        return;
    }
    lastAttemptTime = now;

    noAttempts += 1;
    updateMoodUI();

    // after super angry + 5 attempts => gun stage
    if (noAttempts >= (T_SUPER + EXTRA_FOR_GUN)) {
        enterGunStage();
        return;
    }

    moveNoSmooth(cursorX, cursorY);
}

// -----------------------------
// Gun stage
// -----------------------------
function enterGunStage() {
    gunStage = true;
    gunOverlay.classList.remove("hidden");
    noBtn.style.display = "none";
    noHint.style.display = "none";
}

function removeNoForever() {
    noRemovedByGun = true;
    gunOverlay.classList.add("hidden");
    noBtn.style.display = "none";
    noHint.style.display = "none";
}

// click anywhere when gun is showing -> remove no
gunOverlay.addEventListener("click", () => {
    removeNoForever();
});

document.addEventListener("click", (e) => {
    if (gunStage && !noRemovedByGun) {
        if (e.target === yesBtn) return;
        removeNoForever();
    }
});

// -----------------------------
// Make NO impossible to click
// -----------------------------
noBtn.addEventListener("mousedown", (e) => {
    // if someone tries to click fast, it still escapes
    e.preventDefault();
    e.stopPropagation();
    moveNoSmooth(e.clientX, e.clientY);
});
noBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
});

// -----------------------------
// Main chase logic
// - if cursor comes near NO, it moves smoothly + counts attempts slowly
// -----------------------------
document.addEventListener("mousemove", (e) => {
    if (celebrating || gunStage || noRemovedByGun) return;
    if (noBtn.style.display === "none") return;

    const r = noBtn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    const dist = Math.hypot(e.clientX - cx, e.clientY - cy);

    if (dist < dangerRadius) {
        registerAttempt(e.clientX, e.clientY);
    } else {
        // keep hint following always
        if (!gunStage && !celebrating) {
            const x = noFloating ? parseFloat(noBtn.style.left || r.left) : r.left;
            const y = noFloating ? parseFloat(noBtn.style.top || r.top) : r.top;
            placeHintNearNo(x, y, r.width, r.height);
        }
    }
});

// keep NO fully visible on resize (fixes “outside screen” issues)
window.addEventListener("resize", () => {
    if (noFloating) hardClampNoToViewport();
});

// -----------------------------
// YES logic
// -----------------------------
yesBtn.addEventListener("click", () => {
    if (celebrating) return;
    celebrating = true;

    yesBtn.style.display = "none";
    noBtn.style.display = "none";
    noHint.style.display = "none";

    gunOverlay.classList.add("hidden");

    success.classList.remove("hidden");

    dock.style.display = "block";
    dockGif.src = GIFS.love;
    dockTitle.textContent = "YAYYY 💖";
    dockSub.textContent = "best decision ever 😽💘";

    startConfetti(2400);
});

againBtn.addEventListener("click", () => {
    location.reload();
});

// -----------------------------
// Confetti
// -----------------------------
function resizeCanvas() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let confetti = [];
let running = false;

function makeConfetti(n = 150) {
    confetti = [];
    for (let i = 0; i < n; i++) {
        confetti.push({
            x: Math.random() * confettiCanvas.width,
            y: -20 - Math.random() * 240,
            vx: -2 + Math.random() * 4,
            vy: 2 + Math.random() * 5,
            r: 4 + Math.random() * 7,
            rot: Math.random() * Math.PI,
            vr: -0.2 + Math.random() * 0.4,
            a: 0.9
        });
    }
}

function draw() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    for (const p of confetti) {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.a -= 0.003;

        ctx.save();
        ctx.globalAlpha = Math.max(p.a, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = `hsl(${(p.x + p.y) % 360} 90% 65%)`;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
        ctx.restore();
    }
    confetti = confetti.filter(p => p.a > 0 && p.y < confettiCanvas.height + 60);

    if (running) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

function startConfetti(ms = 2000) {
    makeConfetti(170);
    running = true;
    draw();
    setTimeout(() => running = false, ms);
}

// -----------------------------
// Init
// -----------------------------
updateMoodUI();

// show the hint under NO immediately
setTimeout(() => {
    const rr = noBtn.getBoundingClientRect();
    noHint.style.display = "block";
    placeHintNearNo(rr.left, rr.top, rr.width, rr.height);
}, 60);
