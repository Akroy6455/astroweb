'use client';

import { useState, useEffect } from 'react';
import { db, auth, googleProvider } from '@/lib/firebaseClient';
import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { Heart, MessageCircle, LogIn, Send } from 'lucide-react';
import { DateTime } from 'luxon';

export default function BlogInteractions({ slug, initialLikes }: { slug: string, initialLikes: number }) {
  const [user, setUser] = useState<User | null>(null);
  const [likes, setLikes] = useState(initialLikes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user has liked
        const checkLike = async () => {
          const likeDoc = await getDoc(doc(db, `blogs/${slug}/likes`, currentUser.uid));
          if (likeDoc.exists()) setHasLiked(true);
        };
        checkLike();
      }
    });

    // Realtime comments listener
    const q = query(collection(db, `blogs/${slug}/comments`), orderBy('timestamp', 'asc'));
    const unsubComments = onSnapshot(q, (snap) => {
      const fetched: any[] = [];
      snap.forEach(d => fetched.push({ id: d.id, ...d.data() }));
      setComments(fetched);
    });

    // Realtime likes listener (optional, but good for UX)
    const unsubLikes = onSnapshot(doc(db, 'blogs', slug), (doc) => {
      if (doc.exists() && doc.data().likes !== undefined) {
        setLikes(doc.data().likes);
      }
    });

    return () => {
      unsubAuth();
      unsubComments();
      unsubLikes();
    };
  }, [slug]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleLike = async () => {
    if (!user) return handleLogin();
    if (hasLiked) return; // Prevent double like

    setHasLiked(true);
    setLikes(prev => prev + 1); // Optimistic UI

    try {
      await setDoc(doc(db, `blogs/${slug}/likes`, user.uid), { likedAt: serverTimestamp() });
      await setDoc(doc(db, 'blogs', slug), { likes: increment(1) }, { merge: true });
    } catch (err) {
      console.error(err);
      setHasLiked(false);
      setLikes(prev => prev - 1);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, `blogs/${slug}/comments`), {
        text: newComment.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhoto: user.photoURL || null,
        timestamp: serverTimestamp()
      });
      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-white/10">
      {/* Action Bar */}
      <div className="flex items-center gap-6 mb-12">
        <button 
          onClick={handleLike}
          className={`flex items-center gap-2 transition-colors ${hasLiked ? 'text-rose-500' : 'text-white/60 hover:text-rose-400'}`}
        >
          <Heart className={`w-6 h-6 ${hasLiked ? 'fill-current' : ''}`} />
          <span className="font-medium text-lg">{likes}</span>
        </button>
        <div className="flex items-center gap-2 text-white/60">
          <MessageCircle className="w-6 h-6" />
          <span className="font-medium text-lg">{comments.length}</span>
        </div>
      </div>

      {/* Comments Section */}
      <h3 className="text-2xl font-serif text-primary mb-6">Discussion</h3>

      {!user ? (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center mb-8">
          <p className="text-white/70 mb-4">Join the conversation by signing in.</p>
          <button 
            onClick={handleLogin}
            className="px-6 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg font-medium inline-flex items-center gap-2 transition-all"
          >
            <LogIn className="w-4 h-4" /> Sign In to Comment
          </button>
        </div>
      ) : (
        <form onSubmit={handleComment} className="mb-8 relative">
          <div className="flex items-start gap-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-full border border-white/20" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
              </div>
            )}
            <div className="flex-1 relative">
              <textarea 
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary min-h-[100px] resize-none"
              />
              <button 
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="absolute bottom-3 right-3 p-2 bg-primary text-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.map((comment) => {
          const time = comment.timestamp?.toDate ? DateTime.fromJSDate(comment.timestamp.toDate()).toRelative() : 'Just now';
          return (
            <div key={comment.id} className="flex gap-4">
              {comment.authorPhoto ? (
                <img src={comment.authorPhoto} alt={comment.authorName} className="w-10 h-10 rounded-full border border-white/10 flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/50 font-bold flex-shrink-0">
                  {comment.authorName.charAt(0)}
                </div>
              )}
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-medium text-white/90">{comment.authorName}</span>
                  <span className="text-xs text-white/40">{time}</span>
                </div>
                <p className="text-white/70 leading-relaxed text-sm whitespace-pre-wrap">{comment.text}</p>
              </div>
            </div>
          );
        })}
        {comments.length === 0 && (
          <div className="text-white/40 text-center py-8">
            No comments yet. Be the first to share your perspective!
          </div>
        )}
      </div>
    </div>
  );
}
