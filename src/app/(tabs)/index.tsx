import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, auth, storage } from '@/lib/firebase';
import { useBooks } from '@/hooks/useBooks';
import { BookCard } from '@/components/BookCard';
import { RenameModal } from '@/components/RenameModal';
import { PaywallModal } from '@/components/PaywallModal';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { DEFAULT_USER_TIER } from '@/constants/monetization';
import { Book } from '@/types/book';

export default function LibraryScreen() {
  const { books, loading, refreshBooks } = useBooks();
  const router = useRouter();
  const [renameTarget, setRenameTarget] = useState<Book | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const handlePressBook = (book: Book) => {
    if (book.status === 'ready') {
      router.push(`/book/${book.id}`);
    } else {
      router.push(`/processing/${book.id}`);
    }
  };

  const handleSaveRename = async (newTitle: string) => {
    if (!renameTarget) return;
    try {
      const userId = auth.currentUser?.uid || 'anon';
      const docRef = doc(db, 'users', userId, 'books', renameTarget.id);
      // STRICT INVARIANT: Only update title field. Retention clock (expiresAt), createdAt, and audio settings are preserved intact.
      await updateDoc(docRef, { title: newTitle });
    } catch (e) {
      console.error('Failed to rename book:', e);
      Alert.alert('Error', 'Could not rename the audiobook.');
    } finally {
      setRenameTarget(null);
    }
  };

  const handleDeleteBook = (book: Book) => {
    Alert.alert(
      'Delete Audiobook?',
      `Are you sure you want to delete "${book.title || 'Untitled Audiobook'}"? This will permanently remove the recording and free up 1 slot in your ${DEFAULT_USER_TIER.name} quota.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const userId = auth.currentUser?.uid || 'anon';
              const docRef = doc(db, 'users', userId, 'books', book.id);
              await deleteDoc(docRef);

              if (book.videoUri) {
                const videoFileRef = ref(storage, book.videoUri);
                deleteObject(videoFileRef).catch(() => {});
              }
              if (book.audioUri) {
                const audioFileRef = ref(storage, book.audioUri);
                deleteObject(audioFileRef).catch(() => {});
              }
            } catch (e) {
              console.error('Failed to delete book:', e);
              Alert.alert('Error', 'Could not delete the audiobook recording.');
            }
          },
        },
      ]
    );
  };

  const isAtQuota = books.length >= DEFAULT_USER_TIER.maxConcurrentBooks;

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="book-outline" size={44} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Your Bookshelf is Ready</Text>
      <Text style={styles.emptySubtitle}>
        Digitize your physical books with a quick video scan to create AI-narrated audiobooks.
      </Text>
      <TouchableOpacity 
        style={styles.scanButton} 
        onPress={() => router.push('/(tabs)/scan')}
        activeOpacity={0.85}
      >
        <Ionicons name="camera" size={18} color="#000000" style={{ marginRight: 8 }} />
        <Text style={styles.scanButtonText}>Digitize First Book</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Library</Text>
          <Text style={styles.headerSubtitle}>Personal Format-Shifted Audiobooks</Text>
        </View>

        <TouchableOpacity 
          style={[styles.headerBadge, isAtQuota && styles.headerBadgeQuota]}
          onPress={() => setShowPaywall(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.headerCount, isAtQuota && styles.headerCountQuota]}>
            {books.length}/{DEFAULT_USER_TIER.maxConcurrentBooks} Titles ({DEFAULT_USER_TIER.name}) ✨
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <BookCard 
            book={item} 
            onPress={() => handlePressBook(item)}
            onRename={() => setRenameTarget(item)} 
            onDelete={() => handleDeleteBook(item)}
          />
        )}
        ListEmptyComponent={!loading ? renderEmpty : null}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshBooks}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      />

      <RenameModal 
        visible={!!renameTarget}
        currentTitle={renameTarget?.title || ''}
        onSave={handleSaveRename}
        onCancel={() => setRenameTarget(null)}
      />

      <PaywallModal 
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerBadgeQuota: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  headerCount: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerCountQuota: {
    color: '#fbbf24',
  },
  listContent: {
    padding: Spacing.lg,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xxl * 1.5,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    lineHeight: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  scanButtonText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
});

