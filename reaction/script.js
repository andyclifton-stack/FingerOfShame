const storeKey = "reaction-rumble-board-v3";

const levelConfigs = [
  { level: 1, name: "Nap Patrol", rounds: 4, delayMin: 1200, delayMax: 2400, baseMult: 1.30, falseStart: 20 },
  { level: 2, name: "Snack Reflex", rounds: 5, delayMin: 1000, delayMax: 2100, baseMult: 1.18, falseStart: 25 },
  { level: 3, name: "Couch Commando", rounds: 6, delayMin: 850, delayMax: 1800, baseMult: 1.05, falseStart: 30 },
  { level: 4, name: "Caffeine Captain", rounds: 7, delayMin: 700, delayMax: 1500, baseMult: 0.95, falseStart: 36 },
  { level: 5, name: "Turbo Gremlin", rounds: 8, delayMin: 580, delayMax: 1250, baseMult: 0.87, falseStart: 43 },
  { level: 6, name: "Panic Ninja", rounds: 9, delayMin: 470, delayMax: 1050, baseMult: 0.80, falseStart: 51 },
  { level: 7, name: "Galactic Sweatlord", rounds: 10, delayMin: 360, delayMax: 900, baseMult: 0.74, falseStart: 60 },
];

const impactWords = ["POW", "BAM", "WHAP", "ZONK", "KAZAP", "KABLAM"];
const funnyFast = [
  "Reflexes of a caffeinated ninja.",
  "That target never saw Tuesday coming.",
  "Your thumb just broke the sound barrier.",
  "You are legally a lightning bolt now.",
];
const funnySlow = [
  "A majestic, thoughtful tap.",
  "Reflexes currently loading...",
  "That was a story-driven reaction.",
  "No rush. The target was immortal anyway.",
];
const failLines = [
  "You zapped the local mailbox. It is pressing charges.",
  "Premature kaboom. Classic rookie theater.",
  "Your blaster fired at pure anxiety.",
  "Friendly fire on absolutely nothing.",
];

const targets = Array.isArray(window.REACTION_TARGETS) ? window.REACTION_TARGETS : [];

const playerNameInput = document.getElementById("playerName");
const startBtn = document.getElementById("startBtn");
const muteBtn = document.getElementById("muteBtn");
const difficultySlider = document.getElementById("difficultySlider");
const difficultyName = document.getElementById("difficultyName");
const difficultyMeta = document.getElementById("difficultyMeta");

const target = document.getElementById("target");
const targetImage = document.getElementById("targetImage");
const targetName = document.getElementById("targetName");
const targetPrompt = document.getElementById("targetPrompt");

const message = document.getElementById("message");
const speechBubble = document.getElementById("speechBubble");
const powFx = document.getElementById("powFx");
const killBoardWrap = document.getElementById("killBoardWrap");
const killBoardEl = document.getElementById("killBoard");
const killBoardHint = document.getElementById("killBoardHint");

const roundValue = document.getElementById("roundValue");
const scoreValue = document.getElementById("scoreValue");
const bestValue = document.getElementById("bestValue");
const scoreboardEl = document.getElementById("scoreboard");
const resetBoardBtn = document.getElementById("resetBoard");

const state = {
  inGame: false,
  round: 0,
  score: 0,
  combo: 0,
  waitingForSpawn: false,
  spawnTime: 0,
  timer: null,
  player: "",
  bestReaction: null,
  level: Number(difficultySlider.value || 4),
  muteSetting: false,
  muteBonusActive: false,
  activeTarget: null,
  lastTargetId: null,
  lastDelay: null,
  kills: [],
};

