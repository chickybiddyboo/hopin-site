const items = Array.from(document.querySelectorAll(".feature-item"));
const stageImage = document.getElementById("stageImage");
const stageVideo = document.getElementById("stageVideo");
const heroFloat = document.getElementById("heroFloat");
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
  narrativePanel.classList.remove("is-visible");
  heroFloat.classList.add("is-visible");
}

function showFeature(item) {
  items.forEach((el) => el.classList.remove("is-active"));
  item.classList.add("is-active");

  heroFloat.classList.remove("is-visible");

  const videoSrc = item.dataset.video;

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

// "Key Features" label collapses/expands the feature list below it
const featureListToggle = document.getElementById("featureListToggle");
const featureListAside = document.querySelector(".feature-list");
featureListToggle.addEventListener("click", () => {
  const collapsed = featureListAside.classList.toggle("is-collapsed");
  featureListToggle.setAttribute("aria-expanded", String(!collapsed));
});

// "Function" nav button: plays a standalone video in the stage, same mechanics
// as a feature's video but with no feature item, caption, or narrative attached
const functionBtn = document.getElementById("functionBtn");
const FUNCTION_VIDEO = "assets/video/function.mp4";

function playFunctionVideo() {
  items.forEach((el) => el.classList.remove("is-active"));
  heroFloat.classList.remove("is-visible");
  narrativePanel.classList.remove("is-visible");
  stageImage.classList.remove("is-visible");
  stageVideo.pause();
  videoQueue = [FUNCTION_VIDEO];
  videoIndex = 0;
  stageVideo.classList.add("is-visible");
  playQueuedVideo();
}

functionBtn.addEventListener("click", playFunctionVideo);

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
  if (heroFloat.classList.contains("is-visible") && !cameraModeOn) {
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

// ---------- camera mode: the stage's white background becomes a live feed, and the
// floating cars become draggable, so the whole scene composes into one shot ----------

const stage = document.querySelector(".stage");
const stageCamera = document.getElementById("stageCamera");
const heroLogo = document.getElementById("heroLogo");
const exitCameraBtn = document.getElementById("exitCameraBtn");
const cameraControls = document.getElementById("cameraControls");
const shutterBtn = document.getElementById("shutterBtn");
const captureActions = document.getElementById("captureActions");
const retakeBtn = document.getElementById("retakeBtn");
const downloadCapture = document.getElementById("downloadCapture");
const capturePreview = document.getElementById("capturePreview");
const captureCanvas = document.getElementById("captureCanvas");
const cameraError = document.getElementById("cameraError");

let cameraStream = null;
let cameraModeOn = false;
let dragTarget = null;
let dragStartX = 0;
let dragStartY = 0;
let dragBaseX = 0;
let dragBaseY = 0;
const dragOffsets = new Map();

function setFloatTransform(wrap) {
  const img = wrap.querySelector("img");
  const off = dragOffsets.get(wrap) || { x: 0, y: 0 };
  img.style.transform = `translate(${off.x}px, ${off.y}px) rotateZ(var(--r))`;
}

async function enableCameraMode() {
  if (cameraModeOn) return;
  cameraError.classList.remove("is-visible");
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
  } catch (err) {
    cameraError.textContent = "카메라를 사용할 수 없어요. 브라우저의 카메라 권한을 확인해 주세요.";
    cameraError.classList.add("is-visible");
    return;
  }
  stageCamera.srcObject = cameraStream;
  stageCamera.classList.add("is-visible");
  cameraModeOn = true;
  heroFloat.classList.add("camera-active");
  exitCameraBtn.classList.add("is-visible");
  cameraControls.classList.add("is-visible");

  // freeze the ambient drift and drop every car to a flat, precisely draggable
  // pose (position + its base rotation only) so the composition holds still
  dragOffsets.clear();
  floatItems.forEach((wrap) => setFloatTransform(wrap));
}

function disableCameraMode() {
  if (!cameraModeOn) return;
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  stageCamera.classList.remove("is-visible");
  cameraModeOn = false;
  heroFloat.classList.remove("camera-active");
  exitCameraBtn.classList.remove("is-visible");
  cameraControls.classList.remove("is-visible");
  captureActions.classList.remove("is-visible");
  capturePreview.classList.remove("is-visible");
  cameraError.classList.remove("is-visible");
  dragOffsets.clear();
  floatItems.forEach((wrap) => {
    wrap.querySelector("img").style.transform = "";
  });
}

function capturePhoto() {
  const stageRect = stage.getBoundingClientRect();
  const w = Math.round(stageRect.width);
  const h = Math.round(stageRect.height);
  captureCanvas.width = w;
  captureCanvas.height = h;
  const ctx = captureCanvas.getContext("2d");

  // background: the mirrored camera frame, cover-fit into the stage box exactly
  // like the live <video> does, so the capture matches what was on screen
  const vw = stageCamera.videoWidth;
  const vh = stageCamera.videoHeight;
  if (vw && vh) {
    const stageRatio = w / h;
    const videoRatio = vw / vh;
    let sx;
    let sy;
    let sw;
    let sh;
    if (videoRatio > stageRatio) {
      sh = vh;
      sw = vh * stageRatio;
      sx = (vw - sw) / 2;
      sy = 0;
    } else {
      sw = vw;
      sh = vw / stageRatio;
      sx = 0;
      sy = (vh - sh) / 2;
    }
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(stageCamera, sx, sy, sw, sh, 0, 0, w, h);
    ctx.restore();
  } else {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
  }

  // then each car, at its exact current on-screen position and rotation
  floatItems.forEach((wrap) => {
    const img = wrap.querySelector("img");
    const rect = img.getBoundingClientRect();
    const cx = rect.left + rect.width / 2 - stageRect.left;
    const cy = rect.top + rect.height / 2 - stageRect.top;
    const deg = parseFloat(getComputedStyle(wrap).getPropertyValue("--r")) || 0;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.drawImage(img, -rect.width / 2, -rect.height / 2, rect.width, rect.height);
    ctx.restore();
  });

  const dataUrl = captureCanvas.toDataURL("image/png");
  capturePreview.src = dataUrl;
  downloadCapture.href = dataUrl;
  downloadCapture.download = `hopin-shot-${Date.now()}.png`;
  capturePreview.classList.add("is-visible");
  cameraControls.classList.remove("is-visible");
  captureActions.classList.add("is-visible");
}

function retakePhoto() {
  capturePreview.classList.remove("is-visible");
  captureActions.classList.remove("is-visible");
  cameraControls.classList.add("is-visible");
}

heroLogo.addEventListener("click", enableCameraMode);
heroLogo.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    enableCameraMode();
  }
});
exitCameraBtn.addEventListener("click", disableCameraMode);
shutterBtn.addEventListener("click", capturePhoto);
retakeBtn.addEventListener("click", retakePhoto);

// cars are only draggable while composing a shot in camera mode
floatItems.forEach((wrap) => {
  wrap.addEventListener("pointerdown", (e) => {
    if (!cameraModeOn) return;
    dragTarget = wrap;
    wrap.setPointerCapture(e.pointerId);
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const cur = dragOffsets.get(wrap) || { x: 0, y: 0 };
    dragBaseX = cur.x;
    dragBaseY = cur.y;
  });
  wrap.addEventListener("pointermove", (e) => {
    if (dragTarget !== wrap) return;
    const x = dragBaseX + (e.clientX - dragStartX);
    const y = dragBaseY + (e.clientY - dragStartY);
    dragOffsets.set(wrap, { x, y });
    setFloatTransform(wrap);
  });
  ["pointerup", "pointercancel"].forEach((evt) => {
    wrap.addEventListener(evt, () => {
      if (dragTarget === wrap) dragTarget = null;
    });
  });
});
