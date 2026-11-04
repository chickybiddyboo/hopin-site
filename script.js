const items = Array.from(document.querySelectorAll(".feature-item"));
const stageImage = document.getElementById("stageImage");
const stageVideo = document.getElementById("stageVideo");
const stageCaption = document.getElementById("stageCaption");
const heroFloat = document.getElementById("heroFloat");
const captionNum = document.getElementById("captionNum");
const captionName = document.getElementById("captionName");
const logoHome = document.getElementById("logoHome");
const narrativePanel = document.getElementById("narrativePanel");
const narrativeNum = document.getElementById("narrativeNum");
const narrativeName = document.getElementById("narrativeName");
const narrativeText = document.getElementById("narrativeText");

const DEFAULT_IMAGE = "assets/images/main.webp";

// a feature's data-video can list several clips, comma-separated, to play
// in order (e.g. an intro clip before the main loop); only the last one loops
let videoQueue = [];
let videoIndex = 0;

function playQueuedVideo() {
  const src = videoQueue[videoIndex];
  if (!src) return;
  stageVideo.loop = videoIndex === videoQueue.length - 1;
  if (stageVideo.getAttribute("src") !== src) {
    stageVideo.setAttribute("src", src);
  }
  stageVideo.currentTime = 0;
  stageVideo.play().catch(() => {});
}

stageVideo.addEventListener("ended", () => {
  if (videoIndex < videoQueue.length - 1) {
    videoIndex += 1;
    playQueuedVideo();
  }
});

// break narrative copy onto a new line after each sentence, so a 2-3
// sentence intro reads as short stacked lines instead of one dense block
function renderSentences(el, text) {
  const sentences = text.split(/(?<=[.!?。])\s+/).filter(Boolean);
  el.replaceChildren();
  sentences.forEach((sentence, i) => {
    if (i > 0) el.appendChild(document.createElement("br"));
    el.appendChild(document.createTextNode(sentence));
  });
}

function showHome() {
  items.forEach((el) => el.classList.remove("is-active"));
  stageVideo.pause();
  videoQueue = [];
  stageImage.classList.remove("is-visible");
  stageVideo.classList.remove("is-visible");
  stageCaption.classList.remove("is-visible");
  narrativePanel.classList.remove("is-visible");
  heroFloat.classList.add("is-visible");
}

function showFeature(item) {
  items.forEach((el) => el.classList.remove("is-active"));
  item.classList.add("is-active");

  heroFloat.classList.remove("is-visible");
  stageCaption.classList.add("is-visible");

  const videoSrc = item.dataset.video;
  captionNum.textContent = item.dataset.id;
  captionName.textContent = item.querySelector(".name").textContent;

  // the longer narrative (name + intro paragraph above the video) only
  // appears once a feature actually supplies one — most features don't yet
  const narrative = (item.dataset.narrative || "").trim();
  if (narrative) {
    narrativeNum.textContent = item.dataset.id;
    narrativeName.textContent = item.querySelector(".name").textContent;
    renderSentences(narrativeText, narrative);
    narrativePanel.classList.add("is-visible");
  } else {
    narrativePanel.classList.remove("is-visible");
  }

  stageVideo.pause();

  if (videoSrc) {
    videoQueue = videoSrc.split(",").map((s) => s.trim()).filter(Boolean);
    videoIndex = 0;
    stageImage.classList.remove("is-visible");
    stageVideo.classList.add("is-visible");
    playQueuedVideo();
  } else {
    videoQueue = [];
    stageVideo.classList.remove("is-visible");
    stageImage.classList.add("is-visible");
    if (stageImage.getAttribute("src") !== DEFAULT_IMAGE) {
      stageImage.setAttribute("src", DEFAULT_IMAGE);
    }
  }
}

items.forEach((item) => {
  item.addEventListener("click", () => showFeature(item));
});

logoHome.addEventListener("click", showHome);

// default state: hero floating scene
showHome();

const aboutPanel = document.getElementById("aboutPanel");
document.querySelector('[data-panel="about"]').addEventListener("click", (e) => {
  e.preventDefault();
  aboutPanel.classList.toggle("is-visible");
});

// ---------- floating hero: each object drifts and tilts on its own ----------