const audio = {
  ctx: null,
  master: null,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getLevelConfig() {
  return levelConfigs[state.level - 1] || levelConfigs[3];
}

function initAudio() {
  if (!audio.ctx) {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return;
    audio.ctx = new AudioContextCtor();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = 0.6;
    audio.master.connect(audio.ctx.destination);
  }

  if (audio.ctx.state === "suspended") {
    audio.ctx.resume();
  }
}

function beep({ freq = 440, duration = 0.1, type = "square", gain = 0.04, slideTo = null }) {
  if (!audio.ctx || !audio.master || state.muteSetting) return;

  const osc = audio.ctx.createOscillator();
  const amp = audio.ctx.createGain();
  const now = audio.ctx.currentTime;

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
  }

  amp.gain.setValueAtTime(0.0001, now);
  amp.gain.exponentialRampToValueAtTime(gain, now + 0.01);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(amp).connect(audio.master);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function playReadySound() {
  beep({ freq: 510, duration: 0.1, type: "triangle", gain: 0.045 });
}

function playSpawnSound() {
  beep({ freq: 740, duration: 0.08, type: "square", gain: 0.06 });
  setTimeout(() => beep({ freq: 980, duration: 0.06, type: "square", gain: 0.05 }), 60);
}

function playHitSound() {
  beep({ freq: 290, slideTo: 120, duration: 0.16, type: "sawtooth", gain: 0.08 });
}

function playPenaltySound() {
  beep({ freq: 190, slideTo: 80, duration: 0.25, type: "triangle", gain: 0.07 });
}

function playGameOverSound() {
  beep({ freq: 392, duration: 0.08, type: "triangle", gain: 0.05 });
  setTimeout(() => beep({ freq: 329, duration: 0.08, type: "triangle", gain: 0.05 }), 90);
  setTimeout(() => beep({ freq: 262, duration: 0.14, type: "triangle", gain: 0.055 }), 180);
}

function playUiTick() {
  beep({ freq: 700, duration: 0.045, type: "sine", gain: 0.028 });
}

function playStartSound() {
  beep({ freq: 450, duration: 0.07, type: "triangle", gain: 0.045 });
  setTimeout(() => beep({ freq: 620, duration: 0.07, type: "triangle", gain: 0.045 }), 80);
  setTimeout(() => beep({ freq: 760, duration: 0.08, type: "triangle", gain: 0.05 }), 160);
}

function randomDelay() {
  const cfg = getLevelConfig();
  let delay = Math.floor(cfg.delayMin + Math.random() * (cfg.delayMax - cfg.delayMin + 1));
  const levelRatio = (state.level - 1) / 6; // 0..1
  const roll = Math.random();

  // All levels can occasionally be faster/slower than expected to avoid pattern play.
  if (roll < 0.2) {
    const quickBoost = 120 + Math.random() * (220 + 180 * levelRatio);
    delay -= quickBoost;
  } else if (roll > 0.82) {
    const slowBoost = 180 + Math.random() * (420 - 160 * levelRatio);
    delay += slowBoost;
  }

  // Anti-pattern nudge: avoid nearly identical intervals back-to-back.
  if (typeof state.lastDelay === "number" && Math.abs(delay - state.lastDelay) < 130) {
    delay += (Math.random() < 0.5 ? -1 : 1) * (140 + Math.random() * 170);
  }

  delay = clamp(Math.round(delay), 300, 2600);
  state.lastDelay = delay;
  return delay;
}

function setMessage(text) {
  message.textContent = text;
}

function triggerHaptics(pattern = 10) {
  if (typeof navigator.vibrate === "function") {
    navigator.vibrate(pattern);
  }
}

function showBubble(text) {
  speechBubble.textContent = text;
  speechBubble.classList.remove("hidden");
}

function hideBubble() {
  speechBubble.classList.add("hidden");
}

function showPow(text) {
  powFx.textContent = text;
  powFx.classList.remove("hidden");
  powFx.style.animation = "none";
  void powFx.offsetWidth;
  powFx.style.animation = "slam .35s ease-out";
  setTimeout(() => powFx.classList.add("hidden"), 360);
}

function setKillBoardHint(text) {
  killBoardHint.textContent = text;
}

function setKillBoardVisible(visible) {
  killBoardWrap.classList.toggle("board-collapsed", !visible);
}

function clearKillBoard() {
  state.kills = [];
  killBoardEl.innerHTML = "<span class=\"kill-board-empty\">No zaps yet. Start blasting.</span>";
  setKillBoardHint("Kills: 0 · Zapped targets appear here.");
  setKillBoardVisible(false);
}

function buildKillThumb(entry) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `kill-thumb ${state.inGame ? "locked" : "unlocked"}`;
  button.dataset.killId = entry.id;
  button.title = `${entry.name} · ${entry.ms} ms`;
  button.setAttribute("aria-label", `${entry.name} in round ${entry.round}, ${entry.ms} milliseconds`);

  if (entry.image) {
    const img = document.createElement("img");
    img.src = entry.image;
    img.alt = entry.name;
    img.addEventListener("error", () => {
      img.remove();
      const fallback = document.createElement("span");
      fallback.className = "kill-thumb-fallback";
      fallback.textContent = entry.name.slice(0, 1).toUpperCase();
      button.appendChild(fallback);
    });
    button.appendChild(img);
  } else {
    const fallback = document.createElement("span");
    fallback.className = "kill-thumb-fallback";
    fallback.textContent = entry.name.slice(0, 1).toUpperCase();
    button.appendChild(fallback);
  }

  return button;
}

