import { db } from '@/lib/firebaseClient';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import BlogInteractions from '@/components/BlogInteractions';

// We fetch slugs from Firestore for Static Generation
export async function generateStaticParams() {
  try {
    const snap = await getDocs(collection(db, 'blogs'));
    const slugs: any[] = [];
    snap.forEach((d) => slugs.push({ slug: d.id }));
    return slugs;
  } catch (error) {
    return [];
  }
}

export async function generateMetadata({ params }: any) {
  const slug = params.slug;
  try {
    const docSnap = await getDoc(doc(db, 'blogs', slug));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        title: `${data.title} | Tara Nirnay`,
        description: data.description,
      };
    }
  } catch (e) {}

  return {
    title: 'Blog | Tara Nirnay',
  };
}

export const revalidate = 60; // Revalidate every minute

export default async function BlogPost({ params }: any) {
  const slug = params.slug;

  let data = null;
  try {
    const docSnap = await getDoc(doc(db, 'blogs', slug));
    if (docSnap.exists()) {
      data = docSnap.data();
    }
  } catch (e) {
    console.error(e);
  }

  if (!data) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: '#fff' }}>Post not found</div>;
  }

  return (
    <main className="app-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem' }}>
      <Link href="/blog" style={{ color: 'var(--primary)', textDecoration: 'none', marginBottom: '2rem', display: 'inline-block' }}>
        ← Back to Blog
      </Link>
      
      <article style={{ color: 'var(--foreground)' }}>
        <header style={{ marginBottom: '3rem', borderBottom: '1px solid var(--border)', paddingBottom: '2rem' }}>
          <div style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '1rem' }}>{data.date}</div>
          <h1 style={{ fontSize: '3.5rem', fontFamily: 'var(--font-cormorant), serif', margin: '0 0 1rem 0' }}>{data.title}</h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>{data.description}</p>
        </header>
        
        <div className="prose prose-invert" style={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
          <MDXRemote source={data.content || ''} />
        </div>

        <BlogInteractions slug={slug} initialLikes={data.likes || 0} />
      </article>
    </main>
  );
}
