import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ref, uploadBytesResumable } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { storage, db, auth, functions } from '@/lib/firebase';
import { VOICES, DEFAULT_VOICE } from '@/constants/voices';
import { DOCUMENT_TYPES, DEFAULT_DOCUMENT_TYPE } from '@/constants/documentTypes';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { IPAgreementModal } from '@/components/IPAgreementModal';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [mode, setMode] = useState<'idle' | 'camera' | 'preview'>('idle');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE);
  const [documentType, setDocumentType] = useState(DEFAULT_DOCUMENT_TYPE);
  const [showIPModal, setShowIPModal] = useState(false);
  
  const cameraRef = useRef<any>(null);

  const handleOpenRecord = async () => {
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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
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
      const response = await fetch(videoUri);
      const blob = await response.blob();
      const filename = `users/${auth.currentUser?.uid || 'anon'}/videos/${Date.now()}.mov`;
      const storageRef = ref(storage, filename);
      
      const uploadTask = uploadBytesResumable(storageRef, blob);
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload failed', error);
          setIsUploading(false);
        },
        async () => {
          const docRef = await addDoc(collection(db, 'users', auth.currentUser?.uid || 'anon', 'books'), {
            title,
            status: 'uploading',
            voiceName: selectedVoice,
            documentType,
            createdAt: serverTimestamp(),
            videoUri: filename,
            progress: 10,
          });
          
          const processVideoFn = httpsCallable(functions, 'processVideo');
          processVideoFn({ 
            bookId: docRef.id,
            videoPath: filename,
            voiceName: selectedVoice,
            documentType,
          }).catch(console.error);

          setIsUploading(false);
          setMode('idle');
          setTitle('');
          setVideoUri(null);
          setUploadProgress(0);
          router.push(`/processing/${docRef.id}`);
        }
      );
    } catch (error) {
      console.error(error);
      setIsUploading(false);
    }
  };

  const handleProcessPress = () => {
    if (!videoUri || !title) return;
    // Open the IP protection modal first
    setShowIPModal(true);
  };

  if (mode === 'idle') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.idleContent}>
          <Text style={styles.idleTitle}>Digitize a Book</Text>
          <Text style={styles.idleSubtitle}>Record pages or choose an existing video to extract text and generate audio.</Text>
          
          <TouchableOpacity 
            style={styles.mainButton} 
            onPress={handleOpenRecord}>
            <Text style={styles.mainButtonText}>📹 Record Video</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={pickVideo}>
            <Text style={styles.secondaryButtonText}>🖼️ Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'camera') {
    if (!permission?.granted) {
      return (
        <SafeAreaView style={styles.container}>
          <Text style={{color: 'white', textAlign: 'center'}}>Camera permission required.</Text>
          <TouchableOpacity onPress={requestPermission}><Text>Grant</Text></TouchableOpacity>
        </SafeAreaView>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} mode="video" facing="back">
          <SafeAreaView style={styles.cameraOverlay}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setMode('idle')}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            
            <View style={styles.recordControls}>
              <TouchableOpacity 
                style={[styles.recordButton, isRecording && styles.recordButtonActive]} 
                onPress={isRecording ? stopRecording : startRecording}
              >
                <View style={[styles.recordButtonInner, isRecording && styles.recordButtonInnerActive]} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.previewContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => setMode('idle')} disabled={isUploading}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.sectionTitle}>Video Ready</Text>
        <View style={styles.videoPlaceholder}>
          <Text style={styles.videoPlaceholderText}>📹 Video selected</Text>
        </View>

        <Text style={styles.inputLabel}>Book Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. The Great Gatsby"
          placeholderTextColor={Colors.textSecondary}
          value={title}
          onChangeText={setTitle}
          editable={!isUploading}
        />

        <Text style={styles.inputLabel}>Select Voice</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.voiceList}>
          {VOICES.map(v => (
            <TouchableOpacity 
              key={v.id} 
              style={[styles.voiceChip, selectedVoice === v.id && styles.voiceChipActive]}
              onPress={() => setSelectedVoice(v.id)}
              disabled={isUploading}
            >
              <Text style={[styles.voiceChipText, selectedVoice === v.id && styles.voiceChipTextActive]}>
                {v.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.inputLabel}>Reading Style</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.voiceList}>
          {DOCUMENT_TYPES.map(type => (
            <TouchableOpacity 
              key={type.id} 
              style={[styles.voiceChip, documentType === type.id && styles.voiceChipActive]}
              onPress={() => setDocumentType(type.id)}
              disabled={isUploading}
            >
              <Text style={[styles.voiceChipText, documentType === type.id && styles.voiceChipTextActive]}>
                {type.emoji} {type.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity 
          style={[styles.processButton, (!title || isUploading) && styles.processButtonDisabled]} 
          onPress={handleProcessPress}
          disabled={!title || isUploading}
        >
          {isUploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator color={Colors.text} style={{ marginRight: 8 }} />
              <Text style={styles.processButtonText}>Uploading {Math.round(uploadProgress)}%</Text>
            </View>
          ) : (
            <Text style={styles.processButtonText}>Process This Book</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

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
  container: { flex: 1, backgroundColor: Colors.background },
  idleContent: { flex: 1, justifyContent: 'center', padding: Spacing.xl },
  idleTitle: { fontSize: FontSize.xxl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.sm, textAlign: 'center' },
  idleSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xxl, textAlign: 'center' },
  mainButton: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: BorderRadius.md, alignItems: 'center', marginBottom: Spacing.md },
  mainButtonText: { color: Colors.text, fontSize: FontSize.lg, fontWeight: 'bold' },
  secondaryButton: { backgroundColor: Colors.surfaceLight, padding: Spacing.lg, borderRadius: BorderRadius.md, alignItems: 'center' },
  secondaryButtonText: { color: Colors.text, fontSize: FontSize.lg, fontWeight: 'bold' },
  
  cameraOverlay: { flex: 1, justifyContent: 'space-between', padding: Spacing.lg },
  closeButton: { alignSelf: 'flex-start', padding: Spacing.sm, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  closeButtonText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  recordControls: { alignSelf: 'center', marginBottom: Spacing.xl },
  recordButton: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  recordButtonActive: { borderColor: Colors.error },
  recordButtonInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.error },
  recordButtonInnerActive: { borderRadius: 8, width: 32, height: 32 },

  previewContent: { padding: Spacing.lg },
  backButton: { marginBottom: Spacing.lg },
  backButtonText: { color: Colors.primary, fontSize: FontSize.md },
  sectionTitle: { fontSize: FontSize.xl, fontWeight: 'bold', color: Colors.text, marginBottom: Spacing.md },
  videoPlaceholder: { height: 160, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl },
  videoPlaceholderText: { color: Colors.textSecondary, fontSize: FontSize.md },
  inputLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.xs, textTransform: 'uppercase' },
  input: { backgroundColor: Colors.surface, color: Colors.text, padding: Spacing.md, borderRadius: BorderRadius.sm, fontSize: FontSize.md, marginBottom: Spacing.xl },
  voiceList: { flexDirection: 'row', marginBottom: Spacing.xl },
  voiceChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 20, backgroundColor: Colors.surface, marginRight: Spacing.sm, borderWidth: 1, borderColor: Colors.surfaceLight },
  voiceChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  voiceChipText: { color: Colors.textSecondary },
  voiceChipTextActive: { color: Colors.text, fontWeight: 'bold' },
  processButton: { backgroundColor: Colors.primary, padding: Spacing.lg, borderRadius: BorderRadius.md, alignItems: 'center', marginTop: Spacing.lg },
  processButtonDisabled: { opacity: 0.5 },
  processButtonText: { color: Colors.text, fontSize: FontSize.lg, fontWeight: 'bold' },
  uploadingContainer: { flexDirection: 'row', alignItems: 'center' },
});
