import React, { useState, useMemo } from 'react';
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

const SEVERITY_COLORS = {
  info: '#3b82f6',
  warning: '#f59e0b',
  critical: '#ef4444',
  opportunity: '#22c55e',
};

// ─── Styles ──────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', background: '#0f172a', color: '#e2e8f0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
    paddingBottom: 80,
  },
  container: { maxWidth: 600, margin: '0 auto', padding: '0 16px' },
  header: {
    padding: '16px 20px', borderBottom: '1px solid rgba(148,163,184,0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 },
  card: {
    background: 'rgba(30,41,59,0.6)', borderRadius: 16,
    border: '1px solid rgba(148,163,184,0.08)', padding: 20,
    marginBottom: 12,
  },
  resourceBar: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 0',
  },
  barTrack: {
    flex: 1, height: 8, borderRadius: 4,
    background: 'rgba(148,163,184,0.1)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%', borderRadius: 4,
    transition: 'width 0.5s ease, background 0.3s',
  },
  btn: {
    padding: '14px 24px', borderRadius: 14, border: 'none',
    fontWeight: 700, fontSize: 15, cursor: 'pointer',
    transition: 'all 0.2s', width: '100%',
    marginBottom: 8,
  },
  choiceBtn: {
    padding: '16px', borderRadius: 14,
    border: '2px solid rgba(148,163,184,0.1)',
    background: 'rgba(15,23,42,0.5)',
    color: '#e2e8f0', cursor: 'pointer',
    textAlign: 'left' as const, marginBottom: 10,
    transition: 'all 0.2s',
    width: '100%',
  },
};

// ─── Resource Bar Component ─────────────────────────────────

