import { useState, useEffect } from 'react';
import { Book } from '@/types/book';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@books_cache';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFromCache = async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        setBooks(JSON.parse(cached));
      }
    } catch (e) {
      console.error('Failed to load books from cache:', e);
    }
  };

  const saveToCache = async (data: Book[]) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save books to cache:', e);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
    let unsubscribe: (() => void) | undefined;

    const setupListener = () => {
      const user = auth.currentUser;
      if (!user) {
        setBooks([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, 'users', user.uid, 'books'),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        const newBooks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Book[];
        
        setBooks(newBooks);
        saveToCache(newBooks);
        setLoading(false);
      }, (error) => {
        console.error('Firestore snapshot error:', error);
        // Fallback to cache on error (e.g. offline)
        loadFromCache().finally(() => setLoading(false));
      });
    };

    // Try cache first for quick load
    loadFromCache().then(() => {
      setupListener();
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const refreshBooks = async () => {
    // In a real implementation this might trigger a force re-fetch
    // but onSnapshot handles realtime updates mostly
    setLoading(true);
    // simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoading(false);
  };

  return { books, loading, refreshBooks };
}
