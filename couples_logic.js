// --- CONFIGURATION ---
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
const gameRef = db.ref('couples_game/session_1');

// --- SOUNDS ---
const sfxSwipe = new Audio('sounds/card_swipe.mp3');
const sfxPlay = new Audio('sounds/card_play.mp3');
const sfxAlert = new Audio('sounds/card_alert.mp3');

// --- STATE ---
let currentUserRole = null; 
let gameConfig = null; 
let userProfile = null; 
let userDeck = []; 
let pendingCard = null; 
let xDown = null, yDown = null;

// Avatars
const FUN_AVATARS = ['🦖','👽','🦄','🤖','🦁','🐙','🐻','🦊','🐼','🐨','🐯','🐸'];

// --- INIT ---
window.onload = function() { 
    setFavicon("🃏"); 
    checkGameStatus(); 
};

function haptic(pattern) {
    if (navigator.vibrate) navigator.vibrate(pattern);
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

function checkGameStatus() {
    gameRef.on('value', (snapshot) => {
        const data = snapshot.val();
        
        if (!data || !data.config || !data.config.duration) {
            showView('view-init');
        } else {
            gameConfig = data.config;
            renderRoleButtons(data.profiles);
            
            if(currentUserRole) {
                userProfile = data.profiles ? data.profiles[currentUserRole] : null;
                updatePresence(); 
            } else {
                showRoleSelection();
            }
        }
    });
}

function renderRoleButtons(profiles) {
    if(!profiles) return;
    
    ['husband', 'wife'].forEach(role => {
        const p = profiles[role];
        if(p) {
            document.getElementById(`name-${role}`).innerText = p.name;
            document.getElementById(`avatar-${role}`).innerText = p.avatar;
            
            const pinKey = role + "_pin";
            const isLocked = gameConfig[pinKey];
            const statusEl = document.getElementById(`status-${role}`);
            
            if(isLocked) {
                statusEl.innerText = "LOCKED 🔒";
                statusEl.className = "role-status status-locked";
            } else {
                statusEl.innerText = "OPEN - SET PIN";
                statusEl.className = "role-status status-open";
            }
        }
    });
}

function initGameSetup() {
    const days = parseInt(document.getElementById('duration-select').value);
    const durationMs = days * 24 * 60 * 60 * 1000;
    seedDatabase(durationMs);
}

function forceHardReset() {
    if(confirm("⚠️ This will WIPE the database and start fresh. Are you sure?")) {
        gameRef.remove().then(() => window.location.reload());
    }
}

// --- LOGIC: SEEDING ---
function seedDatabase(durationMs) { 
    const husbandDeck = generateRandomDeck();
    const wifeDeck = generateRandomDeck();

    const initialData = {
        config: { created: Date.now(), duration: durationMs, gameOver: false },
        husband: husbandDeck,
        wife: wifeDeck,
        profiles: {
            husband: { name: "Husband", avatar: "👨" },
            wife: { name: "Wife", avatar: "👩" }
        },
        presence: { husband: 0, wife: 0 },
        history: { init: { message: "Game Started", timestamp: Date.now(), user: "System" } },
        resetRequest: null 
    };

    gameRef.set(initialData).then(() => window.location.reload());
}

function generateRandomDeck() {
    const deckObj = {};
    const shuffled = [...cardPool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 15);

    selected.forEach((card, index) => {
        const id = `card_${(index + 1).toString().padStart(2, '0')}`;
        deckObj[id] = { ...card, used: false, usedAt: null, seen: false };
    });

    deckObj['card_hell_no_1'] = { ...hellNoCard, used: false, usedAt: null, seen: false };
    deckObj['card_hell_no_2'] = { ...hellNoCard, used: false, usedAt: null, seen: false };
    deckObj['card_gamble'] = { ...highStakesCard, used: false, usedAt: null, seen: false };

    return deckObj;
}

// --- LOGIN FLOW ---
function showRoleSelection() {
    showView('view-roles');
    currentUserRole = null;
}

function selectRole(role) {
    currentUserRole = role;
    const pinKey = role + "_pin";
    const hasPin = gameConfig && gameConfig[pinKey];

    showView('view-pin');
    document.getElementById('pin-input').value = '';
    
    const btn = document.getElementById('btn-pin-action');
    const nameArea = document.getElementById('name-area');
    const forgotBtn = document.getElementById('forgot-btn');

    if (hasPin) {
        document.getElementById('pin-title').innerText = `Login`;
        document.getElementById('pin-subtitle').innerText = "Enter your secret PIN";
        nameArea.style.display = 'none';
        forgotBtn.style.display = 'block';
        btn.innerText = "Login";
        btn.onclick = verifyPin;
    } else {
        document.getElementById('pin-title').innerText = `Setup`;
        document.getElementById('pin-subtitle').innerText = "Create Profile & PIN";
        nameArea.style.display = 'block';
        document.getElementById('name-input').value = '';
        forgotBtn.style.display = 'none';
        btn.innerText = "Start Game";
        btn.onclick = setNewPin;
    }
}

function verifyPin() {
    const input = document.getElementById('pin-input').value;
    const storedPin = gameConfig[currentUserRole + "_pin"];
    if (input == storedPin) loadDashboard();
    else alert("Incorrect PIN");
}

function setNewPin() {
    const pinInput = document.getElementById('pin-input').value;
    const nameInput = document.getElementById('name-input').value.trim();

    if (pinInput.length < 4) { alert("PIN must be 4 digits"); return; }
    if (nameInput.length < 2) { alert("Please enter your name"); return; }

    const randomAvatar = FUN_AVATARS[Math.floor(Math.random() * FUN_AVATARS.length)];

    const updates = {};
    updates[`config/${currentUserRole}_pin`] = pinInput;
    updates[`profiles/${currentUserRole}`] = { name: nameInput, avatar: randomAvatar };

    gameRef.update(updates).then(() => {
        loadDashboard();
    });
}

function resetPin() {
    if(!confirm("Reset PIN? This will unlock the account for anyone.")) return;
    gameRef.child('config').child(`${currentUserRole}_pin`).remove().then(() => {
        selectRole(currentUserRole);
    });
}

function logout() {
    currentUserRole = null;
    gameRef.off();
    window.location.reload();
}

// --- DASHBOARD ---
function loadDashboard() {
    showView('view-dashboard');
    
    gameRef.child(`profiles/${currentUserRole}`).once('value', snap => {
        userProfile = snap.val();
        document.getElementById('user-greeting').innerText = `Hello, ${userProfile.name} ${userProfile.avatar}`;
    });

    updateTimeRemaining();
    setInterval(updateTimeRemaining, 60000); 
    
    updatePresence();
    setInterval(updatePresence, 30000); 

    gameRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            renderHistory(data.history);
            checkResetRequest(data.resetRequest);
            renderPartnerStatus(data.presence);
            
            // New: Calculate Stats
            calculateCardCounts(data);

            const myDeckObj = data[currentUserRole];
            userDeck = [];
            if(myDeckObj) {
                Object.entries(myDeckObj).forEach(([key, val]) => {
                    if (!val.used) userDeck.push({ id: key, ...val });
                });
            }
            renderCardStack();

            const opponentRole = currentUserRole === 'husband' ? 'wife' : 'husband';
            const opponentDeck = data[opponentRole];
            checkForIncoming(opponentDeck, opponentRole, data.profiles);
            
            if(gameConfig.gameOver) renderGameOver(data);
        }
    });
}

