import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '@/lib/firebase';
import { useBooks } from '@/hooks/useBooks';
import { DEFAULT_VOICE } from '@/constants/voices';
import { DOCUMENT_TYPES, DEFAULT_DOCUMENT_TYPE } from '@/constants/documentTypes';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { DEFAULT_USER_TIER } from '@/constants/monetization';
import { IPAgreementModal } from '@/components/IPAgreementModal';
import { VoiceSelector } from '@/components/VoiceSelector';

export default function ScanScreen() {
  const router = useRouter();
  const { books } = useBooks();
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [mode, setMode] = useState<'idle' | 'camera' | 'preview'>('idle');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE);
  const [documentType, setDocumentType] = useState(DEFAULT_DOCUMENT_TYPE);
  const [showIPModal, setShowIPModal] = useState(false);
  
  const cameraRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // Live recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const loadDefaultVoice = async () => {
      try {
        const saved = await AsyncStorage.getItem('paperecho_default_voice');
        if (saved) setSelectedVoice(saved);
      } catch (e) {
        console.error('Failed to load default voice in scan', e);
      }
    };
    loadDefaultVoice();
  }, []);

  const checkQuotaLimit = () => {
    if (books.length >= DEFAULT_USER_TIER.maxConcurrentBooks) {
      Alert.alert(
        'Bookshelf Quota Reached',
        `Your ${DEFAULT_USER_TIER.name} permits up to ${DEFAULT_USER_TIER.maxConcurrentBooks} active audiobooks on your bookshelf. Please delete an existing recording from your Library to digitize another book.`,
        [
          { text: 'Go to Library', onPress: () => router.push('/(tabs)') },
          { text: 'OK', style: 'cancel' }
        ]
      );
      return true;
    }
    return false;
  };

  const handleOpenRecord = async () => {
    if (checkQuotaLimit()) return;
    if (!permission?.granted) {
      const camRes = await requestPermission();
      if (!camRes.granted) return;
    }
    if (!micPermission?.granted) {
      await requestMicPermission();
    }
    setMode('camera');
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;
    setIsRecording(true);
    try {
      const video = await cameraRef.current.recordAsync({
        mute: !micPermission?.granted,
        maxDuration: 300,
      });
      if (video?.uri) {
        setVideoUri(video.uri);
        setMode('preview');
      }
    } catch (e) {
      console.error('Recording error:', e);
    } finally {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  const pickVideo = async () => {
    if (checkQuotaLimit()) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
      setMode('preview');
    }
  };

  const triggerUploadAndProcess = async () => {
    if (!videoUri || !title) return;
    setIsUploading(true);

    try {
      console.log('Preparing video file for upload:', videoUri);
      
      const ext = videoUri.toLowerCase().endsWith('.mov') ? 'mov' : 'mp4';
      const mimeType = ext === 'mov' ? 'video/quicktime' : 'video/mp4';
      const filename = `users/${auth.currentUser?.uid || 'anon'}/videos/${Date.now()}.${ext}`;

      // 1. Create Firestore document immediately so user gets instant studio feedback
      const docRef = await addDoc(collection(db, 'users', auth.currentUser?.uid || 'anon', 'books'), {
        title,
        status: 'uploading',
        voiceName: selectedVoice,
        documentType,
        createdAt: serverTimestamp(),
        videoUri: filename,
        progress: 10,
      });

      const bookId = docRef.id;

      // 2. Instantly transition to studio workflow screen & clear scan form
      setIsUploading(false);
      setMode('idle');
      setTitle('');
      setVideoUri(null);
      setUploadProgress(0);
      router.push(`/processing/${bookId}`);

      // 3. Perform file upload in background while user watches studio progress
      const file = new File(videoUri);
      const token = await auth.currentUser?.getIdToken();
      const bucketName = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'page-reader-prod.firebasestorage.app';
      const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(filename)}`;

      console.log('Starting background streaming upload to Firebase Storage:', filename);
      const uploadResult = await file.upload(uploadUrl, {
        httpMethod: 'POST',
        headers: {
          'Content-Type': mimeType,
          ...(token ? { 'Authorization': `Firebase ${token}` } : {}),
        },
      });

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(`Upload failed (${uploadResult.status}): ${uploadResult.body}`);
      }

      console.log('Background upload to Firebase Storage complete!');

      // 4. Trigger processVideo cloud function
      const processVideoFn = httpsCallable(functions, 'processVideo', { timeout: 600000 });
      processVideoFn({ 
        bookId,
        videoPath: filename,
        voiceName: selectedVoice,
        documentType,
      }).catch((err) => {
        console.error('processVideo background execution error:', err);
      });

    } catch (error) {
      console.error('Upload & process error:', error);
      setIsUploading(false);
    }
  };

  const handleProcessPress = () => {
    if (!videoUri || !title) return;
    setShowIPModal(true);
  };

  if (mode === 'idle') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.idleContent}>
          <View style={styles.iconBadgeWrap}>
            <Ionicons name="scan-outline" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.idleTitle}>Digitize Book Pages</Text>
          <Text style={styles.idleSubtitle}>
            Record a continuous video turning through pages of your physical book. Gemini multimodal AI will transcribe, format, and synthesize humanlike speech.
          </Text>
          
          <TouchableOpacity 
            style={styles.mainButton} 
            onPress={handleOpenRecord}
            activeOpacity={0.85}
          >
            <Ionicons name="videocam" size={20} color="#000000" style={{ marginRight: 8 }} />
            <Text style={styles.mainButtonText}>Record Page Turn Video</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={pickVideo}
            activeOpacity={0.7}
          >
            <Ionicons name="images-outline" size={18} color={Colors.text} style={{ marginRight: 8 }} />
            <Text style={styles.secondaryButtonText}>Select Video from Gallery</Text>
          </TouchableOpacity>

          <View style={styles.tipCard}>
            <Ionicons name="bulb-outline" size={16} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.tipText}>
              Hold steady for 1-2 seconds per page spread under good lighting.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'camera') {
    if (!permission?.granted) {
      return (
        <SafeAreaView style={styles.container}>
          <Text style={styles.permText}>Camera permission required.</Text>
          <TouchableOpacity style={styles.mainButton} onPress={requestPermission}>
            <Text style={styles.mainButtonText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }

    return (
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        <CameraView 
          style={StyleSheet.absoluteFill} 
          ref={cameraRef} 
          mode="video" 
          facing="back" 
          enableTorch={torchEnabled}
        />
        <SafeAreaView style={[StyleSheet.absoluteFill, styles.cameraOverlay]} pointerEvents="box-none">
          {/* Viewfinder Top HUD */}
          <View style={styles.topHud}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setMode('idle')}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.recordingIndicator}>
              <View style={[styles.recDot, isRecording && styles.recDotActive]} />
              <Text style={styles.recText}>
                {isRecording ? `${formatTimer(recordingDuration)} / 05:00` : 'READY TO SCAN'}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.closeButton, torchEnabled && styles.torchButtonActive]} 
              onPress={() => setTorchEnabled(!torchEnabled)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={torchEnabled ? "flash" : "flash-off"} 
                size={20} 
                color={torchEnabled ? Colors.primary : "#ffffff"} 
              />
            </TouchableOpacity>
          </View>

          {/* Center Framing Brackets */}
          <View style={styles.frameContainer}>
            <View style={styles.frameBox} />
            <Text style={styles.frameHint}>Position open book spreads within frame</Text>
          </View>
          
          {/* Bottom Record Controls */}
          <View style={styles.recordControls}>
            <TouchableOpacity 
              style={[styles.recordButton, isRecording && styles.recordButtonActive]} 
              onPress={isRecording ? stopRecording : startRecording}
              activeOpacity={0.85}
            >
              <View style={[styles.recordButtonInner, isRecording && styles.recordButtonInnerActive]} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.previewContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => setMode('idle')} 
            disabled={isUploading}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color={Colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.backButtonText}>Back to Scan</Text>
          </TouchableOpacity>
          
          <Text style={styles.sectionTitle}>Recording Ready</Text>

          <View style={styles.videoCard}>
            <Ionicons name="film-outline" size={28} color={Colors.primary} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.videoCardTitle}>Video Captured</Text>
              <Text style={styles.videoCardSubtitle}>Ready to transcribe and synthesize</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
          </View>

          <Text style={styles.inputLabel}>Book Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Dune by Frank Herbert"
            placeholderTextColor={Colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            editable={!isUploading}
          />

          <Text style={styles.inputLabel}>Narrator Voice</Text>
          <VoiceSelector compact selectedVoice={selectedVoice} onSelectVoice={setSelectedVoice} />

          <Text style={[styles.inputLabel, { marginTop: 16 }]}>Reading Style & Tone</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.voiceList}>
            {DOCUMENT_TYPES.map(type => (
              <TouchableOpacity 
                key={type.id} 
                style={[styles.voiceChip, documentType === type.id && styles.voiceChipActive]}
                onPress={() => setDocumentType(type.id)}
                disabled={isUploading}
                activeOpacity={0.7}
              >
                <Text style={styles.chipEmoji}>{type.emoji}</Text>
                <Text style={[styles.voiceChipText, documentType === type.id && styles.voiceChipTextActive]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity 
            style={[styles.processButton, (!title || isUploading) && styles.processButtonDisabled]} 
            onPress={handleProcessPress}
            disabled={!title || isUploading}
            activeOpacity={0.85}
          >
            {isUploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator color="#000000" style={{ marginRight: 8 }} />
                <Text style={styles.processButtonText}>Uploading Video...</Text>
              </View>
            ) : (
              <View style={styles.uploadingContainer}>
                <Ionicons name="sparkles" size={18} color="#000000" style={{ marginRight: 8 }} />
                <Text style={styles.processButtonText}>Generate Audiobook</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <IPAgreementModal 
        visible={showIPModal}
        onAccept={() => {
          setShowIPModal(false);
          triggerUploadAndProcess();
        }}
        onCancel={() => setShowIPModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background,
  },
  idleContent: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: Spacing.xl,
  },
  iconBadgeWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  idleTitle: { 
    fontSize: FontSize.xxl, 
    fontWeight: '800', 
    color: Colors.text, 
    marginBottom: Spacing.sm, 
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  idleSubtitle: { 
    fontSize: FontSize.sm, 
    color: Colors.textSecondary, 
    marginBottom: Spacing.xxl, 
    textAlign: 'center',
    lineHeight: 22,
  },
  mainButton: { 
    flexDirection: 'row',
    backgroundColor: Colors.primary, 
    padding: Spacing.lg, 
    borderRadius: BorderRadius.md, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  mainButtonText: { 
    color: '#000000', 
    fontSize: FontSize.md, 
    fontWeight: '700',
  },
  secondaryButton: { 
    flexDirection: 'row',
    backgroundColor: Colors.surface, 
    padding: Spacing.lg, 
    borderRadius: BorderRadius.md, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: { 
    color: Colors.text, 
    fontSize: FontSize.md, 
    fontWeight: '600',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xl,
  },
  tipText: {
    color: Colors.textTertiary,
    fontSize: FontSize.xs,
    flex: 1,
    lineHeight: 18,
  },
  permText: {
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  cameraOverlay: { 
    flex: 1, 
    justifyContent: 'space-between', 
    padding: Spacing.lg,
  },
  topHud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: { 
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  torchButtonActive: {
    backgroundColor: 'rgba(226, 179, 80, 0.25)',
    borderColor: Colors.primary,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: 6,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textTertiary,
  },
  recDotActive: {
    backgroundColor: Colors.error,
  },
  recText: {
    fontSize: FontSize.xxs,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 1,
  },
  frameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameBox: {
    width: '90%',
    height: 240,
    borderWidth: 2,
    borderColor: 'rgba(226, 179, 80, 0.6)',
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  frameHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.xs,
    marginTop: 10,
    fontWeight: '600',
  },
  recordControls: { 
    alignSelf: 'center', 
    marginBottom: Spacing.xl,
  },
  recordButton: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    borderWidth: 4, 
    borderColor: 'white', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  recordButtonActive: { 
    borderColor: Colors.error,
  },
  recordButtonInner: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: Colors.error,
  },
  recordButtonInnerActive: { 
    borderRadius: 8, 
    width: 32, 
    height: 32,
  },
  previewContent: { 
    padding: Spacing.lg,
  },
  backButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  backButtonText: { 
    color: Colors.textSecondary, 
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  sectionTitle: { 
    fontSize: FontSize.xxl, 
    fontWeight: '800', 
    color: Colors.text, 
    marginBottom: Spacing.md,
    letterSpacing: -0.4,
  },
  videoCard: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface, 
    borderRadius: BorderRadius.md, 
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  videoCardTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
  videoCardSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  inputLabel: { 
    color: Colors.textTertiary, 
    fontSize: FontSize.xs, 
    marginBottom: Spacing.xs, 
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  input: { 
    backgroundColor: Colors.surface, 
    color: Colors.text, 
    padding: Spacing.md, 
    borderRadius: BorderRadius.md, 
    fontSize: FontSize.md, 
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  voiceList: { 
    flexDirection: 'row', 
    marginBottom: Spacing.lg,
  },
  voiceChip: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: BorderRadius.full, 
    backgroundColor: Colors.surface, 
    marginRight: Spacing.sm, 
    borderWidth: 1, 
    borderColor: Colors.border,
  },
  voiceChipActive: { 
    borderColor: Colors.primary,
    backgroundColor: 'rgba(226, 179, 80, 0.12)',
  },
  chipEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  voiceChipText: { 
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  voiceChipTextActive: { 
    color: Colors.primary, 
    fontWeight: '700',
  },
  processButton: { 
    backgroundColor: Colors.primary, 
    padding: Spacing.lg, 
    borderRadius: BorderRadius.md, 
    alignItems: 'center', 
    marginTop: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  processButtonDisabled: { 
    opacity: 0.5,
  },
  processButtonText: { 
    color: '#000000', 
    fontSize: FontSize.md, 
    fontWeight: '700',
  },
  uploadingContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
});
