import { useState } from 'react';
import { useStrategyStore } from '../../store/strategyStore';
import { STRATEGY_ACHIEVEMENTS } from '../../types/strategyGame';
import type { StrategyCampaignDifficulty, Resources, EventChoice } from '../../types/strategyGame';

// ─── Station Wars — Full Strategy Game UI ────────────────────

const RESOURCE_CONFIG: Record<keyof Resources, { label: string; icon: string; color: string; max: number }> = {
  fleet:  { label: 'Στόλος',        icon: '🚗', color: '#3b82f6', max: 50 },
  staff:  { label: 'Προσωπικό',    icon: '👥', color: '#8b5cf6', max: 25 },
  budget: { label: 'Budget',        icon: '💰', color: '#22c55e', max: 5000 },
  rating: { label: 'Rating',        icon: '⭐', color: '#f59e0b', max: 100 },
  time:   { label: 'Χρόνος',       icon: '⏰', color: '#06b6d4', max: 16 },
};

const DIFFICULTY_CONFIG: Record<StrategyCampaignDifficulty, { label: string; icon: string; color: string; desc: string }> = {
  easy:   { label: 'Εύκολο',  icon: '🌱', color: '#22c55e', desc: 'Πολλοί πόροι, χαλαρό tempo' },
  normal: { label: 'Κανονικό', icon: '🎯', color: '#3b82f6', desc: 'Ισορροπημένη πρόκληση' },
  hard:   { label: 'Δύσκολο',  icon: '🔥', color: '#f59e0b', desc: 'Λίγοι πόροι, σκληρές αποφάσεις' },
  expert: { label: 'Expert',   icon: '💀', color: '#ef4444', desc: 'Ελάχιστα πάντα — μόνο για τους καλύτερους' },
};

const SEVERITY_COLORS: Record<string, string> = {
  info: '#3b82f6',
  warning: '#f59e0b',
  critical: '#ef4444',
  opportunity: '#22c55e',
};

// Tailwind classes used directly in JSX

// ─── Resource Bar Component ─────────────────────────────────

