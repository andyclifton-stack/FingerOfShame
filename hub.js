const SHARE_URL = "https://fingergame.co.uk/";
const RECENT_KEY = "finger_hub_recent_v1";
const PREF_KEY = "finger_hub_preferences_v1";

// Add future games/apps here; the grid renders from this list.
const HUB_ITEMS = [
    {
        id: "finger",
        title: "Finger of Shame",
        description: "The ultimate party court. Accuse friends, cast votes, and face the wheel.",
        type: "game",
        href: "finger-index.html",
        short: "FS",
        accent: "crimson",
        featured: true,
        status: "new",
        tags: ["party", "votes", "friends"],
        cta: "Play Now"
    },
    {
        id: "diceduel",
        title: "Dice Duel",
        description: "A 1v1 strategy battle. Roll, reposition, and outplay your opponent.",
        type: "game",
        href: "diceduel-index.html",
        short: "DD",
        accent: "azure",
        featured: true,
        tags: ["1v1", "strategy", "cards"],
        cta: "Play Now"
    },
    {
        id: "poker",
        title: "Poker Elite",
        description: "Track buy-ins, live pots, and weekly payouts for your table.",
        type: "app",
        href: "PokerScore-index.html",
        short: "PE",
        accent: "amber",
        tags: ["tracking", "poker", "stats"],
        cta: "Launch App"
    },
    {
        id: "couples",
        title: "Couples Cards",
        description: "Strategy, romance, and chores with card-based actions.",
        type: "game",
        href: "couples-index.html",
        short: "CC",
        accent: "rose",
        locked: true,
        unlockCode: "1234",
        tags: ["cards", "couples", "private"],
        cta: "Unlock"
    },
    {
        id: "fitness",
        title: "AC Fitness",
        description: "Track workouts, manage plans, and keep streaks alive.",
        type: "app",
        href: "fitness-index.html",
        short: "AF",
        accent: "emerald",
        locked: true,
        unlockCode: "1234",
        tags: ["workouts", "planner", "private"],
        cta: "Unlock"
    },
    {
        id: "wheelspin",
        title: "Wheel Spin",
        description: "A customizable prize wheel with smooth physics and social sharing.",
        type: "game",
        href: "/WheelSpin/",
        localHref: "http://localhost:5173/",
        short: "WS",
        accent: "teal",
        status: "beta",
        tags: ["wheel", "party", "custom"],
        cta: "Play Now"
    },
    {
        id: "prowheel",
        title: "PRO Wheel Settings",
        description: "Quick lookup for Logitech PRO wheel and in-game settings by title.",
        type: "app",
        href: "/pro-wheel-settings/",
        short: "PW",
        accent: "azure",
        status: "new",
        tags: ["racing", "logitech", "settings"],
        cta: "Open"
    },
    {
        id: "gameupdates",
        title: "Game Updates",
        description: "Track confirmed news, patches, and launch updates for the racing and action games on watch.",
        type: "app",
        href: "/GameUpdates/",
        short: "GU",
        accent: "teal",
        status: "new",
        featured: true,
        tags: ["news", "updates", "gaming"],
        cta: "Open"
    },
    {
        id: "alibucks",
        title: "AliBucks",
        description: "The official Alice Starbucks app.",
        type: "app",
        href: "/AliBucks/",
        localHref: "http://localhost:8080/",
        logo: "alibucks-logo.png",
        short: "AB",
        accent: "slate",
        tags: ["rewards", "cafe", "alice"],
        cta: "Launch App"
    },
    {
        id: "magictrick",
        title: "Magic Trick",
        description: "A digital mind-reading illusion with polished stage effects.",
        type: "game",
        href: "/ShowMeAMagicTrick/",
        localHref: "http://localhost:5174/",
        short: "MT",
        accent: "violet",
        status: "beta",
        tags: ["illusion", "show", "interactive"],
        cta: "Play Now"
    },
    {
        id: "birthday",
        title: "Alice Birthday",
        description: "Music, confetti, and voting for Alice's birthday celebration.",
        type: "app",
        href: "/AliceBirthday/",
        localHref: "http://localhost:5173/",
        short: "BD",
        accent: "coral",
        tags: ["music", "celebration", "voting"],
        cta: "Open"
    },
    {
        id: "wouldyourather",
        title: "Would You Rather",
        description: "Fast social debate rounds that reveal who thinks alike.",
        type: "game",
        href: "/WouldYouRather/",
        localHref: "http://localhost:5173/WouldYouRather/",
        short: "WR",
        accent: "azure",
        featured: true,
        tags: ["debate", "social", "party"],
        cta: "Play Now"
    },
    {
        id: "tamagotchi",
        title: "Tamagotchi",
        description: "Care for a real-time virtual pet with themes, growth, parent tools, and live sharing.",
        type: "game",
        href: "/Tamagotchi/",
        localHref: "http://localhost:5175/",
        short: "TG",
        accent: "rose",
        status: "new",
        featured: true,
        tags: ["virtual pet", "kids", "realtime"],
        cta: "Play Now"
    },
    {
        id: "spybunnies",
        title: "Spy Bunnies",
        description: "Burrow Command mission base where Spy Bunnies crack clues, stay together, and unlock treasure.",
        type: "game",
        href: "/spybunnies/",
        localHref: "https://fingergame.co.uk/spybunnies/",
        short: "SB",
        accent: "emerald",
        status: "new",
        featured: true,
        tags: ["bunnies", "missions", "treasure"],
        cta: "Play Now"
    },
    {
        id: "reactionrumble",
        title: "Reaction Rumble",
        description: "Comic-style reaction test madness with penalties, sound modes, and a live kill board.",
        type: "game",
        href: "/reaction/",
        short: "RR",
        accent: "amber",
        status: "new",
        featured: true,
        tags: ["reaction", "arcade", "speed"],
        cta: "Play Now"
    },
    {
        id: "roasttimer",
        title: "Roast Dinner Timer",
        description: "Plan every roast task backwards from serving time with live kitchen recovery tools.",
        type: "app",
        href: "/Roast/",
        short: "RT",
        accent: "amber",
        status: "new",
        featured: true,
        tags: ["kitchen", "timer", "planning"],
        cta: "Open"
    },
];

