import { useState } from 'react';
import { Bot, Send, Sparkles, X, TrendingUp, Database, Zap, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export function AIAssistant({ isOpen, onClose, tableName }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hi! I'm your AI assistant for "${tableName}". I can help you with:

• Analyze your data and find insights
• Generate formulas and automations
• Clean and transform data
• Create charts and visualizations
• Answer questions about your records

What would you like to do today?`,
      timestamp: new Date(),
      suggestions: [
        'Show high priority tasks due this week',
        'Calculate total effort for In Progress tasks',
        'Find tasks without assignees',
        'Create automation for overdue tasks',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickActions = [
    { icon: TrendingUp, label: 'Analyze data', color: 'blue', query: 'Analyze my data and find insights' },
    { icon: Sparkles, label: 'Generate formula', color: 'purple', query: 'Generate a formula to calculate total effort' },
    { icon: Database, label: 'Clean data', color: 'green', query: 'Clean my data and find duplicates' },
    { icon: Zap, label: 'Create automation', color: 'orange', query: 'Create an automation for overdue tasks' },
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: getAIResponse(input),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('high priority') || lowerQuery.includes('urgent')) {
      return `I found 3 high priority tasks:

1. **Implement user authentication** - Due Feb 15, Assigned to John Smith
2. **Fix mobile responsive issues** - Due Feb 10 (OVERDUE), Assigned to Mike Chen
3. **Set up CI/CD pipeline** - Due Feb 16, Assigned to Mike Chen

Would you like me to create a filtered view for these tasks or set up notifications?`;
    }
    
    if (lowerQuery.includes('formula') || lowerQuery.includes('calculate')) {
      return `I can help you create a formula! For calculating total effort, use:

\`\`\`
SUM({Effort (hours)})
\`\`\`

For In Progress tasks specifically, create a Rollup field with:
- Filter: Status = "In Progress"
- Aggregation: SUM of Effort (hours)

This will give you: **24 hours** of effort currently in progress.

Would you like me to add this field to your table?`;
    }
    
    if (lowerQuery.includes('automation')) {
      return `I can create an automation for overdue tasks! Here's what it would do:

**Trigger:** Daily at 9 AM
**Condition:** Due Date < Today AND Status ≠ "Done"
**Actions:**
1. Send notification to assignee
2. Update Priority to "Urgent"
3. Add comment: "This task is overdue"

Would you like me to set this up?`;
    }
    
    if (lowerQuery.includes('clean') || lowerQuery.includes('duplicate')) {
      return `I scanned your data and found:

✓ No duplicate records
✓ 2 records with missing assignees
✓ 1 record with empty description

Would you like me to:
1. Highlight records needing attention
2. Auto-assign unassigned tasks
3. Fill in default descriptions`;
    }
    
    return `I understand you're asking about "${query}". Based on your current data in "${tableName}", I can:

1. **Analyze patterns** - I see 8 total tasks with varied priorities
2. **Suggest optimizations** - 2 tasks are overdue and need attention
3. **Create views** - Would you like a view for tasks due this week?
4. **Build automations** - I can automate status updates and notifications

What specific aspect would you like help with?`;
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  if (!isOpen) return null;

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs text-gray-500">Demo Mode</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200">
        <p className="text-xs font-medium text-gray-500 mb-2">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="justify-start h-auto py-2"
              onClick={() => {
                setInput(action.query);
              }}
            >
              <action.icon className="w-4 h-4 mr-2" style={{ color: action.color }} />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.type === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4" />
                    <span className="text-xs font-medium">AI Assistant</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.suggestions && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium mb-2">Suggested queries:</p>
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="block w-full text-left text-xs p-2 bg-white rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