function ResourceDisplay({ resources }: { resources: Resources }) {
  return (
    <div
      className="grid grid-cols-2 gap-x-4 gap-y-1 px-4 py-3 rounded-[14px] bg-slate-800/50 border border-slate-700/[0.06] mb-3"
      role="group"
      aria-label="Πόροι σταθμού"
    >
      {(Object.keys(RESOURCE_CONFIG) as (keyof Resources)[]).map(key => {
        const cfg = RESOURCE_CONFIG[key];
        const value = resources[key];
        const percent = Math.max(0, Math.min(100, (value / cfg.max) * 100));
        const isLow = key === 'budget' ? value < 0 : percent < 25;
        const isCritical = key === 'budget' ? value < -500 : percent < 10;

        return (
          <div key={key} className="flex items-center gap-2 py-2">
            <span className="text-base w-6 text-center" aria-hidden="true">{cfg.icon}</span>
            <div className="flex-1">
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-400">{cfg.label}</span>
                <span
                  className="font-bold tabular-nums"
                  style={{ color: isCritical ? '#ef4444' : isLow ? '#f59e0b' : cfg.color }}
                >
                  {key === 'budget' ? `${value}€` : value}
                </span>
              </div>
              <div
                className="h-2 rounded bg-slate-700/10 overflow-hidden"
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={cfg.max}
                aria-label={cfg.label}
              >
                <div
                  className="h-full rounded transition-all duration-500"
                  style={{
                    width: `${Math.max(0, percent)}%`,
                    background: isCritical ? '#ef4444' : isLow ? '#f59e0b' : cfg.color,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Effect Preview ─────────────────────────────────────────

function EffectPreview({ effects, resources }: { effects: Partial<Resources>; resources: Resources }) {
  const entries = Object.entries(effects).filter(([_, v]) => v !== 0);
  if (entries.length === 0) return <span className="text-[11px] text-slate-500">Χωρίς αλλαγές</span>;

  return (
    <div className="flex gap-1.5 flex-wrap mt-1.5">
      {entries.map(([key, delta]) => {
        const cfg = RESOURCE_CONFIG[key as keyof Resources];
        const isPositive = (delta as number) > 0;
        const newVal = resources[key as keyof Resources] + (delta as number);
        const isDangerous = key === 'budget' ? newVal < 0 : key === 'rating' ? newVal < 20 : key === 'fleet' ? newVal < 3 : key === 'staff' ? newVal < 2 : false;

        return (
          <span
            key={key}
            className="px-2 py-0.5 rounded-md text-[11px] font-bold"
            style={{
              background: isDangerous
                ? 'rgba(239,68,68,0.15)'
                : isPositive
                  ? 'rgba(34,197,94,0.1)'
                  : 'rgba(239,68,68,0.08)',
              color: isDangerous ? '#ef4444' : isPositive ? '#22c55e' : '#f87171',
            }}
          >
            <span aria-hidden="true">{cfg.icon}</span> {isPositive ? '+' : ''}{delta as number}
          </span>
        );
      })}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function StationWars() {
  const store = useStrategyStore();
  const { game } = store;

  const [setupDifficulty, setSetupDifficulty] = useState<StrategyCampaignDifficulty>('normal');
  const [setupMode, setSetupMode] = useState<'campaign' | 'quick' | 'endless'>('campaign');
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('sw-player-name') || '');
  const [showSetup, setShowSetup] = useState(true);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showTurnResult, setShowTurnResult] = useState(false);

  const lastResult = game?.history[game.history.length - 1] ?? null;

  // ── Setup Screen ──
  if (!game || showSetup) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 font-sans pb-20">
        <header className="px-5 py-4 border-b border-slate-700/[0.08] flex items-center justify-between">
          <h1 className="text-[22px] font-extrabold flex items-center gap-2.5">
            <span aria-hidden="true">⚔️</span> Station Wars
          </h1>
          <div className="text-xs text-slate-400">
            <span aria-hidden="true">🎮</span> {store.totalGamesPlayed} παιχνίδια
          </div>
        </header>

        <section className="max-w-[600px] mx-auto px-4">
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/[0.08] p-5 mb-3 text-center mt-4">
            <div className="text-4xl mb-2" aria-hidden="true">🏢</div>
            <h2 className="text-xl font-extrabold mb-1">Station Wars</h2>
            <p className="text-slate-400 text-[13px] mb-5">
              Διαχειρίσου τον σταθμό ενοικίασης. Κάθε μέρα φέρνει νέες προκλήσεις.<br />
              Πάρε αποφάσεις, διαχειρίσου πόρους, κράτα τους πελάτες χαρούμενους!
            </p>

            {/* Player name */}
            <div className="mb-5">
              <label className="block text-xs text-slate-400 mb-1 text-left" htmlFor="player-name">
                ΤΟ ΟΝΟΜΑ ΣΟΥ
              </label>
              <input
                id="player-name"
                value={playerName}
                onChange={e => {
                  setPlayerName(e.target.value);
                  localStorage.setItem('sw-player-name', e.target.value);
                }}
                placeholder="π.χ. Μιχάλης"
                className="w-full px-4 py-3 rounded-xl border border-slate-700/15 bg-slate-900/50 text-slate-200 text-base outline-none"
              />
            </div>

            {/* Mode Selection */}
            <fieldset className="mb-5 border-none p-0">
              <legend className="text-xs text-slate-400 mb-2 text-left">ΛΕΙΤΟΥΡΓΙΑ</legend>
              <div className="flex gap-2" role="radiogroup" aria-label="Επιλογή λειτουργίας">
                {([
                  { m: 'campaign' as const, label: 'Καμπάνια', icon: '🏆', desc: '30 μέρες' },
                  { m: 'quick' as const, label: 'Γρήγορο', icon: '⚡', desc: '10 μέρες' },
                  { m: 'endless' as const, label: 'Ατέρμονο', icon: '♾️', desc: '∞ μέρες' },
                ]).map(item => (
                  <button
                    key={item.m}
                    onClick={() => setSetupMode(item.m)}
                    role="radio"
                    aria-checked={setupMode === item.m}
                    className={`flex-1 px-2 py-3 rounded-xl border-2 cursor-pointer text-[13px] font-semibold ${
                      setupMode === item.m
                        ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                        : 'border-slate-700/[0.08] bg-slate-900/40 text-slate-400'
                    }`}
                  >
                    <div className="text-xl mb-0.5" aria-hidden="true">{item.icon}</div>
                    {item.label}
                    <div className="text-[10px] opacity-70">{item.desc}</div>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Difficulty */}
            <fieldset className="mb-6 border-none p-0">
              <legend className="text-xs text-slate-400 mb-2 text-left">ΔΥΣΚΟΛΙΑ</legend>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Επιλογή δυσκολίας">
                {(Object.entries(DIFFICULTY_CONFIG) as [StrategyCampaignDifficulty, typeof DIFFICULTY_CONFIG.easy][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setSetupDifficulty(key)}
                    role="radio"
                    aria-checked={setupDifficulty === key}
                    className={`py-3.5 px-3 rounded-xl border-2 cursor-pointer text-left ${
                      setupDifficulty === key ? '' : 'border-slate-700/[0.08] bg-slate-900/40 text-slate-400'
                    }`}
                    style={setupDifficulty === key ? {
                      borderColor: cfg.color,
                      background: `${cfg.color}12`,
                      color: cfg.color,
                    } : undefined}
                  >
                    <div className="text-lg mb-0.5">
                      <span aria-hidden="true">{cfg.icon}</span> {cfg.label}
                    </div>
                    <div className="text-[10px] opacity-70">{cfg.desc}</div>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Start */}
            <button
              onClick={() => {
                store.startGame(playerName || 'Player', setupMode, setupDifficulty);
                setShowSetup(false);
                setShowTurnResult(false);
                setSelectedChoice(null);
              }}
              disabled={!playerName.trim()}
              className={`w-full px-6 py-3.5 rounded-[14px] border-none font-bold text-lg cursor-pointer transition-all duration-200 mb-2 text-white ${
                playerName.trim() ? 'shadow-lg shadow-blue-500/30' : ''
              }`}
              style={{
                background: playerName.trim()
                  ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(59,130,246,0.15)',
              }}
            >
              <span aria-hidden="true">⚔️</span> Ξεκίνα!
            </button>
          </div>

          {/* High Scores */}
          {store.highScores.length > 0 && (
            <section className="bg-slate-800/60 rounded-2xl border border-slate-700/[0.08] p-5 mb-3" aria-label="Υψηλά σκορ">
              <h3 className="text-[15px] font-bold mb-2.5">
                <span aria-hidden="true">🏆</span> Υψηλά Σκορ
              </h3>
              {store.highScores.slice(0, 5).map((hs, i) => (
                <div
                  key={i}
                  className={`flex justify-between items-center py-2 ${
                    i < 4 ? 'border-b border-slate-700/[0.05]' : ''
                  }`}
                >
                  <span className="text-[13px] text-slate-400">
                    <span aria-hidden="true">{['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]}</span> {hs.difficulty} · {hs.mode} · Ημέρα {hs.day}
                  </span>
                  <span className="font-bold text-amber-400">{hs.score}</span>
                </div>
              ))}
            </section>
          )}

          {/* Achievements */}
          {store.earnedAchievements.length > 0 && (
            <section className="bg-slate-800/60 rounded-2xl border border-slate-700/[0.08] p-5 mb-3" aria-label="Επιτεύγματα">
              <h3 className="text-[15px] font-bold mb-2.5">
                <span aria-hidden="true">🎖️</span> Επιτεύγματα
              </h3>
              <div className="flex gap-2 flex-wrap">
                {STRATEGY_ACHIEVEMENTS.filter(a => store.earnedAchievements.includes(a.id)).map(a => (
                  <span
                    key={a.id}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-400/[0.08] border border-amber-400/15 text-xs font-semibold text-amber-400"
                  >
                    <span aria-hidden="true">{a.icon}</span> {a.name}
                  </span>
                ))}
              </div>
            </section>
          )}
        </section>
      </div>
    );
  }

  // ── Game Over / Complete Screen ──
  if (game.isComplete || game.isGameOver) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 font-sans pb-20">
        <header className="px-5 py-4 border-b border-slate-700/[0.08] flex items-center justify-between">
          <h1 className="text-[22px] font-extrabold flex items-center gap-2.5">
            <span aria-hidden="true">⚔️</span> Station Wars
          </h1>
        </header>
        <section className="max-w-[600px] mx-auto px-4">
          <div
            className={`bg-slate-800/60 rounded-2xl p-5 mb-3 text-center mt-4 border ${
              game.isGameOver ? 'border-red-500/30' : 'border-green-500/30'
            }`}
          >
            <div className="text-5xl mb-3" aria-hidden="true">
              {game.isGameOver ? '💀' : '🏆'}
            </div>
            <h2 className={`text-2xl font-extrabold mb-2 ${game.isGameOver ? 'text-red-500' : 'text-green-500'}`}>
              {game.isGameOver ? 'Game Over!' : 'Νίκη! 🎉'}
            </h2>
            {game.gameOverReason && (
              <p className="text-red-400 text-sm mb-3">{game.gameOverReason}</p>
            )}
            <div className="flex justify-center gap-5 mb-4">
              <div>
                <div className="text-[28px] font-extrabold text-amber-400">{game.score}</div>
                <div className="text-[11px] text-slate-400">Πόντοι</div>
              </div>
              <div>
                <div className="text-[28px] font-extrabold text-blue-500">{game.day}</div>
                <div className="text-[11px] text-slate-400">Ημέρες</div>
              </div>
              <div>
                <div className="text-[28px] font-extrabold text-violet-500">{game.history.length}</div>
                <div className="text-[11px] text-slate-400">Αποφάσεις</div>
              </div>
            </div>

            <ResourceDisplay resources={game.resources} />

            {/* Achievements earned this game */}
            {game.achievements.length > 0 && (
              <div className="px-4 py-3 rounded-xl mb-4 bg-amber-400/[0.06] border border-amber-400/15">
                <div className="text-[13px] font-bold text-amber-400 mb-2">
                  <span aria-hidden="true">🎖️</span> Νέα Επιτεύγματα!
                </div>
                {game.achievements.map(id => {
                  const ach = STRATEGY_ACHIEVEMENTS.find(a => a.id === id);
                  return ach ? (
                    <div key={id} className="text-[13px] mb-1 text-slate-200">
                      <span aria-hidden="true">{ach.icon}</span> <strong>{ach.name}</strong> — {ach.description}
                    </div>
                  ) : null;
                })}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { store.resetGame(); setShowSetup(true); }}
                className="flex-1 w-full px-6 py-3.5 rounded-[14px] border-none font-bold text-[15px] cursor-pointer transition-all duration-200 mb-2 text-white"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
              >
                <span aria-hidden="true">🔄</span> Ξανά
              </button>
              <button
                onClick={() => { store.resetGame(); setShowSetup(true); }}
                className="flex-1 w-full px-6 py-3.5 rounded-[14px] border-none font-bold text-[15px] cursor-pointer transition-all duration-200 mb-2 bg-slate-700/10 text-slate-400"
              >
                <span aria-hidden="true">📋</span> Μενού
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ── Turn Result Screen ──
  if (showTurnResult && lastResult) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 font-sans pb-20">
        <header className="px-5 py-4 border-b border-slate-700/[0.08] flex items-center justify-between">
          <h1 className="text-[22px] font-extrabold flex items-center gap-2.5">
            <span aria-hidden="true">⚔️</span> Ημέρα {game.day}
          </h1>
          <div className="text-sm font-bold text-amber-400">
            <span aria-hidden="true">📊</span> {game.score}
          </div>
        </header>
        <section className="max-w-[600px] mx-auto px-4">
          <ResourceDisplay resources={game.resources} />

          <div
            className={`bg-slate-800/60 rounded-2xl p-5 mb-3 border-2 ${
              lastResult.riskOutcome === 'bonus'
                ? 'border-green-500/30'
                : lastResult.riskOutcome === 'penalty'
                  ? 'border-red-500/30'
                  : 'border-slate-700/[0.08]'
            }`}
          >
            <h3 className="text-sm font-bold mb-2">
              Αποτέλεσμα Μέρας {lastResult.day}
            </h3>

            {/* Effects summary */}
            <div className="mb-3">
              <EffectPreview effects={lastResult.effects} resources={lastResult.resourcesBefore} />
            </div>

            {/* Risk outcome */}
            {lastResult.riskOutcome !== 'none' && lastResult.riskText && (
              <div
                className={`px-3.5 py-2.5 rounded-[10px] mb-3 text-[13px] font-semibold border ${
                  lastResult.riskOutcome === 'bonus'
                    ? 'bg-green-500/[0.08] border-green-500/20 text-green-500'
                    : 'bg-red-500/[0.08] border-red-500/20 text-red-500'
                }`}
              >
                <span aria-hidden="true">{lastResult.riskOutcome === 'bonus' ? '🎉 ' : '⚠️ '}</span>
                {lastResult.riskText}
              </div>
            )}

            {/* Score delta */}
            <div className={`text-[13px] font-bold ${lastResult.score >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {lastResult.score >= 0 ? '+' : ''}{lastResult.score} πόντοι
            </div>
          </div>

          <button
            onClick={() => {
              setShowTurnResult(false);
              setSelectedChoice(null);
              store.nextDay();
            }}
            className="w-full px-6 py-3.5 rounded-[14px] border-none font-bold text-base cursor-pointer transition-all duration-200 mb-2 text-white"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
          >
            <span aria-hidden="true">☀️</span> Επόμενη Μέρα →
          </button>

          {game.mode === 'endless' && (
            <button
              onClick={() => store.endGame()}
              className="w-full px-6 py-3.5 rounded-[14px] font-bold text-[15px] cursor-pointer transition-all duration-200 mb-2 bg-red-500/10 text-red-500 border border-red-500/20"
            >
              <span aria-hidden="true">🏁</span> Τερμάτισε
            </button>
          )}
        </section>
      </div>
    );
  }

  // ── Event / Decision Screen ──
  const event = game.currentEvent;
  if (!event) {
    store.nextDay();
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 font-sans pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-spin" aria-hidden="true">⏳</div>
          <div className="text-slate-400">Φόρτωση ημέρας...</div>
        </div>
      </div>
    );
  }

  const canAffordChoice = (choice: EventChoice): boolean => {
    if (!choice.requiredResources) return true;
    for (const [key, val] of Object.entries(choice.requiredResources)) {
      if (game.resources[key as keyof Resources] < (val as number)) return false;
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans pb-20">
      {/* Header */}
      <header className="px-5 py-4 border-b border-slate-700/[0.08] flex items-center justify-between">
        <h1 className="text-[22px] font-extrabold flex items-center gap-2.5">
          <span aria-hidden="true">⚔️</span> Ημέρα {game.day}
          <span className="text-xs text-slate-500 font-normal">
            / {game.maxDays === 999 ? '∞' : game.maxDays}
          </span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold text-amber-400">
            <span aria-hidden="true">📊</span> {game.score}
          </div>
          <div
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold"
            style={{
              background: `${DIFFICULTY_CONFIG[game.difficulty].color}15`,
              color: DIFFICULTY_CONFIG[game.difficulty].color,
            }}
          >
            <span aria-hidden="true">{DIFFICULTY_CONFIG[game.difficulty].icon}</span> {DIFFICULTY_CONFIG[game.difficulty].label}
          </div>
        </div>
      </header>

      <section className="max-w-[600px] mx-auto px-4">
        {/* Resources */}
        <ResourceDisplay resources={game.resources} />

        {/* Event Card */}
        <div
          className="bg-slate-800/60 rounded-2xl p-5 mb-3 border-2"
          style={{ borderColor: `${SEVERITY_COLORS[event.severity]}30` }}
        >
          {/* Event header */}
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: `${SEVERITY_COLORS[event.severity]}15` }}
              aria-hidden="true"
            >
              {event.icon}
            </div>
            <div className="flex-1">
              <div
                className="text-[11px] font-bold uppercase tracking-wide"
                style={{ color: SEVERITY_COLORS[event.severity] }}
              >
                {event.severity === 'opportunity' ? '🟢 Ευκαιρία' :
                 event.severity === 'critical' ? '🔴 Κρίσιμο' :
                 event.severity === 'warning' ? '🟡 Προσοχή' : '🔵 Πληροφορία'}
              </div>
              <div className="text-[17px] font-bold">{event.title}</div>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {event.description}
          </p>

          {/* Choices */}
          <div className="text-xs text-slate-400 font-semibold mb-2">
            ΕΠΙΛΕΞΕ ΔΡΑΣΗ:
          </div>
          {event.choices.map(choice => {
            const affordable = canAffordChoice(choice);
            const isSelected = selectedChoice === choice.id;

            return (
              <button
                key={choice.id}
                onClick={() => {
                  if (!affordable) return;
                  setSelectedChoice(choice.id);
                }}
                disabled={!affordable}
                aria-pressed={isSelected}
                className={`w-full p-4 rounded-[14px] border-2 text-slate-200 cursor-pointer text-left mb-2.5 transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10'
                    : affordable
                      ? 'border-slate-700/10 bg-slate-900/50'
                      : 'border-red-500/15 bg-red-500/[0.03] opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg" aria-hidden="true">{choice.icon}</span>
                  <span className="text-[15px] font-bold">{choice.label}</span>
                  {choice.risk && (
                    <span className="px-1.5 py-px rounded text-[10px] bg-amber-400/10 text-amber-400 font-semibold">
                      <span aria-hidden="true">🎲</span> {Math.round(choice.risk.probability * 100)}% ρίσκο
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mb-1">{choice.description}</div>
                <EffectPreview effects={choice.effects} resources={game.resources} />
                {!affordable && (
                  <div className="text-[11px] text-red-500 mt-1">
                    <span aria-hidden="true">❌</span> Δεν επαρκούν οι πόροι
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Confirm Button */}
        <button
          onClick={() => {
            if (!selectedChoice) return;
            store.makeChoice(selectedChoice);
            setShowTurnResult(true);
          }}
          disabled={!selectedChoice}
          className={`w-full px-6 py-3.5 rounded-[14px] border-none font-bold text-base cursor-pointer transition-all duration-200 mb-2 text-white ${
            selectedChoice
              ? 'shadow-lg shadow-green-500/30 opacity-100'
              : 'opacity-50 cursor-not-allowed'
          }`}
          style={{
            background: selectedChoice
              ? 'linear-gradient(135deg, #22c55e, #16a34a)'
              : 'rgba(34,197,94,0.1)',
          }}
        >
          {selectedChoice ? '✅ Επιβεβαίωση Απόφασης' : 'Επέλεξε μια δράση...'}
        </button>
      </section>
    </div>
  );
}

export default StationWars;