function addKillToBoard(entry) {
  const empty = killBoardEl.querySelector(".kill-board-empty");
  if (empty) empty.remove();
  killBoardEl.appendChild(buildKillThumb(entry));
  setKillBoardHint(`Kills: ${state.kills.length} · ${state.inGame ? "Keep blasting." : "Tap thumbnails to preview."}`);
  setKillBoardVisible(true);
}

function setKillBoardUnlocked(unlocked) {
  const thumbs = killBoardEl.querySelectorAll(".kill-thumb");
  thumbs.forEach((thumb) => {
    thumb.classList.toggle("locked", !unlocked);
    thumb.classList.toggle("unlocked", unlocked);
  });
}

function recordKill(ms) {
  const targetInfo = state.activeTarget || { name: "Unknown Target", image: "" };
  const entry = {
    id: `k-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    name: targetInfo.name,
    image: targetInfo.image || "",
    round: state.round,
    ms,
  };
  state.kills.push(entry);
  addKillToBoard(entry);
}

function setTargetState(mode, options = {}) {
  const {
    name = "",
    prompt = "",
    image = "",
    showImage = false,
  } = options;

  target.className = `target ${mode}`;
  targetName.textContent = name;
  targetPrompt.textContent = prompt;

  if (showImage && image) {
    targetImage.src = image;
    targetImage.alt = name;
    targetImage.classList.remove("hidden");
    return;
  }

  targetImage.classList.add("hidden");
  targetImage.removeAttribute("src");
  targetImage.alt = "";
}

function pulseDifficultyName() {
  difficultyName.classList.remove("pulse-glow");
  void difficultyName.offsetWidth;
  difficultyName.classList.add("pulse-glow");
}

function updateSliderVisuals() {
  const min = Number(difficultySlider.min || 1);
  const max = Number(difficultySlider.max || 7);
  const value = Number(difficultySlider.value || state.level);
  const ratio = (value - min) / Math.max(1, max - min);
  const progress = `${Math.round(ratio * 100)}%`;
  const hue = Math.round(220 - ratio * 220);
  const color = `hsl(${hue} 95% 55%)`;

  difficultySlider.style.setProperty("--slider-progress", progress);
  difficultySlider.style.setProperty("--slider-color", color);
  difficultyName.style.color = color;
}

function updateDifficultyUI(animate = false) {
  const cfg = getLevelConfig();
  difficultyName.textContent = cfg.name;
  difficultyMeta.textContent = `${cfg.rounds} rounds · ${cfg.delayMin}-${cfg.delayMax}ms · base x${cfg.baseMult.toFixed(2)} · false start -${cfg.falseStart}`;
  updateSliderVisuals();
  if (animate) pulseDifficultyName();
  if (!state.inGame) playUiTick();
}

function updateMuteButton() {
  if (state.muteSetting) {
    muteBtn.textContent = "Muted (+5%)";
    muteBtn.classList.add("muted");
    muteBtn.setAttribute("aria-pressed", "true");
  } else {
    muteBtn.textContent = "Sound On";
    muteBtn.classList.remove("muted");
    muteBtn.setAttribute("aria-pressed", "false");
  }
}

function updateHud() {
  const cfg = getLevelConfig();
  roundValue.textContent = `${state.round} / ${cfg.rounds}`;
  scoreValue.textContent = String(state.score);
  bestValue.textContent = state.bestReaction ? `${state.bestReaction} ms` : "-";
}

function loadBoard() {
  try {
    return JSON.parse(localStorage.getItem(storeKey) || "[]");
  } catch {
    return [];
  }
}

function saveBoard(rows) {
  localStorage.setItem(storeKey, JSON.stringify(rows.slice(0, 14)));
}

function renderBoard() {
  const rows = loadBoard();
  scoreboardEl.innerHTML = "";

  if (!rows.length) {
    scoreboardEl.innerHTML = "<li><span>No scores yet.</span><span class=\"small\">Your comic legend starts here.</span></li>";
    return;
  }

  rows.forEach((r) => {
    const item = document.createElement("li");
    const mutePill = r.muted ? "<span class=\"mute-pill\">MUTED</span>" : "";
    const modePill = `<span class=\"mode-pill\">${escapeHtml(r.difficultyName)}</span>`;
    item.innerHTML = `<span><strong>${escapeHtml(r.name)}</strong> <span class=\"small\">(${r.best} ms best)</span>${modePill}${mutePill}</span><span>${r.score}</span>`;
    scoreboardEl.appendChild(item);
  });
}