const floatItems = Array.from(document.querySelectorAll(".float-item"));
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const rand = (min, max) => min + Math.random() * (max - min);
const sign = () => (Math.random() < 0.5 ? -1 : 1);

// per-item "personality": own idle drift rhythm + own reaction to the pointer,
// so no two objects ever move in lockstep or share a single global rule.
// each axis sums TWO sine waves of unrelated frequency — a slow wide sweep
// plus a faster small one — so the path never repeats on a visible cycle
// and never just wobbles in place near its starting spot.
function harmonic() {
  return {
    f1: rand(0.015, 0.045),
    p1: rand(0, Math.PI * 2),
    a1: 0, // set by caller
    f2: rand(0.05, 0.14),
    p2: rand(0, Math.PI * 2),
    a2: 0,
  };
}

const floatState = floatItems.map((wrap) => {
  const img = wrap.querySelector("img");

  // a per-item perspective (still varied, but kept well back) gives each
  // object its own vanishing point for a 3D read without fish-eyeing the
  // photo — too close a perspective warps the car shapes badly
  wrap.style.perspective = `${rand(1100, 1900).toFixed(0)}px`;

  const hx = harmonic();
  hx.a1 = rand(90, 190); // slow wide sweep across the stage
  hx.a2 = rand(20, 50); // faster small flutter on top

  const hy = harmonic();
  hy.a1 = rand(80, 170);
  hy.a2 = rand(18, 45);

  const hz = harmonic();
  hz.a1 = rand(60, 130);
  hz.a2 = rand(15, 35);

  const hrx = harmonic();
  hrx.a1 = rand(7, 15);
  hrx.a2 = rand(3, 8);

  const hry = harmonic();
  hry.a1 = rand(7, 15);
  hry.a2 = rand(3, 8);

  const hrz = harmonic();
  hrz.a1 = rand(8, 18);
  hrz.a2 = rand(3, 9);

  return {
    img,
    hx,
    hy,
    hz,
    hrx,
    hry,
    hrz,
    // mouse reaction: random strength AND random direction per item —
    // some objects chase the pointer, some pull away, some barely notice
    mouseX: rand(14, 40) * sign(),
    mouseY: rand(14, 40) * sign(),
    mouseZ: rand(20, 55) * sign(),
    mouseTiltX: rand(5, 13) * sign(),
    mouseTiltY: rand(5, 13) * sign(),
    mouseLag: rand(0.015, 0.07),
    curX: 0,
    curY: 0,
  };
});

function wander(h, t) {
  return Math.sin(t * h.f1 + h.p1) * h.a1 + Math.sin(t * h.f2 + h.p2) * h.a2;
}

let pointerX = 0;
let pointerY = 0;

heroFloat.addEventListener("pointermove", (e) => {
  const rect = heroFloat.getBoundingClientRect();
  pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
});

heroFloat.addEventListener("pointerleave", () => {
  pointerX = 0;
  pointerY = 0;
});

function tickFloat(tMs) {
  if (heroFloat.classList.contains("is-visible")) {
    const t = tMs * 0.001;

    floatState.forEach((s) => {
      // each item eases toward the live pointer at its own speed
      s.curX += (pointerX - s.curX) * s.mouseLag;
      s.curY += (pointerY - s.curY) * s.mouseLag;

      const driftX = wander(s.hx, t);
      const driftY = wander(s.hy, t);
      const driftZ = wander(s.hz, t);

      const tx = driftX + s.curX * s.mouseX;
      const ty = driftY + s.curY * s.mouseY;
      const tz = driftZ + (s.curX + s.curY) * s.mouseZ * 0.5;

      const rx = wander(s.hrx, t) - s.curY * s.mouseTiltX;
      const ry = wander(s.hry, t) + s.curX * s.mouseTiltY;
      const rz = wander(s.hrz, t);

      s.img.style.transform =
        `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, ${tz.toFixed(1)}px) ` +
        `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg)`;
    });
  }

  if (!reduceMotion) requestAnimationFrame(tickFloat);
}

if (reduceMotion) {
  floatState.forEach((s) => {
    s.img.style.transform = `rotateX(${(s.hrx.a1 * 0.4).toFixed(1)}deg) rotateY(${(s.hry.a1 * 0.4).toFixed(1)}deg)`;
  });
} else {
  requestAnimationFrame(tickFloat);
}
