import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBooks } from '@/hooks/useBooks';
import { BookCard } from '@/components/BookCard';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { Book } from '@/types/book';

export default function LibraryScreen() {
  const { books, loading, refreshBooks } = useBooks();
  const router = useRouter();

  const handlePressBook = (book: Book) => {
    if (book.status === 'ready') {
      router.push(`/book/${book.id}`);
    } else {
      router.push(`/processing/${book.id}`);
    }
  };

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

        <View style={styles.headerBadge}>
          <Text style={styles.headerCount}>{books.length} {books.length === 1 ? 'Title' : 'Titles'}</Text>
        </View>
      </View>

      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <BookCard book={item} onPress={() => handlePressBook(item)} />
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
  headerCount: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.3,
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

