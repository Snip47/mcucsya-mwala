import React from 'react';
import { Post } from '../api';
import { Pin, Clock } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  announcement:   'bg-blue-100 text-blue-700',
  mentorship:     'bg-purple-100 text-purple-700',
  opportunity:    'bg-orange-100 text-orange-700',
  bursary:        'bg-green-100 text-green-700',
  county_program: 'bg-teal-100 text-teal-700',
  event_info:     'bg-pink-100 text-pink-700',
};

const TYPE_LABELS: Record<string, string> = {
  announcement:   'Announcement',
  mentorship:     'Mentorship',
  opportunity:    'Opportunity',
  bursary:        'Bursary',
  county_program: 'County Program',
  event_info:     'Event',
};

const ROLE_LABELS: Record<string, string> = {
  mp:     '🏛️ MP',
  leader: '👤 Leader',
  admin:  '⚙️ Admin',
};

const PostCard: React.FC<{ post: Post; onDelete?: (id: number) => void; canDelete?: boolean }> = ({
  post, onDelete, canDelete
}) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm mb-3 overflow-hidden ${post.is_pinned ? 'border-2 border-green-400' : 'border border-gray-100'}`}>
      {post.image_url && (
        <img src={post.image_url} alt={post.title} className="w-full h-44 object-cover" />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {post.is_pinned && <Pin className="w-3.5 h-3.5 text-green-600" />}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[post.post_type] || 'bg-gray-100 text-gray-600'}`}>
              {TYPE_LABELS[post.post_type] || post.post_type}
            </span>
          </div>
          {canDelete && onDelete && (
            <button
              onClick={() => onDelete(post.id)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          )}
        </div>

        <h3 className="font-bold text-gray-800 text-base mb-1">{post.title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-3">{post.content}</p>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{ROLE_LABELS[post.author_role] || post.author_role} · {post.author_name}</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;