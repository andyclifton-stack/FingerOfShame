"use strict";

// Word bank: add new categories or words here.
const WORD_BANK = {
  Animals: [
    "penguin", "elephant", "giraffe", "lion", "tiger", "zebra", "dolphin", "shark", "whale", "octopus",
    "rabbit", "hamster", "dog", "cat", "horse", "cow", "sheep", "goat", "chicken", "duck", "owl", "eagle",
    "snake", "crocodile", "turtle", "frog", "monkey", "panda", "koala", "kangaroo", "fox", "wolf", "bear",
    "polar bear", "butterfly", "bee", "spider", "crab", "lobster"
  ],
  Food: [
    "pizza", "burger", "chips", "pasta", "spaghetti", "curry", "rice", "noodles", "tacos", "sandwich",
    "cheese", "sausage", "bacon", "egg", "toast", "pancake", "cereal", "soup", "salad", "apple", "banana",
    "orange", "strawberry", "watermelon", "grapes", "carrot", "potato", "broccoli", "chocolate", "cake",
    "biscuit", "ice cream", "doughnut", "popcorn", "crisps"
  ],
  Drinks: [
    "water", "milk", "orange juice", "lemonade", "hot chocolate", "tea", "coffee", "milkshake", "smoothie",
    "cola", "squash", "tonic water"
  ],
  Places: [
    "school", "beach", "park", "cinema", "supermarket", "zoo", "farm", "castle", "museum", "library",
    "swimming pool", "airport", "train station", "restaurant", "hospital", "dentist", "kitchen", "bedroom",
    "garden", "garage", "playground", "football pitch", "church", "hotel", "campsite"
  ],
  Countries: [
    "England", "Scotland", "Wales", "Ireland", "France", "Spain", "Italy", "Germany", "Greece", "Australia",
    "New Zealand", "Canada", "United States", "Brazil", "Mexico", "Japan", "China", "India", "Egypt",
    "South Africa"
  ],
  Objects: [
    "chair", "table", "sofa", "lamp", "television", "phone", "laptop", "keyboard", "mouse", "book", "pencil",
    "pen", "ruler", "backpack", "clock", "mirror", "toothbrush", "towel", "spoon", "fork", "plate", "cup",
    "bottle", "scissors", "umbrella", "keys", "remote control", "headphones", "camera"
  ],
  Sports: [
    "football", "rugby", "tennis", "cricket", "darts", "swimming", "running", "cycling", "basketball",
    "netball", "golf", "boxing", "martial arts", "gymnastics", "skiing", "surfing", "hockey", "baseball"
  ],
  Darts: [
    "dartboard", "bullseye", "treble twenty", "double sixteen", "flight", "shaft", "barrel", "oche",
    "checkout", "one hundred and eighty", "bounce out", "robin hood"
  ],
  "Films and TV": [
    "Toy Story", "Frozen", "Moana", "Encanto", "The Lion King", "Shrek", "Finding Nemo", "Harry Potter",
    "Star Wars", "Marvel", "Spider-Man", "Batman", "Bluey", "The Simpsons", "Pokémon", "Minecraft", "Sonic",
    "Mario"
  ],
  School: [
    "teacher", "classroom", "homework", "pencil case", "whiteboard", "laptop", "Chromebook", "timetable",
    "playground", "assembly", "register", "lesson", "maths", "English", "science", "history", "geography",
    "art", "music", "PE"
  ],
  Vehicles: [
    "car", "bus", "train", "plane", "boat", "bicycle", "motorbike", "tractor", "fire engine", "ambulance",
    "police car", "helicopter", "scooter", "van", "taxi", "lorry"
  ],
  Weather: [
    "rain", "snow", "sunshine", "thunder", "lightning", "wind", "cloud", "rainbow", "fog", "storm", "frost",
    "hail"
  ],
  Fantasy: [
    "dragon", "wizard", "witch", "castle", "treasure", "sword", "shield", "potion", "spell", "unicorn",
    "giant", "goblin", "fairy", "mermaid", "pirate", "ghost", "vampire", "werewolf"
  ],
  Emotions: [
    "happy", "sad", "angry", "excited", "nervous", "surprised", "bored", "proud", "scared", "confused",
    "calm"
  ],
  Hobbies: [
    "gaming", "reading", "drawing", "painting", "cooking", "baking", "gardening", "dancing", "singing",
    "photography", "fishing", "camping", "walking", "collecting"
  ],
  Home: [
    "kitchen", "bathroom", "bedroom", "living room", "stairs", "door", "window", "fridge", "oven", "sink",
    "shower", "bed", "wardrobe", "cupboard", "washing machine", "radiator"
  ]
};

