const sourceArticleUrl =
  'https://support.logi.com/hc/en-gb/articles/8358055253271-In-Game-Settings-for-Pro-Wheels';
const dataCapturedAt = '2026-03-03';

const games = [
  {
    game: 'Assetto Corsa',
    wheel: {
      compatibilityMode: 'PRO',
      ffbFilter: '8',
      dampener: '30',
      angle: '1080'
    },
    sources: [
      'https://www.logitech.com/assets/66231/game-settings.png',
      'https://www.logitech.com/assets/66231/2/game-settings.png'
    ],
    inGame: [
      { label: 'Gain', value: '100%' },
      { label: 'Gamma', value: '1.00' },
      { label: 'Filter', value: '0%' },
      { label: 'Minimum Force', value: '0%' },
      { label: 'Kerb Effects', value: '2%' },
      { label: 'Road Effects', value: '2%' },
      { label: 'ABS Effects', value: '2%' }
    ]
  },
  {
    game: 'Assetto Corsa Competizione',
    wheel: {
      compatibilityMode: 'PRO/G923',
      ffbFilter: '10',
      dampener: '30',
      angle: '1080'
    },
    sources: ['https://www.logitech.com/assets/66231/38/game-settings.png'],
    inGame: [
      { label: 'Gain', value: '85%' },
      { label: 'Minimum Force', value: '0%' },
      { label: 'Damper', value: '0%' },
      { label: 'Dynamic Damping', value: '100%' },
      { label: 'Road Effects', value: '0%' },
      { label: 'Frequency', value: '400 Hz' },
      { label: 'Steer Lock', value: '1080 deg' },
      { label: 'Steer Linearity', value: '1.00' },
      { label: 'Brake Gamma', value: '1.00' },
      { label: 'Gearshift Debouncing', value: '50 ms' },
      { label: 'Manufacturer Extras', value: 'Enabled' }
    ]
  },
  {
    game: 'Assetto Corsa Evo',
    wheel: {
      compatibilityMode: 'PRO',
      ffbFilter: '5',
      dampener: 'OFF',
      angle: '1080'
    },
    sources: ['https://www.logitech.com/content/dam/support/game-menu-settings/pro-wheels-update-images/ace.png'],
    inGame: [
      { label: 'Steering Lock', value: '1080 deg' },
      { label: 'FFB Gain', value: '100%' },
      { label: 'Dynamic Damping', value: '50%' },
      { label: 'Damper', value: '0%' },
      { label: 'Damper Gain', value: '30%' },
      { label: 'Audio-based FFB Effects', value: '100%' },
      { label: 'Curbs Effects', value: '30%' },
      { label: 'Road Effects', value: '20%' },
      { label: 'Tyre Slips Effects', value: '20%' },
      { label: 'ABS Effects', value: '10%' }
    ]
  },
  {
    game: 'Assetto Corsa Rally',
    wheel: {
      compatibilityMode: 'PRO',
      ffbFilter: '1',
      dampener: '20',
      angle: '1080'
    },
    sources: ['https://www.logitech.com/content/dam/support/game-menu-settings/pro-wheels-update-images/ac-rally.png'],
    inGame: [
      { label: 'Gain', value: '90' },
      { label: 'Minimum Force', value: '0' },
      { label: 'Damper', value: '40' },
      { label: 'Steering Lock', value: '1080' }
    ]
  },
  {
    game: 'BeamNG Drive',
    wheel: {
      compatibilityMode: 'PRO',
      ffbFilter: '9',
      dampener: '35',
      angle: '1080'
    },
    sources: [
      'https://www.logitech.com/assets/66231/8/game-settings.png',
      'https://www.logitech.com/assets/66231/51/game-settings.png'
    ],
    inGame: [
      { label: '1:1 Steering Angle', value: '1080' },
      { label: '1:1 Behaviour', value: 'Faster if needed' },
      { label: 'Inverted Axis', value: 'Off' },
      { label: 'Linearity', value: '1' },
      { label: 'Deadzone (rest)', value: '0' },
      { label: 'Deadzone (end)', value: '0' },
      { label: 'Force Feedback', value: 'Enabled' },
      { label: 'Force Feedback Inverted', value: 'Off' },
      { label: 'Strength', value: '230' },
      { label: 'Steering Lock Strength', value: '50%' },
      { label: 'Side Acceleration Strength', value: '0%' },
      { label: 'Reduce Strength While Parked', value: 'On' },
      { label: 'Use Logitech Features', value: 'On' },
      { label: 'Trueforce Sound Strength', value: '100%' },
      { label: 'Maximum', value: '150 Hz' },
      { label: 'Smoothing', value: '80' },
      { label: 'Automatic Secondary Smoothing', value: 'On' },
      { label: 'Secondary Smoothing', value: '390' },
      { label: 'Update Rate Limit', value: '1000 Hz' },
      { label: 'Update Type', value: 'Fast' },
      { label: 'Use Response Correction Curve', value: 'Off' }
    ]
  },
  {
    game: 'EA Sports WRC',
    wheel: {
      compatibilityMode: 'PRO',
      ffbFilter: '8',
      dampener: '15',
      angle: '1080'
    },
    sources: ['https://www.logitech.com/assets/66231/46/game-settings.png'],
    inGame: [
      { label: 'Self Aligning Torque', value: '70' },
      { label: 'Wheel Friction', value: '55' },
      { label: 'Tyre Friction', value: '53' },
      { label: 'Suspension', value: '50' },
      { label: 'Tyre Slip', value: '0' },
      { label: 'Engine', value: '0' },
      { label: 'Collision', value: '50' },
      { label: 'Soft Lock', value: '100' },
      { label: 'Steering Centre Force', value: 'Off' },
      { label: 'TRUEFORCE', value: 'On' },
      { label: 'TRUEFORCE Tyre Slip', value: '31' },
      { label: 'TRUEFORCE Engine', value: '5' },
      { label: 'TRUEFORCE Surface', value: '25' }
    ]
  },
  {
    game: 'Forza Horizon 5',
    wheel: {
      compatibilityMode: 'G923',
      ffbFilter: '8',
      dampener: '30',
      angle: '900'
    },
    sources: ['https://www.logitech.com/assets/66231/16/game-settings.png'],
    inGame: [
      { label: 'Vibration Scale', value: '1.0' },
      { label: 'Force Feedback Scale', value: '1.0' },
      { label: 'Center Spring Scale', value: '15' },
      { label: 'Wheel Damper Scale', value: '0.8' },
      { label: 'Mechanical Trail Scale', value: '0.8' },
      { label: 'Force Feedback Minimum Force', value: '1.0' },
      { label: 'Force Feedback Load Sensitivity', value: '1.3' },
      { label: 'Road Feel Scale', value: '1.0' },
      { label: 'Off-road Feel Scale', value: '0.5' },
      { label: 'Steering Sensitivity', value: '0.5' }
    ]
  },
  {
    game: 'Forza Motorsport (2023)',
    wheel: {
      compatibilityMode: 'PRO',
      ffbFilter: '8',
      dampener: '15',
      angle: '1080'
    },
    sources: ['https://www.logitech.com/assets/66231/52/game-settings.png'],
    inGame: [
      { label: 'Force Feedback Scale', value: '100' },
      { label: 'Steering Self Alignment', value: '80', uncertain: true },
      { label: 'Mechanical Trail Scale', value: '70' },
      { label: 'Pneumatic Trail Scale', value: '100' },
      { label: 'Road Feel Scale', value: '100' },
      { label: 'Load Sensitivity', value: '80', uncertain: true },
      { label: 'Wheel Damping Scale', value: '90' },
      { label: 'Center Spring Scale', value: '100' },
      { label: 'Dynamic Damper Behavior', value: '100' },
      { label: 'Steering Sensitivity', value: '80', uncertain: true },
      { label: 'Steering Linearity', value: '80', uncertain: true },
      { label: 'TRUEFORCE', value: 'On' },
      { label: 'TRUEFORCE Engine', value: '70' },
      { label: 'TRUEFORCE Tires', value: '50' },
      { label: 'TRUEFORCE Rumble Strip', value: '39', uncertain: true },
      { label: 'TRUEFORCE Collision', value: '90' }
    ]
  },
  {
    game: 'GRID Legends',
    wheel: {
      compatibilityMode: 'G923',
      ffbFilter: '13',
      dampener: '30',
      angle: '900'
    },
    sources: ['https://www.logitech.com/assets/66231/19/game-settings.png'],
    inGame: [
      { label: 'Vibration & Feedback', value: 'Enabled' },
      { label: 'Self Aligning Torque', value: '75' },
      { label: 'Wheel Friction', value: '100' },
      { label: 'Tyre Friction', value: '100' },
      { label: 'Suspension', value: '100' },
      { label: 'Collision', value: '100' },
      { label: 'Soft Lock Scale', value: '100' },
      { label: 'Centre Force Scale', value: 'Enabled' },
      { label: 'Centre Force', value: '70' }
    ]
  },
  {
    game: 'Le Mans Ultimate',
    wheel: {
      compatibilityMode: 'PRO',
      ffbFilter: '8',
      dampener: '20',
      angle: '1080'
    },
    sources: ['https://www.logitech.com/assets/66231/54/game-settings.png'],
    inGame: [
      { label: 'Force Feedback Effects', value: 'On' },
      { label: 'Invert Force Feedback', value: 'Off' },
      { label: 'Force Feedback Strength', value: '92%' },
      { label: 'Force Feedback Smoothing', value: '5%' },
      { label: 'Minimum Steering Torque', value: '0.0%' },
      { label: 'Collision Strength', value: '100%' },
      { label: 'Steering Torque Sensitivity', value: '100%' }
    ]
  },
  {
    game: 'Project Motor Racing',
    wheel: {
      compatibilityMode: 'PRO',
      ffbFilter: '10',
      dampener: '20',
      angle: '1080'
    },
    sources: [
      'https://www.logitech.com/content/dam/support/game-menu-settings/pro-wheels-update-images/pmr-car.png',
      'https://www.logitech.com/content/dam/support/game-menu-settings/pro-wheels-update-images/pmr-ffb.png'
    ],
    inGame: [
      { label: 'Tyre Pressure', value: '1.50 bar' },
      { label: 'Steering Rack Rate', value: '1.0' },
      { label: 'Steering Stiffness', value: '9' },
      { label: 'Steering Damping', value: '2', uncertain: true },
      { label: 'Force Feedback Strength', value: '1.20' },
      { label: 'Rack Feel', value: '1.00' },
      { label: 'Alignment Boost', value: '-0.00' },
      { label: 'Load Boost', value: '0.34' },
      { label: 'Friction', value: '0.000' },
      { label: 'EQ Low', value: '1.2' },
      { label: 'EQ Mid', value: '1.0' },
      { label: 'EQ High', value: '0.7' },
      { label: 'Global Force Feedback Gain', value: '100' },
      { label: 'Low Force Boost', value: '0', uncertain: true },
      { label: 'Brake Feel Boost', value: '30' },
      { label: 'Force Feedback Headroom', value: '150' },
      { label: 'Rumble Strength', value: '30' }
    ]
  },
  {
    game: 'RaceRoom Racing Experience',
    wheel: {
      compatibilityMode: 'PRO',
      ffbFilter: '12',
      dampener: '40',
      angle: 'Change as per car'
    },
    sources: [
      'https://www.logitech.com/assets/66231/29/game-settings.png',
      'https://www.logitech.com/assets/66231/30/game-settings.png'
    ],
    inGame: [
      { label: 'Toggle Controller Force Feedback', value: 'On' },
      { label: 'Invert Force Feedback', value: 'Off' },
      { label: 'FFB Strength', value: '100%' },
      { label: 'FFB Linearity', value: '100%' },
      { label: 'FFB Minimum Force', value: '0%' },
      { label: 'FFB Maximum Force', value: '100%' },
      { label: 'Stationary Friction', value: '50%' },
      { label: 'Engine Vibrations', value: '100%' },
      { label: 'Bump Amplification', value: '10%' },
      { label: 'Gearshift Effects', value: '100%' }
    ]
  },
  {
    game: 'The Crew Motorfest',
    wheel: {
      compatibilityMode: 'PRO',
      ffbFilter: '8',
      dampener: 'OFF',
      angle: '1080'
    },
    sources: ['https://www.logitech.com/assets/66231/42/game-settings.png'],
    inGame: [
      { label: 'Force Feedback', value: '100', uncertain: true },
      { label: 'Damper', value: '20' },
      { label: 'Vibration', value: '50' },
      { label: 'Gearbox', value: 'Sequential' },
      { label: 'Dynamic Range', value: 'On' },
      { label: 'Range', value: '900' },
      { label: 'Preset', value: 'Default' },
      { label: 'Linearity', value: '50' },
      { label: 'Dead Zone', value: '0' },
      { label: 'Highest', value: '100' }
    ]
  },
  {
    game: 'Wreckfest',
    wheel: {
      compatibilityMode: 'PRO',
      ffbFilter: '10',
      dampener: '20',
      angle: '900'
    },
    sources: ['https://www.logitech.com/assets/66231/35/game-settings.png'],
    inGame: [
      { label: 'Force Feedback', value: '5%', uncertain: true },
      { label: 'Steering Saturation', value: '100%', uncertain: true },
      { label: 'Brake Saturation', value: '100%', uncertain: true },
      { label: 'Clutch Saturation', value: '100%', uncertain: true },
      { label: 'Brake Dead Zone', value: '0%', uncertain: true },
      {
        label: 'Image Quality Note',
        value: 'Wreckfest source image is low-legibility; verify against source image.'
      }
    ]
  }
];

