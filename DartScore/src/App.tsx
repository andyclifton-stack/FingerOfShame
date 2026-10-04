import { useEffect, useState } from "react";
import { GameScreen } from "./components/GameScreen";
import { StartScreen } from "./components/StartScreen";
import { Results } from "./components/Results";
import { History } from "./components/History";
import {
  applyDartThrow,
  applyVisitTotal,
  createGame,
  endTurn,
  nextLeg,
  replaceTurnDart,
  undoLastDart,
} from "./logic/gameEngine";
import {
  clearSavedGame,
  loadSavedGame,
  saveGame,
  loadHistory,
  reconcileHistory,
  loadPreferences,
  writeLocal,
  storageAvailable,
  type Preferences,
} from "./logic/storage";
import type { CreateGameInput, GameState } from "./types/game";
interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

function App() {
  const [saved, setSaved] = useState(loadSavedGame);
  const [state, setState] = useState<GameState | null>(null);
  const [history, setHistory] = useState(loadHistory);
  const [page, setPage] = useState<"setup" | "history">("setup");
  const [archived, setArchived] = useState<GameState | null>(null);
  const [preferences, setPreferences] = useState(loadPreferences);
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [awakeStatus, setAwakeStatus] = useState("");
  const [saveWarning, setSaveWarning] = useState(!storageAvailable);
  const playing = state?.status === "in_progress";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state?.status, state?.turn.turnIndex, page, archived]);
  useEffect(() => {
    const prompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallPrompt);
    };
    const installed = () => setInstall(null);
    const network = () => setOffline(!navigator.onLine);
    window.addEventListener("beforeinstallprompt", prompt);
    window.addEventListener("appinstalled", installed);
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      const message = (e: MessageEvent) => {
        if (e.data?.type === "OFFLINE_READY") setOfflineReady(true);
      };
      navigator.serviceWorker.addEventListener("message", message);
      navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`)
        .then(async () => {
          const ready = await navigator.serviceWorker.ready;
          ready.active?.postMessage({ type: "CHECK_OFFLINE" });
        })
        .catch(() => setOfflineReady(false));
      return () => {
        window.removeEventListener("beforeinstallprompt", prompt);
        window.removeEventListener("appinstalled", installed);
        window.removeEventListener("online", network);
        window.removeEventListener("offline", network);
        navigator.serviceWorker.removeEventListener("message", message);
      };
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", prompt);
      window.removeEventListener("appinstalled", installed);
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
    };
  }, []);
  useEffect(() => {
    let lock: WakeLockSentinel | undefined,
      cancelled = false;
    const acquire = async () => {
      if (!preferences.awake || !playing) return;
      if (!("wakeLock" in navigator)) {
        setAwakeStatus("Screen-awake is unavailable in this browser.");
        return;
      }
      if (document.visibilityState !== "visible") return;
      try {
        const acquired = await navigator.wakeLock.request("screen");
        if (cancelled) {
          await acquired.release();
          return;
        }
        lock = acquired;
        setAwakeStatus("Screen stays awake during play.");
        acquired.addEventListener("release", () => {
          if (!cancelled) setAwakeStatus("Screen-awake paused by your device.");
        });
      } catch {
        if (!cancelled)
          setAwakeStatus("Your device could not keep the screen awake.");
      }
    };
    const visible = () => {
      if (!lock || lock.released) void acquire();
    };
    void acquire();
    document.addEventListener("visibilitychange", visible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", visible);
      void lock?.release();
    };
  }, [preferences.awake, playing]);

  function commit(next: GameState | null) {
    if (next) {
      saveGame(next);
      setSaved(next);
      setHistory(reconcileHistory(next));
    } else {
      clearSavedGame();
      setSaved(null);
    }
    setSaveWarning(!storageAvailable);
    setState(next);
  }
  function start(config: CreateGameInput) {
    writeLocal("dartscore.setup.v1", config);
    setArchived(null);
    setPage("setup");
    commit(createGame(config));
  }
  function changePreferences(next: Preferences) {
    setPreferences(next);
    writeLocal("dartscore.preferences.v1", next);
    setSaveWarning(!storageAvailable);
  }
  function rematch(s: GameState) {
    start({
      playerNames: s.players.map((p) => p.name),
      mode: s.mode,
      bestOf: s.match?.bestOf ?? 1,
    });
  }
  const result = archived ?? (state?.status === "game_over" ? state : null);
  const appNavigation = (
        <header className="app-header">
          <a className="brand" href="../" aria-label="Finger Game hub">
            <span className="brand-icon" aria-hidden="true">
              ◎
            </span>
            <span>
              DART<span className="brand-accent">SCORE</span>
              <small>THE MATCH-NIGHT COMPANION</small>
            </span>
          </a>
          <nav aria-label="App navigation">
            <button
              className={`text-button ${page === "setup" && !state && !archived ? "active" : ""}`}
              onClick={() => {
                setState(null);
                setArchived(null);
                setPage("setup");
              }}
            >
              Play
            </button>
            <button
              className={`text-button ${page === "history" ? "active" : ""}`}
              onClick={() => {
                setState(null);
                setArchived(null);
                setPage("history");
              }}
            >
              History
            </button>
            <details className="app-settings">
              <summary aria-label="App settings">Settings</summary>
              <div className="settings-popover panel">
                <strong>Match-night settings</strong>
                <label className="check-field">
                  <input
                    type="checkbox"
                    checked={preferences.awake}
                    onChange={(e) =>
                      changePreferences({
                        ...preferences,
                        awake: e.target.checked,
                      })
                    }
                  />
                  Keep screen awake during play
                </label>
                <small className="hint">
                  Supported browsers only. Your device may pause this to save
                  battery.
                </small>
                {preferences.awake && state?.status === "in_progress" && (
                  <small role="status">{awakeStatus}</small>
                )}
                <p className="hint">
                  {offline
                    ? "You’re offline."
                    : offlineReady
                      ? "Ready to play offline."
                      : "Scores save on this device."}
                </p>
                {install ? (
                  <button
                    className="button button--accent"
                    onClick={async () => {
                      await install.prompt();
                      await install.userChoice;
                      setInstall(null);
                    }}
                  >
                    Install DartScore
                  </button>
                ) : (
                  <small className="hint">
                    To install: use your browser’s Install option, or Share →
                    Add to Home Screen on iPhone.
                  </small>
                )}
                <small className="hint">
                  History and saved games stay in this browser. Clearing site
                  data removes them.
                </small>
              </div>
            </details>
          </nav>
        </header>
  );
  return (
    <div className="app-shell">
      <main className="app-frame">
        {state?.status !== "in_progress" || result ? appNavigation : null}
        {saveWarning && (
          <p className="error-message" role="status">
            This browser cannot save right now. Keep this page open to retain
            your game.
          </p>
        )}
        {offline && (
          <p className="offline-banner" role="status">
            Offline · keep playing. Scores stay on this device.
          </p>
        )}
        {result ? (
          <Results
            state={result}
            archived={!!archived}
            onNext={() => state && commit(nextLeg(state))}
            onRematch={() => rematch(result)}
            onHome={() => {
              setState(null);
              setArchived(null);
              setPage(archived ? "history" : "setup");
            }}
            onUndo={() => state && commit(undoLastDart(state))}
          />
        ) : state?.status === "in_progress" ? (
          <GameScreen
            appNavigation={appNavigation}
            gameState={state}
            preferences={preferences}
            onInput={(input) => changePreferences({ ...preferences, input })}
            onThrow={(dart) => commit(applyDartThrow(state, dart))}
            onReplaceDart={(id, dart) =>
              commit(replaceTurnDart(state, id, dart))
            }
            onUndo={() => commit(undoLastDart(state))}
            onEndTurn={() => commit(endTurn(state))}
            onNewGame={() => commit(null)}
            onVisit={(total, darts, finish) => {
              try {
                commit(applyVisitTotal(state, total, darts, finish));
                return null;
              } catch (e) {
                return e instanceof Error ? e.message : "Check your score.";
              }
            }}
          />
        ) : page === "history" ? (
          <History history={history} onSelect={setArchived} />
        ) : (
          <StartScreen
            savedGame={saved}
            onResumeGame={() => setState(saved)}
            onStartGame={start}
          />
        )}
        {!state && !archived && (
          <footer className="app-footer">
            <span>
              {offlineReady ? "Offline ready" : "Made for match night"} · No
              account needed
            </span>
            <a href="../">Back to Finger Game ↗</a>
          </footer>
        )}
      </main>
    </div>
  );
}
export default App;