function ResourceDisplay({ resources }: { resources: Resources }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px',
      padding: '12px 16px', borderRadius: 14,
      background: 'rgba(30,41,59,0.5)',
      border: '1px solid rgba(148,163,184,0.06)',
      marginBottom: 12,
    }}>
      {(Object.keys(RESOURCE_CONFIG) as (keyof Resources)[]).map(key => {
        const cfg = RESOURCE_CONFIG[key];
        const value = resources[key];
        const percent = key === 'budget'
          ? Math.max(0, Math.min(100, (value / cfg.max) * 100))
          : Math.max(0, Math.min(100, (value / cfg.max) * 100));
        const isLow = key === 'budget' ? value < 0 : percent < 25;
        const isCritical = key === 'budget' ? value < -500 : percent < 10;

        return (
          <div key={key} style={s.resourceBar}>
            <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{cfg.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 11, marginBottom: 2,
              }}>
                <span style={{ color: '#94a3b8' }}>{cfg.label}</span>
                <span style={{
                  fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                  color: isCritical ? '#ef4444' : isLow ? '#f59e0b' : cfg.color,
                }}>
                  {key === 'budget' ? `${value}€` : value}
                </span>
              </div>
              <div style={s.barTrack}>
                <div style={{
                  ...s.barFill,
                  width: `${Math.max(0, percent)}%`,
                  background: isCritical ? '#ef4444' : isLow ? '#f59e0b' : cfg.color,
                }} />
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
  if (entries.length === 0) return <span style={{ fontSize: 11, color: '#64748b' }}>Χωρίς αλλαγές</span>;

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
      {entries.map(([key, delta]) => {
        const cfg = RESOURCE_CONFIG[key as keyof Resources];
        const isPositive = (delta as number) > 0;
        // Check if this would be dangerous
        const newVal = resources[key as keyof Resources] + (delta as number);
        const isDangerous = key === 'budget' ? newVal < 0 : key === 'rating' ? newVal < 20 : key === 'fleet' ? newVal < 3 : key === 'staff' ? newVal < 2 : false;

        return (
          <span key={key} style={{
            padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: isDangerous
              ? 'rgba(239,68,68,0.15)'
              : isPositive
                ? 'rgba(34,197,94,0.1)'
                : 'rgba(239,68,68,0.08)',
            color: isDangerous ? '#ef4444' : isPositive ? '#22c55e' : '#f87171',
          }}>
            {cfg.icon} {isPositive ? '+' : ''}{delta as number}
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

  // Setup state
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
      <div style={s.page}>
        <div style={s.header}>
          <div style={s.title}>⚔️ Station Wars</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            🎮 {store.totalGamesPlayed} παιχνίδια
          </div>
        </div>

        <div style={s.container}>
          <div style={{ ...s.card, textAlign: 'center', marginTop: 16 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🏢</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Station Wars</h2>
            <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
              Διαχειρίσου τον σταθμό ενοικίασης. Κάθε μέρα φέρνει νέες προκλήσεις.<br />
              Πάρε αποφάσεις, διαχειρίσου πόρους, κράτα τους πελάτες χαρούμενους!
            </p>

            {/* Player name */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4, textAlign: 'left' }}>ΤΟ ΟΝΟΜΑ ΣΟΥ</div>
              <input
                value={playerName}
                onChange={e => {
                  setPlayerName(e.target.value);
                  localStorage.setItem('sw-player-name', e.target.value);
                }}
                placeholder="π.χ. Μιχάλης"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12,
                  border: '1px solid rgba(148,163,184,0.15)',
                  background: 'rgba(15,23,42,0.5)', color: '#e2e8f0',
                  fontSize: 16, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Mode Selection */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, textAlign: 'left' }}>ΛΕΙΤΟΥΡΓΙΑ</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {([
                  { m: 'campaign' as const, label: 'Καμπάνια', icon: '🏆', desc: '30 μέρες' },
                  { m: 'quick' as const, label: 'Γρήγορο', icon: '⚡', desc: '10 μέρες' },
                  { m: 'endless' as const, label: 'Ατέρμονο', icon: '♾️', desc: '∞ μέρες' },
                ]).map(item => (
                  <button
                    key={item.m}
                    onClick={() => setSetupMode(item.m)}
                    style={{
                      flex: 1, padding: '12px 8px', borderRadius: 12,
                      border: setupMode === item.m ? '2px solid #3b82f6' : '2px solid rgba(148,163,184,0.08)',
                      background: setupMode === item.m ? 'rgba(59,130,246,0.1)' : 'rgba(15,23,42,0.4)',
                      color: setupMode === item.m ? '#60a5fa' : '#94a3b8',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 2 }}>{item.icon}</div>
                    {item.label}
                    <div style={{ fontSize: 10, opacity: 0.7 }}>{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, textAlign: 'left' }}>ΔΥΣΚΟΛΙΑ</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(Object.entries(DIFFICULTY_CONFIG) as [StrategyCampaignDifficulty, typeof DIFFICULTY_CONFIG.easy][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setSetupDifficulty(key)}
                    style={{
                      padding: '14px 12px', borderRadius: 12,
                      border: setupDifficulty === key ? `2px solid ${cfg.color}` : '2px solid rgba(148,163,184,0.08)',
                      background: setupDifficulty === key ? `${cfg.color}12` : 'rgba(15,23,42,0.4)',
                      color: setupDifficulty === key ? cfg.color : '#94a3b8',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{cfg.icon} {cfg.label}</div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>{cfg.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start */}
            <button
              onClick={() => {
                store.startGame(playerName || 'Player', setupMode, setupDifficulty);
                setShowSetup(false);
                setShowTurnResult(false);
                setSelectedChoice(null);
              }}
              disabled={!playerName.trim()}
              style={{
                ...s.btn,
                background: playerName.trim()
                  ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(59,130,246,0.15)',
                color: '#fff',
                boxShadow: playerName.trim() ? '0 4px 20px rgba(59,130,246,0.3)' : 'none',
                fontSize: 18,
              }}
            >
              ⚔️ Ξεκίνα!
            </button>
          </div>

          {/* High Scores */}
          {store.highScores.length > 0 && (
            <div style={s.card}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>🏆 Υψηλά Σκορ</div>
              {store.highScores.slice(0, 5).map((hs, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: i < 4 ? '1px solid rgba(148,163,184,0.05)' : 'none',
                }}>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>
                    {['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i]} {hs.difficulty} · {hs.mode} · Ημέρα {hs.day}
                  </span>
                  <span style={{ fontWeight: 700, color: '#f59e0b' }}>{hs.score}</span>
                </div>
              ))}
            </div>
          )}

          {/* Achievements */}
          {store.earnedAchievements.length > 0 && (
            <div style={s.card}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>🎖️ Επιτεύγματα</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {STRATEGY_ACHIEVEMENTS.filter(a => store.earnedAchievements.includes(a.id)).map(a => (
                  <span key={a.id} style={{
                    padding: '6px 10px', borderRadius: 8,
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.15)',
                    fontSize: 12, fontWeight: 600, color: '#f59e0b',
                  }}>
                    {a.icon} {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Game Over / Complete Screen ──
  if (game.isComplete || game.isGameOver) {
    return (
      <div style={s.page}>
        <div style={s.header}>
          <div style={s.title}>⚔️ Station Wars</div>
        </div>
        <div style={s.container}>
          <div style={{
            ...s.card, textAlign: 'center', marginTop: 16,
            border: game.isGameOver
              ? '1px solid rgba(239,68,68,0.3)'
              : '1px solid rgba(34,197,94,0.3)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>
              {game.isGameOver ? '💀' : '🏆'}
            </div>
            <h2 style={{
              fontSize: 24, fontWeight: 800, marginBottom: 8,
              color: game.isGameOver ? '#ef4444' : '#22c55e',
            }}>
              {game.isGameOver ? 'Game Over!' : 'Νίκη! 🎉'}
            </h2>
            {game.gameOverReason && (
              <p style={{ color: '#f87171', fontSize: 14, marginBottom: 12 }}>{game.gameOverReason}</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>{game.score}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Πόντοι</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#3b82f6' }}>{game.day}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Ημέρες</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#8b5cf6' }}>{game.history.length}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Αποφάσεις</div>
              </div>
            </div>

            <ResourceDisplay resources={game.resources} />

            {/* Achievements earned this game */}
            {game.achievements.length > 0 && (
              <div style={{
                padding: '12px 16px', borderRadius: 12, marginBottom: 16,
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.15)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}>🎖️ Νέα Επιτεύγματα!</div>
                {game.achievements.map(id => {
                  const ach = STRATEGY_ACHIEVEMENTS.find(a => a.id === id);
                  return ach ? (
                    <div key={id} style={{ fontSize: 13, marginBottom: 4, color: '#e2e8f0' }}>
                      {ach.icon} <strong>{ach.name}</strong> — {ach.description}
                    </div>
                  ) : null;
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { store.resetGame(); setShowSetup(true); }}
                style={{
                  ...s.btn, flex: 1,
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: '#fff',
                }}
              >
                🔄 Ξανά
              </button>
              <button
                onClick={() => { store.resetGame(); setShowSetup(true); }}
                style={{
                  ...s.btn, flex: 1,
                  background: 'rgba(148,163,184,0.1)',
                  color: '#94a3b8',
                }}
              >
                📋 Μενού
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Turn Result Screen ──
  if (showTurnResult && lastResult) {
    return (
      <div style={s.page}>
        <div style={s.header}>
          <div style={s.title}>⚔️ Ημέρα {game.day}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>📊 {game.score}</div>
        </div>
        <div style={s.container}>
          <ResourceDisplay resources={game.resources} />

          <div style={{
            ...s.card,
            border: lastResult.riskOutcome === 'bonus'
              ? '1px solid rgba(34,197,94,0.3)'
              : lastResult.riskOutcome === 'penalty'
                ? '1px solid rgba(239,68,68,0.3)'
                : '1px solid rgba(148,163,184,0.08)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
              Αποτέλεσμα Μέρας {lastResult.day}
            </div>

            {/* Effects summary */}
            <div style={{ marginBottom: 12 }}>
              <EffectPreview effects={lastResult.effects} resources={lastResult.resourcesBefore} />
            </div>

            {/* Risk outcome */}
            {lastResult.riskOutcome !== 'none' && lastResult.riskText && (
              <div style={{
                padding: '10px 14px', borderRadius: 10, marginBottom: 12,
                background: lastResult.riskOutcome === 'bonus'
                  ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${lastResult.riskOutcome === 'bonus' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                color: lastResult.riskOutcome === 'bonus' ? '#22c55e' : '#ef4444',
                fontSize: 13, fontWeight: 600,
              }}>
                {lastResult.riskOutcome === 'bonus' ? '🎉 ' : '⚠️ '}
                {lastResult.riskText}
              </div>
            )}

            {/* Score delta */}
            <div style={{
              fontSize: 13, color: lastResult.score >= 0 ? '#22c55e' : '#ef4444',
              fontWeight: 700,
            }}>
              {lastResult.score >= 0 ? '+' : ''}{lastResult.score} πόντοι
            </div>
          </div>

          <button
            onClick={() => {
              setShowTurnResult(false);
              setSelectedChoice(null);
              store.nextDay();
            }}
            style={{
              ...s.btn,
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff', fontSize: 16,
            }}
          >
            ☀️ Επόμενη Μέρα →
          </button>

          {game.mode === 'endless' && (
            <button
              onClick={() => store.endGame()}
              style={{
                ...s.btn,
                background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              🏁 Τερμάτισε
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Event / Decision Screen ──
  const event = game.currentEvent;
  if (!event) {
    // Loading next day
    store.nextDay();
    return (
      <div style={{ ...s.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12, animation: 'spin 1s linear infinite' }}>⏳</div>
          <div style={{ color: '#94a3b8' }}>Φόρτωση ημέρας...</div>
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
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.title}>
          ⚔️ Ημέρα {game.day}
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 400 }}>
            / {game.maxDays === 999 ? '∞' : game.maxDays}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>📊 {game.score}</div>
          <div style={{
            padding: '4px 10px', borderRadius: 8, fontSize: 11,
            background: `${DIFFICULTY_CONFIG[game.difficulty].color}15`,
            color: DIFFICULTY_CONFIG[game.difficulty].color,
            fontWeight: 700,
          }}>
            {DIFFICULTY_CONFIG[game.difficulty].icon} {DIFFICULTY_CONFIG[game.difficulty].label}
          </div>
        </div>
      </div>

      <div style={s.container}>
        {/* Resources */}
        <ResourceDisplay resources={game.resources} />

        {/* Event Card */}
        <div style={{
          ...s.card,
          borderColor: `${SEVERITY_COLORS[event.severity]}30`,
          borderWidth: 2,
        }}>
          {/* Event header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${SEVERITY_COLORS[event.severity]}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>
              {event.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                color: SEVERITY_COLORS[event.severity],
                letterSpacing: 0.5,
              }}>
                {event.severity === 'opportunity' ? '🟢 Ευκαιρία' :
                 event.severity === 'critical' ? '🔴 Κρίσιμο' :
                 event.severity === 'warning' ? '🟡 Προσοχή' : '🔵 Πληροφορία'}
              </div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{event.title}</div>
            </div>
          </div>

          <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 16 }}>
            {event.description}
          </p>

          {/* Choices */}
          <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, marginBottom: 8 }}>
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
                style={{
                  ...s.choiceBtn,
                  borderColor: isSelected ? '#3b82f6' : affordable ? 'rgba(148,163,184,0.1)' : 'rgba(239,68,68,0.15)',
                  background: isSelected ? 'rgba(59,130,246,0.1)' : affordable ? 'rgba(15,23,42,0.5)' : 'rgba(239,68,68,0.03)',
                  opacity: affordable ? 1 : 0.5,
                  cursor: affordable ? 'pointer' : 'not-allowed',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>{choice.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{choice.label}</span>
                  {choice.risk && (
                    <span style={{
                      padding: '1px 6px', borderRadius: 4, fontSize: 10,
                      background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 600,
                    }}>
                      🎲 {Math.round(choice.risk.probability * 100)}% ρίσκο
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{choice.description}</div>
                <EffectPreview effects={choice.effects} resources={game.resources} />
                {!affordable && (
                  <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>
                    ❌ Δεν επαρκούν οι πόροι
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
          style={{
            ...s.btn,
            background: selectedChoice
              ? 'linear-gradient(135deg, #22c55e, #16a34a)'
              : 'rgba(34,197,94,0.1)',
            color: '#fff',
            fontSize: 16,
            boxShadow: selectedChoice ? '0 4px 20px rgba(34,197,94,0.3)' : 'none',
            cursor: selectedChoice ? 'pointer' : 'not-allowed',
            opacity: selectedChoice ? 1 : 0.5,
          }}
        >
          {selectedChoice ? '✅ Επιβεβαίωση Απόφασης' : 'Επέλεξε μια δράση...'}
        </button>
      </div>
    </div>
  );
}

export default StationWars;
