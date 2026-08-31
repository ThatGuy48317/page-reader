import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, ProcessingStep } from '../types/book';

const KEY_PREFIX = 'paperecho_book_';

export async function saveBook(book: Book): Promise<void> {
  try {
    const key = `${KEY_PREFIX}${book.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(book));
  } catch (error) {
    console.error(`Failed to save book ${book.id}:`, error);
    throw error;
  }
}

export async function getBook(id: string): Promise<Book | null> {
  try {
    const key = `${KEY_PREFIX}${id}`;
    const data = await AsyncStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as Book;
  } catch (error) {
    console.error(`Failed to get book ${id}:`, error);
    return null;
  }
}

export async function getAllBooks(): Promise<Book[]> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const bookKeys = allKeys.filter((key: string) => key.startsWith(KEY_PREFIX));
    if (bookKeys.length === 0) return [];

    const pairs = await AsyncStorage.multiGet(bookKeys);
    const books: Book[] = [];

    for (const [, value] of pairs) {
      if (value) {
        try {
          const parsed = JSON.parse(value) as Book;
          books.push(parsed);
        } catch (e) {
          console.error('Failed to parse book data:', e);
        }
      }
    }

    return books.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (error) {
    console.error('Failed to get all books:', error);
    return [];
  }
}

export async function deleteBook(id: string): Promise<void> {
  try {
    const key = `${KEY_PREFIX}${id}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to delete book ${id}:`, error);
    throw error;
  }
}

export async function updateBookStatus(
  id: string,
  status: ProcessingStep,
  progress: number,
  extra?: Partial<Book>
): Promise<void> {
  try {
    const book = await getBook(id);
    if (!book) {
      throw new Error(`Book with id ${id} not found`);
    }

    const updatedBook: Book = {
      ...book,
      status,
      progress,
      ...extra,
    };

    await saveBook(updatedBook);
  } catch (error) {
    console.error(`Failed to update book status for ${id}:`, error);
    throw error;
  }
}
