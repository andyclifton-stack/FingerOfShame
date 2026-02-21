// --- SPLASH SCREEN LOGIC ---
window.addEventListener('load', () => {
    const splash = document.getElementById('splash-screen');
    setTimeout(() => { if(splash) splash.classList.add('fade-out'); }, 2000);
});

// --- DEFINE CANVAS GLOBALLY BEFORE USE ---
let cvs, ctx;
window.onload = function() {
    cvs = document.getElementById("confetti-canvas");
    if(cvs) ctx = cvs.getContext("2d");
};

// --- SOUNDS ---
const sounds = {
    timer: new Audio('sounds/timer.mp3'),
    reveal: new Audio('sounds/reveal.mp3'),
    agree: new Audio('sounds/agree.mp3'),
    hmmm: new Audio('sounds/hmmm.mp3'),
    objection: new Audio('sounds/objection.mp3'),
    guilty: new Audio('sounds/guilty.mp3'),
    innocent: new Audio('sounds/innocent.mp3'),
    wheel: new Audio('sounds/wheel.mp3'),
    end: new Audio('sounds/end.mp3')
};
sounds.timer.loop = true;

// --- GLOBAL & UTILS ---
function showRules() { document.getElementById('rules-overlay').style.display='flex'; }
function hideRules() { document.getElementById('rules-overlay').style.display='none'; }

function changeTheme(t) { 
    document.body.classList.remove('theme-christmas', 'theme-nye', 'theme-birthday', 'theme-pizza', 'theme-clean'); 
    if(t !== 'standard') document.body.classList.add('theme-'+t); 
}

function speak(text) {
    if(isMuted) return;
    try {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.2; 
        u.pitch = 1.0;
        window.speechSynthesis.speak(u);
    } catch(e) { }
}