const STORAGE_KEYS = {
  favorites: 'prowheel_favorites_v1'
};

const gameIndexByName = new Map(games.map((entry, idx) => [entry.game, idx]));
const gameByName = new Map(games.map((entry) => [entry.game, entry]));
const gameBySlug = new Map(games.map((entry) => [slugify(entry.game), entry.game]));

const sourceLink = document.getElementById('source-link');
const captureDate = document.getElementById('capture-date');
const searchInput = document.getElementById('search-input');
const gameSelect = document.getElementById('game-select');
const favoriteBtn = document.getElementById('favorite-btn');
const favoritesWrap = document.getElementById('favorites-wrap');
const favoritesList = document.getElementById('favorites-list');
const viewRoot = document.getElementById('view-root');

sourceLink.href = sourceArticleUrl;
captureDate.textContent = ` | Data captured: ${dataCapturedAt}`;

const state = {
  query: '',
  selectedGame: getInitialSelectedGame(),
  favorites: new Set(loadJson(STORAGE_KEYS.favorites, []))
};

initialize();

function initialize() {
  if (!gameByName.has(state.selectedGame)) {
    state.selectedGame = games[0].game;
  }

  bindEvents();
  render();
}

function bindEvents() {
  searchInput.addEventListener('input', (event) => {
    state.query = event.target.value || '';
    ensureValidSelectionsAfterFilter();
    render();
  });

  gameSelect.addEventListener('change', (event) => {
    state.selectedGame = event.target.value;
    syncUrl();
    render();
  });

  favoriteBtn.addEventListener('click', () => {
    toggleFavorite(state.selectedGame);
    render();
  });

  favoritesList.addEventListener('click', (event) => {
    const target = event.target.closest('button[data-game]');
    if (!target) return;

    const game = target.dataset.game;
    if (!gameByName.has(game)) return;

    state.selectedGame = game;
    syncUrl();
    render();
  });
}

