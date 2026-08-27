import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBooks } from '@/hooks/useBooks';
import { BookCard } from '@/components/BookCard';
import { Colors, Spacing, FontSize } from '@/constants/theme';
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
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>Your library is empty</Text>
      <Text style={styles.emptySubtitle}>Go to the Scan tab to digitize a book.</Text>
      <TouchableOpacity style={styles.scanButton} onPress={() => router.push('/(tabs)/scan')}>
        <Text style={styles.scanButtonText}>Scan a Book</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Library</Text>
        <Text style={styles.headerCount}>{books.length} {books.length === 1 ? 'book' : 'books'}</Text>
      </View>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerCount: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  listContent: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 24,
  },
  scanButtonText: {
    color: Colors.text,
    fontWeight: 'bold',
    fontSize: FontSize.md,
  },
});