// --- SHARE FUNCTION ---
function shareGameUrl() {
    const url = window.location.href.split('?')[0] + "?code=" + roomCode;
    if (navigator.share) {
        navigator.share({
            title: 'Finger of Shame',
            text: `Join my game! Code: ${roomCode}`,
            url: url
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(url).then(() => {
            alert("Link copied to clipboard! Send it to the group.");
        });
    }
}

const firebaseConfig = {
    apiKey: "AIzaSyDjEu71FYxr8Ebqhd3fySP-4qxuWNxSC6Q",
    authDomain: "finger-of-shame.firebaseapp.com",
    projectId: "finger-of-shame",
    storageBucket: "finger-of-shame.firebasestorage.app",
    messagingSenderId: "940288270460",
    appId: "1:940288270460:web:fb2681477c29523b7269f9",
    measurementId: "G-0QT07HKZ8M",
    databaseURL: "https://finger-of-shame-default-rtdb.europe-west1.firebasedatabase.app"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let roomCode = "";
let gameRef = null; 
let localPlayerId = localStorage.getItem('fs_player_id') || 'p_' + Math.random().toString(36).substr(2,9);
localStorage.setItem('fs_player_id', localPlayerId);

let gameState = { 
    players: [], currentJudgeIndex: 0, question: "Waiting...", 
    phase: 'setup', status: 'thinking', revealName: "", trigger: 0, 
    paused:false, adminId: localPlayerId,
    defenseVotes: { agree: 0, hmmm: 0, objection: 0 },
    defenseEndTime: 0,
    lastVerdict: "" 
};

let actualVerdict = ""; 
let defenseTimerInt = null;
let godClicks = 0; 
let manualMenuOpen = false; 

// Flags
let verdictLocked = false; 
let currentBadgeTarget = ""; 
const REACTION_COOLDOWN = 3000; 
let lastReactionTime = 0;
let isMuted = false;
let isSpectator = false;

// --- EMOJIS & DATA ---
const safeDeck = (typeof COURT_DATA !== 'undefined') ? COURT_DATA : ["Who ate the last cookie?", "Who is likely to be late?"];
const safeForfeits = (typeof FORFEITS !== 'undefined') ? FORFEITS : ["10 Pushups", "Sing a song"];
const EMOJIS = ['🦁','🍕','🦄','🌵','🌮','🤖','💩','🐼','🐸','👻','👽','💀','🎃','🤠','🤡','🍟','🥑','🧛','🦞','🚀','🦖','🍄','🧀','🍩'];

let questionDeck = [...safeDeck];
let gameForfeits = safeForfeits;

// --- INIT & ROUTING ---
const urlParams = new URLSearchParams(window.location.search);
const urlCode = urlParams.get('code');
const urlMode = urlParams.get('mode');

if(urlMode === 'spectator') {
    isSpectator = true;
    document.body.classList.add('spectator-mode');
}

if(urlCode) {
    connectToRoom(urlCode.toUpperCase());
} else {
    initEmojiBadge('host-emoji-badge');
    initEmojiBadge('join-emoji-badge');
}

document.addEventListener('click', (e) => { godClicks = 0; });

function toggleMute() {
    isMuted = !isMuted;
    const icon = isMuted ? "🔇" : "🔊";
    document.getElementById('mute-btn').innerText = icon;
    const specBtn = document.getElementById('spec-mute-btn');
    if(specBtn) specBtn.innerText = icon;
    if(isMuted) { Object.values(sounds).forEach(s => { s.pause(); s.currentTime = 0; }); }
}

function playSound(key) {
    if(isMuted) return;
    const s = sounds[key];
    if(s) { s.currentTime = 0; s.play().catch(e => console.log("Autoplay blocked", e)); }
}

function stopSound(key) {
    const s = sounds[key];
    if(s) { s.pause(); s.currentTime = 0; }
}

function drawQuestion() {
    if(questionDeck.length === 0) questionDeck = [...safeDeck];
    const idx = Math.floor(Math.random() * questionDeck.length);
    const q = questionDeck[idx];
    questionDeck.splice(idx, 1);
    return q;
}

function initEmojiBadge(id) {
    const el = document.getElementById(id);
    if(el) { el.innerText = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]; }
}

function openEmojiPicker(targetId) {
    currentBadgeTarget = targetId;
    const grid = document.getElementById('emoji-picker-grid');
    grid.innerHTML = "";
    EMOJIS.forEach(e => {
        const b = document.createElement('div');
        b.className = 'emoji-modal-btn';
        b.innerText = e;
        b.onclick = (ev) => { ev.stopPropagation(); selectEmojiFromModal(e); };
        grid.appendChild(b);
    });
    document.getElementById('emoji-picker-overlay').style.display = 'flex';
}

function selectEmojiFromModal(e) {
    if(currentBadgeTarget) { document.getElementById(currentBadgeTarget).innerText = e; }
    closeEmojiPicker();
}

function closeEmojiPicker() {
    document.getElementById('emoji-picker-overlay').style.display = 'none';
    currentBadgeTarget = "";
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active-screen'));
    document.getElementById(id).classList.add('active-screen');
}

function startSpectator() {
    let code = prompt("Enter the 4-Letter Room Code you want to watch:");
    if (code && code.length === 4) {
        window.location.href = `?code=${code.toUpperCase()}&mode=spectator`;
    }
}

function createRoom() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    roomCode = "";
    for (let i = 0; i < 4; i++) roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    connectToRoom(roomCode);
    gameRef.set({ 
        players: [], currentJudgeIndex: 0, question: "Waiting...", 
        phase: 'setup', status: 'thinking', trigger: 0, 
        paused:false, adminId: localPlayerId,
        defenseVotes: {agree:0, hmmm:0, objection:0}
    });
}

function joinRoomManually() {
    const input = document.getElementById('join-code-input');
    const code = input.value.toUpperCase();
    if(code.length !== 4) { alert("Please enter a 4-letter code."); return; }
    
    db.ref('games/' + code).once('value', (snapshot) => {
        if (snapshot.exists()) { connectToRoom(code); } 
        else { alert(`Room ${code} not found!`); }
    });
}

function connectToRoom(code) {
    roomCode = code;
    gameRef = db.ref('games/' + roomCode);
    document.getElementById('footer-room-code').innerText = "ROOM: " + roomCode;
    
    const bigCode = document.getElementById('big-room-code');
    if(bigCode) bigCode.innerText = roomCode;
    
    document.getElementById('spec-corner-code').innerText = roomCode;
    document.getElementById('lobby-corner-code').innerText = roomCode;
    
    const joinUrl = window.location.href.split('?')[0] + "?code=" + roomCode;
    const src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinUrl)}`;
    
    const bigQr = document.getElementById('large-qr-img');
    if(bigQr) bigQr.src = src;
    
    document.getElementById('spec-corner-qr').src = src;
    document.getElementById('lobby-corner-qr').src = src;

    // AUTO REJOIN LOGIC
    gameRef.child('players').once('value', (snap) => {
        const players = snap.val() || [];
        // Check if I am in the list based on saved ID
        const myPlayerIndex = players.findIndex(p => p.takenBy === localPlayerId);
        if (myPlayerIndex !== -1) {
            console.log("Welcome back, player!");
        }
    });

    gameRef.on('value', (snap) => {
        const data = snap.val();
        if(data) {
            if(data.trigger !== gameState.trigger) handleTrigger(data.triggerType, data.triggerPayload);
            gameState = data;
            handleGameUpdate();
        }
    });
}

function showRoomQR() { if(!roomCode) return; document.getElementById('qr-overlay').style.display = 'flex'; }

function showIdentities() {
    if(!roomCode) return;
    manualMenuOpen = true; 
    handleGameUpdate();
}
function closeIdentities() {
    manualMenuOpen = false; 
    if(gameState.phase === 'game') showScreen('screen-game');
    handleGameUpdate(); 
}

function handleGameUpdate() {
    const isPaused = gameState.paused === true;
    const amIGod = document.getElementById('god-menu-overlay').style.display === 'flex';
    document.getElementById('pause-overlay').style.display = (isPaused && !amIGod) ? 'flex' : 'none';

    if(gameState.phase === 'setup' && !isSpectator) {
        document.getElementById('lobby-corner-panel').style.display = 'flex';
    } else {
        document.getElementById('lobby-corner-panel').style.display = 'none';
    }

    const recap = document.getElementById('recap-ticker');
    if (gameState.lastVerdict) {
        document.getElementById('recap-text').innerText = gameState.lastVerdict;
        recap.style.display = 'block';
    } else {
        recap.style.display = 'none';
    }

    // --- FIX: REMOVED AGGRESSIVE AUTO-CLOSE ---
    // The previous code block here was closing the defense screen immediately.
    // It has been removed. Overlays are now closed ONLY by 'close_all' trigger.

    if(gameState.defenseVotes) {
        document.getElementById('val-agree').innerText = gameState.defenseVotes.agree || 0;
        document.getElementById('val-hmmm').innerText = gameState.defenseVotes.hmmm || 0;
        document.getElementById('val-obj').innerText = gameState.defenseVotes.objection || 0;
    }

    const myPlayers = (gameState.players || []).filter(p => p.takenBy === localPlayerId);
    const myNames = myPlayers.map(p => `${p.emoji} ${p.name}`).join(' & ');
    document.getElementById('identity-display').innerHTML = myNames ? `You are: ${myNames}` : "";

    if (isSpectator) {
            if(gameState.phase === 'game') { showScreen('screen-game'); renderGameDisplay(); } 
            else if (gameState.phase === 'setup') { showScreen('screen-setup'); }
            return;
    }

    if (myPlayers.length === 0) {
        if(gameState.phase === 'setup') { showScreen('screen-setup'); renderPlayerList(); } 
        else { showScreen('screen-join-pick'); renderJoinList(); }
        return;
    }

    if (manualMenuOpen) {
        showScreen('screen-join-pick');
        renderJoinList();
        return;
    }

    if (gameState.phase === 'setup') { showScreen('screen-setup'); renderPlayerList(); } 
    else if (gameState.phase === 'game') { showScreen('screen-game'); renderGameDisplay(); }
}

function triggerGodMode(e) { if(e) e.stopPropagation(); godClicks++; }

function handleRulesClick(e) {
    if(e) e.stopPropagation(); 
    if (godClicks >= 5) { openGodMenu(); godClicks = 0; } else { showRules(); }
}

function openGodMenu() {
    const overlay = document.getElementById('god-menu-overlay');
    const judgeList = document.getElementById('admin-judge-list');
    const scoreList = document.getElementById('admin-score-list');
    const kickList = document.getElementById('admin-kick-list'); 

    judgeList.innerHTML = "";
    (gameState.players || []).forEach((p, i) => { 
        const b = document.createElement('button');
        b.className = 'glass-btn';
        b.innerText = p.name;
        b.onclick = () => adminSetJudge(i);
        judgeList.appendChild(b);
    });

    scoreList.innerHTML = "";
    (gameState.players || []).forEach((p, i) => {
        const div = document.createElement('div');
        div.className = 'god-row';
        div.innerHTML = `<span>${p.name}</span><input type="number" class="god-input" value="${p.total}" onchange="adminChangeScore(${i}, this.value)">`;
        scoreList.appendChild(div);
    });

    kickList.innerHTML = "";
    (gameState.players || []).forEach((p, i) => {
        const div = document.createElement('div');
        div.className = 'god-row';
        div.style.borderColor = 'rgba(255, 71, 87, 0.3)';
        div.innerHTML = `<span>${p.emoji} ${p.name}</span><button class="glass-btn" style="background: rgba(255, 71, 87, 0.2); border:1px solid #ff4757; font-size: 0.8rem; padding: 5px 15px;" onclick="removePlayer(${i})">KICK ✕</button>`;
        kickList.appendChild(div);
    });

    overlay.style.display = 'flex';
}

function adminTogglePause() { gameRef.update({ paused: !gameState.paused }); }
function adminSkipQuestion() { gameRef.update({ question: drawQuestion() }); }
function adminSetJudge(i) { gameRef.update({ currentJudgeIndex: i, phase: 'game', status: 'thinking', question: drawQuestion(), revealName: "" }); }
function adminChangeScore(i, val) { const players = [...gameState.players]; players[i].total = parseInt(val); gameRef.update({ players }); }

function handleEnter(e) { if(e.key==='Enter') addPlayer(); }

function addPlayer() {
    const rawName = document.getElementById('new-player-name').value.trim();
    if(!rawName) return;
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const chosenEmoji = document.getElementById('host-emoji-badge').innerText;
    
    const myPlayers = (gameState.players || []).filter(p => p.takenBy === localPlayerId);
    const claimStatus = (myPlayers.length === 0) ? localPlayerId : null;
    
    const newPlayers = [...(gameState.players || []), { name, takenBy: claimStatus, total: 0, round: 0, emoji: chosenEmoji, id: Date.now() }];
    gameRef.update({ players: newPlayers });
    
    document.getElementById('new-player-name').value = "";
    initEmojiBadge('host-emoji-badge');
}

function addLatePlayer() {
    const rawName = document.getElementById('late-join-name').value.trim();
    if(!rawName) return;
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const chosenEmoji = document.getElementById('join-emoji-badge').innerText;
    
    const newPlayers = [...(gameState.players || []), { name, takenBy: localPlayerId, total: 0, round: 0, emoji: chosenEmoji, id: Date.now() }];
    gameRef.update({ players: newPlayers });
    
    document.getElementById('late-join-name').value = "";
    initEmojiBadge('join-emoji-badge');
    manualMenuOpen = false;
}

function claimPlayer(index) {
    const players = [...gameState.players];
    players[index].takenBy = localPlayerId;
    gameRef.update({ players });
    manualMenuOpen = false;
    showScreen('screen-game');
}

function renderPlayerList() {
    const list = document.getElementById('player-list-ul');
    list.innerHTML = "";
    (gameState.players || []).forEach((p, i) => {
        let status = "", action = "";
        if (p.takenBy === localPlayerId) {
            status = `<span style="color:#42e695; font-weight:bold; font-size:0.8rem; margin-right:10px;">(YOU)</span>`;
            action = `<button class="glass-btn" style="padding:5px 10px; font-size:0.7rem; margin-right:10px; background:rgba(255,255,255,0.3);" onclick="claimPlayer(${i})">UNCLAIM</button>`;
        } else if (p.takenBy) {
            status = `<span style="color:rgba(255,255,255,0.3); font-size:0.8rem; margin-right:10px;">(TAKEN)</span>`;
        } else {
            action = `<button class="glass-btn" style="padding:5px 10px; font-size:0.7rem; margin-right:10px;" onclick="claimPlayer(${i})">I'M ${p.name.toUpperCase()}</button>`;
        }
        const li = document.createElement('li');
        li.innerHTML = `<div style="display:flex; align-items:center;">${p.emoji} ${p.name}</div><div style="display:flex; align-items:center;">${status} ${action}</div>`;
        list.appendChild(li);
    });
}