const SETTINGS_KEY = "imposter_settings_v1";
const MIN_PLAYERS = 3;
const MAX_PLAYERS = 10;

const app = document.getElementById("app");
const categoryNames = Object.keys(WORD_BANK);

const state = {
  screen: "setup",
  setup: loadSettings(),
  round: null,
  error: ""
};

render();

// Main render switch for the single-page app.
function render() {
  if (state.screen === "setup") {
    renderSetup();
    return;
  }
  if (state.screen === "pass") {
    renderPass();
    return;
  }
  if (state.screen === "card") {
    renderCard();
    return;
  }
  if (state.screen === "game") {
    renderGame();
    return;
  }
  if (state.screen === "preReveal") {
    renderPreReveal();
    return;
  }
  renderResult();
}

function renderSetup() {
  const setup = state.setup;
  app.innerHTML = `
    <div class="screen">
      <div>
        <h2>Set up the round</h2>
        <p class="lead">Choose players and a word source, then pass the phone around so each player can see their private card.</p>
      </div>

      <div class="setup-grid">
        <section class="field-group">
          <span class="label">Players</span>
          <div class="player-count">
            <button class="icon-button" type="button" data-action="count-down" aria-label="Remove player">-</button>
            <div class="count-display">${setup.playerCount}</div>
            <button class="icon-button" type="button" data-action="count-up" aria-label="Add player">+</button>
          </div>
        </section>

        <section class="field-group">
          <span class="label">Word choice</span>
          <div class="option-grid">
            ${modeButton("random", "Random category and word")}
            ${modeButton("category", "Pick category, random word")}
            ${modeButton("custom", "Custom category and word")}
          </div>
        </section>

        <section class="field-group wide">
          <span class="label">Names</span>
          <div class="name-list">
            ${Array.from({ length: setup.playerCount }, (_, index) => nameInput(index)).join("")}
          </div>
        </section>

        <section class="field-group wide" ${setup.mode === "random" ? "hidden" : ""}>
          ${setup.mode === "category" ? renderCategoryPicker() : renderCustomInputs()}
        </section>
      </div>

      ${state.error ? `<p class="error">${escapeHtml(state.error)}</p>` : ""}
      <button class="primary-button" type="button" data-action="start-round">Start round</button>
    </div>
  `;
  bindSetupEvents();
}

function modeButton(mode, label) {
  const activeClass = state.setup.mode === mode ? " is-active" : "";
  return `<button class="option-button${activeClass}" type="button" data-mode="${mode}">${escapeHtml(label)}</button>`;
}

function nameInput(index) {
  const value = state.setup.names[index] || defaultName(index);
  return `
    <label class="name-row">
      <span class="name-index">${index + 1}</span>
      <input class="input" data-name-index="${index}" value="${escapeHtml(value)}" maxlength="24" autocomplete="off" />
    </label>
  `;
}

function renderCategoryPicker() {
  const options = categoryNames
    .map((category) => `<option value="${escapeHtml(category)}"${category === state.setup.category ? " selected" : ""}>${escapeHtml(category)}</option>`)
    .join("");
  return `
    <span class="label">Category</span>
    <select class="select" id="category-select">${options}</select>
  `;
}

