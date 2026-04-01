const lastUpdatedEl = document.getElementById("last-updated");
const todaySummaryEl = document.getElementById("today-summary");
const trackedGamesEl = document.getElementById("tracked-games");
const latestVersionsEl = document.getElementById("latest-versions");
const updatesByGameEl = document.getElementById("updates-by-game");
const verificationListEl = document.getElementById("verification-list");

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
    const gamesUpdatedToday = games.filter((game) =>
        Array.isArray(game.updates) && game.updates.some((item) => item.date === currentDay)
    );

    lastUpdatedEl.textContent = `Last updated: ${formatTimestamp(updatedDate)}`;

    trackedGamesEl.innerHTML = games
        .map((game) => `<span class="coverage-chip">${escapeHtml(game.name)}</span>`)
        .join("");

    latestVersionsEl.innerHTML = games
        .map((game) => `<span class="coverage-chip">${escapeHtml(game.name)}: ${escapeHtml(game.latestVersion || "Unknown")}</span>`)
        .join("");

    if (gamesUpdatedToday.length === 0) {
        todaySummaryEl.innerHTML = `<span class="summary-chip">No newly confirmed updates found on ${escapeHtml(formatDate(currentDay))}.</span>`;
    } else {
        todaySummaryEl.innerHTML = gamesUpdatedToday
            .map((game) => `<span class="summary-chip">${escapeHtml(game.name)}: ${escapeHtml(game.latestVersion || "Latest version update")}</span>`)
            .join("");
    }

    updatesByGameEl.innerHTML = games
        .map((game) => buildGameGroup(game))
        .join("");

    if (needsVerification.length === 0) {
        verificationListEl.innerHTML = '<p class="empty-copy">No unconfirmed items are being carried forward right now.</p>';
        return;
    }

    verificationListEl.innerHTML = needsVerification
        .map((item) => `
            <article class="verification-card">
                <div class="update-meta">
                    <span class="status-pill unofficial">Unofficial</span>
                    <span class="meta-chip">${escapeHtml(item.game)}</span>
                    <span class="meta-chip">${escapeHtml(formatDate(item.date))}</span>
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

function buildGameGroup(game) {
    const updates = Array.isArray(game.updates) ? game.updates : [];
    const latestDate = updates[0] ? formatDate(updates[0].date) : "No updates recorded";
    const latestVersion = game.latestVersion || "Unknown";
    const cards = updates.length
        ? updates.map((item) => buildUpdateCard(item)).join("")
        : '<p class="empty-copy">No confirmed updates recorded yet.</p>';

    return `
        <section class="game-group">
            <div class="group-head">
                <div>
                    <p class="section-label">Tracked Game</p>
                    <h2>${escapeHtml(game.name)}</h2>
                </div>
                <div class="group-meta">Latest version: ${escapeHtml(latestVersion)} | Latest recorded update: ${escapeHtml(latestDate)}</div>
            </div>
            <div class="updates-list">${cards}</div>
        </section>
    `;
}

function buildUpdateCard(item) {
    const statusClass = item.status === "Unofficial" ? "unofficial" : "official";
    const versionChip = item.version ? `<span class="meta-chip">Version ${escapeHtml(item.version)}</span>` : "";
    return `
        <article class="update-card">
            <div class="update-meta">
                <span class="status-pill ${statusClass}">${escapeHtml(item.status)}</span>
                <span class="meta-chip">${escapeHtml(formatDate(item.date))}</span>
                <span class="meta-chip">${escapeHtml(item.game)}</span>
                ${versionChip}
            </div>
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
    return parsed.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function formatTimestamp(value) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
        return "Unavailable";
    }
    return value.toLocaleString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short"
    });
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