function renderJoinList() {
    const list = document.getElementById('join-list-ul');
    list.innerHTML = "";
    (gameState.players || []).forEach((p, i) => {
        let status = "", action = "";
        if (p.takenBy === localPlayerId) {
            status = `<span style="color:#42e695; font-weight:bold; font-size:0.8rem; margin-right:10px;">(YOU)</span>`;
            action = ""; 
        } else {
            action = `<button class="glass-btn" style="padding:5px 10px; font-size:0.7rem; margin-right:10px;" onclick="claimPlayer(${i})">I'M ${p.name.toUpperCase()}</button>`;
        }
        const li = document.createElement('li');
        li.innerHTML = `<div style="display:flex; align-items:center;">${p.emoji} ${p.name}</div><div style="display:flex; align-items:center;">${status} ${action}</div>`;
        list.appendChild(li);
    });
}

function removePlayer(i) {
    if(!confirm("Are you sure you want to kick this player?")) return;
    const newPlayers = [...gameState.players];
    let newJudgeIndex = gameState.currentJudgeIndex;
    if (i < newJudgeIndex) newJudgeIndex--;
    else if (i === newJudgeIndex) newJudgeIndex = 0; 
    newPlayers.splice(i, 1);
    gameRef.update({ players: newPlayers, currentJudgeIndex: newJudgeIndex })
        .then(() => { if(document.getElementById('god-menu-overlay').style.display === 'flex') setTimeout(() => openGodMenu(), 50); });
}

