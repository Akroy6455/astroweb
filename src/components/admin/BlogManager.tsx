'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { FileText, Plus, Trash2, Edit } from 'lucide-react';
import { DateTime } from 'luxon';

export default function BlogManager() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBlog, setEditingBlog] = useState<any | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  const fetchBlogs = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, 'blogs'));
    const fetched: any[] = [];
    snap.forEach((d) => {
      fetched.push({ id: d.id, ...d.data() });
    });
    // Sort by date desc
    fetched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setBlogs(fetched);
    setLoading(false);
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleEdit = (b: any) => {
    setEditingBlog(b);
    setTitle(b.title || '');
    setSlug(b.id || '');
    setDescription(b.description || '');
    setContent(b.content || '');
  };

  const handleNew = () => {
    setEditingBlog({ isNew: true });
    setTitle('');
    setSlug('');
    setDescription('');
    setContent('');
  };

  const handleSave = async () => {
    if (!slug || !title || !content) return alert("Slug, Title, and Content are required.");
    try {
      await setDoc(doc(db, 'blogs', slug), {
        title,
        description,
        content,
        date: editingBlog.date || DateTime.now().toFormat('yyyy-MM-dd'),
        likes: editingBlog.likes || 0
      });
      alert('Blog saved!');
      setEditingBlog(null);
      fetchBlogs();
    } catch (e) {
      console.error(e);
      alert('Failed to save blog');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      await deleteDoc(doc(db, 'blogs', id));
      fetchBlogs();
    }
  };

  if (editingBlog) {
    return (
      <div className="glass-panel p-6 rounded-xl border border-white/10 space-y-4">
        <h2 className="text-2xl font-serif text-primary mb-4">{editingBlog.isNew ? 'Create New Post' : 'Edit Post'}</h2>
        
        <div>
          <label className="block text-white/60 mb-1 text-sm">URL Slug</label>
          <input 
            type="text" 
            value={slug} 
            onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            disabled={!editingBlog.isNew}
            className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-primary"
            placeholder="e.g. my-first-post"
          />
        </div>

        <div>
          <label className="block text-white/60 mb-1 text-sm">Title</label>
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-white/60 mb-1 text-sm">Description (SEO)</label>
          <textarea 
            value={description} 
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-primary h-20"
          />
        </div>

        <div>
          <label className="block text-white/60 mb-1 text-sm">Markdown Content</label>
          <textarea 
            value={content} 
            onChange={e => setContent(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-primary h-64 font-mono text-sm"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-primary text-black font-semibold rounded hover:bg-primary/90 transition-colors"
          >
            Save Post
          </button>
          <button 
            onClick={() => setEditingBlog(null)}
            className="px-6 py-2 bg-white/10 text-white rounded hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl overflow-hidden border border-white/10">
      <div className="bg-black/40 px-6 py-4 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-lg font-serif text-primary flex items-center gap-2">
          <FileText className="w-5 h-5" /> Blog Posts
        </h2>
        <button 
          onClick={handleNew}
          className="flex items-center gap-1 text-sm bg-primary/20 hover:bg-primary/30 text-primary px-3 py-1.5 rounded transition-colors border border-primary/30"
        >
          <Plus className="w-4 h-4" /> New Post
        </button>
      </div>
      
      {loading ? (
        <div className="p-6 text-white/50 text-center">Loading posts...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-white/5 text-white/90">
              <tr>
                <th className="px-6 py-3 font-medium">Title</th>
                <th className="px-6 py-3 font-medium">Slug</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Likes</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {blogs.map((b) => (
                <tr key={b.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{b.title}</td>
                  <td className="px-6 py-4">{b.id}</td>
                  <td className="px-6 py-4">{b.date}</td>
                  <td className="px-6 py-4">{b.likes || 0}</td>
                  <td className="px-6 py-4 flex items-center justify-end gap-3">
                    <button onClick={() => handleEdit(b)} className="text-blue-400 hover:text-blue-300">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(b.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {blogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-white/40">
                    No blog posts found in Firestore. Create one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
