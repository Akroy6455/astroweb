import { db } from '@/lib/firebaseClient';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Tara Nirnay',
  description: 'Learn about advanced astrology calculations, Dasha tracking, and Planetary Transits.',
};

export const revalidate = 60; // Revalidate every minute

async function getPosts() {
  try {
    const q = query(collection(db, 'blogs'), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    const posts: any[] = [];
    snap.forEach(doc => {
      posts.push({ slug: doc.id, frontmatter: doc.data() });
    });
    return posts;
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return [];
  }
}

export default async function BlogIndex() {
  const posts = await getPosts();

  return (
    <main className="app-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem' }}>
      <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-cormorant), serif', color: 'var(--primary)', marginBottom: '1rem' }}>Tara Nirnay Blog</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.1rem' }}>
        Deep dives into Vedic Astrology, Transit Weighted Net Dasha Flow, and Panchang.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {posts.map((post, index) => (
          <div key={index} style={{ 
            background: 'var(--card-bg)', 
            border: '1px solid var(--border)', 
            padding: '2rem', 
            borderRadius: '16px',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}>
            <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>{post.frontmatter.date}</div>
              <h2 style={{ fontSize: '1.8rem', margin: '0 0 1rem 0', color: 'var(--foreground)' }}>{post.frontmatter.title}</h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                {post.frontmatter.description}
              </p>
              <div style={{ marginTop: '1.5rem', fontWeight: 600, color: 'var(--primary)' }}>Read Article →</div>
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}
