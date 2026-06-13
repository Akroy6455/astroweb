import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import seoData from '@/data/seo-combinations.json';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://taranirnay.com'; // Replace with actual domain

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Dynamic Blog routes
  try {
    const { db } = require('@/lib/firebaseClient');
    const { collection, getDocs } = require('firebase/firestore');
    const snap = await getDocs(collection(db, 'blogs'));
    snap.forEach((d: any) => {
      const slug = d.id;
      routes.push({
        url: `${baseUrl}/blog/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    });
  } catch (e) {
    console.error('Sitemap blog error', e);
  }

  // Dynamic SEO Transit routes
  seoData.forEach((item) => {
    routes.push({
      url: `${baseUrl}/transit/${item.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  });

  return routes;
}