function renderCustomInputs() {
  return `
    <span class="label">Custom round</span>
    <input class="input" id="custom-category" value="${escapeHtml(state.setup.customCategory)}" maxlength="32" placeholder="Category" />
    <input class="input" id="custom-word" value="${escapeHtml(state.setup.customWord)}" maxlength="40" placeholder="Secret word" />
  `;
}

function bindSetupEvents() {
  app.querySelector("[data-action='count-down']").addEventListener("click", () => {
    updatePlayerCount(state.setup.playerCount - 1);
  });
  app.querySelector("[data-action='count-up']").addEventListener("click", () => {
    updatePlayerCount(state.setup.playerCount + 1);
  });
  app.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.setup.mode = button.dataset.mode;
      state.error = "";
      saveSettings();
      render();
    });
  });
  app.querySelectorAll("[data-name-index]").forEach((input) => {
    input.addEventListener("input", () => {
      state.setup.names[Number(input.dataset.nameIndex)] = input.value;
      saveSettings();
    });
  });
  const categorySelect = document.getElementById("category-select");
  if (categorySelect) {
    categorySelect.addEventListener("change", () => {
      state.setup.category = categorySelect.value;
      saveSettings();
    });
  }
  const customCategory = document.getElementById("custom-category");
  const customWord = document.getElementById("custom-word");
  if (customCategory && customWord) {
    customCategory.addEventListener("input", () => {
      state.setup.customCategory = customCategory.value;
      saveSettings();
    });
    customWord.addEventListener("input", () => {
      state.setup.customWord = customWord.value;
      saveSettings();
    });
  }
  app.querySelector("[data-action='start-round']").addEventListener("click", startRound);
}

function renderPass() {
  const round = state.round;
  const player = currentRevealPlayer();
  app.innerHTML = `
    <div class="screen">
      <div class="summary-row">
        <span class="pill">Card ${round.revealIndex + 1} of ${round.players.length}</span>
        <span class="pill">Category ready</span>
      </div>
      <section class="pass-card">
        <p class="secret-label">Pass the phone to</p>
        <p class="big-name">${escapeHtml(player.name)}</p>
        <button class="primary-button" type="button" data-action="show-card">Show my card</button>
      </section>
    </div>
  `;
  app.querySelector("[data-action='show-card']").addEventListener("click", () => {
    state.screen = "card";
    render();
  });
}

function renderCard() {
  const round = state.round;
  const player = currentRevealPlayer();
  const isImposter = player.index === round.imposterIndex;
  app.innerHTML = `
    <div class="screen">
      <section class="secret-card">
        <p class="secret-label">${escapeHtml(player.name)}</p>
        ${isImposter
          ? `<p class="secret-word imposter-word">You are the Imposter</p>`
          : `<p class="secret-label">Secret word</p><p class="secret-word">${escapeHtml(round.word)}</p>`}
        <p class="lead">Category: <strong>${escapeHtml(round.category)}</strong></p>
        <button class="primary-button" type="button" data-action="hide-card">Hide card</button>
      </section>
    </div>
  `;
  app.querySelector("[data-action='hide-card']").addEventListener("click", nextReveal);
}

function renderGame() {
  const round = state.round;
  app.innerHTML = `
    <div class="screen">
      <section class="category-banner">
        <p class="secret-label">Category</p>
        <strong>${escapeHtml(round.category)}</strong>
      </section>

      <section>
        <h3>Clue order</h3>
        <ol class="order-list">
          ${round.clueOrder.map((player) => `<li>${escapeHtml(player.name)}</li>`).join("")}
        </ol>
      </section>

      <section>
        <h3>How to play</h3>
        <ol class="steps-list">
          <li>Go round the table and give one clue each.</li>
          <li>Optional second clue round.</li>
          <li>Discuss and vote for the imposter.</li>
          <li>If caught, the imposter gets one guess at the word.</li>
        </ol>
      </section>

      ${renderRules()}

      <div class="two-actions">
        <button class="primary-button" type="button" data-action="start-vote">Start table vote</button>
        <button class="secondary-button" type="button" data-action="new-round">New round, same players</button>
      </div>
      <button class="quiet-button" type="button" data-action="new-game">New game</button>
    </div>
  `;
  bindRoundButtons();
  app.querySelector("[data-action='start-vote']").addEventListener("click", () => {
    state.screen = "preReveal";
    render();
  });
}

