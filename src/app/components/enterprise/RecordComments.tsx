import { useState } from 'react';
import { MessageSquare, Send, User, Clock, Smile, Paperclip, MoreHorizontal, Edit3, Trash2, X } from 'lucide-react';
import type { Comment } from '../../types';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

interface RecordCommentsProps {
  comments: Comment[];
  currentUserId: string;
  currentUserName: string;
  onAddComment: (text: string) => void;
  onEditComment: (id: string, text: string) => void;
  onDeleteComment: (id: string) => void;
}

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function RecordComments({ comments, currentUserId, currentUserName, onAddComment, onEditComment, onDeleteComment }: RecordCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment.trim());
    setNewComment('');
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const handleSaveEdit = () => {
    if (editingId && editText.trim()) {
      onEditComment(editingId, editText.trim());
    }
    setEditingId(null);
    setEditText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Comments ({comments.length})
        </h4>
      </div>

      {/* Comment list */}
      <div className="space-y-3">
        {comments.length === 0 && (
          <p className="text-xs text-gray-400 italic py-4 text-center">No comments yet. Start the conversation!</p>
        )}

        {comments.map((comment) => (
          <div key={comment.id} className="group">
            <div className="flex gap-3">
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-[10px] text-white font-medium flex-shrink-0 mt-0.5">
                {comment.userName.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                {editingId === comment.id ? (
                  /* Edit mode */
                  <div className="space-y-2">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[60px] text-sm"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={handleSaveEdit}>Save</Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  /* Display mode */
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{comment.userName}</span>
                      <span className="text-[10px] text-gray-400">{timeAgo(comment.createdAt)}</span>
                      {comment.editedAt && (
                        <span className="text-[10px] text-gray-400 italic">(edited)</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5 whitespace-pre-wrap">{comment.text}</p>

                    {/* Actions */}
                    {comment.userId === currentUserId && (
                      <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] text-gray-400 hover:text-gray-600"
                          onClick={() => handleEdit(comment)}
                        >
                          <Edit3 className="w-3 h-3 mr-0.5" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] text-red-400 hover:text-red-500"
                          onClick={() => onDeleteComment(comment.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-0.5" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New comment input */}
      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-[10px] text-white font-medium flex-shrink-0">
          {currentUserName.charAt(0)}
        </div>
        <div className="flex-1">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment..."
            className="min-h-[60px] text-sm"
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400" title="Add emoji">
                <Smile className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400" title="Attach file">
                <Paperclip className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Button size="sm" className="h-7 text-xs" disabled={!newComment.trim()} onClick={handleSubmit}>
              <Send className="w-3 h-3 mr-1" />
              Comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
