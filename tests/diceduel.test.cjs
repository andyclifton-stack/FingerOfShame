// Deterministic rule and asynchronous reset regressions. Run: node --test tests/diceduel.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../diceduel-index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1]
    .split("        document.querySelectorAll('.card-slot').forEach")[0]
    .replace('        initDiceFaces(diceEl);', '').replace('        initBoard();', '');

function game() {
    const elements = new Map();
    function element(id = '') {
        const classes = new Set();
        return { id, style: {}, dataset: {}, textContent: '', innerText: '', attributes: {},
            classList: { add: (...v) => v.forEach(x => classes.add(x)), remove: (...v) => v.forEach(x => classes.delete(x)), contains: v => classes.has(v), toggle: (v, on) => (on ? classes.add(v) : classes.delete(v)) },
            setAttribute(k,v) { this.attributes[k] = v; }, addEventListener() {},
            appendChild(child) { child.parentElement = this; },
            getBoundingClientRect: () => ({ left: 0, top: 0 }),
        };
    }
    const get = id => { if (!elements.has(id)) elements.set(id, element(id)); return elements.get(id); };
    let now = 0, next = 0;
    const timers = new Map();
    const schedule = (fn, delay = 0) => { const id = ++next; timers.set(id, { fn, at: now + delay }); return id; };
    const context = vm.createContext({
        console: { log() {}, error() {} }, URLSearchParams,
        window: { location: { search: '' }, AudioContext: class {} }, navigator: {},
        document: { getElementById: get, createElement: () => element(), querySelector: () => get('scene'), querySelectorAll: () => [...elements.values()].filter(e => e.id.startsWith('card-')) },
        setTimeout: schedule, clearTimeout: id => timers.delete(id),
        setInterval: () => 99999, clearInterval() {}, requestAnimationFrame: fn => schedule(fn, 16),
        matchMedia: () => ({ matches: true }),
        localStorage: { getItem() {}, setItem() {} }, history: { replaceState() {} },
    });
    vm.runInContext(script, context);
    const run = code => vm.runInContext(code, context);
    // Isolate sound and visual rendering; actual rules, timers, moves, resets and online handling run unchanged.
    run('playSound = () => {}; triggerHaptic = () => {}; updateUI = () => {}; initBoard();');
    async function tick(ms) {
        const end = now + ms;
        for (let count = 0; count < 1000; count++) {
            await Promise.resolve(); await Promise.resolve();
            const entry = [...timers.entries()].filter(([,t]) => t.at <= end).sort((a,b) => a[1].at - b[1].at)[0];
            if (!entry) break;
            timers.delete(entry[0]); now = entry[1].at; entry[1].fn();
        }
        now = end;
        await Promise.resolve(); await Promise.resolve();
    }
    return { run, tick, get };
}

test('matching sums move cards, bump opponents and pass the turn', async () => {
    const g = game();
    g.run("gameState.hasRolled = true; gameState.roll = 3; handleCardClick('p1', 1); handleCardClick('p1', 2); performMove();");
    await g.tick(1000);
    assert.equal(g.run('gameState.turn'), 'p2');
    assert.equal(g.run('gameStats.p1.moves'), 2);
    assert.equal(g.get('card-p1-1').parentElement.id, 'center-slot-1');
    g.run("gameState.hasRolled = true; gameState.roll = 1; handleCardClick('p2', 1); performMove();");
    await g.tick(1000);
    assert.equal(g.run('gameStats.p2.bumps'), 1);
    assert.equal(g.run('p1Home[1]'), true);
    assert.equal(g.get('card-p1-1').parentElement.id, 'p1-slot-1');
    assert.equal(g.get('card-p2-1').parentElement.id, 'center-slot-1');
});

test('invalid selections cannot move; six center cards win', async () => {
    const g = game();
    g.run("gameState.hasRolled = true; gameState.roll = 6; handleCardClick('p1', 1); performMove();");
    assert.equal(g.run('isAnimating'), false);
    g.run("fullReset(); gameState.centerSlots = {1:'p1',2:'p1',3:'p1',4:'p1',5:'p1'}; p1Home = {6:true}; gameState.hasRolled = true; gameState.roll = 6; handleCardClick('p1',6); performMove();");
    await g.tick(1000);
    assert.equal(g.run('gameState.winner'), 'p1');
    assert.equal(g.run("victoryOverlay.classList.contains('show')"), true);
});

test('restart cancels a pending roll, AI decision and card move', async () => {
    for (const start of [
        "triggerRoll();",
        "gameMode='1p'; passTurn();",
        "gameState.hasRolled=true; gameState.roll=1; handleCardClick('p1',1); performMove();",
    ]) {
        const g = game();
        g.run(start); await g.tick(100); g.run('fullReset();'); await g.tick(10000);
        assert.equal(g.run('gameState.turn'), 'p1');
        assert.equal(g.run('gameState.hasRolled'), false);
        assert.equal(g.run('isAnimating'), false);
        assert.equal(g.run('selectedValues.length'), 0);
        assert.equal(g.get('card-p1-1').parentElement.id, 'p1-slot-1');
    }
});

test('AI makes a legal move and returns control to the player', async () => {
    const g = game();
    g.run("gameMode='1p'; gameState.turn='p2'; gameState.hasRolled=true; gameState.roll=4; aiDecideMove();");
    await g.tick(3000);
    assert.equal(g.run('gameState.centerSlots[4]'), 'p2');
    assert.equal(g.run('gameState.turn'), 'p1');
});

test('received online victory is not written back; rematch cancels an old roll', async () => {
    const g = game();
    g.run(`let writes=0; db={ref:()=>({update:()=>{writes++;return Promise.resolve();}})};
        gameMode='online'; onlineGameId='TESTROOM'; myRole='p2';
        applyOnlineState({round:1,status:'active',gameState:{turn:'p1',roll:1,hasRolled:true,winner:'p1',centerSlots:{1:'p1'}},p1Home:{},p2Home:{1:true}});`);
    assert.equal(g.run('writes'), 0);
    g.run(`gameState.winner=null; triggerRoll(); applyOnlineState({round:2,status:'active',gameState:{turn:'p1',roll:1,hasRolled:false,winner:null},p1Home:{1:true},p2Home:{1:true}});`);
    await g.tick(2000);
    assert.equal(g.run('gameState.hasRolled'), false);
    assert.equal(g.run("victoryOverlay.classList.contains('show')"), false);
    assert.equal(g.run('onlineReady'), true);
});

test('online write failures disable play and show a recovery message', async () => {
    const g = game();
    g.run("db={ref:()=>({update:()=>Promise.reject(new Error('denied'))})}; gameMode='online'; onlineReady=true; syncOnline();");
    await g.tick(0);
    assert.equal(g.run('onlineReady'), false);
    assert.match(g.get('connection-status').textContent, /Reload/);
});
