import React, { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useGameStore } from '../../store/gameStore';
import { CHAT_USERS } from '../../data/chatData';
import type {
  GameCategory, GameMode, GameSession, GameAnswer, PlayerProfile,
  LeaderboardPeriod,
} from '../../types/game';
import { GAME_CATEGORIES_INFO, getLevelInfo, getLevel } from '../../types/game';

const StationWars = lazy(() => import('./StationWars'));

// ─── Station Challenge — Full Game UI ────────────────────────

// ── Inline styles ──

const g: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', background: '#0f172a', color: '#e2e8f0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
    paddingBottom: 80,
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px 12px', borderBottom: '1px solid rgba(148,163,184,0.08)',
  },
  title: { fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 },
  streakBadge: {
    background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: 13,
    padding: '4px 10px', borderRadius: 12, fontWeight: 600,
  },
  tabs: {
    display: 'flex', gap: 2, padding: '12px 20px',
    background: 'rgba(30,41,59,0.5)', margin: '0 0 8px',
    overflowX: 'auto',
  },
  tab: {
    padding: '8px 16px', borderRadius: 10, background: 'none',
    border: '1px solid transparent', color: '#94a3b8', fontSize: 13,
    fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  tabActive: {
    background: 'rgba(59,130,246,0.15)', color: '#60a5fa',
    borderColor: 'rgba(59,130,246,0.3)',
  },
  section: { padding: '16px 20px' },
  card: {
    background: 'rgba(30,41,59,0.6)', borderRadius: 14,
    border: '1px solid rgba(148,163,184,0.08)', padding: 20,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12 },
  btn: {
    padding: '12px 24px', borderRadius: 12, border: 'none',
    fontWeight: 600, fontSize: 14, cursor: 'pointer',
    transition: 'all 0.2s',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: '#fff', boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
  },
  btnSecondary: {
    background: 'rgba(148,163,184,0.1)', color: '#94a3b8',
    border: '1px solid rgba(148,163,184,0.15)',
  },
  btnDanger: {
    background: 'rgba(239,68,68,0.15)', color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.2)',
  },
  // Game play
  questionCard: {
    background: 'rgba(30,41,59,0.8)', borderRadius: 16,
    border: '1px solid rgba(148,163,184,0.1)', padding: 24,
    marginBottom: 16,
  },
  questionText: { fontSize: 18, fontWeight: 600, lineHeight: 1.5, marginBottom: 20 },
  optionBtn: {
    display: 'block', width: '100%', padding: '14px 18px',
    borderRadius: 12, border: '2px solid rgba(148,163,184,0.15)',
    background: 'rgba(15,23,42,0.6)', color: '#e2e8f0',
    fontSize: 15, fontWeight: 500, cursor: 'pointer',
    textAlign: 'left' as const, marginBottom: 8,
    transition: 'all 0.2s',
  },
  optionCorrect: {
    borderColor: '#22c55e', background: 'rgba(34,197,94,0.1)', color: '#22c55e',
  },
  optionWrong: {
    borderColor: '#ef4444', background: 'rgba(239,68,68,0.1)', color: '#ef4444',
  },
  optionSelected: {
    borderColor: '#3b82f6', background: 'rgba(59,130,246,0.1)',
  },
  progressBar: {
    width: '100%', height: 6, borderRadius: 3,
    background: 'rgba(148,163,184,0.1)', overflow: 'hidden', marginBottom: 16,
  },
  progressFill: {
    height: '100%', borderRadius: 3,
    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    transition: 'width 0.4s ease',
  },
  timer: {
    fontSize: 28, fontWeight: 700, color: '#f59e0b', textAlign: 'center' as const,
    marginBottom: 12, fontVariantNumeric: 'tabular-nums',
  },
  timerDanger: { color: '#ef4444', animation: 'pulse 0.5s infinite' },
  meta: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 12, color: '#64748b', marginBottom: 12,
  },
  catBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
  },
  diffDots: { display: 'flex', gap: 3 },
  dot: { width: 8, height: 8, borderRadius: '50%', background: '#334155' },
  dotActive: { background: '#f59e0b' },
  // Leaderboard
  lbRow: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
    borderRadius: 12, marginBottom: 6,
    background: 'rgba(30,41,59,0.4)',
  },
  lbRank: { fontSize: 18, fontWeight: 700, width: 32, textAlign: 'center' as const },
  lbName: { flex: 1, fontWeight: 500 },
  lbScore: { fontWeight: 700, color: '#f59e0b', fontSize: 15 },
  // Results
  resultsBig: {
    textAlign: 'center' as const, padding: '32px 20px',
  },
  resultScore: {
    fontSize: 48, fontWeight: 800,
    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    marginBottom: 8,
  },
  resultSubtitle: { fontSize: 16, color: '#94a3b8', marginBottom: 24 },
  statGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
    marginBottom: 24,
  },
  statCell: {
    background: 'rgba(15,23,42,0.5)', borderRadius: 12, padding: 16,
    textAlign: 'center' as const,
  },
  statValue: { fontSize: 24, fontWeight: 700, marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#64748b', textTransform: 'uppercase' as const },
  // Profile
  profileHeader: {
    display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20,
  },
  avatar: {
    width: 56, height: 56, borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 28,
    background: 'rgba(59,130,246,0.15)', border: '3px solid',
  },
  xpBar: {
    width: '100%', height: 10, borderRadius: 5,
    background: 'rgba(148,163,184,0.1)', overflow: 'hidden', marginTop: 8,
  },
  xpFill: {
    height: '100%', borderRadius: 5,
    background: 'linear-gradient(90deg, #3b82f6, #a855f7)',
    transition: 'width 0.5s ease',
  },
  badgeGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: 8, marginTop: 12,
  },
  badgeCell: {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    gap: 4, padding: '12px 8px', borderRadius: 12,
    background: 'rgba(30,41,59,0.4)', fontSize: 11, textAlign: 'center' as const,
  },
  badgeIcon: { fontSize: 28 },
  // Category grid
  catGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
    marginBottom: 20,
  },
  catCard: {
    padding: '16px 14px', borderRadius: 14, cursor: 'pointer',
    border: '2px solid transparent', transition: 'all 0.2s',
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
    gap: 6, textAlign: 'center' as const,
  },
  catIcon: { fontSize: 32 },
  catLabel: { fontSize: 13, fontWeight: 600 },
};