function updatePresence() {
    if(currentUserRole) {
        gameRef.child(`presence/${currentUserRole}`).set(Date.now());
    }
}

function renderPartnerStatus(presenceData) {
    if(!presenceData) return;
    const opponentRole = currentUserRole === 'husband' ? 'wife' : 'husband';
    const lastSeen = presenceData[opponentRole] || 0;
    const diff = Date.now() - lastSeen;
    
    const el = document.getElementById('partner-status');
    const textEl = document.getElementById('partner-status-text');
    
    if(diff < 60000 * 2) { // 2 mins
        el.className = 'status-indicator online';
        textEl.innerText = "Active now";
    } else {
        el.className = 'status-indicator offline';
        const mins = Math.floor(diff / 60000);
        textEl.innerText = mins > 60 ? "Offline" : `Seen ${mins}m ago`;
    }
}

// --- NEW STATS LOGIC ---
function calculateCardCounts(data) {
    if (!data) return;
    
    const opponentRole = currentUserRole === 'husband' ? 'wife' : 'husband';
    
    // My Count
    const myDeck = data[currentUserRole];
    let myCount = 0;
    if (myDeck) {
        myCount = Object.values(myDeck).filter(c => !c.used).length;
    }
    
    // Partner Count
    const partnerDeck = data[opponentRole];
    let partnerCount = 0;
    if (partnerDeck) {
        partnerCount = Object.values(partnerDeck).filter(c => !c.used).length;
    }
    
    // Update DOM
    document.getElementById('count-me').innerText = myCount;
    document.getElementById('count-partner').innerText = partnerCount;
    
    // Update partner name label if profile exists
    if(data.profiles && data.profiles[opponentRole]) {
        document.getElementById('label-partner').innerText = data.profiles[opponentRole].name.toUpperCase().substring(0,8);
    }
}

