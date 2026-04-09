const lastUpdatedEl = document.getElementById("last-updated");
const todaySummaryEl = document.getElementById("today-summary");
const trackedGamesEl = document.getElementById("tracked-games");
const latestVersionsEl = document.getElementById("latest-versions");
const updatesByGameEl = document.getElementById("updates-by-game");
const verificationListEl = document.getElementById("verification-list");
const verificationPanelEl = document.getElementById("verification-panel");

loadUpdates();

async function loadUpdates() {
    try {
        const response = await fetch("updates.json", { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        renderPage(data);
    } catch (error) {
        renderError();
    }
}

function renderPage(data) {
    const games = Array.isArray(data.games) ? data.games : [];
    const needsVerification = Array.isArray(data.needsVerification) ? data.needsVerification : [];
    const updatedAt = typeof data.updatedAt === "string" ? data.updatedAt : "";
    const updatedDate = updatedAt ? new Date(updatedAt) : null;
    const currentDay = updatedAt ? updatedAt.slice(0, 10) : "";
    const newlyTrackedItems = getNewlyTrackedItems(games, currentDay);

    lastUpdatedEl.textContent = `Last updated: ${formatTimestamp(updatedDate)}`;

    trackedGamesEl.innerHTML = games
        .map((game) => {
            const targetId = `game-${slugify(game.name)}`;
            return `<a class="coverage-chip nav-chip" href="#${escapeAttribute(targetId)}">${escapeHtml(game.name)}</a>`;
        })
        .join("");

    latestVersionsEl.innerHTML = games
        .map((game) => `<span class="coverage-chip">${escapeHtml(game.name)}: ${escapeHtml(game.latestVersion || "Unknown")}</span>`)
        .join("");

    if (newlyTrackedItems.length === 0) {
        todaySummaryEl.innerHTML = `<span class="summary-chip">No items were newly added to the tracker on ${escapeHtml(formatDate(currentDay))}.</span>`;
    } else {
        todaySummaryEl.innerHTML = newlyTrackedItems
            .map((item) => {
                const sourceNote = item.trackedAt && item.trackedAt !== item.date
                    ? `Source ${formatDate(item.date)}`
                    : "Source published today";
                return `<span class="summary-chip">${escapeHtml(item.game)}: ${escapeHtml(item.headline)} (${escapeHtml(sourceNote)})</span>`;
            })
            .join("");
    }

    updatesByGameEl.innerHTML = games
        .map((game) => buildGameGroup(game))
        .join("");

    verificationPanelEl.open = needsVerification.length > 0;

    if (needsVerification.length === 0) {
        verificationListEl.innerHTML = '<p class="empty-copy">No unconfirmed items are being carried forward right now.</p>';
        return;
    }

    verificationListEl.innerHTML = needsVerification
        .map((item) => `
            <article class="verification-card">
                <div class="update-meta">
                    <span class="status-pill unofficial">Unofficial</span>
                    <span class="meta-chip">Source date ${escapeHtml(formatDate(item.date))}</span>
                    <span class="meta-chip">${escapeHtml(item.game)}</span>
                </div>
                <h3>${escapeHtml(item.headline)}</h3>
                <p class="verification-summary">${escapeHtml(item.summary)}</p>
                <div class="source-row">
                    <span>Source: ${escapeHtml(item.sourceName)}</span>
                    <a class="source-link" href="${escapeAttribute(item.sourceUrl)}" target="_blank" rel="noreferrer">Open source</a>
                </div>
            </article>
        `)
        .join("");
}

function getNewlyTrackedItems(games, currentDay) {
    return games.flatMap((game) => {
        const updates = Array.isArray(game.updates) ? game.updates : [];
        return updates.filter((item) => getTrackedDate(item) === currentDay);
    });
}

function getTrackedDate(item) {
    if (typeof item.trackedAt === "string" && item.trackedAt) {
        return item.trackedAt;
    }

    if (typeof item.recordedAt === "string" && item.recordedAt) {
        return item.recordedAt;
    }

    return typeof item.date === "string" ? item.date : "";
}

function buildGameGroup(game) {
    const updates = Array.isArray(game.updates) ? game.updates : [];
    const latestUpdate = updates[0] || null;
    const olderUpdates = updates.slice(1);
    const latestDate = latestUpdate ? formatDate(latestUpdate.date) : "No updates recorded";
    const latestVersion = game.latestVersion || "Unknown";
    const targetId = `game-${slugify(game.name)}`;

    let content = '<p class="empty-copy">No confirmed updates recorded yet.</p>';

    if (latestUpdate) {
        content = buildUpdateCard(latestUpdate, { featured: true, showGame: false });
    }

    if (olderUpdates.length > 0) {
        const noun = olderUpdates.length === 1 ? "update" : "updates";
        content += `
            <details class="history-toggle">
                <summary class="history-summary">Show ${olderUpdates.length} older ${noun}</summary>
                <div class="updates-list older-updates">
                    ${olderUpdates.map((item) => buildUpdateCard(item, { showGame: false })).join("")}
                </div>
            </details>
        `;
    }

    return `
        <section id="${escapeAttribute(targetId)}" class="game-group">
            <div class="group-head">
                <div>
                    <p class="section-label">Tracked Game</p>
                    <h2>${escapeHtml(game.name)}</h2>
                    <div class="group-stats">
                        <span class="meta-chip">Latest version ${escapeHtml(latestVersion)}</span>
                        <span class="meta-chip">Latest source date ${escapeHtml(latestDate)}</span>
                        <span class="meta-chip">${updates.length} recorded</span>
                    </div>
                </div>
                <div class="group-meta">Latest official context stays pinned at the top; older history is collapsed to keep the page easier to scan.</div>
            </div>
            <div class="updates-list">${content}</div>
        </section>
    `;
}

function buildUpdateCard(item, options = {}) {
    const statusClass = item.status === "Unofficial" ? "unofficial" : "official";
    const trackedDate = getTrackedDate(item);
    const metaChips = [
        `<span class="status-pill ${statusClass}">${escapeHtml(item.status)}</span>`,
        `<span class="meta-chip">Source date ${escapeHtml(formatDate(item.date))}</span>`
    ];

    if (options.showGame !== false) {
        metaChips.push(`<span class="meta-chip">${escapeHtml(item.game)}</span>`);
    }

    if (item.version) {
        metaChips.push(`<span class="meta-chip">Version ${escapeHtml(item.version)}</span>`);
    }

    if (trackedDate && trackedDate !== item.date) {
        metaChips.push(`<span class="meta-chip">Added here ${escapeHtml(formatDate(trackedDate))}</span>`);
    }

    const featuredClass = options.featured ? " featured" : "";

    return `
        <article class="update-card${featuredClass}">
            <div class="update-meta">${metaChips.join("")}</div>
            <h3>${escapeHtml(item.headline)}</h3>
            <p class="update-summary">${escapeHtml(item.summary)}</p>
            <div class="source-row">
                <span>Source: ${escapeHtml(item.sourceName)}</span>
                <a class="source-link" href="${escapeAttribute(item.sourceUrl)}" target="_blank" rel="noreferrer">Open source</a>
            </div>
        </article>
    `;
}

function renderError() {
    lastUpdatedEl.textContent = "Last updated: unavailable";
    todaySummaryEl.innerHTML = '<span class="summary-chip">Updates could not be loaded.</span>';
    trackedGamesEl.innerHTML = "";
    latestVersionsEl.innerHTML = "";
    updatesByGameEl.innerHTML = '<section class="game-group"><p class="empty-copy">The updates feed is currently unavailable.</p></section>';
    verificationListEl.innerHTML = '<p class="empty-copy">Verification data is currently unavailable.</p>';
}

function formatDate(value) {
    if (!value) {
        return "Unknown date";
    }

    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
    }).format(parsed);
}

function formatTimestamp(value) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
        return "Unavailable";
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short"
    }).format(value);
}

function slugify(value) {
    return String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}