function startGame() {
    if(!gameState.players || gameState.players.length < 2) { alert("Need 2+ players!"); return; }
    // Explicit trigger to close splash screens/overlays
    gameRef.update({ trigger: (gameState.trigger||0)+1, triggerType: 'close_all' });
    nextRound(); 
}

function nextRound(btn) {
    if(btn) btn.classList.add('processing');
    
    // 1. Close everyone's overlays first
    gameRef.update({ trigger: (gameState.trigger||0)+1, triggerType: 'close_all' });

    // 2. Advance game
    gameRef.child('players').transaction(players => {
        if (players) return players.map(p => ({...p, round: 0}));
        return players;
    }, (error, committed, snapshot) => {
        if(committed) {
            let players = snapshot.val();
            const nextJudge = (gameState.currentJudgeIndex + 1) % players.length;
            const nextQ = drawQuestion();
            
            gameRef.update({ 
                phase: 'game', status: 'thinking', 
                currentJudgeIndex: nextJudge, question: nextQ, revealName: "" 
            }).then(() => {
                    if(btn) btn.classList.remove('processing');
                    actualVerdict = "";
            });
        } else {
                if(btn) btn.classList.remove('processing');
        }
    });
}

function toggleJudgeSelection(name) {
    if (actualVerdict === name) actualVerdict = "";
    else actualVerdict = name;
    renderJudgePickGrid(); 
}

function renderJudgePickGrid() {
    const container = document.getElementById('judge-pick-container');
    let html = `<div class="judge-pick-grid">`;
    (gameState.players || []).forEach(p => {
        const isSelected = (p.name === actualVerdict) ? 'selected' : '';
        html += `<button class="judge-pick-btn ${isSelected}" onclick="toggleJudgeSelection('${p.name}')">${p.emoji} ${p.name}</button>`;
    });
    html += `</div>`;
    container.innerHTML = html;
}