// ── Helper to resolve user name from chat data ──
function getUserName(userId: string): string {
  return CHAT_USERS.find(u => u.id === userId)?.name || userId;
}
function getUserAvatar(userId: string): string {
  return CHAT_USERS.find(u => u.id === userId)?.avatar || '👤';
}
function getUserTeam(userId: string): string {
  return CHAT_USERS.find(u => u.id === userId)?.group || '';
}

// ── Timer component ──
function CountdownTimer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    setRemaining(seconds);
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [seconds, onExpire]);

  return (
    <div style={{ ...g.timer, ...(remaining <= 5 ? g.timerDanger : {}) }}>
      {remaining}s
    </div>
  );
}

// ── Difficulty dots ──
function DifficultyDots({ level }: { level: number }) {
  return (
    <div style={g.diffDots}>
      {[1, 2, 3, 4, 5].map(d => (
        <div key={d} style={{ ...g.dot, ...(d <= level ? g.dotActive : {}) }} />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ── Main Game Component ──────────────────────────────────────
// ══════════════════════════════════════════════════════════════

export function GamePage() {
  const { currentProfile } = useAuthStore();
  const {
    players, currentSession, activeTab, selectedCategory,
    initPlayer, startGame, submitAnswer, skipQuestion, finishGame,
    getLeaderboard, setActiveTab, setSelectedCategory, canPlayDaily, getStreak,
  } = useGameStore();

  const userId = currentProfile?.id || '';
  const userTeam = currentProfile?.group;

  // Initialize player on mount
  useEffect(() => {
    if (userId) {
      initPlayer(userId, userTeam as 'ΟΜΑΔΑ Α' | 'ΟΜΑΔΑ Β' | undefined);
    }
  }, [userId, userTeam, initPlayer]);

  const player = players[userId];
  const streak = getStreak(userId);

  // If there's an active session, show the game play UI
  if (currentSession && !currentSession.isComplete) {
    return <GamePlay />;
  }

  if (currentSession && currentSession.isComplete) {
    return <GameResults />;
  }

  return (
    <div style={g.page}>
      {/* Header */}
      <div style={g.header}>
        <div style={g.title}>
          <span>🎮</span>
          <span>Station Challenge</span>
        </div>
        {streak > 0 && (
          <div style={g.streakBadge}>🔥 {streak} ημέρες</div>
        )}
      </div>

      {/* Tabs */}
      <div style={g.tabs}>
        {(['play', 'strategy', 'leaderboard', 'profile', 'practice'] as const).map(tab => (
          <button
            key={tab}
            style={{ ...g.tab, ...(activeTab === tab ? g.tabActive : {}) }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'play' && '⚡ Παίξε'}
            {tab === 'strategy' && '⚔️ Station Wars'}
            {tab === 'leaderboard' && '🏆 Κατάταξη'}
            {tab === 'profile' && '👤 Προφίλ'}
            {tab === 'practice' && '📚 Εξάσκηση'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'play' && <PlayTab userId={userId} />}
      {activeTab === 'strategy' && (
        <Suspense fallback={<div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>⏳ Φόρτωση...</div>}>
          <StationWars />
        </Suspense>
      )}
      {activeTab === 'leaderboard' && <LeaderboardTab />}
      {activeTab === 'profile' && <ProfileTab userId={userId} />}
      {activeTab === 'practice' && <PracticeTab userId={userId} />}
    </div>
  );
}

// ── Play Tab ──

function PlayTab({ userId }: { userId: string }) {
  const { startGame, canPlayDaily } = useGameStore();
  const dailyAvailable = canPlayDaily(userId);

  return (
    <div style={g.section}>
      {/* Daily Sprint */}
      <div style={g.card}>
        <div style={g.cardTitle}>⚡ Ημερήσιο Sprint</div>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
          5 ερωτήσεις, 30 δευτερόλεπτα η καθεμιά. Μία φορά τη μέρα!
        </p>
        <button
          style={{ ...g.btn, ...(dailyAvailable ? g.btnPrimary : g.btnSecondary) }}
          onClick={() => dailyAvailable && startGame(userId, 'daily_sprint')}
          disabled={!dailyAvailable}
        >
          {dailyAvailable ? '🎮 Ξεκίνα' : '✅ Έπαιξες σήμερα'}
        </button>
      </div>

      {/* Weekly Tournament */}
      <div style={g.card}>
        <div style={g.cardTitle}>🏆 Εβδομαδιαίο Τουρνουά</div>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
          20 ερωτήσεις από όλες τις κατηγορίες. Κορυφή 3 = Badges!
        </p>
        <button
          style={{ ...g.btn, ...g.btnPrimary }}
          onClick={() => startGame(userId, 'weekly_tournament')}
        >
          🏅 Συμμετοχή
        </button>
      </div>

      {/* Team Battle */}
      <div style={g.card}>
        <div style={g.cardTitle}>👥 Ομαδική Μάχη</div>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
          Η βαθμολογία σου πάει στην ομάδα σου! ΟΜΑΔΑ Α vs ΟΜΑΔΑ Β
        </p>
        <button
          style={{ ...g.btn, ...g.btnPrimary }}
          onClick={() => startGame(userId, 'team_battle')}
        >
          ⚔️ Παίξε για την ομάδα
        </button>
      </div>

      {/* Speed Run */}
      <div style={g.card}>
        <div style={g.cardTitle}>🏁 Speed Run</div>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
          30 ερωτήσεις — απάντησε όσο πιο γρήγορα μπορείς!
        </p>
        <button
          style={{ ...g.btn, ...g.btnSecondary }}
          onClick={() => startGame(userId, 'speed_run')}
        >
          🏁 Ξεκίνα
        </button>
      </div>
    </div>
  );
}

// ── Practice Tab ──

function PracticeTab({ userId }: { userId: string }) {
  const { startGame, setSelectedCategory, selectedCategory } = useGameStore();

  return (
    <div style={g.section}>
      <div style={{ ...g.card, padding: 16 }}>
        <div style={g.cardTitle}>📚 Εξάσκηση κατά κατηγορία</div>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
          Χωρίς σκορ. Μάθε και εξασκήσου!
        </p>

        <div style={g.catGrid}>
          {(Object.entries(GAME_CATEGORIES_INFO) as [GameCategory, typeof GAME_CATEGORIES_INFO[GameCategory]][]).map(([key, info]) => (
            <div
              key={key}
              style={{
                ...g.catCard,
                background: selectedCategory === key ? `${info.color}22` : 'rgba(30,41,59,0.4)',
                borderColor: selectedCategory === key ? info.color : 'transparent',
              }}
              onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
            >
              <span style={g.catIcon}>{info.icon}</span>
              <span style={g.catLabel}>{info.label}</span>
            </div>
          ))}
        </div>

        <button
          style={{ ...g.btn, ...g.btnPrimary, width: '100%' }}
          onClick={() => startGame(userId, 'practice', selectedCategory || undefined)}
        >
          🎯 Ξεκίνα Εξάσκηση {selectedCategory ? `(${GAME_CATEGORIES_INFO[selectedCategory].label})` : '(Όλα)'}
        </button>
      </div>
    </div>
  );
}

// ── Leaderboard Tab ──

function LeaderboardTab() {
  const { getLeaderboard } = useGameStore();
  const [period, setPeriod] = useState<LeaderboardPeriod>('allTime');
  const entries = getLeaderboard(period);

  return (
    <div style={g.section}>
      {/* Period toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['daily', 'weekly', 'monthly', 'allTime'] as const).map(p => (
          <button
            key={p}
            style={{ ...g.tab, ...(period === p ? g.tabActive : {}), padding: '6px 12px', fontSize: 12 }}
            onClick={() => setPeriod(p)}
          >
            {p === 'daily' && 'Σήμερα'}
            {p === 'weekly' && 'Εβδομάδα'}
            {p === 'monthly' && 'Μήνας'}
            {p === 'allTime' && 'Σύνολο'}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div style={{ ...g.card, textAlign: 'center', color: '#64748b', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
          Κανένα παιχνίδι ακόμα — ξεκίνα πρώτος!
        </div>
      ) : (
        entries.map((entry, i) => {
          const name = getUserName(entry.userId);
          const avatar = getUserAvatar(entry.userId);
          const team = getUserTeam(entry.userId);
          const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
          return (
            <div key={entry.userId} style={{
              ...g.lbRow,
              background: i < 3 ? 'rgba(245,158,11,0.06)' : 'rgba(30,41,59,0.4)',
              border: i < 3 ? '1px solid rgba(245,158,11,0.15)' : '1px solid transparent',
            }}>
              <div style={g.lbRank}>{rankIcon}</div>
              <span style={{ fontSize: 22 }}>{avatar}</span>
              <div style={g.lbName}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{team} · {entry.accuracy}% ακρίβεια</div>
              </div>
              <div style={g.lbScore}>{entry.score} XP</div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Profile Tab ──

function ProfileTab({ userId }: { userId: string }) {
  const { players } = useGameStore();
  const player = players[userId];

  if (!player) {
    return (
      <div style={{ ...g.section, textAlign: 'center', color: '#64748b', paddingTop: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎮</div>
        Παίξε το πρώτο σου παιχνίδι για να δεις το προφίλ σου!
      </div>
    );
  }

  const levelInfo = getLevelInfo(player.level);
  const nextLevelInfo = getLevel(player.xp) === 'legend' ? null : getLevelInfo(
    getLevel(player.xp + 1) !== player.level ? getLevel(player.xp + 1) : player.level
  );
  const currentLevelMin = levelInfo.minXp;
  const nextLevelXp = nextLevelInfo ? (() => {
    const levels: [number, string][] = [[100, 'agent'], [500, 'specialist'], [1500, 'expert'], [4000, 'master'], [10000, 'legend']];
    return levels.find(([xp]) => xp > player.xp)?.[0] || 10000;
  })() : player.xp;
  const xpProgress = nextLevelXp > currentLevelMin
    ? ((player.xp - currentLevelMin) / (nextLevelXp - currentLevelMin)) * 100
    : 100;

  const accuracy = player.totalAnswered > 0
    ? Math.round((player.totalCorrect / player.totalAnswered) * 100)
    : 0;

  return (
    <div style={g.section}>
      {/* Profile header */}
      <div style={g.profileHeader}>
        <div style={{ ...g.avatar, borderColor: levelInfo.color }}>
          {levelInfo.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{getUserName(userId)}</div>
          <div style={{ fontSize: 13, color: levelInfo.color, fontWeight: 600 }}>
            {levelInfo.label} · {player.xp} XP
          </div>
          <div style={g.xpBar}>
            <div style={{ ...g.xpFill, width: `${Math.min(100, xpProgress)}%` }} />
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            {nextLevelXp > player.xp ? `${nextLevelXp - player.xp} XP μέχρι το επόμενο level` : 'Μέγιστο level!'}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={g.statGrid}>
        <div style={g.statCell}>
          <div style={g.statValue}>{player.gamesPlayed}</div>
          <div style={g.statLabel}>Παιχνίδια</div>
        </div>
        <div style={g.statCell}>
          <div style={g.statValue}>{accuracy}%</div>
          <div style={g.statLabel}>Ακρίβεια</div>
        </div>
        <div style={g.statCell}>
          <div style={{ ...g.statValue, color: '#f59e0b' }}>🔥 {player.streak}</div>
          <div style={g.statLabel}>Streak</div>
        </div>
      </div>

      {/* Category breakdown */}
      <div style={{ ...g.card, padding: 16 }}>
        <div style={g.cardTitle}>📊 Κατηγορίες</div>
        {(Object.entries(GAME_CATEGORIES_INFO) as [GameCategory, typeof GAME_CATEGORIES_INFO[GameCategory]][]).map(([key, info]) => {
          const cat = player.categoryScores[key];
          const pct = cat.total > 0 ? Math.round((cat.correct / cat.total) * 100) : 0;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{info.icon}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{info.label}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{cat.correct}/{cat.total}</span>
              <div style={{ width: 60, height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.1)' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: info.color }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: info.color, width: 36, textAlign: 'right' }}>{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Badges */}
      <div style={{ ...g.card, padding: 16 }}>
        <div style={g.cardTitle}>🏅 Badges ({player.badges.length})</div>
        {player.badges.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: 13, textAlign: 'center', padding: 20 }}>
            Κέρδισε badges παίζοντας! 🎯
          </div>
        ) : (
          <div style={g.badgeGrid}>
            {player.badges.map(badge => (
              <div key={badge.id} style={g.badgeCell}>
                <span style={g.badgeIcon}>{badge.icon}</span>
                <span>{badge.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ── Game Play Screen ─────────────────────────────────────────
// ══════════════════════════════════════════════════════════════

function GamePlay() {
  const { currentSession, submitAnswer, skipQuestion } = useGameStore();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answered, setAnswered] = useState(false);

  if (!currentSession) return null;

  const question = currentSession.questions[currentSession.currentIndex];
  if (!question) return null;

  const progress = ((currentSession.currentIndex) / currentSession.questions.length) * 100;
  const catInfo = GAME_CATEGORIES_INFO[question.category];

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelectedOption(index);
    setAnswered(true);
    setShowResult(true);

    // Auto-advance after 1.5 seconds
    setTimeout(() => {
      submitAnswer(index);
      setSelectedOption(null);
      setShowResult(false);
      setAnswered(false);
    }, 1500);
  };

  const handleExpire = useCallback(() => {
    if (!answered) {
      setAnswered(true);
      setShowResult(true);
      setTimeout(() => {
        skipQuestion();
        setSelectedOption(null);
        setShowResult(false);
        setAnswered(false);
      }, 1500);
    }
  }, [answered, skipQuestion]);

  return (
    <div style={g.page}>
      {/* Progress */}
      <div style={{ padding: '16px 20px 8px' }}>
        <div style={g.meta}>
          <span>Ερώτηση {currentSession.currentIndex + 1}/{currentSession.questions.length}</span>
          <span style={{ fontWeight: 600, color: '#f59e0b' }}>{currentSession.score} XP</span>
        </div>
        <div style={g.progressBar}>
          <div style={{ ...g.progressFill, width: `${progress}%` }} />
        </div>
      </div>

      {/* Timer */}
      {!answered && (
        <CountdownTimer
          key={`timer-${currentSession.currentIndex}`}
          seconds={question.timeLimitSec}
          onExpire={handleExpire}
        />
      )}

      {/* Question */}
      <div style={{ padding: '0 20px' }}>
        <div style={g.questionCard}>
          <div style={g.meta}>
            <span style={{
              ...g.catBadge,
              background: `${catInfo.color}22`,
              color: catInfo.color,
            }}>
              {catInfo.icon} {catInfo.label}
            </span>
            <DifficultyDots level={question.difficulty} />
          </div>

          <div style={g.questionText}>{question.text}</div>

          {/* Options */}
          {question.options.map((opt, i) => {
            let optStyle = { ...g.optionBtn };
            if (showResult) {
              if (i === question.correctIndex) {
                optStyle = { ...optStyle, ...g.optionCorrect };
              } else if (i === selectedOption && i !== question.correctIndex) {
                optStyle = { ...optStyle, ...g.optionWrong };
              }
            } else if (i === selectedOption) {
              optStyle = { ...optStyle, ...g.optionSelected };
            }

            return (
              <button
                key={i}
                style={optStyle}
                onClick={() => handleSelect(i)}
                disabled={answered}
              >
                <span style={{ marginRight: 10, opacity: 0.5, fontWeight: 600 }}>
                  {String.fromCharCode(65 + i)})
                </span>
                {opt}
              </button>
            );
          })}

          {/* Explanation after answer */}
          {showResult && question.explanation && (
            <div style={{
              marginTop: 16, padding: '12px 16px', borderRadius: 10,
              background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)',
              fontSize: 13, color: '#94a3b8', lineHeight: 1.5,
            }}>
              💡 {question.explanation}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ── Game Results Screen ──────────────────────────────────────
// ══════════════════════════════════════════════════════════════

function GameResults() {
  const { currentSession, finishGame, players } = useGameStore();

  if (!currentSession) return null;

  const totalQuestions = currentSession.questions.length;
  const correctCount = currentSession.answers.filter(a => a.isCorrect).length;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const avgTime = currentSession.answers.length > 0
    ? Math.round(currentSession.answers.reduce((s, a) => s + a.timeMs, 0) / currentSession.answers.length / 1000 * 10) / 10
    : 0;
  const isPerfect = correctCount === totalQuestions;

  const player = players[currentSession.playerId];
  const levelInfo = player ? getLevelInfo(player.level) : null;

  return (
    <div style={g.page}>
      <div style={g.resultsBig}>
        {isPerfect && <div style={{ fontSize: 64, marginBottom: 8 }}>🎉</div>}
        <div style={g.resultScore}>{currentSession.score} XP</div>
        <div style={g.resultSubtitle}>
          {isPerfect ? 'Τέλειο σκορ! 🏆' : correctCount >= totalQuestions * 0.8 ? 'Εξαιρετικά! 🌟' : correctCount >= totalQuestions * 0.5 ? 'Καλή δουλειά! 👍' : 'Συνέχισε να εξασκείσαι! 💪'}
        </div>

        {/* Stats grid */}
        <div style={g.statGrid}>
          <div style={g.statCell}>
            <div style={{ ...g.statValue, color: '#22c55e' }}>{correctCount}/{totalQuestions}</div>
            <div style={g.statLabel}>Σωστές</div>
          </div>
          <div style={g.statCell}>
            <div style={g.statValue}>{accuracy}%</div>
            <div style={g.statLabel}>Ακρίβεια</div>
          </div>
          <div style={g.statCell}>
            <div style={g.statValue}>{avgTime}s</div>
            <div style={g.statLabel}>Μ.Ο. Χρόνος</div>
          </div>
        </div>

        {/* Player level */}
        {levelInfo && (
          <div style={{
            ...g.card, display: 'flex', alignItems: 'center',
            gap: 12, justifyContent: 'center', padding: '16px 20px',
          }}>
            <span style={{ fontSize: 28 }}>{levelInfo.icon}</span>
            <div>
              <div style={{ fontWeight: 700, color: levelInfo.color }}>{levelInfo.label}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{player!.xp} XP Total</div>
            </div>
          </div>
        )}

        {/* Answer breakdown */}
        <div style={{ ...g.card, padding: 16, textAlign: 'left' }}>
          <div style={g.cardTitle}>📋 Ανάλυση Απαντήσεων</div>
          {currentSession.answers.map((ans, i) => {
            const q = currentSession.questions[i];
            const catInfo = GAME_CATEGORIES_INFO[q.category];
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 0', borderBottom: i < currentSession.answers.length - 1 ? '1px solid rgba(148,163,184,0.06)' : 'none',
              }}>
                <span style={{ fontSize: 16 }}>{ans.isCorrect ? '✅' : '❌'}</span>
                <span style={{ fontSize: 14 }}>{catInfo.icon}</span>
                <span style={{ flex: 1, fontSize: 13, color: '#cbd5e1' }}>{q.text.slice(0, 50)}...</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {Math.round(ans.timeMs / 1000)}s
                </span>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
          <button
            style={{ ...g.btn, ...g.btnPrimary }}
            onClick={finishGame}
          >
            🏠 Αρχική
          </button>
        </div>
      </div>
    </div>
  );
}

export default GamePage;
