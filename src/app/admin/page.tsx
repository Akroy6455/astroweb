'use client';

import { useState, useEffect } from 'react';
import { auth, db, googleProvider } from '@/lib/firebaseClient';
import { signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { ShieldAlert, Users, Activity, LogIn, Clock } from 'lucide-react';
import { DateTime } from 'luxon';

const ADMIN_EMAILS = ['adarsh6455@gmail.com', 'akroy6455@gmail.com'];

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  lastLogin: any; // Firestore Timestamp
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<UserData[]>([]);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && ADMIN_EMAILS.includes(currentUser.email || '')) {
        await fetchAdminData();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch Stats
      const statsDoc = await getDoc(doc(db, 'stats', 'global'));
      if (statsDoc.exists()) {
        setStats(statsDoc.data());
      } else {
        setStats({ chartsGenerated: 0 });
      }

      // Fetch Users
      const q = query(collection(db, 'users'), orderBy('lastLogin', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedUsers: UserData[] = [];
      querySnapshot.forEach((doc) => {
        fetchedUsers.push(doc.data() as UserData);
      });
      setUsersList(fetchedUsers);
      
    } catch (error) {
      console.error("Error fetching admin data: ", error);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Sign in failed:", err);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white/50">Loading Admin Dashboard...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-xl max-w-md w-full text-center">
          <ShieldAlert className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-primary mb-2">Admin Access Required</h2>
          <p className="text-white/60 mb-6 text-sm">Please sign in with an administrator account to view this page.</p>
          <button 
            onClick={handleLogin}
            className="w-full py-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            <LogIn size={18} />
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  if (!ADMIN_EMAILS.includes(user.email || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-xl max-w-md w-full text-center border-red-500/30 border">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-red-400 mb-2">Access Denied</h2>
          <p className="text-white/60 text-sm">The account <span className="text-white">{user.email}</span> does not have administrative privileges.</p>
        </div>
      </div>
    );
  }

  // Calculate New Users (joined within last 7 days)
  const oneWeekAgo = DateTime.now().minus({ days: 7 });
  const newUsersCount = usersList.filter(u => {
    if (!u.createdAt) return false;
    const dt = DateTime.fromJSDate(new Date(u.createdAt));
    return dt >= oneWeekAgo;
  }).length;

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 border-b border-white/10 pb-4">
        <ShieldAlert className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-serif text-primary">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Users Card */}
        <div className="glass-panel p-6 rounded-xl flex flex-col relative overflow-hidden">
          <div className="text-white/60 text-sm font-medium mb-1">Total Users</div>
          <div className="text-4xl font-serif text-primary">{usersList.length}</div>
          <Users className="absolute bottom-4 right-4 w-12 h-12 text-primary/10" />
        </div>

        {/* New Users Card */}
        <div className="glass-panel p-6 rounded-xl flex flex-col relative overflow-hidden border border-emerald-500/20">
          <div className="text-emerald-400/80 text-sm font-medium mb-1">New Users (7 Days)</div>
          <div className="text-4xl font-serif text-emerald-400">{newUsersCount}</div>
          <Clock className="absolute bottom-4 right-4 w-12 h-12 text-emerald-400/10" />
        </div>

        {/* Charts Generated Card */}
        <div className="glass-panel p-6 rounded-xl flex flex-col relative overflow-hidden">
          <div className="text-white/60 text-sm font-medium mb-1">Charts Generated</div>
          <div className="text-4xl font-serif text-primary">{stats?.chartsGenerated || 0}</div>
          <Activity className="absolute bottom-4 right-4 w-12 h-12 text-primary/10" />
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden mt-8 border border-white/10">
        <div className="bg-black/40 px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-serif text-primary">Registered Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-white/5 text-white/90">
              <tr>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Joined</th>
                <th className="px-6 py-3 font-medium">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {usersList.map((u, i) => {
                const joined = u.createdAt ? DateTime.fromJSDate(new Date(u.createdAt)).toFormat('MMM dd, yyyy') : 'Unknown';
                const lastLog = (u.lastLogin && typeof u.lastLogin.toDate === 'function') ? DateTime.fromJSDate(u.lastLogin.toDate()).toRelative() : 'Unknown';
                
                return (
                  <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.displayName} className="w-8 h-8 rounded-full border border-white/20" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                          {u.displayName?.charAt(0) || u.email?.charAt(0) || '?'}
                        </div>
                      )}
                      <span className="font-medium text-white">{u.displayName || 'Unknown User'}</span>
                    </td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">{joined}</td>
                    <td className="px-6 py-4 text-primary/80">{lastLog}</td>
                  </tr>
                );
              })}
              
              {usersList.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-white/40">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