function renderGameDisplay() {
    document.getElementById('question-display').innerText = gameState.question;
    const judge = (gameState.players || [])[gameState.currentJudgeIndex];
    
    const forfeitBtn = document.getElementById('btn-forfeit');
    if (gameState.status === 'revealed' || gameState.triggerType === 'defense') {
        forfeitBtn.style.display = 'block';
    } else {
        forfeitBtn.style.display = 'none';
    }
    
    if(judge) {
        document.getElementById('main-subtitle').innerText = `Ruled over by ${judge.emoji} ${judge.name}`;
        const amIJudge = (judge.takenBy === localPlayerId);
        const controls = document.getElementById('judge-controls-area');
        const waitMsg = document.getElementById('judge-waiting-msg');
        const adminDiv = document.getElementById('admin-controls');
        
        const mobStatus = document.getElementById('mob-status-text');

        if(amIJudge && !isSpectator) {
            controls.classList.remove('disabled-overlay');
            waitMsg.style.display = 'none';
            document.getElementById('judge-pick-container').style.display = (gameState.status === 'thinking') ? 'block' : 'none';
            if(gameState.status === 'thinking') renderJudgePickGrid();

            document.getElementById('btn-lock').style.display = (gameState.status === 'thinking') ? 'block' : 'none';
            document.getElementById('btn-vote').style.display = (gameState.status === 'locked') ? 'block' : 'none';
            document.getElementById('btn-reveal').style.display = (gameState.status === 'counted') ? 'block' : 'none';
            
            document.getElementById('btn-defense').style.display = 'none'; 
            document.getElementById('btn-forfeit').style.display = 'none';

            adminDiv.style.display = 'flex';
            if(mobStatus) mobStatus.style.display = 'none';
        } else {
            document.getElementById('judge-pick-container').style.display = 'none';
            
            const statusText = document.getElementById('judge-waiting-msg');
            if (gameState.status === 'thinking') {
                    statusText.innerHTML = `Judge <strong>${judge.name}</strong> is identifying the culprit... 🧐`;
                    statusText.className = 'judge-status-pulse';
            } else if (gameState.status === 'locked') {
                    statusText.innerHTML = `VERDICT LOCKED 🔒<br><span style="font-size:0.8em">Get ready to point!</span>`;
                    statusText.className = 'judge-status-locked';
            } else {
                    statusText.innerHTML = "Waiting for the Judge...";
                    statusText.className = "";
            }
            statusText.style.display = 'block';
            
            const btns = ['btn-lock','btn-vote','btn-reveal','btn-defense','btn-forfeit'];
            btns.forEach(id => document.getElementById(id).style.display = 'none');
            
            adminDiv.style.display = 'none';
            if(mobStatus) mobStatus.style.display = 'block';
        }
    }
    renderScoreboard();
}

function renderScoreboard() {
    const container = document.getElementById('scoreboard-container');
    if(!container) return; 
    
    container.innerHTML = "";
    const judge = (gameState.players || [])[gameState.currentJudgeIndex];
    const amIJudge = (judge && judge.takenBy === localPlayerId);

    (gameState.players || []).forEach((p, i) => {
        const isJudge = (i === gameState.currentJudgeIndex);
        const badge = isJudge ? `<span class="score-judge-marker">JUDGE</span>` : "";
        const rowClass = isJudge ? "score-row judge-active-row" : "score-row";
        
        const div = document.createElement('div');
        div.className = rowClass;
        
        let controls;
        if(amIJudge && !isSpectator) {
            controls = `
                <button class="score-btn btn-minus" onclick="updateRoundScore(${i}, -1)">-</button>
                <div class="score-round" style="color:#ffaf40;">${p.round || 0}</div>
                <button class="score-btn btn-plus" onclick="updateRoundScore(${i}, 1)">+</button>
            `;
        } else {
            controls = `<div class="score-round" style="width:100%; text-align:right;">${p.total || 0}</div>`;
        }

        div.innerHTML = `<div class="score-name">${p.emoji} ${p.name} ${badge}</div>
                            <div class="score-val-container" style="min-width: 80px; justify-content: flex-end;">${controls}</div>`;
        container.appendChild(div);
    });
}

function updateRoundScore(i, chg) {
    const players = [...gameState.players];
    players[i].round = (players[i].round || 0) + chg;
    gameRef.update({ players });
}
function updateStoredVerdict(el) { actualVerdict = el.value; }

function lockVerdict() { 
    if(!actualVerdict || actualVerdict.trim() === "") {
        alert("You must tap a player to blame!");
        return; 
    }
    gameRef.update({ status: 'locked', revealName: actualVerdict }); 
}

function triggerGlobalCountdown() { gameRef.update({ status: 'counting', trigger: (gameState.trigger||0)+1, triggerType: 'countdown' }); }
function triggerGlobalReveal() { gameRef.update({ status: 'revealed', trigger: (gameState.trigger||0)+1, triggerType: 'reveal', triggerPayload: gameState.revealName }); }

function triggerForfeit(btn) { 
    if(btn) btn.classList.add('processing');
    const randomResult = gameForfeits[Math.floor(Math.random() * gameForfeits.length)];
    gameRef.update({ trigger: (gameState.trigger||0)+1, triggerType: 'forfeit', triggerPayload: randomResult })
            .then(() => { if(btn) btn.classList.remove('processing'); });
}

function triggerReaction(type, e) {
    if(e) e.stopPropagation();
    
    const btns = document.querySelectorAll('.reaction-btn');
    const btn = e.currentTarget;
    btn.style.transform = "scale(0.9)";
    setTimeout(() => btn.style.transform = "scale(1)", 100);

    gameRef.child('defenseVotes/' + type).transaction(val => (val || 0) + 1);
    gameRef.update({ trigger: (gameState.trigger||0)+1, triggerType: type }); 
}

function triggerObjection(e) { 
        triggerReaction('objection', e); 
}