function render() {
  const filtered = getFilteredGames(state.query);

  renderSelectors(filtered);
  renderFavoriteState();
  renderFavoritesChips();
  renderPanels();
  syncUrl();
}

function renderSelectors(filtered) {
  gameSelect.innerHTML = '';

  if (!filtered.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No games found';
    gameSelect.appendChild(option);
    gameSelect.disabled = true;
  } else {
    gameSelect.disabled = false;
    filtered.forEach((entry) => {
      const option = document.createElement('option');
      const isFavorite = state.favorites.has(entry.game);
      option.value = entry.game;
      option.textContent = `${isFavorite ? '[Fav] ' : ''}${entry.game}`;
      option.selected = entry.game === state.selectedGame;
      gameSelect.appendChild(option);
    });
  }
}

function renderFavoriteState() {
  const isFav = state.favorites.has(state.selectedGame);
  favoriteBtn.textContent = isFav ? 'Favorited' : 'Favorite';
  favoriteBtn.classList.toggle('active', isFav);
}

function renderFavoritesChips() {
  favoritesList.innerHTML = '';
  const favGames = [...state.favorites]
    .filter((name) => gameByName.has(name))
    .sort((a, b) => gameIndexByName.get(a) - gameIndexByName.get(b));

  favoritesWrap.hidden = favGames.length === 0;

  favGames.forEach((game) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fav-chip';
    btn.dataset.game = game;
    btn.textContent = game;
    favoritesList.appendChild(btn);
  });
}

