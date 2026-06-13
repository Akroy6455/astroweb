'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { getKundliData, saveMLData } from './actions';
import KundliChart from '@/components/KundliChart';
import NavamshaChakra from '@/components/NavamshaChakra';
import AshtakavargaChart from '@/components/AshtakavargaChart';
import AshtakavargaTable from '@/components/AshtakavargaTable';
import ShadbalaTable from '@/components/ShadbalaTable';
import VimshopakTable from '@/components/VimshopakTable';
import TransitTab from '@/components/TransitTab';
import AwasthasTable from '@/components/AwasthasTable';
import SpecialLagnasTable from '@/components/SpecialLagnasTable';
import YogTab from '@/components/YogTab';
import DashaChart from '@/components/DashaChart';
import TransitChart from '@/components/TransitChart';
import TaraNirnaySettings from '@/components/TaraNirnaySettings';
import { generateDashaTimeSeries, DEFAULT_NDS_WEIGHTS, NDSWeights } from '@/lib/nds_engine';
import { DashaTab } from '@/components/DashaTab';
import PanchangTab from '@/components/PanchangTab';
import { getVargaDevta, getDivisionalSign, getDivPart, getDivSignName, getDivSignShort, getD60Nature } from '@/lib/vargaDevtas';
import { Settings, Save, LayoutTemplate, Aperture, Grid3X3, BarChart, Clock, Moon, Sparkles, Database, TrendingUp, List } from 'lucide-react';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import ExportTimeline from '@/components/ExportTimeline';
import { formatDMS } from '@/lib/utils';

// Firebase Client Imports
import { auth, db, googleProvider } from '@/lib/firebaseClient';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, serverTimestamp, increment } from 'firebase/firestore';

const DIVISIONAL_CHARTS_INFO = [
  { key: 'D1', name: 'Rashi Chart', division: 1, meaning: 'Main birth chart; overall life, personality, destiny' },
  { key: 'D2', name: 'Hora', division: 2, meaning: 'Wealth, financial strength, food, family resources' },
  { key: 'D3', name: 'Drekkana', division: 3, meaning: 'Siblings, courage, initiative, co-borns' },
  { key: 'D4', name: 'Chaturthamsha', division: 4, meaning: 'Property, home, fixed assets, fortune from residence' },
  { key: 'D5', name: 'Panchamsha', division: 5, meaning: 'Power, fame, authority, spiritual merit' },
  { key: 'D6', name: 'Shashthamsha', division: 6, meaning: 'Diseases, enemies, obstacles, health struggles' },
  { key: 'D7', name: 'Saptamsha', division: 7, meaning: 'Children, fertility, lineage' },
  { key: 'D8', name: 'Ashtamsha', division: 8, meaning: 'Longevity, sudden events, hidden karma' },
  { key: 'D9', name: 'Navamsha', division: 9, meaning: 'Marriage, spouse, dharma, inner strength; most important after D1' },
  { key: 'D10', name: 'Dashamsha', division: 10, meaning: 'Career, profession, reputation, achievements' },
  { key: 'D11', name: 'Rudramsha / Labhamsha', division: 11, meaning: 'Gains, fulfillment, elder siblings' },
  { key: 'D12', name: 'Dwadashamsha', division: 12, meaning: 'Parents, ancestral karma, heredity' },
  { key: 'D16', name: 'Shodashamsha', division: 16, meaning: 'Vehicles, comforts, luxuries, happiness' },
  { key: 'D20', name: 'Vimshamsha', division: 20, meaning: 'Spirituality, mantra siddhi, worship' },
  { key: 'D24', name: 'Chaturvimshamsha', division: 24, meaning: 'Education, learning capacity, scriptures' },
  { key: 'D27', name: 'Bhamsha / Nakshatramsha', division: 27, meaning: 'Strengths, weaknesses, inner abilities' },
  { key: 'D30', name: 'Trimshamsha', division: 30, meaning: 'Misfortunes, evils, hidden suffering' },
  { key: 'D40', name: 'Khavedamsha', division: 40, meaning: 'Maternal lineage karma, auspiciousness' },
  { key: 'D45', name: 'Akshavedamsha', division: 45, meaning: 'Paternal lineage karma, character' },
  { key: 'D60', name: 'Shashtyamsha', division: 60, meaning: 'Deep past-life karma; extremely important in classical astrology' },
];