function finishGame(btn) {
    if(btn) btn.classList.add('processing');
    
    gameRef.child('players').transaction(players => {
        if(players) return players.map(p => ({...p, total: (p.total||0) + (p.round||0), round: 0}));
        return players;
    }, (error, committed) => {
        if(committed) {
                gameRef.update({ trigger: (gameState.trigger||0)+1, triggerType: 'end' });
        }
        if(btn) btn.classList.remove('processing');
    });
}

function finishGameAnimation() {
    const players = gameState.players || [];
    let max = -999;
    players.forEach(p => { if((p.total || 0) > max) max = p.total || 0; });

    if(players.length === 0) return;

    const winners = players.filter(p => (p.total || 0) === max).map(p => p.name).join(' & ');
    document.getElementById('winner-display').innerText = winners;

    const tbl = document.getElementById('final-scores-table');
    tbl.innerHTML = "";
    tbl.style.display = 'none'; 
    
    [...players].sort((a,b) => (b.total||0) - (a.total||0)).forEach(p => {
        tbl.innerHTML += `<div class="final-row"><span>${p.emoji} ${p.name}</span><strong>${p.total}</strong></div>`;
    });

    document.getElementById('winner-overlay').style.display = 'flex';
    startConfetti();
    playSound('end');
}

function toggleDetails() { 
    const t = document.getElementById('final-scores-table'); 
    t.style.display = t.style.display === 'block' ? 'none' : 'block'; 
}

function resetGame() {
        const players = (gameState.players || []).map(p => ({...p, total: 0, round: 0}));
        gameRef.update({ players, phase: 'setup', status: 'thinking' });
        document.getElementById('winner-overlay').style.display = 'none';
}
function openDefendantPicker() {
    selectedIndices = [];
    const grid = document.getElementById('picker-grid');
    grid.innerHTML = "";
    gameState.players.forEach((p, i) => { grid.innerHTML += `<button id="btn-def-${i}" class="picker-btn" onclick="toggleDefendant(${i})">${p.emoji} ${p.name}</button>`; });
    document.getElementById('defendant-picker-overlay').style.display = 'flex';
}
function toggleDefendant(i) {
    const btn = document.getElementById(`btn-def-${i}`);
    const idx = selectedIndices.indexOf(i);
    if (idx > -1) { selectedIndices.splice(idx, 1); btn.classList.remove('selected'); } 
    else { selectedIndices.push(i); btn.classList.add('selected'); }
}

function confirmDefense() {
    if (selectedIndices.length === 0) return;
    const names = selectedIndices.map(i => gameState.players[i].name).join(" & ");
    const secretPick = gameState.revealName;
    let judgeMatched = false;
    let judgeName = "The Judge";

    gameRef.child('players').transaction(players => {
        if (players) {
            const judge = players[gameState.currentJudgeIndex];
            judgeName = judge.name;
            if (secretPick && names.includes(secretPick)) {
                judge.total = (judge.total || 0) + 2;
                judgeMatched = true;
            } else {
                judge.total = (judge.total || 0) - 1;
                judgeMatched = false;
            }
        }
        return players;
    }, (error, committed) => {
        if(committed) {
            document.getElementById('defendant-picker-overlay').style.display='none';
            const endTime = Date.now() + 30000;
            
            gameRef.update({ 
                trigger: (gameState.trigger||0)+1, 
                triggerType: 'defense_start', 
                triggerPayload: {
                    names: names,
                    match: judgeMatched,
                    judge: judgeName
                },
                defenseVotes: {agree:0, hmmm:0, objection:0},
                defenseEndTime: endTime
            });
            
            playSound('timer');
        }
    });
}

function handleTrigger(type, payload) {
    if (type === 'defense_start') { showDefenseOverlay(payload); return; }
    
    // NEW: Safe way to close overlays for everyone
    if (type === 'close_all') {
        document.querySelectorAll('.overlay').forEach(el => {
            if(el.id !== 'splash-screen') el.style.display = 'none';
        });
        stopSound('timer');
        return;
    }

    const map = {
        'countdown': startCountdownAnimation,
        'reveal': () => showRevealAnimation(payload),
        'objection': playObjectionSound,
        'agree': playAgreeReaction,
        'hmmm': playHmmmReaction,
        'forfeit': () => spinForfeitAnimation(payload),
        'end': finishGameAnimation
    };
    if(map[type]) map[type]();
}

function playAgreeReaction() { flashReaction("😇", "#42e695"); playSound('agree'); }
function playHmmmReaction() { flashReaction("🤔", "#ffaf40"); playSound('hmmm'); }

function flashReaction(text, color) {
    const el = document.getElementById('flash-reaction');
    const content = document.getElementById('flash-content');
    content.innerText = text;
    content.style.textShadow = `0 0 20px ${color}`;
    el.style.opacity = '1';
    el.style.transform = "scale(1)";
    setTimeout(() => el.style.opacity = '0', 800);
}

function startCountdownAnimation() {
    const ol = document.getElementById('timer-overlay'); const txt = document.getElementById('timer-text'); const sub = document.getElementById('timer-sub');
    ol.style.display = 'flex'; sub.innerText = "GET READY..."; txt.classList.remove('reveal-text');
    
    document.getElementById('reveal-container').style.display = 'none';
    txt.style.display = 'block';
    sub.style.display = 'block';

    let count = 3; txt.innerText = count; 
    speak("Three"); 
    
    const int = setInterval(() => {
        count--;
        if(count > 0) { 
            txt.innerText = count; 
            if(count === 2) speak("Two");
            if(count === 1) speak("One");
        }
        else {
            clearInterval(int);
            txt.innerText = "POINT!"; 
            sub.innerText = "Wait for reveal..."; 
            speak("Point!");
            if(gameState.players[gameState.currentJudgeIndex].takenBy === localPlayerId) {
                ol.onclick = () => { ol.style.display='none'; triggerGlobalReveal(); }; sub.innerText = "Tap to Reveal";
            }
        }
    }, 1000);
}

