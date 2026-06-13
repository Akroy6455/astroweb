import seoData from '@/data/seo-combinations.json';
import Link from 'next/link';

export async function generateStaticParams() {
  return seoData.map((item) => ({
    slug: item.slug,
  }));
}

export async function generateMetadata({ params }: any) {
  const { slug } = params;
  const data = seoData.find(item => item.slug === slug);
  
  if (!data) {
    return { title: 'Transit Not Found' };
  }

  return {
    title: `${data.title} | Tara Nirnay`,
    description: data.description,
  };
}

export default function TransitSeoPage({ params }: any) {
  const { slug } = params;
  const data = seoData.find(item => item.slug === slug);

  if (!data) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: '#fff' }}>Transit Not Found</div>;
  }

  return (
    <main className="app-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem' }}>
      <article style={{ color: 'var(--foreground)' }}>
        <header style={{ marginBottom: '2rem' }}>
          <div style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>
            Astrological Transits
          </div>
          <h1 style={{ fontSize: '3.5rem', fontFamily: 'var(--font-cormorant), serif', margin: '0 0 1rem 0' }}>
            {data.title}
          </h1>
        </header>

        <div style={{ fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '3rem' }}>
          {data.content}
        </div>

        {/* Call to Action Container */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,168,106,0.1), rgba(0,0,0,0.5))',
          border: '1px solid var(--primary)',
          borderRadius: '16px',
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{ fontSize: '1.8rem', margin: '0 0 1rem 0', color: '#fff' }}>
            How does this transit affect YOU?
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.05rem' }}>
            General interpretations only tell half the story. See exactly how {data.planet} in the {data.house} house impacts your unique Dasha timeline using our advanced Net Dasha Flow calculator.
          </p>
          <Link href="/" style={{
            background: 'var(--primary)',
            color: '#000',
            fontWeight: 700,
            padding: '1rem 2rem',
            borderRadius: '8px',
            textDecoration: 'none',
            display: 'inline-block',
            transition: 'transform 0.2s'
          }}>
            Calculate Your Custom Transit Flow
          </Link>
        </div>
      </article>
    </main>
  );
}