function renderPanels() {
  if (!gameByName.has(state.selectedGame)) {
    viewRoot.className = 'view single-layout';
    viewRoot.innerHTML = '<p class="empty">No game selected.</p>';
    return;
  }

  viewRoot.className = 'view single-layout';
  viewRoot.innerHTML = renderGamePanel(state.selectedGame, { title: 'Selected' });
}

function renderGamePanel(gameName, options = {}) {
  const game = gameByName.get(gameName);
  if (!game) return '';

  const wheelRows = [
    ['Compatibility Mode', game.wheel.compatibilityMode],
    ['FFB Filter', game.wheel.ffbFilter],
    ['Dampener', game.wheel.dampener],
    ['Angle', game.wheel.angle]
  ];

  const wheelHtml = wheelRows
    .map(
      ([label, value]) => `
        <div class="kv-item">
          <span class="kv-label">${escapeHtml(label)}</span>
          <span class="kv-value">${escapeHtml(value)}</span>
        </div>
      `
    )
    .join('');

  const inGameHtml = game.inGame
    .map((row) => {
      const valueClass = row.uncertain ? 'setting-value uncertain' : 'setting-value';
      const meter = getMeterPercent(row.value);

      const meterHtml = meter === null
        ? ''
        : `
            <div class="setting-meter"><span style="width: ${meter}%"></span></div>
            <div class="setting-meter-caption">${Math.round(meter)}/100</div>
          `;

      return `
        <div class="setting-row">
          <div class="setting-top">
            <span class="setting-label">${escapeHtml(row.label)}</span>
            <span class="${valueClass}">${escapeHtml(row.value)}${row.uncertain ? ' (OCR)' : ''}</span>
          </div>
          ${meterHtml}
        </div>
      `;
    })
    .join('');

  const sourceLinks = game.sources
    .map(
      (url, index) => `<a href="${url}" target="_blank" rel="noreferrer">Source ${index + 1}</a>`
    )
    .join(' | ');

  return `
    <article class="game-panel">
      <header class="panel-head">
        <h2>${escapeHtml(game.game)}</h2>
        <p>${escapeHtml(options.title || 'Selected')} game</p>
      </header>

      <div class="panel-body">
        <section class="block">
          <h3>Wheel Settings</h3>
          <div class="kv-grid">${wheelHtml}</div>
        </section>

        <section class="block">
          <h3>In-Game Settings</h3>
          <div class="settings-list">${inGameHtml}</div>
          <p class="source-links">${sourceLinks}</p>
        </section>
      </div>
    </article>
  `;
}