// --- CARD ACTIONS ---
function redeemActiveCard(cardId, cardTitle, btnElement) {
    const currentCard = userDeck.find(c => c.id === cardId);
    
    // High Stakes Logic
    if (currentCard.title === "The Gamble") {
        if (userDeck.length < 3) {
            alert("You need at least 2 other cards in your hand to burn for The Gamble!");
            return;
        }
        
        const wish = prompt("What is your High Stakes Wish?");
        if(!wish) return;

        if(!confirm("Warning: This will destroy 2 random cards in your hand. Proceed?")) return;

        const otherCards = userDeck.filter(c => c.id !== cardId);
        const shuffled = otherCards.sort(() => 0.5 - Math.random());
        const burn1 = shuffled[0];
        const burn2 = shuffled[1];

        const updates = {};
        const timestamp = Date.now();
        
        updates[`${currentUserRole}/${cardId}/used`] = true;
        updates[`${currentUserRole}/${cardId}/usedAt`] = timestamp;
        updates[`${currentUserRole}/${burn1.id}/used`] = true;
        updates[`${currentUserRole}/${burn2.id}/used`] = true;

        const customTitle = `The Gamble: "${wish}"`;
        const logRef = gameRef.child('history').push();
        logRef.set({
            user: currentUserRole,
            cardTitle: customTitle,
            timestamp: timestamp,
            isVeto: false
        });

        gameRef.update(updates);
        fireConfetti();
        return;
    }

    if(!confirm(`Redeem "${cardTitle}"?`)) return;
    
    haptic(100);
    sfxPlay.currentTime = 0;
    sfxPlay.play().catch(e => {});
    
    const cardEl = btnElement.closest('.game-card');
    cardEl.classList.add('stamped'); 

    setTimeout(() => {
        const timestamp = Date.now();
        gameRef.child(`${currentUserRole}/${cardId}`).update({ used: true, usedAt: timestamp, seen: false });
        gameRef.child(`history`).push({
            user: currentUserRole,
            cardTitle: cardTitle,
            timestamp: timestamp,
            isVeto: (cardTitle === "HELL NO")
        });
        showSuccessModal(cardTitle);
        fireConfetti();
    }, 600);
}