const itemById = new Map(HUB_ITEMS.map((item) => [item.id, item]));
const isLocalHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const recentMap = loadRecent();
const state = {
    filter: "all",
    query: "",
    sort: "featured"
};

const el = {
    featuredPanel: document.getElementById("featured-panel"),
    searchInput: document.getElementById("search-input"),
    filterButtons: Array.from(document.querySelectorAll(".filter-btn")),
    sortSelect: document.getElementById("sort-select"),
    grid: document.getElementById("hub-grid"),
    emptyState: document.getElementById("empty-state"),
    visibleCount: document.getElementById("visible-count"),
    gameCount: document.getElementById("game-count"),
    appCount: document.getElementById("app-count"),
    installBtn: document.getElementById("install-btn"),
    shareBtn: document.getElementById("share-btn"),
    whatsappBtn: document.getElementById("whatsapp-btn"),
    facebookBtn: document.getElementById("facebook-btn"),
    year: document.getElementById("year")
};

hydratePreferences();
bindEvents();
render();
el.year.textContent = String(new Date().getFullYear());

let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    el.installBtn.hidden = false;
});

function bindEvents() {
    el.searchInput.addEventListener("input", (event) => {
        state.query = event.target.value.trim().toLowerCase();
        render();
    });

    el.filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (state.filter === button.dataset.filter) {
                return;
            }
            state.filter = button.dataset.filter;
            savePreferences();
            setActiveFilterButton();
            render();
        });
    });

    el.sortSelect.addEventListener("change", (event) => {
        state.sort = event.target.value;
        savePreferences();
        render();
    });

    el.grid.addEventListener("click", (event) => {
        const card = event.target.closest(".hub-card");
        if (!card) {
            return;
        }
        activateCard(card.dataset.id);
    });

    el.grid.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
            return;
        }
        const card = event.target.closest(".hub-card");
        if (!card) {
            return;
        }
        event.preventDefault();
        activateCard(card.dataset.id);
    });

    el.installBtn.addEventListener("click", async () => {
        if (!deferredPrompt) {
            return;
        }
        deferredPrompt.prompt();
        try {
            await deferredPrompt.userChoice;
        } catch (error) {
            // ignored
        }
        deferredPrompt = null;
        el.installBtn.hidden = true;
    });

    el.shareBtn.addEventListener("click", shareHub);
    el.whatsappBtn.addEventListener("click", shareWhatsApp);
    el.facebookBtn.addEventListener("click", shareFacebook);
}