function renderRules() {
  const rules = [
    "Everyone knows the category.",
    "Everyone except the imposter knows the secret word.",
    "Clues should relate to the word but should not give it away too obviously.",
    "You cannot say the secret word.",
    "You cannot say a word that contains the secret word.",
    "You cannot say a word that rhymes with the secret word.",
    "You cannot give \"I don't know\" as a clue.",
    "The imposter wins if they avoid being caught.",
    "If caught, the imposter can still win by correctly guessing the secret word.",
    "The other players win if they catch the imposter and the imposter fails to guess the word."
  ];

  return `
    <section>
      <h3>Rules</h3>
      <ul class="rules-list">
        ${rules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("")}
      </ul>
    </section>
  `;
}

function renderPreReveal() {
  app.innerHTML = `
    <div class="screen">
      <div>
        <h2>Vote at the table</h2>
        <p class="lead">Put the phone face down, discuss, and vote out loud for who you think the imposter is.</p>
      </div>
      <section class="reveal-warning">
        <strong>Before revealing:</strong>
        <p>If the voted player is the imposter, say: "Imposter, guess the secret word before revealing it."</p>
      </section>
      <button class="primary-button danger-button" type="button" data-action="reveal-result">Reveal imposter and word</button>
      <button class="secondary-button" type="button" data-action="back-to-game">Back to game screen</button>
    </div>
  `;
  app.querySelector("[data-action='reveal-result']").addEventListener("click", () => {
    state.screen = "result";
    render();
  });
  app.querySelector("[data-action='back-to-game']").addEventListener("click", () => {
    state.screen = "game";
    render();
  });
}

function renderResult() {
  const round = state.round;
  const imposter = round.players[round.imposterIndex];
  app.innerHTML = `
    <div class="screen">
      <div>
        <h2>Result</h2>
        <p class="lead">The round is over. Decide the winner using the table vote and the imposter's final guess.</p>
      </div>
      <div class="result-grid">
        <section class="result-card">
          <p>Real imposter</p>
          <strong>${escapeHtml(imposter.name)}</strong>
        </section>
        <section class="result-card">
          <p>Secret word</p>
          <strong>${escapeHtml(round.word)}</strong>
        </section>
        <section class="result-card">
          <p>Category</p>
          <strong>${escapeHtml(round.category)}</strong>
        </section>
      </div>
      <div class="two-actions">
        <button class="primary-button" type="button" data-action="new-round">New round, same players</button>
        <button class="secondary-button" type="button" data-action="new-game">New game</button>
      </div>
    </div>
  `;
  bindRoundButtons();
}

// Round creation and reveal flow.
function startRound() {
  syncSetupFromDom();
  const players = getCleanPlayers();
  const choice = chooseWord();

  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    state.error = `Choose ${MIN_PLAYERS} to ${MAX_PLAYERS} players.`;
    render();
    return;
  }
  if (!choice) {
    state.error = state.setup.mode === "custom"
      ? "Enter a custom category and secret word."
      : "Choose a category with at least one word.";
    render();
    return;
  }

  saveSettings();
  state.error = "";
  state.round = {
    players,
    category: choice.category,
    word: choice.word,
    imposterIndex: randomInt(players.length),
    revealOrder: shuffle([...players]),
    clueOrder: shuffle([...players]),
    revealIndex: 0
  };
  state.screen = "pass";
  render();
}