function getMeterPercent(value) {
  const raw = String(value).trim();
  if (!raw) return null;

  const firstNumber = raw.match(/-?\d+(?:\.\d+)?/);
  if (!firstNumber) return null;

  const numeric = Number(firstNumber[0]);
  if (!Number.isFinite(numeric) || numeric < 0) return null;

  if (raw.includes('%')) {
    if (numeric <= 100) return numeric;
    return null;
  }

  if (/^-?\d+$/.test(raw) && numeric <= 100) {
    return numeric;
  }

  if (/^-?\d+(?:\.\d+)?$/.test(raw) && numeric <= 1) {
    return Math.max(0, Math.min(100, numeric * 100));
  }

  return null;
}

function getFilteredGames(query) {
  const q = query.trim().toLowerCase();
  const list = q
    ? games.filter((entry) => entry.game.toLowerCase().includes(q))
    : [...games];

  return list.sort((a, b) => {
    const favDiff = Number(state.favorites.has(b.game)) - Number(state.favorites.has(a.game));
    if (favDiff !== 0) return favDiff;
    return gameIndexByName.get(a.game) - gameIndexByName.get(b.game);
  });
}

function ensureValidSelectionsAfterFilter() {
  const filtered = getFilteredGames(state.query);

  if (!filtered.some((entry) => entry.game === state.selectedGame)) {
    state.selectedGame = filtered[0]?.game ?? games[0].game;
  }
}

function toggleFavorite(gameName) {
  if (state.favorites.has(gameName)) {
    state.favorites.delete(gameName);
  } else {
    state.favorites.add(gameName);
  }

  saveJson(STORAGE_KEYS.favorites, [...state.favorites]);
}

function getInitialSelectedGame() {
  const params = new URLSearchParams(window.location.search);
  const fromSlug = params.get('game');
  if (fromSlug && gameBySlug.has(fromSlug)) {
    return gameBySlug.get(fromSlug);
  }
  return games[0].game;
}

function syncUrl() {
  const params = new URLSearchParams(window.location.search);
  params.set('game', slugify(state.selectedGame));
  params.delete('compare');

  const next = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, '', next);
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