function chooseTarget() {
  if (!targets.length) {
    return {
      id: "placeholder",
      name: "Missing Target Sprite",
      image: "",
      hitLines: ["Drop PNG files into images/targets/ and continue the chaos."],
    };
  }

  let candidate = pick(targets);
  if (targets.length > 1) {
    while (candidate.id === state.lastTargetId) {
      candidate = pick(targets);
    }
  }

  state.lastTargetId = candidate.id;
  return candidate;
}

function scoreReaction(ms) {
  const cfg = getLevelConfig();

  if (ms <= 420) {
    state.combo += 1;
  } else {
    state.combo = 0;
  }

  const raw = clamp(Math.round((950 - ms) / 8), -20, 150);
  const paceBonus = Math.max(0, 420 - ms) * (0.02 + state.level * 0.006);
  const comboBonus = state.combo * (3 + state.level);
  const muteMult = state.muteBonusActive ? 1.05 : 1;
  const points = Math.round((raw * cfg.baseMult + paceBonus + comboBonus) * muteMult);

  state.score += points;

  if (!state.bestReaction || ms < state.bestReaction) {
    state.bestReaction = ms;
  }

  const speedLine = ms < 260 ? pick(funnyFast) : pick(funnySlow);
  const targetLine = state.activeTarget?.hitLines?.length ? pick(state.activeTarget.hitLines) : "Solid hit.";

  setMessage(`${ms} ms. ${points >= 0 ? `+${points}` : points} points. ${speedLine}`);
  showBubble(targetLine);
  showPow(pick(impactWords));
  playHitSound();
  triggerHaptics([12, 20, 12]);
}

function finalizeGame() {
  const cfg = getLevelConfig();
  state.inGame = false;
  state.waitingForSpawn = false;
  clearTimeout(state.timer);

  const board = loadBoard();
  board.push({
    name: state.player,
    score: state.score,
    best: state.bestReaction || 999,
    difficultyLevel: state.level,
    difficultyName: cfg.name,
    muted: state.muteBonusActive,
    at: Date.now(),
  });

  board.sort((a, b) => b.score - a.score || a.best - b.best || b.at - a.at);
  saveBoard(board);
  renderBoard();

  setTargetState("done", {
    name: "GAME OVER",
    prompt: state.score > 0 ? "The crowd demands another round." : "Even heroes start somewhere.",
  });
  showBubble(state.score > 250 ? "Certified reflex gremlin." : "Comic origins unlocked.");
  setMessage(`Final score: ${state.score}. Difficulty: ${cfg.name}${state.muteBonusActive ? " · Muted bonus active" : ""}.`);
  setKillBoardHint(`Kills: ${state.kills.length} · Game over: tap any thumbnail to preview.`);
  setKillBoardUnlocked(true);

  startBtn.disabled = false;
  difficultySlider.disabled = false;
  muteBtn.disabled = false;
  playerNameInput.disabled = false;

  playGameOverSound();
}

function presentTarget() {
  state.activeTarget = chooseTarget();
  state.waitingForSpawn = false;
  state.spawnTime = performance.now();

  if (state.activeTarget.image) {
    setTargetState("go", {
      name: state.activeTarget.name,
      prompt: "TAP TO ZAP",
      image: state.activeTarget.image,
      showImage: true,
    });
  } else {
    setTargetState("go", {
      name: state.activeTarget.name,
      prompt: "Add target PNG files in images/targets/",
      showImage: false,
    });
  }

  setMessage(`Round ${state.round}: react fast.${state.muteBonusActive ? " Muted +5% scoring active." : ""}`);
  playSpawnSound();
}

