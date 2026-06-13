'use client';

import { useEffect } from 'react';
import { db } from '@/lib/firebaseClient';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { DateTime } from 'luxon';

export default function VisitorTracker() {
  useEffect(() => {
    const trackVisitor = async () => {
      // Check if already tracked this session
      if (sessionStorage.getItem('tara_tracked_visitor')) {
        return;
      }

      const today = DateTime.now().toFormat('yyyy-MM-dd');
      const statRef = doc(db, 'stats', `visitors_${today}`);

      try {
        const snap = await getDoc(statRef);
        if (snap.exists()) {
          await setDoc(statRef, { count: increment(1) }, { merge: true });
        } else {
          await setDoc(statRef, { count: 1, date: today });
        }
        sessionStorage.setItem('tara_tracked_visitor', 'true');
      } catch (err) {
        console.error('Failed to track visitor', err);
      }
    };

    trackVisitor();
  }, []);

  return null;
}