export default function Home() {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'D1' | 'Panchang' | 'Divisional' | 'Chakra' | 'Ashtakavarga' | 'Strength' | 'Transit' | 'Awasthas' | 'Dasha' | 'TaraNirnay' | 'Uttar' | 'Yog' | 'JsonData'>('D1');
  const [isPrinting, setIsPrinting] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showKundliListModal, setShowKundliListModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveQuery, setSaveQuery] = useState('');
  const [saveNotes, setSaveNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadedProfileMetadata, setLoadedProfileMetadata] = useState<{query?: string, notes?: string}>({});
  const [user, setUser] = useState<User | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [activeDivisionalChart, setActiveDivisionalChart] = useState('D9');
  const [formLocation, setFormLocation] = useState({ lat: 25.78, lon: 87.48, ianaTz: 'Asia/Kolkata', label: 'Purnia, BR, IN' });
  const [ayanamsha, setAyanamsha] = useState<'Raman' | 'Lahiri'>('Raman');
  const [ndsWeights, setNdsWeights] = useState<NDSWeights>(DEFAULT_NDS_WEIGHTS);
  const formRef = useRef<HTMLFormElement>(null);

  const activeDashaTimeSeries = useMemo(() => {
    if (!data) return [];
    try {
      const alSignIndex = data.specialLagnas?.arudhaLagna?.rasi?.index ?? 0;
      return generateDashaTimeSeries(
        data.dasha, 
        data.yogaState, 
        data.positions, 
        alSignIndex, 
        data.awasthas, 
        ndsWeights
      );
    } catch (e) {
      console.error('Failed to regenerate NDS series:', e);
      return data.dashaTimeSeries || [];
    }
  }, [data, ndsWeights]);

  useEffect(() => {
    // Automatically set current date and time on initial load
    const now = new Date();
    const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0');
    
    if (formRef.current) {
      const nameInput = formRef.current.elements.namedItem('name') as HTMLInputElement;
      const dateInput = formRef.current.elements.namedItem('date') as HTMLInputElement;
      const timeInput = formRef.current.elements.namedItem('time') as HTMLInputElement;
      
      if (!nameInput.value) nameInput.value = 'Current Transit';
      dateInput.value = dateStr;
      timeInput.value = timeStr;
      
      // Auto-submit after a slight delay to allow refs and state to settle
      setTimeout(() => {
        formRef.current?.requestSubmit();
      }, 100);
    }
  }, []);

  useEffect(() => {
    // Listen for Authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Update user record
        const userRef = doc(db, 'users', currentUser.uid);
        await setDoc(userRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          createdAt: currentUser.metadata.creationTime,
          lastLogin: serverTimestamp(),
        }, { merge: true });

        // User is signed in. Listen to Firestore profiles in real-time
        const profilesRef = collection(db, 'users', currentUser.uid, 'profiles');
        const unsubscribeProfiles = onSnapshot(profilesRef, (snapshot) => {
          const profiles: any[] = [];
          snapshot.forEach((doc) => {
            profiles.push(doc.data());
          });
          // Sort by name for consistency
          profiles.sort((a, b) => a.name.localeCompare(b.name));
          setSavedProfiles(profiles);
        });

        // Listen to settings
        const settingsRef = doc(db, 'users', currentUser.uid, 'settings', 'preferences');
        const unsubscribeSettings = onSnapshot(settingsRef, (doc) => {
          if (doc.exists()) {
            const pref = doc.data();
            if (pref.ayanamsha) setAyanamsha(pref.ayanamsha);
            if (pref.ndsWeights && pref.ndsWeights.version === 4) setNdsWeights(pref.ndsWeights);
          }
        });

        // Trigger local storage profile synchronization to cloud on sign-in
        const local = localStorage.getItem('kundliProfiles');
        if (local) {
          try {
            const localProfiles = JSON.parse(local);
            if (Array.isArray(localProfiles) && localProfiles.length > 0) {
              setSyncing(true);
              for (const profile of localProfiles) {
                const profileDocRef = doc(db, 'users', currentUser.uid, 'profiles', profile.name);
                await setDoc(profileDocRef, {
                  name: profile.name,
                  date: profile.date || '',
                  time: profile.time || '',
                  lat: profile.lat || '',
                  lon: profile.lon || '',
                  tzOffset: profile.tzOffset || '',
                  ianaTz: profile.ianaTz || '',
                  locationLabel: profile.locationLabel || ''
                });
              }
              // Clear local storage after migration
              localStorage.removeItem('kundliProfiles');
            }
          } catch (e) {
            console.error("Failed to sync profiles to Firestore:", e);
          } finally {
            setSyncing(false);
          }
        }

        return () => {
          unsubscribeProfiles();
          unsubscribeSettings();
        };
      } else {
        // User is signed out. Fall back to local storage
        const saved = localStorage.getItem('kundliProfiles');
        if (saved) {
          try {
            const localProfiles = JSON.parse(saved);
            localProfiles.sort((a: any, b: any) => a.name.localeCompare(b.name));
            setSavedProfiles(localProfiles);
          } catch (e) {
            setSavedProfiles([]);
          }
        } else {
          setSavedProfiles([]);
        }
        
        const savedAyanamsha = localStorage.getItem('ayanamshaPref');
        if (savedAyanamsha) setAyanamsha(savedAyanamsha as 'Raman' | 'Lahiri');
        const savedWeights = localStorage.getItem('ndsWeightsPref');
        if (savedWeights) {
          try {
            const parsed = JSON.parse(savedWeights);
            if (parsed.version === 4) { setNdsWeights(parsed); } else { setNdsWeights(DEFAULT_NDS_WEIGHTS); localStorage.removeItem('ndsWeightsPref'); }
          } catch(e) {}
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Sign in failed:", err);
      alert(`Authentication failed: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error("Sign out failed:", err);
    }
  };

  const handleSaveProfileClick = () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const name = formData.get('name') as string;
    if (!name) {
      alert("Please enter a name to save the profile.");
      return;
    }
    setSaveName(name);
    setSaveQuery('');
    setSaveNotes('');
    setShowSaveModal(true);
  };

  const handleConfirmSaveProfile = async () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const name = saveName;
    if (!name) return;
    const profile = {
      name,
      query: saveQuery,
      notes: saveNotes,
      date: formData.get('date'),
      time: formData.get('time'),
      lat: formData.get('lat'),
      lon: formData.get('lon'),
      tzOffset: formData.get('tzOffset') || '',
      ianaTz: formData.get('ianaTz') || '',
      locationLabel: formData.get('locationLabel') || '',
    };

    if (user) {
      try {
        setSyncing(true);
        const profileDocRef = doc(db, 'users', user.uid, 'profiles', name);
        await setDoc(profileDocRef, profile);
      } catch (err) {
        console.error("Failed to save profile to Cloud:", err);
        alert("Could not save to Cloud. Please try again.");
        return;
      } finally {
        setSyncing(false);
      }
    } else {
      const updated = [...savedProfiles.filter(p => p.name !== name), profile];
      updated.sort((a, b) => a.name.localeCompare(b.name));
      setSavedProfiles(updated);
      localStorage.setItem('kundliProfiles', JSON.stringify(updated));
    }

    if (data && data.mlData) {
      try {
        await saveMLData(data.mlData);
      } catch (err) {
        console.error("Failed to save ML data:", err);
      }
    }

    alert(`Profile for ${name} saved successfully! ${user ? 'Synced to cloud.' : 'Saved locally (offline).'}`);
  };

  const loadProfile = (profile: any) => {
    if (!formRef.current) return;
    setLoadedProfileMetadata({ query: profile.query || '', notes: profile.notes || '' });
    setShowKundliListModal(false);
    (formRef.current.elements.namedItem('name') as HTMLInputElement).value = profile.name;
    (formRef.current.elements.namedItem('date') as HTMLInputElement).value = profile.date;
    (formRef.current.elements.namedItem('time') as HTMLInputElement).value = profile.time;
    
    setFormLocation({
      lat: parseFloat(profile.lat) || 0,
      lon: parseFloat(profile.lon) || 0,
      ianaTz: profile.ianaTz || '',
      label: profile.locationLabel || `Lat: ${profile.lat}, Lon: ${profile.lon}`
    });
    
    // Automatically submit to generate
    setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 50);
  };

  const deleteProfile = async (name: string) => {
    if (user) {
      try {
        setSyncing(true);
        const profileDocRef = doc(db, 'users', user.uid, 'profiles', name);
        await deleteDoc(profileDocRef);
      } catch (err) {
        console.error("Failed to delete profile from Cloud:", err);
      } finally {
        setSyncing(false);
      }
    } else {
      const updated = savedProfiles.filter(p => p.name !== name);
      setSavedProfiles(updated);
      localStorage.setItem('kundliProfiles', JSON.stringify(updated));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData(e.currentTarget);
      const res = await getKundliData(formData);
      setData(res);
      
      // Increment global stats
      try {
        const statsRef = doc(db, 'stats', 'global');
        await setDoc(statsRef, { chartsGenerated: increment(1) }, { merge: true });
      } catch (err) {
        console.error("Failed to increment stats:", err);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 1500); // Wait for components to mount and render
  };

  const toggleAyanamsha = async () => {
    const newVal = ayanamsha === 'Raman' ? 'Lahiri' : 'Raman';
    setAyanamsha(newVal);
    if (user) {
      try {
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'preferences');
        await setDoc(settingsRef, { ayanamsha: newVal }, { merge: true });
      } catch (err) {
        console.error("Failed to sync ayanamsha setting:", err);
      }
    } else {
      localStorage.setItem('ayanamshaPref', newVal);
    }
  };

  const handleSaveNdsWeights = async (newWeights: NDSWeights) => {
    setNdsWeights(newWeights);
    if (user) {
      try {
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'preferences');
        await setDoc(settingsRef, { ndsWeights: newWeights }, { merge: true });
      } catch (err) {
        console.error("Failed to sync NDS weights:", err);
      }
    } else {
      localStorage.setItem('ndsWeightsPref', JSON.stringify(newWeights));
    }
  };

  return (
    <main className="app-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1400px' }}>
      <header className="header" style={{ borderBottom: 'none', paddingBottom: '0', marginBottom: '0' }}>
        <div className="header-brand">
          <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex' }}>
            <ThemeSwitcher />
            <LanguageSwitcher />
          </div>
          <div style={{
            fontSize: '64px', 
            fontWeight: 800, 
            lineHeight: 1.4,
            padding: '10px 0', 
            fontFamily: 'var(--font-cormorant), serif', 
            background: 'linear-gradient(to right, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(2px 4px 4px rgba(0,0,0,0.3))',
            marginBottom: '0.5rem',
            letterSpacing: '1px'
          }}>
            Tara Nirnay
          </div>
          <p style={{ color: 'var(--text-muted)' }}>{t('header.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {/* Ayanamsha Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--card-bg)', padding: '0.5rem 1rem', borderRadius: '24px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: ayanamsha === 'Raman' ? 600 : 400, color: ayanamsha === 'Raman' ? 'var(--primary)' : 'var(--text-muted)' }}>Raman</span>
            <div 
              onClick={toggleAyanamsha}
              style={{
                width: '44px',
                height: '24px',
                background: ayanamsha === 'Raman' ? 'var(--primary)' : '#8b5cf6',
                borderRadius: '12px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.3s ease'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '2px',
                left: ayanamsha === 'Raman' ? '2px' : '22px',
                width: '20px',
                height: '20px',
                background: '#fff',
                borderRadius: '50%',
                transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: ayanamsha === 'Lahiri' ? 600 : 400, color: ayanamsha === 'Lahiri' ? '#8b5cf6' : 'var(--text-muted)' }}>Lahiri</span>
          </div>

          <div className="auth-panel">
          {user ? (
            <div className="user-profile">
              <img 
                src={user.photoURL || 'https://www.gravatar.com/avatar/?d=mp'} 
                alt={user.displayName || 'User'} 
                className="user-avatar"
                referrerPolicy="no-referrer"
              />
              <div className="user-details">
                <span className="user-name">{user.displayName}</span>
                <span className="sync-status">
                  {syncing ? (
                    <span className="syncing"><span className="dot pulse"></span> Syncing</span>
                  ) : (
                    <span className="synced"><span className="dot"></span> Cloud Connected</span>
                  )}
                </span>
              </div>
              <button onClick={handleLogout} className="btn-logout" title="Sign Out">
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={handleLogin} className="btn-login-google">
              <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.326 0-6.023-2.697-6.023-6.023s2.697-6.022 6.023-6.022c1.503 0 2.873.551 3.93 1.462l3.102-3.102C18.91 2.868 15.765 1.7 12.24 1.7 6.452 1.7 1.76 6.393 1.76 12.18s4.692 10.48 10.48 10.48c5.84 0 10.44-4.223 10.44-10.44 0-.663-.072-1.282-.194-1.935H12.24z"/>
              </svg>
              Sign in with Google
            </button>
          )}
        </div>
        </div>
      </header>

      <div className="gold-divider"></div>

      {/* Top Bar Form */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <label htmlFor="name">{t('form.name')}</label>
            <input type="text" id="name" name="name" required placeholder={t('placeholders.namePlaceholder')} style={{ padding: '0.5rem' }} />
          </div>
          <div className="form-group" style={{ flex: '1 1 130px', marginBottom: 0 }}>
            <label htmlFor="date">{t('form.date')}</label>
            <input type="date" id="date" name="date" required defaultValue="2000-01-01" style={{ padding: '0.5rem' }} />
          </div>
          <div className="form-group" style={{ flex: '1 1 100px', marginBottom: 0 }}>
            <label htmlFor="time">{t('form.time')}</label>
            <input type="time" id="time" name="time" step="1" required defaultValue="12:00:00" style={{ padding: '0.5rem' }} />
          </div>

          <input type="hidden" name="lat" value={formLocation.lat} />
          <input type="hidden" name="lon" value={formLocation.lon} />
          <input type="hidden" name="ianaTz" value={formLocation.ianaTz} />
          <input type="hidden" name="locationLabel" value={formLocation.label} />
          <input type="hidden" name="ayanamsha" value={ayanamsha} />
          <LocationAutocomplete 
            onSelect={(lat, lon, ianaTz, label) => setFormLocation({ lat, lon, ianaTz, label })} 
            defaultLabel={formLocation.label}
          />
          <div style={{ display: 'flex', gap: '0.5rem', flex: '1 1 200px' }}>
            <button type="submit" className="submit-btn" disabled={loading} style={{ padding: '0.6rem 1rem', flex: 2 }}>
              {loading ? t('form.generating') : t('form.generate')}
            </button>
            <button type="button" className="submit-btn save-btn" onClick={handleSaveProfileClick} style={{ padding: '0.6rem 1rem', flex: 1, backgroundColor: 'var(--border)', color: 'var(--foreground)' }} title="Save Profile">
              <Save size={18} />
            </button>
            <button type="button" className="submit-btn list-btn" onClick={() => setShowKundliListModal(true)} style={{ padding: '0.6rem 1rem', flex: 1, backgroundColor: 'var(--border)', color: 'var(--foreground)' }} title="Kundli List">
              <List size={18} />
            </button>
          </div>
        </form>
        {error && <p style={{ color: '#cc0000', marginTop: '1rem', fontWeight: 500 }}>{error}</p>}
      </div>

      
  {/* Modals go here */}
  {showSaveModal && (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--background)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid var(--border)' }}>
        <h3 style={{ marginTop: 0, color: 'var(--primary)', marginBottom: '1rem' }}>Save Profile</h3>
        <p style={{ margin: '0 0 1rem 0', fontWeight: 600 }}>{saveName}</p>
        <div className="form-group">
          <label>Query</label>
          <input type="text" value={saveQuery} onChange={e => setSaveQuery(e.target.value)} placeholder="E.g., Career prospects" className="form-input" />
        </div>
        <div className="form-group" style={{ marginTop: '1rem' }}>
          <label>Notes</label>
          <textarea value={saveNotes} onChange={e => setSaveNotes(e.target.value)} placeholder="Any additional notes..." className="form-input" style={{ minHeight: '80px', resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button type="button" onClick={() => setShowSaveModal(false)} className="submit-btn" style={{ flex: 1, backgroundColor: 'var(--border)', color: 'var(--foreground)' }}>Cancel</button>
          <button type="button" onClick={handleConfirmSaveProfile} className="submit-btn" style={{ flex: 1 }} disabled={syncing}>{syncing ? 'Saving...' : 'Confirm Save'}</button>
        </div>
      </div>
    </div>
  )}

  {showKundliListModal && (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--background)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: 'var(--primary)' }}>Saved Kundlis</h3>
          <button type="button" onClick={() => setShowKundliListModal(false)} style={{ background: 'none', border: 'none', color: 'var(--foreground)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>
        <input 
          type="text" 
          placeholder="Search by name, query or notes..." 
          className="form-input" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ marginBottom: '1rem' }}
        />
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {savedProfiles
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.query || '').toLowerCase().includes(searchQuery.toLowerCase()) || (p.notes || '').toLowerCase().includes(searchQuery.toLowerCase()))
            .map(p => (
            <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'rgba(201, 168, 106, 0.05)', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ cursor: 'pointer', flex: 1 }} onClick={() => loadProfile(p)}>
                <h4 style={{ margin: '0 0 0.2rem 0', color: 'var(--primary)' }}>{p.name}</h4>
                {p.query && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}><strong>Query:</strong> {p.query}</p>}
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); deleteProfile(p.name); }} className="profile-delete" title="Delete Profile" style={{ padding: '0.4rem', marginLeft: '1rem', cursor: 'pointer', zIndex: 10 }}>✕</button>
            </div>
          ))}
          {savedProfiles.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No saved Kundlis found.</p>}
        </div>
      </div>
    </div>
  )}


      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
        {/* Sidebar Tabs */}
        {data && (
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', height: 'fit-content' }}>
            <button className={activeTab === 'D1' ? 'tab active' : 'tab'} onClick={() => setActiveTab('D1')}><LayoutTemplate size={18} /> {t('tabs.d1')}</button>
            <button className={activeTab === 'Panchang' ? 'tab active' : 'tab'} onClick={() => setActiveTab('Panchang')}><Clock size={18} /> {t('tabs.panchang')}</button>
            <button className={activeTab === 'Divisional' ? 'tab active' : 'tab'} onClick={() => setActiveTab('Divisional')}><Grid3X3 size={18} /> {t('tabs.divisional')}</button>
            <button className={activeTab === 'Chakra' ? 'tab active' : 'tab'} onClick={() => setActiveTab('Chakra')}><Aperture size={18} /> {t('tabs.chakra')}</button>
            <button className={activeTab === 'Ashtakavarga' ? 'tab active' : 'tab'} onClick={() => setActiveTab('Ashtakavarga')}><Grid3X3 size={18} /> {t('tabs.ashtakavarga')}</button>
            <button className={activeTab === 'Strength' ? 'tab active' : 'tab'} onClick={() => setActiveTab('Strength')}><BarChart size={18} /> {t('tabs.strength')}</button>
            <button className={activeTab === 'Transit' ? 'tab active' : 'tab'} onClick={() => setActiveTab('Transit')}><Clock size={18} /> {t('tabs.transit')}</button>
            <button className={activeTab === 'Awasthas' ? 'tab active' : 'tab'} onClick={() => setActiveTab('Awasthas')}><Sparkles size={18} /> {t('tabs.awasthas')}</button>
            <button className={activeTab === 'Dasha' ? 'tab active' : 'tab'} onClick={() => setActiveTab('Dasha')}><Moon size={18} /> {t('tabs.dasha')}</button>
            <button className={activeTab === 'TaraNirnay' ? 'tab active' : 'tab'} onClick={() => setActiveTab('TaraNirnay')}><TrendingUp size={18} /> {t('tabs.taraNirnay')}</button>
            <button className={activeTab === 'Uttar' ? 'tab active' : 'tab'} onClick={() => setActiveTab('Uttar')}><LayoutTemplate size={18} /> {t('tabs.uttar')}</button>
            <button className={activeTab === 'Yog' ? 'tab active' : 'tab'} onClick={() => setActiveTab('Yog')}><Sparkles size={18} /> {t('tabs.yog')}</button>
            <button className={activeTab === 'JsonData' ? 'tab active' : 'tab'} onClick={() => setActiveTab('JsonData')}><Database size={18} /> {t('tabs.jsonData')}</button>
            
            <button onClick={handlePrint} className="submit-btn" style={{ marginTop: 'auto', padding: '0.75rem', background: 'var(--text-muted)' }}>
              {isPrinting ? 'Preparing PDF...' : 'Print Report'}
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="glass-card display-card" style={{ gridColumn: data ? 'span 3' : '1 / -1' }}>
          {data ? (
            <div className="tab-content">
              {(activeTab === 'D1' || isPrinting) && (
                <div className={isPrinting ? 'print-section' : ''}>
                  {isPrinting && <h2 className="print-only-heading">D-1 Chart</h2>}
                  <KundliChart data={{ lagna: data.lagna, houses: data.houses }} />
                  <div style={{ overflowX: 'auto', marginTop: '2rem' }}>
                    <table className="details-table" style={{ minWidth: '600px' }}>
                      <thead style={{ background: 'var(--text-muted)', color: 'var(--background)' }}>
                        <tr>
                          <th style={{ color: 'var(--background)' }}>Planet</th>
                          <th style={{ color: 'var(--background)' }}>Longitude</th>
                          <th style={{ color: 'var(--background)' }}>Speed</th>
                          <th style={{ color: 'var(--background)' }}>Rasi (D-1)</th>
                          <th style={{ color: 'var(--background)' }}>Nakshatra</th>
                          <th style={{ color: 'var(--background)' }}>Pada</th>
                          <th style={{ color: 'var(--background)' }}>Navamsha (D-9)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.lagna && (
                          <tr style={{ background: 'rgba(232, 220, 203, 0.5)' }}>
                            <td><strong>Lagna</strong></td>
                            <td>{formatDMS(data.lagna.longitude)}</td>
                            <td>-</td>
                            <td>{data.lagna.rasi.name} ({formatDMS(data.lagna.rasi.degreesInSign)})</td>
                            <td>{data.lagna.nakshatra.name}</td>
                            <td>{data.lagna.nakshatra.pada}</td>
                            <td>{data.lagna.navamsha.name}</td>
                          </tr>
                        )}
                        {data.positions.map((p: any, i: number) => {
                          const isSpecial = ['Mandi', 'Gulika', 'Dhooma', 'Vyatipata', 'Parivesha', 'Indrachapa', 'Upaketu', 'Uranus', 'Neptune', 'Pluto'].includes(p.name);
                          return (
                            <tr key={p.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(232, 220, 203, 0.3)' }}>
                              <td style={isSpecial ? { color: '#3b82f6', fontSize: '0.85em' } : {}}><strong>{p.name}</strong> {p.retrograde ? <span style={{ color: '#cc0000' }}>(R)</span> : ''}</td>
                              <td>{formatDMS(p.longitude)}</td>
                              <td>{(p.speed > 0 ? '+' : '')}{p.speed.toFixed(3)}°/d</td>
                              <td>{p.rasi.name} ({formatDMS(p.rasi.degreesInSign)})</td>
                              <td>{p.nakshatra.name}</td>
                              <td>{p.nakshatra.pada}</td>
                              <td>{p.navamsha.name}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: '2rem' }}>
                    <SpecialLagnasTable data={data} />
                  </div>
                </div>
              )}
              {(activeTab === 'Panchang' || isPrinting) && (
                <div className={isPrinting ? 'print-section' : ''}>
                  {isPrinting && <h2 className="print-only-heading">Panchang</h2>}
                  <PanchangTab data={data} />
                </div>
              )}
              {(activeTab === 'Divisional' || isPrinting) && (
                <div className={isPrinting ? 'print-section' : ''}>
                  {isPrinting && <h2 className="print-only-heading">Divisional Charts</h2>}
                  {!isPrinting && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ flex: '1 1 300px', marginBottom: 0 }}>
                          <label style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>Select Divisional Chart</label>
                          <select
                            value={activeDivisionalChart}
                            onChange={(e) => setActiveDivisionalChart(e.target.value)}
                            style={{ padding: '0.65rem 1rem', fontSize: '0.95rem', background: 'var(--card-bg)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}
                          >
                            {DIVISIONAL_CHARTS_INFO.map(c => (
                              <option key={c.key} value={c.key}>
                                {c.key} — {c.name} (÷{c.division})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {(() => {
                        const info = DIVISIONAL_CHARTS_INFO.find(c => c.key === activeDivisionalChart);
                        if (!info) return null;
                        return (
                          <div style={{
                            background: 'linear-gradient(135deg, rgba(201,168,106,0.15), rgba(94,124,123,0.1))',
                            border: '1px solid rgba(201,168,106,0.35)',
                            borderRadius: '10px',
                            padding: '1rem 1.25rem',
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'flex-start'
                          }}>
                            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>📜</span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                                {info.name} ({info.key})
                                <span style={{ fontWeight: 400, fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>Division: {info.division}</span>
                              </div>
                              <div style={{ fontSize: '0.9rem', color: 'var(--foreground)', lineHeight: 1.5 }}>
                                {info.meaning}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {data.divisionalCharts && data.divisionalCharts[activeDivisionalChart] ? (
                    <KundliChart data={{ lagna: data.divisionalCharts[activeDivisionalChart].lagna, houses: data.divisionalCharts[activeDivisionalChart].houses }} />
                  ) : (
                    <KundliChart data={{ lagna: data.d9Lagna, houses: data.d9Houses }} />
                  )}

                  {/* Planet Details Table */}
                  {(() => {
                    const info = DIVISIONAL_CHARTS_INFO.find(c => c.key === activeDivisionalChart);
                    if (!info || !data.positions) return null;
                    const div = info.division;

                    const allEntries: any[] = [];
                    if (data.lagna) {
                      allEntries.push({ name: 'Lagna', short: 'As', longitude: data.lagna.longitude, rasi: data.lagna.rasi, isLagna: true });
                    }
                    allEntries.push(...data.positions);

                    return (
                      <div style={{ overflowX: 'auto', marginTop: '2rem' }}>
                        <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1rem' }}>
                          {info.key} Planetary Positions & Devtas
                        </h3>
                        <table className="details-table" style={{ width: '100%', fontSize: '0.82rem' }}>
                          <thead style={{ background: 'var(--text-muted)', color: 'var(--background)' }}>
                            <tr>
                              <th style={{ color: 'var(--background)' }}>Planet</th>
                              <th style={{ color: 'var(--background)' }}>Natal Sign</th>
                              <th style={{ color: 'var(--background)' }}>Deg in Sign</th>
                              <th style={{ color: 'var(--background)' }}>{info.key} Sign</th>
                              <th style={{ color: 'var(--background)' }}>Part</th>
                              <th style={{ color: 'var(--background)' }}>Devta</th>
                              {div === 60 && <th style={{ color: 'var(--background)' }}>Nature</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {allEntries.map((p: any, i: number) => {
                              const sIdx = p.rasi.index;
                              const deg = p.rasi.degreesInSign;
                              const isOdd = sIdx % 2 === 0;
                              const divSign = getDivisionalSign(sIdx, deg, div);
                              const part = getDivPart(deg, div, isOdd);
                              const devta = getVargaDevta(sIdx, deg, div);
                              const isSpecial = ['Mandi', 'Gulika', 'Dhooma', 'Vyatipata', 'Parivesha', 'Indrachapa', 'Upaketu', 'Uranus', 'Neptune', 'Pluto'].includes(p.name);
                              return (
                                <tr key={p.name} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(232, 220, 203, 0.3)' }}>
                                  <td style={isSpecial ? { color: '#3b82f6', fontSize: '0.85em' } : {}}><strong>{p.name}</strong>{p.retrograde ? <span style={{ color: '#cc0000', marginLeft: 4 }}>(R)</span> : null}</td>
                                  <td>{p.rasi.name}</td>
                                  <td>{formatDMS(deg)}</td>
                                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{getDivSignName(divSign)}</td>
                                  <td>{part + 1}/{div}</td>
                                  <td style={{ color: devta === '—' ? 'var(--text-muted)' : '#C9A86A', fontWeight: devta !== '—' ? 600 : 400 }}>{devta}</td>
                                  {div === 60 && <td style={{ color: getD60Nature(sIdx, deg) === 'Benefic' ? '#10b981' : '#ef4444', fontWeight: 600 }}>{getD60Nature(sIdx, deg)}</td>}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}
              {(activeTab === 'Chakra' || isPrinting) && (
                <div className={isPrinting ? 'print-section' : ''}>
                  {isPrinting && <h2 className="print-only-heading">Navamsha Chakra</h2>}
                  <NavamshaChakra data={data} />
                </div>
              )}
              {(activeTab === 'Ashtakavarga' || isPrinting) && (
                <div className={isPrinting ? 'print-section' : ''}>
                  {isPrinting && <h2 className="print-only-heading">Ashtakavarga</h2>}
                  <AshtakavargaChart data={data} />
                  <AshtakavargaTable data={data.ashtakavarga} />
                </div>
              )}
              {(activeTab === 'Strength' || isPrinting) && (
                <div className={isPrinting ? 'print-section' : ''}>
                  {isPrinting && <h2 className="print-only-heading">Strength (Shadbala & Vimshopak)</h2>}
                  <ShadbalaTable data={data.shadbala} />
                  <VimshopakTable data={data.vimshopakBala} />
                </div>
              )}
              <div style={{ display: (activeTab === 'Transit' || isPrinting) ? 'block' : 'none' }} className={isPrinting ? 'print-section' : ''}>
                {isPrinting && <h2 className="print-only-heading">Transit</h2>}
                <TransitTab mainData={data} ayanamsha={ayanamsha} weights={ndsWeights} />
              </div>
              {(activeTab === 'Awasthas' || isPrinting) && (
                <div className={isPrinting ? 'print-section' : ''}>
                  {isPrinting && <h2 className="print-only-heading">Awasthas</h2>}
                  <AwasthasTable data={data.awasthas} />
                </div>
              )}
              {(activeTab === 'Dasha' || isPrinting) && (
                <div className={isPrinting ? 'print-section' : ''}>
                  {isPrinting && <h2 className="print-only-heading">Vimshottari Dasha</h2>}
                  <DashaTab dashas={data.dasha} />
                </div>
              )}
              {(activeTab === 'TaraNirnay' || isPrinting) && (
                <div className={isPrinting ? 'print-section' : ''}>
                  {isPrinting && <h2 className="print-only-heading">Tara Dasha Nirnay</h2>}
                  <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    {data?.transitTimeSeries && (
                      <ExportTimeline 
                        dashaData={activeDashaTimeSeries} 
                        transitData={data.transitTimeSeries} 
                        weights={ndsWeights} 
                      />
                    )}
                    {data?.transitTimeSeries && data.transitTimeSeries.length > 0 && (
                      <TransitChart data={data.transitTimeSeries} weights={ndsWeights} />
                    )}
                    <DashaChart data={activeDashaTimeSeries}>
                      <TaraNirnaySettings 
                        weights={ndsWeights} 
                        onSave={handleSaveNdsWeights}
                      />
                    </DashaChart>
                  </div>
                </div>
              )}
              {(activeTab === 'JsonData' || isPrinting) && (
                <div className={isPrinting ? 'print-section' : ''} style={{ marginTop: '1rem' }}>
                  {(loadedProfileMetadata.query || loadedProfileMetadata.notes) && (
                    <div style={{ background: 'rgba(201, 168, 106, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                      {loadedProfileMetadata.query && (
                        <div style={{ marginBottom: loadedProfileMetadata.notes ? '1rem' : 0 }}>
                          <strong style={{ color: 'var(--primary)' }}>Query:</strong>
                          <p style={{ margin: '0.2rem 0 0 0' }}>{loadedProfileMetadata.query}</p>
                        </div>
                      )}
                      {loadedProfileMetadata.notes && (
                        <div>
                          <strong style={{ color: 'var(--primary)' }}>Notes:</strong>
                          <p style={{ margin: '0.2rem 0 0 0', whiteSpace: 'pre-wrap' }}>{loadedProfileMetadata.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <pre style={{ background: '#FCFBF8', padding: '1.5rem', borderRadius: '12px', color: '#2E3131', overflowX: 'auto', fontSize: '0.85rem', border: '1px solid var(--border)' }}>
                    {JSON.stringify(data.yogaState, null, 2)}
                  </pre>
                </div>
              )}
              {(activeTab === 'Uttar') && (
                <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--foreground)' }}>{t('tabs.uttar')}</h3>
                  <p>Coming soon...</p>
                </div>
              )}
              {(activeTab === 'Yog') && (
                <YogTab data={data} />
              )}
            </div>
          ) : (
            <div className="kundli-placeholder">{t('placeholders.enterDetails')}</div>
          )}
        </div>
      </div>

      <footer style={{ marginTop: '4rem', padding: '3rem 2rem', background: '#2E3131', color: '#cbd5e1', textAlign: 'center', borderTop: '1px solid #3f3f46' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div>
            <h4 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Contact Us</h4>
            <p style={{ margin: 0 }}>
              <a href="mailto:sales@solutionandnetwork.com" style={{ color: '#C9A86A', textDecoration: 'none', fontWeight: 500 }}>
                sales@solutionandnetwork.com
              </a>
            </p>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <h4 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>Join our Telegram Community</h4>
            <a 
              href="https://t.me/+lFPEq5KV0vA1NzI9" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'inline-block', transition: 'transform 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://t.me/+lFPEq5KV0vA1NzI9" 
                alt="Telegram Group QR Code" 
                style={{ borderRadius: '8px', border: '2px solid #C9A86A', padding: '4px', background: '#fff' }}
              />
            </a>
            <a 
              href="https://t.me/+lFPEq5KV0vA1NzI9"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#0088cc',
                color: '#fff',
                padding: '0.6rem 1.2rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(0, 136, 204, 0.3)'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.888-.662 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              Join Telegram Group
            </a>
          </div>

          <div style={{ marginTop: '2rem', fontStyle: 'italic', fontSize: '0.9rem', color: '#64748b' }}>
            expanding the list...
          </div>
        </div>
      </footer>
    </main>
  );
}