function nextRound() {
  const cfg = getLevelConfig();
  if (state.round >= cfg.rounds) {
    finalizeGame();
    return;
  }

  state.round += 1;
  state.waitingForSpawn = true;
  hideBubble();
  updateHud();

  setTargetState("wait", {
    name: "SCAN FOR TROUBLE...",
    prompt: `Do not tap early. Penalty: -${cfg.falseStart}`,
  });
  setMessage(`${cfg.name} mode: target appears in ${cfg.delayMin}-${cfg.delayMax}ms.`);
  playReadySound();

  clearTimeout(state.timer);
  state.timer = setTimeout(presentTarget, randomDelay());
}

function startGame() {
  const name = playerNameInput.value.trim();
  if (!name) {
    setMessage("Name required. Superheroes need branding.");
    playerNameInput.focus();
    return;
  }

  initAudio();

  state.inGame = true;
  state.round = 0;
  state.score = 0;
  state.combo = 0;
  state.waitingForSpawn = false;
  state.spawnTime = 0;
  state.player = name;
  state.bestReaction = null;
  state.activeTarget = null;
  state.lastTargetId = null;
  state.lastDelay = null;
  state.muteBonusActive = state.muteSetting;

  startBtn.disabled = true;
  difficultySlider.disabled = true;
  muteBtn.disabled = true;
  playerNameInput.disabled = true;

  updateHud();
  const cfg = getLevelConfig();
  setTargetState("idle", {
    name: `${cfg.name} READY`,
    prompt: `${cfg.rounds} rounds. Keep your cool.`,
  });
  hideBubble();
  setMessage(`Game on, ${state.player}. First target incoming...`);
  clearKillBoard();
  setKillBoardHint("Kills: 0 · Targets you zap appear here. Preview unlocks at game over.");
  target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  playStartSound();

  clearTimeout(state.timer);
  state.timer = setTimeout(nextRound, 420);
}

startBtn.addEventListener("click", startGame);

difficultySlider.addEventListener("input", () => {
  if (state.inGame) return;
  state.level = Number(difficultySlider.value);
  updateDifficultyUI(true);
  updateHud();
});

muteBtn.addEventListener("click", () => {
  if (state.inGame) return;
  initAudio();
  state.muteSetting = !state.muteSetting;
  updateMuteButton();
  setMessage(state.muteSetting ? "Muted mode selected: +5% scoring bonus." : "Sound is active. No mute bonus.");
  if (!state.muteSetting) playUiTick();
});

targetImage.addEventListener("error", () => {
  targetImage.classList.add("hidden");
  targetPrompt.textContent = "Sprite missing. Add PNG to images/targets/.";
});

target.addEventListener("click", () => {
  if (!state.inGame) return;

  if (state.waitingForSpawn) {
    const cfg = getLevelConfig();
    clearTimeout(state.timer);
    state.score -= cfg.falseStart;
    state.combo = 0;

    setTargetState("bad", {
      name: "TOO EARLY!",
      prompt: "You zapped a mailbox. The mailbox is furious.",
    });
    showBubble(pick(failLines));
    showPow("WHIFF");
    setMessage(`False start: -${cfg.falseStart} points. Negative score is allowed.`);
    playPenaltySound();
    triggerHaptics(30);
    updateHud();

    state.timer = setTimeout(nextRound, 860);
    return;
  }

  if (target.classList.contains("go")) {
    const ms = Math.round(performance.now() - state.spawnTime);
    scoreReaction(ms);
    recordKill(ms);
    updateHud();

    setTargetState("done", {
      name: `${ms} ms`,
      prompt: "Target zapped.",
    });

    const cooldown = Math.max(380, 880 - state.level * 55);
    state.timer = setTimeout(nextRound, cooldown);
  }
});

document.addEventListener("keydown", (event) => {
  if (!state.inGame) return;
  if (event.code !== "Space") return;
  event.preventDefault();
  target.click();
});

target.addEventListener("touchstart", () => {
  if (!state.inGame) return;
  triggerHaptics(8);
}, { passive: true });

killBoardEl.addEventListener("click", (event) => {
  const thumb = event.target.closest(".kill-thumb");
  if (!thumb) return;
  if (state.inGame) return;
  if (thumb.classList.contains("previewing")) return;

  thumb.classList.add("previewing");
  playUiTick();
  triggerHaptics([10, 22, 10]);
  setTimeout(() => thumb.classList.remove("previewing"), 2000);
});

resetBoardBtn.addEventListener("click", () => {
  localStorage.removeItem(storeKey);
  renderBoard();
});

updateDifficultyUI();
updateMuteButton();
renderBoard();
updateHud();
clearKillBoard();