function showRevealAnimation(name) {
    const ol = document.getElementById('timer-overlay'); 
    ol.style.display = 'flex';
    document.getElementById('timer-text').style.display = 'none';
    document.getElementById('timer-sub').style.display = 'none';

    const container = document.getElementById('reveal-container');
    container.style.display = 'flex';
    document.getElementById('reveal-name').innerText = name;
    
    playSound('reveal');

    const judge = (gameState.players || [])[gameState.currentJudgeIndex];
    const amIJudge = (judge && judge.takenBy === localPlayerId);

    const existingBtn = document.getElementById('btn-reveal-start-defense');
    if(existingBtn) existingBtn.remove();

    if (amIJudge) {
            const btn = document.createElement('button');
            btn.id = 'btn-reveal-start-defense';
            btn.className = 'btn-main';
            btn.innerText = 'START DEFENSE 🛡️';
            btn.style.marginTop = '20px';
            btn.onclick = (e) => {
                e.stopPropagation();
                ol.style.display = 'none';
                openDefendantPicker();
                if(gameState.status !== 'revealed') gameRef.update({status:'revealed'});
            };
            container.appendChild(btn);
            document.getElementById('reveal-hint').style.display = 'none';
            ol.onclick = null; 
    } else {
            document.getElementById('reveal-hint').style.display = 'block';
            ol.onclick = () => { ol.style.display = 'none'; };
    }
}

function playObjectionSound() {
    flashReaction("GUILTY!", "#ff4757");
    document.body.classList.add('shake-screen'); 
    playSound('objection');
    setTimeout(() => document.body.classList.remove('shake-screen'), 500);
}

function spinForfeitAnimation(targetText) {
    document.getElementById('forfeit-overlay').style.display = 'flex';
    const txt = document.getElementById('forfeit-text'); 
    let s = 0;
    const int = setInterval(() => { 
        txt.innerText = gameForfeits[Math.floor(Math.random()*gameForfeits.length)]; 
        playSound('wheel');
        s++; 
        if(s > 20) { 
            clearInterval(int); 
            txt.innerText = targetText; 
            playSound('guilty');
        } 
    }, 100);
}

function showDefenseOverlay(payload) {
    document.getElementById('defense-overlay').style.display='flex'; 
    document.getElementById('defense-target').innerText = payload.names;
    document.getElementById('defense-question').innerText = gameState.question || "";
    document.querySelector('.defense-sub').innerText = "Why should you not be charged?"; 
    document.querySelector('.defense-sub').style.fontSize = "1.5rem";
    
    showAlert(payload.match, payload.judge);

    document.getElementById('judge-ruling-area').style.display = 'none';
    document.getElementById('sentencing-controls').style.display = 'none';
    document.getElementById('btn-judge-spin').style.display = 'none';
    document.getElementById('close-hint-text').style.display = 'none';
    document.getElementById('judge-lock-text').style.display = 'none';
    
    const juryControls = document.getElementById('jury-controls');
    juryControls.style.opacity = '1';
    juryControls.style.pointerEvents = 'auto';

    verdictLocked = false; 
    votingOpen = true; 

    const judge = (gameState.players || [])[gameState.currentJudgeIndex];
    const amIJudge = (judge && judge.takenBy === localPlayerId);

    if (amIJudge) {
        document.getElementById('close-hint-text').innerText = "(YOU ARE JUDGE)";
        document.getElementById('close-hint-text').style.display = 'block';
        verdictLocked = true; 
    } else {
        const myPlayer = (gameState.players || []).find(p => p.takenBy === localPlayerId);
        const myName = myPlayer ? myPlayer.name : "";
        
        if (payload.names.includes(myName)) {
            juryControls.style.display = 'none';
        } else {
            juryControls.style.display = 'grid';
        }
    }

    const t = document.getElementById('defense-timer-val'); 
    clearInterval(defenseTimerInt);
    
    defenseTimerInt = setInterval(() => { 
        const now = Date.now();
        const end = gameState.defenseEndTime || (now + 30000);
        const d = Math.max(0, Math.ceil((end - now) / 1000));
        
        if(d <= 0) { 
            clearInterval(defenseTimerInt); 
            stopSound('timer'); 
            t.innerText = ""; 
            document.querySelector('.defense-sub').innerText = "THE JUDGE WILL NOW RULE";
            document.querySelector('.defense-sub').style.fontSize = "2rem"; 
            document.querySelector('.defense-sub').style.fontWeight = "800";
            
            juryControls.style.opacity = '0.5';

            if(amIJudge) {
                document.getElementById('judge-ruling-area').style.display = 'flex';
                document.getElementById('judge-lock-text').style.display = 'block';
            }
        } else { 
            t.innerText = d; 
        } 
    }, 100); 
}