function render() {
    const visibleItems = getVisibleItems();
    el.grid.innerHTML = "";

    visibleItems.forEach((item, index) => {
        el.grid.appendChild(buildCard(item, index));
    });

    el.emptyState.hidden = visibleItems.length > 0;
    renderFeatured(visibleItems);
    renderStats(visibleItems);
}

function buildCard(item, index) {
    const card = document.createElement("article");
    card.className = item.locked ? "hub-card is-locked" : "hub-card";
    card.dataset.id = item.id;
    card.dataset.type = item.type;
    card.dataset.accent = item.accent || "slate";
    card.style.setProperty("--stagger", `${Math.min(index, 18) * 45}ms`);
    card.tabIndex = 0;
    card.setAttribute("role", item.locked ? "button" : "link");
    card.setAttribute("aria-label", `${item.title}. ${item.description}`);

    const avatar = item.logo
        ? `<div class="avatar has-image"><img src="${escapeHtml(item.logo)}" alt="${escapeHtml(item.title)} logo"></div>`
        : `<div class="avatar"><span>${escapeHtml(item.short || "FG")}</span></div>`;

    const badges = getBadgeData(item)
        .map((badge) => `<span class="badge ${badge.className}">${escapeHtml(badge.label)}</span>`)
        .join("");

    const tags = (item.tags || [])
        .slice(0, 3)
        .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
        .join("");

    card.innerHTML = `
        <div class="card-head">
            ${avatar}
            <div class="badges">${badges}</div>
        </div>
        <h2 class="card-title">${escapeHtml(item.title)}</h2>
        <p class="card-description">${escapeHtml(item.description)}</p>
        <div class="tags">${tags}</div>
        <div class="card-action">${escapeHtml(resolveActionLabel(item))}</div>
    `;

    return card;
}

function renderFeatured(items) {
    if (items.length === 0) {
        el.featuredPanel.innerHTML = `
            <p class="featured-label">Featured</p>
            <h2 class="featured-title">No matching entries</h2>
            <p class="featured-description">Update filters to bring your featured launch card back.</p>
        `;
        return;
    }

    const featuredItem =
        items.find((item) => item.featured && !item.locked) ||
        items.find((item) => !item.locked) ||
        items[0];
    const lastPlayed = getRelativePlayedTime(featuredItem.id);
    const itemTypeLabel = featuredItem.type === "app" ? "App" : "Game";
    const launchLabel = featuredItem.locked ? "Unlock" : resolveActionLabel(featuredItem);

    el.featuredPanel.innerHTML = `
        <div class="featured-head">
            <p class="featured-label">Featured</p>
            <span class="featured-chip">${itemTypeLabel} - ${lastPlayed}</span>
        </div>
        <h2 class="featured-title">${escapeHtml(featuredItem.title)}</h2>
        <p class="featured-description">${escapeHtml(featuredItem.description)}</p>
        <div class="featured-cta">
            <button class="btn btn-install" type="button" data-featured-id="${escapeHtml(featuredItem.id)}">${escapeHtml(launchLabel)}</button>
        </div>
    `;

    const launchButton = el.featuredPanel.querySelector("[data-featured-id]");
    if (launchButton) {
        launchButton.addEventListener("click", () => {
            activateCard(featuredItem.id);
        });
    }
}

function renderStats(visibleItems) {
    const visibleGames = visibleItems.filter((item) => item.type === "game").length;
    const visibleApps = visibleItems.filter((item) => item.type === "app").length;

    el.visibleCount.textContent = String(visibleItems.length);
    el.gameCount.textContent = String(visibleGames);
    el.appCount.textContent = String(visibleApps);
}

function getVisibleItems() {
    const filtered = HUB_ITEMS.filter((item) => {
        if (state.filter === "game" && item.type !== "game") {
            return false;
        }
        if (state.filter === "app" && item.type !== "app") {
            return false;
        }
        if (state.filter === "locked" && !item.locked) {
            return false;
        }
        if (!state.query) {
            return true;
        }

        const haystack = `${item.title} ${item.description} ${(item.tags || []).join(" ")}`.toLowerCase();
        return haystack.includes(state.query);
    });

    if (state.sort === "az") {
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    if (state.sort === "recent") {
        return filtered.sort((a, b) => {
            const playedDelta = getLastPlayed(b.id) - getLastPlayed(a.id);
            if (playedDelta !== 0) {
                return playedDelta;
            }
            return a.title.localeCompare(b.title);
        });
    }

    return filtered.sort((a, b) => {
        const featuredDelta = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
        if (featuredDelta !== 0) {
            return featuredDelta;
        }
        const lockedDelta = Number(Boolean(a.locked)) - Number(Boolean(b.locked));
        if (lockedDelta !== 0) {
            return lockedDelta;
        }
        if (a.type !== b.type) {
            return a.type === "game" ? -1 : 1;
        }
        return a.title.localeCompare(b.title);
    });
}

function activateCard(id) {
    const item = itemById.get(id);
    if (!item) {
        return;
    }

    if (item.locked) {
        const code = window.prompt("Enter password to unlock:");
        if (code === null) {
            return;
        }
        if (code !== String(item.unlockCode || "")) {
            window.alert("Incorrect password.");
            return;
        }
    }

    markPlayed(item.id);
    const targetHref = resolveHref(item);
    window.location.href = targetHref;
}

function resolveHref(item) {
    if (isLocalHost && item.localHref) {
        return item.localHref;
    }
    return item.href;
}

function resolveActionLabel(item) {
    if (item.cta) {
        return item.cta;
    }
    return item.type === "app" ? "Launch App" : "Play Now";
}

function getBadgeData(item) {
    const badges = [];

    if (item.featured) {
        badges.push({ label: "Featured", className: "" });
    }
    if (item.status === "new") {
        badges.push({ label: "New", className: "status-new" });
    }
    if (item.status === "beta") {
        badges.push({ label: "Beta", className: "status-beta" });
    }
    if (item.locked) {
        badges.push({ label: "Locked", className: "status-locked" });
    }

    return badges.slice(0, 2);
}

function markPlayed(id) {
    recentMap[id] = Date.now();
    try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(recentMap));
    } catch (error) {
        // ignored
    }
}

function getLastPlayed(id) {
    const value = Number(recentMap[id]);
    if (!Number.isFinite(value)) {
        return 0;
    }
    return value;
}

function getRelativePlayedTime(id) {
    const playedAt = getLastPlayed(id);
    if (!playedAt) {
        return "ready";
    }

    const deltaMs = Date.now() - playedAt;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (deltaMs < minute) {
        return "just now";
    }
    if (deltaMs < hour) {
        return `${Math.floor(deltaMs / minute)}m ago`;
    }
    if (deltaMs < day) {
        return `${Math.floor(deltaMs / hour)}h ago`;
    }
    return `${Math.floor(deltaMs / day)}d ago`;
}

function hydratePreferences() {
    let parsed = null;
    try {
        parsed = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
    } catch (error) {
        parsed = null;
    }

    if (parsed && (parsed.filter === "all" || parsed.filter === "game" || parsed.filter === "app" || parsed.filter === "locked")) {
        state.filter = parsed.filter;
    }
    if (parsed && (parsed.sort === "featured" || parsed.sort === "recent" || parsed.sort === "az")) {
        state.sort = parsed.sort;
    }

    el.sortSelect.value = state.sort;
    setActiveFilterButton();
}

function savePreferences() {
    try {
        localStorage.setItem(PREF_KEY, JSON.stringify({ filter: state.filter, sort: state.sort }));
    } catch (error) {
        // ignored
    }
}

function setActiveFilterButton() {
    el.filterButtons.forEach((button) => {
        button.classList.toggle("is-active", button.dataset.filter === state.filter);
    });
}

function loadRecent() {
    try {
        const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || "{}");
        if (parsed && typeof parsed === "object") {
            return parsed;
        }
    } catch (error) {
        // ignored
    }
    return {};
}

async function shareHub() {
    const shareData = {
        title: "Finger Game Hub",
        text: "Finger Game Hub - one place for party games and custom apps.",
        url: SHARE_URL
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
            return;
        } catch (error) {
            // ignored
        }
    }

    shareWhatsApp();
}

function shareWhatsApp() {
    const text = "Finger Game Hub is live. Explore all games and apps in one place:";
    const target = `https://wa.me/?text=${encodeURIComponent(text)}%20${encodeURIComponent(SHARE_URL)}`;
    window.open(target, "_blank", "noopener");
}

function shareFacebook() {
    const target = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`;
    window.open(target, "_blank", "noopener");
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
