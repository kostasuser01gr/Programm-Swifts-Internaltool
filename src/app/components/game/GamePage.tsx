import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
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

// Tailwind classes used directly in JSX — no inline style objects needed

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
    <div className={`text-[28px] font-bold text-center mb-3 tabular-nums ${remaining <= 5 ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
      {remaining}s
    </div>
  );
}

// ── Difficulty dots ──
function DifficultyDots({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Δυσκολία ${level}/5`}>
      {[1, 2, 3, 4, 5].map(d => (
        <div key={d} className={`w-2 h-2 rounded-full ${d <= level ? 'bg-amber-500' : 'bg-slate-700'}`} />
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
    <div className="min-h-screen bg-slate-900 text-slate-200 pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-500/8">
        <h1 className="text-[22px] font-bold flex items-center gap-2.5">
          <span aria-hidden="true">🎮</span>
          <span>Station Challenge</span>
        </h1>
        {streak > 0 && (
          <div className="bg-amber-500/15 text-amber-500 text-[13px] px-2.5 py-1 rounded-xl font-semibold">🔥 {streak} ημέρες</div>
        )}
      </header>

      {/* Tabs */}
      <nav className="flex gap-0.5 px-5 py-3 bg-slate-800/50 mb-2 overflow-x-auto" role="tablist" aria-label="Ενότητες παιχνιδιού">
        {(['play', 'strategy', 'leaderboard', 'profile', 'practice'] as const).map(tab => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-[10px] border text-[13px] font-medium cursor-pointer whitespace-nowrap transition-all ${activeTab === tab ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'}`}
            onClick={() => setActiveTab(tab)}
            role="tab"
            aria-selected={activeTab === tab}
          >
            {tab === 'play' && '⚡ Παίξε'}
            {tab === 'strategy' && '⚔️ Station Wars'}
            {tab === 'leaderboard' && '🏆 Κατάταξη'}
            {tab === 'profile' && '👤 Προφίλ'}
            {tab === 'practice' && '📚 Εξάσκηση'}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      {activeTab === 'play' && <PlayTab userId={userId} />}
      {activeTab === 'strategy' && (
        <Suspense fallback={<div className="text-center py-10 text-slate-400">⏳ Φόρτωση...</div>}>
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
    <div className="px-5 py-4">
      {/* Daily Sprint */}
      <div className="bg-slate-800/60 rounded-[14px] border border-slate-500/8 p-5 mb-3">
        <div className="text-base font-semibold mb-3">⚡ Ημερήσιο Sprint</div>
        <p className="text-[13px] text-slate-400 mb-4">
          5 ερωτήσεις, 30 δευτερόλεπτα η καθεμιά. Μία φορά τη μέρα!
        </p>
        <button
          className={`px-6 py-3 rounded-xl border-none font-semibold text-sm cursor-pointer transition-all duration-200 ${dailyAvailable ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]' : 'bg-slate-500/10 text-slate-400 border border-slate-500/15'}`}
          onClick={() => dailyAvailable && startGame(userId, 'daily_sprint')}
          disabled={!dailyAvailable}
        >
          {dailyAvailable ? '🎮 Ξεκίνα' : '✅ Έπαιξες σήμερα'}
        </button>
      </div>

      {/* Weekly Tournament */}
      <div className="bg-slate-800/60 rounded-[14px] border border-slate-500/8 p-5 mb-3">
        <div className="text-base font-semibold mb-3">🏆 Εβδομαδιαίο Τουρνουά</div>
        <p className="text-[13px] text-slate-400 mb-4">
          20 ερωτήσεις από όλες τις κατηγορίες. Κορυφή 3 = Badges!
        </p>
        <button
          className="px-6 py-3 rounded-xl border-none font-semibold text-sm cursor-pointer transition-all duration-200 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
          onClick={() => startGame(userId, 'weekly_tournament')}
        >
          🏅 Συμμετοχή
        </button>
      </div>

      {/* Team Battle */}
      <div className="bg-slate-800/60 rounded-[14px] border border-slate-500/8 p-5 mb-3">
        <div className="text-base font-semibold mb-3">👥 Ομαδική Μάχη</div>
        <p className="text-[13px] text-slate-400 mb-4">
          Η βαθμολογία σου πάει στην ομάδα σου! ΟΜΑΔΑ Α vs ΟΜΑΔΑ Β
        </p>
        <button
          className="px-6 py-3 rounded-xl border-none font-semibold text-sm cursor-pointer transition-all duration-200 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
          onClick={() => startGame(userId, 'team_battle')}
        >
          ⚔️ Παίξε για την ομάδα
        </button>
      </div>

      {/* Speed Run */}
      <div className="bg-slate-800/60 rounded-[14px] border border-slate-500/8 p-5 mb-3">
        <div className="text-base font-semibold mb-3">🏁 Speed Run</div>
        <p className="text-[13px] text-slate-400 mb-4">
          30 ερωτήσεις — απάντησε όσο πιο γρήγορα μπορείς!
        </p>
        <button
          className="px-6 py-3 rounded-xl border-none font-semibold text-sm cursor-pointer transition-all duration-200 bg-slate-500/10 text-slate-400 border border-slate-500/15"
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
    <div className="px-5 py-4">
      <div className="bg-slate-800/60 rounded-[14px] border border-slate-500/8 p-4 mb-3">
        <div className="text-base font-semibold mb-3">📚 Εξάσκηση κατά κατηγορία</div>
        <p className="text-[13px] text-slate-400 mb-4">
          Χωρίς σκορ. Μάθε και εξασκήσου!
        </p>

        <div className="grid grid-cols-2 gap-2.5 mb-5" role="listbox" aria-label="Κατηγορίες">
          {(Object.entries(GAME_CATEGORIES_INFO) as [GameCategory, typeof GAME_CATEGORIES_INFO[GameCategory]][]).map(([key, info]) => (
            <button
              key={key}
              className={`px-3.5 py-4 rounded-[14px] cursor-pointer border-2 transition-all duration-200 flex flex-col items-center gap-1.5 text-center ${selectedCategory === key ? 'border-current' : 'border-transparent bg-slate-800/40 hover:bg-slate-700/40'}`}
              style={selectedCategory === key ? { background: `${info.color}22`, borderColor: info.color, color: info.color } : undefined}
              onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
              role="option"
              aria-selected={selectedCategory === key}
            >
              <span className="text-[32px]" aria-hidden="true">{info.icon}</span>
              <span className="text-[13px] font-semibold">{info.label}</span>
            </button>
          ))}
        </div>

        <button
          className="w-full px-6 py-3 rounded-xl border-none font-semibold text-sm cursor-pointer transition-all duration-200 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
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
    <div className="px-5 py-4">
      {/* Period toggle */}
      <div className="flex gap-1.5 mb-4" role="tablist" aria-label="Περίοδος κατάταξης">
        {(['daily', 'weekly', 'monthly', 'allTime'] as const).map(p => (
          <button
            key={p}
            className={`px-3 py-1.5 rounded-[10px] border text-xs font-medium cursor-pointer whitespace-nowrap transition-all ${period === p ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'}`}
            onClick={() => setPeriod(p)}
            role="tab"
            aria-selected={period === p}
          >
            {p === 'daily' && 'Σήμερα'}
            {p === 'weekly' && 'Εβδομάδα'}
            {p === 'monthly' && 'Μήνας'}
            {p === 'allTime' && 'Σύνολο'}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="bg-slate-800/60 rounded-[14px] border border-slate-500/8 p-10 text-center text-slate-500">
          <div className="text-[40px] mb-3" aria-hidden="true">🏆</div>
          Κανένα παιχνίδι ακόμα — ξεκίνα πρώτος!
        </div>
      ) : (
        entries.map((entry, i) => {
          const name = getUserName(entry.userId);
          const avatar = getUserAvatar(entry.userId);
          const team = getUserTeam(entry.userId);
          const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
          return (
            <div key={entry.userId} className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1.5 ${i < 3 ? 'bg-amber-500/[0.06] border border-amber-500/15' : 'bg-slate-800/40 border border-transparent'}`}>
              <div className="text-lg font-bold w-8 text-center">{rankIcon}</div>
              <span className="text-[22px]" aria-hidden="true">{avatar}</span>
              <div className="flex-1 font-medium">
                <div className="font-semibold text-sm">{name}</div>
                <div className="text-[11px] text-slate-500">{team} · {entry.accuracy}% ακρίβεια</div>
              </div>
              <div className="font-bold text-amber-500 text-[15px]">{entry.score} XP</div>
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
      <div className="px-5 py-10 text-center text-slate-500">
        <div className="text-5xl mb-3" aria-hidden="true">🎮</div>
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
    <div className="px-5 py-4">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 rounded-full flex items-center justify-center text-[28px] bg-blue-500/15 border-[3px]" style={{ borderColor: levelInfo.color }}>
          {levelInfo.icon}
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold">{getUserName(userId)}</div>
          <div className="text-[13px] font-semibold" style={{ color: levelInfo.color }}>
            {levelInfo.label} · {player.xp} XP
          </div>
          <div className="w-full h-2.5 rounded-[5px] bg-slate-500/10 overflow-hidden mt-2">
            <div className="h-full rounded-[5px] bg-gradient-to-r from-blue-500 to-violet-500 transition-[width] duration-500" style={{ width: `${Math.min(100, xpProgress)}%` }} />
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {nextLevelXp > player.xp ? `${nextLevelXp - player.xp} XP μέχρι το επόμενο level` : 'Μέγιστο level!'}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-900/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold mb-1">{player.gamesPlayed}</div>
          <div className="text-[11px] text-slate-500 uppercase">Παιχνίδια</div>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold mb-1">{accuracy}%</div>
          <div className="text-[11px] text-slate-500 uppercase">Ακρίβεια</div>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold mb-1 text-amber-500">🔥 {player.streak}</div>
          <div className="text-[11px] text-slate-500 uppercase">Streak</div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-slate-800/60 rounded-[14px] border border-slate-500/8 p-4 mb-3">
        <div className="text-base font-semibold mb-3">📊 Κατηγορίες</div>
        {(Object.entries(GAME_CATEGORIES_INFO) as [GameCategory, typeof GAME_CATEGORIES_INFO[GameCategory]][]).map(([key, info]) => {
          const cat = player.categoryScores[key];
          const pct = cat.total > 0 ? Math.round((cat.correct / cat.total) * 100) : 0;
          return (
            <div key={key} className="flex items-center gap-2.5 mb-2">
              <span className="text-lg" aria-hidden="true">{info.icon}</span>
              <span className="flex-1 text-[13px] font-medium">{info.label}</span>
              <span className="text-xs text-slate-500">{cat.correct}/{cat.total}</span>
              <div className="w-[60px] h-1.5 rounded-sm bg-slate-500/10">
                <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: info.color }} />
              </div>
              <span className="text-xs font-semibold w-9 text-right" style={{ color: info.color }}>{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Badges */}
      <div className="bg-slate-800/60 rounded-[14px] border border-slate-500/8 p-4 mb-3">
        <div className="text-base font-semibold mb-3">🏅 Badges ({player.badges.length})</div>
        {player.badges.length === 0 ? (
          <div className="text-slate-500 text-[13px] text-center py-5">
            Κέρδισε badges παίζοντας! 🎯
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 mt-3">
            {player.badges.map(badge => (
              <div key={badge.id} className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl bg-slate-800/40 text-[11px] text-center">
                <span className="text-[28px]" aria-hidden="true">{badge.icon}</span>
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

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 pb-20">
      {/* Progress */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex justify-between items-center text-xs text-slate-500 mb-3">
          <span>Ερώτηση {currentSession.currentIndex + 1}/{currentSession.questions.length}</span>
          <span className="font-semibold text-amber-500">{currentSession.score} XP</span>
        </div>
        <div className="w-full h-1.5 rounded-sm bg-slate-500/10 overflow-hidden mb-4">
          <div className="h-full rounded-sm bg-gradient-to-r from-blue-500 to-violet-500 transition-[width] duration-400" style={{ width: `${progress}%` }} />
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
      <div className="px-5">
        <div className="bg-slate-800/80 rounded-2xl border border-slate-500/10 p-6 mb-4">
          <div className="flex justify-between items-center text-xs text-slate-500 mb-3">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold"
              style={{ background: `${catInfo.color}22`, color: catInfo.color }}
            >
              {catInfo.icon} {catInfo.label}
            </span>
            <DifficultyDots level={question.difficulty} />
          </div>

          <div className="text-lg font-semibold leading-relaxed mb-5">{question.text}</div>

          {/* Options */}
          <div role="listbox" aria-label="Επιλογές απάντησης">
            {question.options.map((opt, i) => {
              let cls = 'block w-full px-[18px] py-3.5 rounded-xl border-2 text-[15px] font-medium cursor-pointer text-left mb-2 transition-all duration-200 ';
              if (showResult && i === question.correctIndex) {
                cls += 'border-green-500 bg-green-500/10 text-green-500';
              } else if (showResult && i === selectedOption && i !== question.correctIndex) {
                cls += 'border-red-500 bg-red-500/10 text-red-500';
              } else if (i === selectedOption) {
                cls += 'border-blue-500 bg-blue-500/10 text-slate-200';
              } else {
                cls += 'border-slate-500/15 bg-slate-900/60 text-slate-200 hover:border-slate-400/30';
              }

              return (
                <button
                  key={i}
                  className={cls}
                  onClick={() => handleSelect(i)}
                  disabled={answered}
                  role="option"
                  aria-selected={i === selectedOption}
                >
                  <span className="mr-2.5 opacity-50 font-semibold">
                    {String.fromCharCode(65 + i)})
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Explanation after answer */}
          {showResult && question.explanation && (
            <div className="mt-4 px-4 py-3 rounded-[10px] bg-blue-500/8 border border-blue-500/15 text-[13px] text-slate-400 leading-relaxed">
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
    <div className="min-h-screen bg-slate-900 text-slate-200 pb-20">
      <div className="text-center px-5 py-8">
        {isPerfect && <div className="text-[64px] mb-2" aria-hidden="true">🎉</div>}
        <div className="text-5xl font-extrabold bg-gradient-to-br from-amber-500 to-red-500 bg-clip-text text-transparent mb-2">{currentSession.score} XP</div>
        <div className="text-base text-slate-400 mb-6">
          {isPerfect ? 'Τέλειο σκορ! 🏆' : correctCount >= totalQuestions * 0.8 ? 'Εξαιρετικά! 🌟' : correctCount >= totalQuestions * 0.5 ? 'Καλή δουλειά! 👍' : 'Συνέχισε να εξασκείσαι! 💪'}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-900/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold mb-1 text-green-500">{correctCount}/{totalQuestions}</div>
            <div className="text-[11px] text-slate-500 uppercase">Σωστές</div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold mb-1">{accuracy}%</div>
            <div className="text-[11px] text-slate-500 uppercase">Ακρίβεια</div>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold mb-1">{avgTime}s</div>
            <div className="text-[11px] text-slate-500 uppercase">Μ.Ο. Χρόνος</div>
          </div>
        </div>

        {/* Player level */}
        {levelInfo && (
          <div className="bg-slate-800/60 rounded-[14px] border border-slate-500/8 flex items-center gap-3 justify-center px-5 py-4 mb-3">
            <span className="text-[28px]" aria-hidden="true">{levelInfo.icon}</span>
            <div>
              <div className="font-bold" style={{ color: levelInfo.color }}>{levelInfo.label}</div>
              <div className="text-xs text-slate-500">{player!.xp} XP Total</div>
            </div>
          </div>
        )}

        {/* Answer breakdown */}
        <div className="bg-slate-800/60 rounded-[14px] border border-slate-500/8 p-4 text-left mb-3">
          <div className="text-base font-semibold mb-3">📋 Ανάλυση Απαντήσεων</div>
          {currentSession.answers.map((ans, i) => {
            const q = currentSession.questions[i];
            const catInfo = GAME_CATEGORIES_INFO[q.category];
            return (
              <div key={i} className={`flex items-center gap-2 py-2 ${i < currentSession.answers.length - 1 ? 'border-b border-slate-500/[0.06]' : ''}`}>
                <span className="text-base">{ans.isCorrect ? '✅' : '❌'}</span>
                <span className="text-sm" aria-hidden="true">{catInfo.icon}</span>
                <span className="flex-1 text-[13px] text-slate-300">{q.text.slice(0, 50)}...</span>
                <span className="text-[11px] text-slate-500">
                  {Math.round(ans.timeMs / 1000)}s
                </span>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2.5 mt-4 justify-center">
          <button
            className="px-6 py-3 rounded-xl border-none font-semibold text-sm cursor-pointer transition-all duration-200 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
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