// --- CONFETTI ---
function fireConfetti() {
    const duration = 2000;
    const end = Date.now() + duration;

    (function frame() {
        const colors = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b'];
        for(let i=0; i<3; i++) {
            createParticle(Math.random() * window.innerWidth, -10, colors);
        }
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
}

function createParticle(x, y, colors) {
    const p = document.createElement('div');
    p.style.position = 'fixed';
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.width = (Math.random() * 8 + 4) + 'px';
    p.style.height = (Math.random() * 8 + 4) + 'px';
    p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    p.style.borderRadius = '50%';
    p.style.zIndex = '9999';
    p.style.pointerEvents = 'none';
    document.body.appendChild(p);

    const destX = x + (Math.random() - 0.5) * 200;
    const destY = window.innerHeight + 20;
    const rotate = Math.random() * 360;
    const duration = Math.random() * 1000 + 1500;

    const anim = p.animate([
        { transform: `translate(0,0) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${destX - x}px, ${destY}px) rotate(${rotate}deg)`, opacity: 0 }
    ], { duration: duration, easing: 'cubic-bezier(0, .9, .57, 1)' });

    anim.onfinish = () => p.remove();
}

// --- INCOMING CARD ---
function checkForIncoming(opponentDeckObj, opponentRole, profiles) {
    if (!opponentDeckObj) return;

    let foundIncoming = null;
    Object.entries(opponentDeckObj).forEach(([key, card]) => {
        if (card.used && (card.seen === false || card.seen === undefined)) {
            foundIncoming = { id: key, ...card, player: opponentRole };
        }
    });

    if (foundIncoming) {
        if (!pendingCard || pendingCard.id !== foundIncoming.id) {
            sfxAlert.play().catch(e => {});
            haptic([200, 100, 200]); 
        }
        pendingCard = foundIncoming;
        
        const oppProfile = profiles[opponentRole] || { name: capitalize(opponentRole) };
        
        setFavicon("⚠️");
        document.getElementById('inc-emoji').innerText = foundIncoming.emoji || "⚡";
        
        if(foundIncoming.title.includes("The Gamble")) {
             document.getElementById('inc-title').innerText = "HIGH STAKES";
             document.getElementById('inc-desc').innerText = foundIncoming.title.replace("The Gamble:", "").replace(/"/g, "");
        } else {
             document.getElementById('inc-title').innerText = foundIncoming.title;
             document.getElementById('inc-desc').innerText = foundIncoming.desc;
        }
        
        document.getElementById('inc-player').innerText = oppProfile.name;
        document.getElementById('incoming-modal').style.display = 'flex';
    } else {
        document.getElementById('incoming-modal').style.display = 'none';
        pendingCard = null;
        if(userDeck.length > 0) setFavicon(userDeck[0].emoji);
        else setFavicon("✅");
    }
}

// --- RENDERERS ---
function setFavicon(emoji) {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${emoji}</text></svg>`;
    link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function updateTimeRemaining() {
    if (!gameConfig || !gameConfig.created || !gameConfig.duration) {
        document.getElementById('time-remaining').innerText = "--";
        return;
    }
    const now = Date.now();
    const end = gameConfig.created + gameConfig.duration;
    const diff = end - now;
    const el = document.getElementById('time-remaining');

    if (diff <= 0) {
        el.innerText = "Game Over";
        el.style.color = "var(--danger)";
        if(!gameConfig.gameOver) {
            gameRef.child('config').update({ gameOver: true });
        }
    } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        el.innerText = `${days} Days Left`;
        el.style.color = "var(--accent-blue)";
    }
}

function acknowledgeCard() {
    if (!pendingCard) return;
    haptic(50);
    gameRef.child(`${pendingCard.player}/${pendingCard.id}`).update({ seen: true });
}

function renderCardStack(animationType = 'none') {
    const container = document.getElementById('deck-area');
    container.innerHTML = ''; 

    if (userDeck.length === 0) {
        document.getElementById('empty-msg').style.display = 'block';
        document.querySelector('.deck-controls').style.display = 'none';
        setFavicon("✅");
        return;
    } else {
        document.getElementById('empty-msg').style.display = 'none';
        document.querySelector('.deck-controls').style.display = 'flex';
    }

    const maxRender = Math.min(userDeck.length, 3);
    const totalLeft = userDeck.length;
    
    for (let i = 0; i < maxRender; i++) {
        const card = userDeck[i];
        if (i === 0) setFavicon(card.emoji);

        const el = document.createElement('div');
        const catClass = `cat-${card.category || 'fun'}`;
        
        let classes = `game-card ${catClass}`;
        
        // --- ANIMATION CLASSES ---
        if (i === 0) {
            classes += ' active-card';
            if (animationType === 'prev') {
                classes += ' slide-in-left';
            }
        }

        el.className = classes;
        const emojiDisplay = card.emoji ? card.emoji : "🃏";

        el.innerHTML = `
            <div class="stamp-overlay">REDEEMED</div>
            <div class="card-count">${totalLeft} Cards Left</div>
            <div class="card-emoji">${emojiDisplay}</div>
            <div class="card-title">${card.title}</div>
            <div class="card-desc">${card.desc}</div>
            <div class="card-footer">
                <button class="btn btn-primary" onclick="redeemActiveCard('${card.id}', '${card.title}', this)">Redeem Card</button>
            </div>
        `;

        if (i > 0) {
            const scale = 1 - (i * 0.05);
            const transY = i * 15;
            el.style.transform = `scale(${scale}) translateY(${transY}px)`;
            el.style.zIndex = 10 - i;
        } else {
            el.style.zIndex = 10;
            addSwipeListeners(el);
        }
        container.appendChild(el);
    }
}

// --- SWIPE ---
function addSwipeListeners(element) {
    element.addEventListener('touchstart', handleTouchStart, {passive: true});
    element.addEventListener('touchend', handleTouchEnd, {passive: true});
}

function handleTouchStart(evt) {
    const firstTouch = evt.touches[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;
}

function handleTouchEnd(evt) {
    if (!xDown || !yDown) return;
    const xUp = evt.changedTouches[0].clientX;
    const yUp = evt.changedTouches[0].clientY;
    const xDiff = xDown - xUp;
    const yDiff = yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (Math.abs(xDiff) > 50) {
            if (xDiff > 0) cycleNextCard();
            else cyclePrevCard();
        }
    }
    xDown = null; yDown = null;
}

// --- CYCLE NEXT: FIXED ---
function cycleNextCard() {
    if (userDeck.length <= 1) return;
    haptic(10);
    sfxSwipe.currentTime = 0;
    sfxSwipe.play().catch(e => {});

    const activeCardEl = document.querySelector('.active-card');
    if(activeCardEl) {
        // FIX: Clean classes and Force Reflow
        activeCardEl.classList.remove('slide-in-left');
        void activeCardEl.offsetWidth; 
        
        activeCardEl.classList.add('slide-out-left');
        
        setTimeout(() => {
            const item = userDeck.shift();
            userDeck.push(item);
            renderCardStack('next');
        }, 300);
    }
}

function cyclePrevCard() {
    if (userDeck.length <= 1) return;
    haptic(10);
    sfxSwipe.currentTime = 0;
    sfxSwipe.play().catch(e => {});
    const item = userDeck.pop();
    userDeck.unshift(item);
    renderCardStack('prev');
}

function renderHistory(historyObj) {
    const list = document.getElementById('list-history');
    list.innerHTML = '';
    if (!historyObj) return;

    let entries = Object.values(historyObj).sort((a, b) => a.timestamp - b.timestamp);
    
    for(let i = 0; i < entries.length; i++) {
        if(entries[i].isVeto) {
            const vetoer = entries[i].user;
            for(let j = i-1; j >= 0; j--) {
                if(entries[j].user !== vetoer && !entries[j].isVetoed) {
                    entries[j].isVetoed = true;
                    break; 
                }
            }
        }
    }

    entries.sort((a, b) => b.timestamp - a.timestamp);

    entries.forEach(entry => {
        if(entry.user === "System") return;
        const date = new Date(entry.timestamp);
        const timeStr = date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'});
        
        const el = document.createElement('div');
        el.className = entry.isVetoed ? 'log-item vetoed' : 'log-item';
        
        const userColor = entry.user === 'husband' ? 'var(--accent-blue)' : '#ec4899';
        const displayTitle = entry.cardTitle;

        el.innerHTML = `
            <div><span style="color:${userColor}; font-weight:700; text-transform:capitalize;">${entry.user}</span> played <br><strong>${displayTitle}</strong></div>
            <span class="log-time">${timeStr}</span>
        `;
        list.appendChild(el);
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    if (tabName === 'cards') {
        document.getElementById('tab-cards').style.display = 'block';
        document.querySelector('.nav-item:nth-child(1)').classList.add('active');
    } else if (tabName === 'history') {
        document.getElementById('tab-history').style.display = 'block';
        document.querySelector('.nav-item:nth-child(2)').classList.add('active');
    }
}

function openMenu() { document.getElementById('menu-modal').style.display = 'flex'; }
function openRules() { 
    document.getElementById('menu-modal').style.display = 'none';
    document.getElementById('rules-modal').style.display = 'flex'; 
}
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function showSuccessModal(cardTitle) {
    const modal = document.getElementById('success-modal');
    const waBtn = document.getElementById('wa-btn');
    const currentUrl = window.location.href;
    const message = `🚨 I just played my '${cardTitle}' card! Go to the app to see details: ${currentUrl}`;
    waBtn.onclick = () => window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    modal.style.display = 'flex';
}

function triggerResetRequest() {
    closeModal('menu-modal');
    gameRef.child('resetRequest').once('value', (snap) => {
        const data = snap.val();
        if (data && data.initiator === currentUserRole) {
            alert("Waiting for partner approval.");
        } else if (data) {
            checkResetRequest(data);
        } else {
            if(confirm("Request a new Season?")) {
                gameRef.child('resetRequest').set({ initiator: currentUserRole, timestamp: Date.now() });
                alert("Request sent.");
            }
        }
    });
}

function checkResetRequest(reqData) {
    const modal = document.getElementById('reset-modal');
    const actions = document.getElementById('reset-actions');
    
    if (!reqData) {
        modal.style.display = 'none';
        return;
    }
    if (reqData.initiator !== currentUserRole) {
        modal.style.display = 'flex';
        document.getElementById('reset-title').innerText = "Partner Wants to Restart";
        document.getElementById('reset-desc').innerText = `${capitalize(reqData.initiator)} wants to start a new season.`;
        actions.innerHTML = `
            <button class="btn btn-primary" onclick="confirmReset()">Agree & Restart</button>
            <button class="btn btn-outline" onclick="cancelReset()">Decline</button>
        `;
    }
}

function confirmReset() {
    const duration = (gameConfig && gameConfig.duration) ? gameConfig.duration : 2592000000;
    seedDatabase(duration);
    document.getElementById('reset-modal').style.display = 'none';
}
function cancelReset() {
    gameRef.child('resetRequest').remove();
    document.getElementById('reset-modal').style.display = 'none';
}

function renderGameOver(data) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.getElementById('tab-gameover').style.display = 'block';
    document.getElementById('game-stats').innerHTML = "<p>Season Finished!</p><button class='btn btn-primary' onclick='triggerResetRequest()'>Start New Season</button>";
}

function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }