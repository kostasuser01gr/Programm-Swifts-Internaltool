import { useState } from 'react';
import { useNavigate } from 'react-router';
import { cn } from '../ui/utils';
import { Input } from '../ui/input';
import { ArrowRight, ArrowLeft, Sparkles, Users, Palette, Check } from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider';

// ─── Onboarding Flow ───────────────────────────────────────
// 3-step wizard: Create workspace → Invite team → Pick theme

const STEPS = [
  { id: 'workspace', title: 'Create Workspace', icon: Sparkles },
  { id: 'team',      title: 'Invite Team',      icon: Users },
  { id: 'theme',     title: 'Pick Theme',       icon: Palette },
] as const;

export function OnboardingPage() {
  const navigate = useNavigate();
  const { mode: themeMode, setMode: setThemeMode } = useTheme();
  const [step, setStep] = useState(0);

  // Step 1 state
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDesc, setWorkspaceDesc] = useState('');

  // Step 2 state
  const [inviteEmails, setInviteEmails] = useState('');

  const canProceed = () => {
    if (step === 0) return workspaceName.trim().length >= 2;
    return true;
  };

  const handleFinish = () => {
    // Persist onboarding complete flag
    localStorage.setItem('dataos_onboarding_complete', 'true');
    localStorage.setItem('dataos_workspace_name', workspaceName);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            Welcome to DataOS
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Let's set up your workspace in 3 quick steps
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.id} className="flex items-center gap-3">
                <div className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                  isActive && 'bg-primary text-primary-foreground',
                  isDone && 'bg-green-500/15 text-green-500',
                  !isActive && !isDone && 'bg-muted/50 text-muted-foreground',
                )}>
                  {isDone ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                  <span className="hidden sm:inline">{s.title}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    'w-8 h-px',
                    i < step ? 'bg-green-500/40' : 'bg-border',
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-8">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Workspace name</label>
                <Input
                  placeholder="e.g. My Station, HQ Fleet Ops"
                  value={workspaceName}
                  onChange={e => setWorkspaceName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description <span className="text-muted-foreground">(optional)</span></label>
                <Input
                  placeholder="What is this workspace for?"
                  value={workspaceDesc}
                  onChange={e => setWorkspaceDesc(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Invite team members</label>
                <p className="text-xs text-muted-foreground mb-3">
                  Enter email addresses separated by commas, or skip to add later.
                </p>
                <Input
                  placeholder="alice@example.com, bob@example.com"
                  value={inviteEmails}
                  onChange={e => setInviteEmails(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                <Users className="size-4 shrink-0" />
                <span>Invites will be sent when your workspace is ready. You can always add more later from Settings.</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Choose your theme</label>
                <p className="text-xs text-muted-foreground mb-4">You can change this anytime in Settings.</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: 'dark' as const, label: 'Dark', emoji: '🌙' },
                  { value: 'light' as const, label: 'Light', emoji: '☀️' },
                  { value: 'system' as const, label: 'System', emoji: '💻' },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setThemeMode(opt.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer',
                      themeMode === opt.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border/40 bg-muted/20 hover:border-border',
                    )}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              step === 0
                ? 'opacity-0 pointer-events-none'
                : 'text-muted-foreground hover:text-foreground cursor-pointer',
            )}
          >
            <ArrowLeft className="size-4" /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className={cn(
                'flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-all',
                canProceed()
                  ? 'bg-primary text-primary-foreground cursor-pointer hover:opacity-90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed',
              )}
            >
              Continue <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white cursor-pointer hover:bg-green-500 transition-all"
            >
              <Sparkles className="size-4" /> Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