function currentRevealPlayer() {
  return state.round.revealOrder[state.round.revealIndex];
}

function nextReveal() {
  state.round.revealIndex += 1;
  state.screen = state.round.revealIndex >= state.round.players.length ? "game" : "pass";
  render();
}

function bindRoundButtons() {
  const newRoundButton = app.querySelector("[data-action='new-round']");
  const newGameButton = app.querySelector("[data-action='new-game']");

  if (newRoundButton) {
    newRoundButton.addEventListener("click", startRound);
  }
  if (newGameButton) {
    newGameButton.addEventListener("click", () => {
      state.round = null;
      state.screen = "setup";
      state.error = "";
      render();
    });
  }
}

// Setup helpers.
function updatePlayerCount(nextCount) {
  state.setup.playerCount = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, nextCount));
  while (state.setup.names.length < state.setup.playerCount) {
    state.setup.names.push(defaultName(state.setup.names.length));
  }
  state.error = "";
  saveSettings();
  render();
}

function syncSetupFromDom() {
  app.querySelectorAll("[data-name-index]").forEach((input) => {
    state.setup.names[Number(input.dataset.nameIndex)] = input.value;
  });
  const categorySelect = document.getElementById("category-select");
  if (categorySelect) {
    state.setup.category = categorySelect.value;
  }
  const customCategory = document.getElementById("custom-category");
  const customWord = document.getElementById("custom-word");
  if (customCategory && customWord) {
    state.setup.customCategory = customCategory.value;
    state.setup.customWord = customWord.value;
  }
}

function getCleanPlayers() {
  return Array.from({ length: state.setup.playerCount }, (_, index) => ({
    index,
    name: cleanName(state.setup.names[index]) || defaultName(index)
  }));
}

function chooseWord() {
  if (state.setup.mode === "custom") {
    const category = state.setup.customCategory.trim();
    const word = state.setup.customWord.trim();
    return category && word ? { category, word } : null;
  }

  const category = state.setup.mode === "category"
    ? state.setup.category
    : pickRandom(categoryNames);
  const words = WORD_BANK[category] || [];

  if (words.length === 0) {
    return null;
  }
  return { category, word: pickRandom(words) };
}

function loadSettings() {
  const defaults = {
    playerCount: 4,
    names: ["Player 1", "Player 2", "Player 3", "Player 4"],
    mode: "random",
    category: categoryNames[0],
    customCategory: "",
    customWord: ""
  };

  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    const playerCount = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, Number(parsed.playerCount) || defaults.playerCount));
    const names = Array.from({ length: playerCount }, (_, index) => cleanName(parsed.names?.[index]) || defaultName(index));
    const mode = ["random", "category", "custom"].includes(parsed.mode) ? parsed.mode : defaults.mode;
    const category = categoryNames.includes(parsed.category) ? parsed.category : defaults.category;

    return {
      playerCount,
      names,
      mode,
      category,
      customCategory: typeof parsed.customCategory === "string" ? parsed.customCategory : "",
      customWord: typeof parsed.customWord === "string" ? parsed.customWord : ""
    };
  } catch (error) {
    return defaults;
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.setup));
  } catch (error) {
    // Storage is optional.
  }
}

function defaultName(index) {
  return `Player ${index + 1}`;
}

function cleanName(value) {
  return String(value || "").trim().slice(0, 24);
}

// Random helpers.
function pickRandom(items) {
  return items[randomInt(items.length)];
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function randomInt(max) {
  if (!Number.isInteger(max) || max <= 0) {
    throw new Error("randomInt requires a positive integer.");
  }

  if (window.crypto && window.crypto.getRandomValues) {
    const limit = Math.floor(0xffffffff / max) * max;
    const values = new Uint32Array(1);
    do {
      window.crypto.getRandomValues(values);
    } while (values[0] >= limit);
    return values[0] % max;
  }

  return Math.floor(Math.random() * max);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