function showAlert(isMatch, judgeName) {
    const overlay = document.getElementById('alert-overlay');
    const msgBox = document.getElementById('alert-msg');
    const judge = (gameState.players || [])[gameState.currentJudgeIndex];
    const amIJudge = (judge && judge.takenBy === localPlayerId);

    overlay.style.display = 'flex';
    
    if (isMatch) {
        if (amIJudge) {
            msgBox.innerHTML = `You earned the<br><span class="bonus-text">"Man of the People"</span><br>Bonus!`;
        } else {
            msgBox.innerHTML = `${judgeName} earned the<br><span class="bonus-text">"Man of the People"</span><br>Bonus!`;
        }
    } else {
        if (amIJudge) {
            msgBox.innerHTML = `You received the<br><span class="penalty-text">"Out of Touch"</span><br>Penalty!`;
        } else {
            msgBox.innerHTML = `${judgeName} received the<br><span class="penalty-text">"Out of Touch"</span><br>Penalty!`;
        }
    }
    setTimeout(() => { overlay.style.display = 'none'; }, 3000);
}

function closeDefense() { 
    if (verdictLocked) return;
    clearInterval(defenseTimerInt); 
    stopSound('timer');
    document.getElementById('defense-overlay').style.display='none'; 
    verdictLocked = false; 
}

function rulingGuilty(e) {
    if(e) e.stopPropagation(); 
    const targetName = document.getElementById('defense-target').innerText;

    if (targetName.includes('&')) {
        document.getElementById('judge-ruling-area').style.display = 'none';
        const grid = document.getElementById('sentencing-grid');
        grid.innerHTML = "";
        
        const names = targetName.split(' & ');
        names.forEach(n => {
                const btn = document.createElement('button');
                btn.className = 'glass-btn';
                btn.innerText = n;
                btn.style.fontSize = '1.2rem';
                btn.style.padding = '15px 30px';
                btn.onclick = (ev) => applySentence(n, ev);
                grid.appendChild(btn);
        });

        const bothBtn = document.createElement('button');
        bothBtn.className = 'btn-main';
        bothBtn.style.background = '#ff4757';
        bothBtn.innerText = "ALL OF THEM!";
        bothBtn.style.marginTop = '10px';
        bothBtn.onclick = (ev) => applySentence(targetName, ev); 
        grid.appendChild(bothBtn);

        document.getElementById('sentencing-controls').style.display = 'flex';
    } else {
        applySentence(targetName, e);
    }
}

function applySentence(namesToPunish, e) {
        if(e) e.stopPropagation();
        playSound('guilty');
        
        document.getElementById('sentencing-controls').style.display = 'none';
        document.getElementById('judge-ruling-area').style.display = 'none';

        gameRef.child('players').transaction(players => {
        if (players) {
            players.forEach(p => {
                if (namesToPunish.includes(p.name)) {
                    p.total = (p.total || 0) - 1;
                }
            });
        }
        return players;
    }, (error, committed) => {
            document.getElementById('btn-judge-spin').style.display = 'block';
            document.getElementById('judge-lock-text').innerText = "SENTENCE PASSED";
            document.getElementById('judge-lock-text').style.display = 'block';
            
            gameRef.update({ lastVerdict: `${namesToPunish} (Guilty)` });
    });
}

function cancelSentencing(e) {
    if(e) e.stopPropagation();
    document.getElementById('sentencing-controls').style.display = 'none';
    document.getElementById('judge-ruling-area').style.display = 'flex';
}

function rulingNotGuilty(e) {
    if(e) e.stopPropagation();
    playSound('innocent');

    // Get the name of the accused
    const targetName = document.getElementById('defense-target').innerText;
    
    // Update Recap with the name
    gameRef.update({ lastVerdict: `${targetName} was Found Not Guilty` });

    verdictLocked = false;
    closeDefense();

    setTimeout(() => {
        const judge = (gameState.players || [])[gameState.currentJudgeIndex];
        const amIJudge = (judge && judge.takenBy === localPlayerId);
        if (amIJudge) { nextRound(); }
    }, 1500); 
}

function triggerForfeitFromDefense(e) {
    if(e) e.stopPropagation();
    verdictLocked = false; 
    triggerForfeit(document.getElementById('btn-judge-spin')); 
    showScoringReminder = true;
}

function closeForfeit() { 
    const judge = (gameState.players || [])[gameState.currentJudgeIndex];
    const amIJudge = (judge && judge.takenBy === localPlayerId);
    if (amIJudge) { nextRound(); }
    else { document.getElementById('forfeit-overlay').style.display = 'none'; }
}

function openScoringReminder() {}
function closeScoringReminder() { document.getElementById('scoring-reminder-overlay').style.display = 'none'; }

function startConfetti() { parts=[]; for(let i=0;i<150;i++) parts.push({x:Math.random()*cvs.width, y:Math.random()*cvs.height-cvs.height, c:`hsl(${Math.random()*360},100%,50%)`, v:Math.random()*3+2}); animC(); }
function animC() { ctx.clearRect(0,0,cvs.width,cvs.height); 
    parts.forEach(p=>{p.y+=p.v; if(p.y>cvs.height) p.y=-20; ctx.fillStyle=p.c; ctx.fillRect(p.x,p.y,4,4);}); 
    requestAnimationFrame(animC); 
}