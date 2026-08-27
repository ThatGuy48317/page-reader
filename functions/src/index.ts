import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleGenAI } from "@google/genai";
import { defineSecret } from "firebase-functions/params";

admin.initializeApp();

const geminiApiKey = defineSecret("GEMINI_API_KEY");

const db = admin.firestore();
const bucket = admin.storage().bucket();

/**
 * Creates a standard 44-byte RIFF WAV header for 16-bit 24kHz Mono PCM audio.
 */
function createWavHeader(
  dataLength: number,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataLength, 40);

  return header;
}

/**
 * Splits text into chunks at paragraph boundaries, each under maxChars.
 */
function splitTextIntoChunks(text: string, maxChars = 5000): string[] {
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length + 2 > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += (current ? "\n\n" : "") + para;
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

/**
 * Extracts chapter markers from cleaned text.
 * Looks for [CHAPTER: title] markers.
 */
function extractChapters(text: string): Array<{ title: string; textOffset: number }> {
  const chapters: Array<{ title: string; textOffset: number }> = [];
  const regex = /\[CHAPTER:\s*(.+?)\]/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    chapters.push({
      title: match[1].trim(),
      textOffset: match.index,
    });
  }

  if (chapters.length === 0) {
    chapters.push({ title: "Full Book", textOffset: 0 });
  }

  return chapters;
}

/**
 * Updates the Firestore document with the current processing status.
 */
async function updateStatus(
  userId: string,
  bookId: string,
  status: string,
  progress: number,
  extra: Record<string, unknown> = {}
) {
  await db
    .collection("users")
    .doc(userId)
    .collection("books")
    .doc(bookId)
    .update({
      status,
      progress,
      updatedAt: Date.now(),
      ...extra,
    });
}

/**
 * Main processing function — called by the mobile app after video upload.
 *
 * Input: { bookId: string, videoPath: string, voiceName: string }
 * - bookId: Firestore document ID for the book
 * - videoPath: Firebase Storage path to the uploaded video
 * - voiceName: Gemini TTS voice name (e.g., "Kore", "Puck")
 */
export const processVideo = onCall(
  {
    timeoutSeconds: 540,
    memory: "1GiB",
    secrets: [geminiApiKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated.");
    }

    const userId = request.auth.uid;
    const { bookId, videoPath, voiceName = "Kore" } = request.data;

    if (!bookId || !videoPath) {
      throw new HttpsError(
        "invalid-argument",
        "bookId and videoPath are required."
      );
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

    try {
      // ── Step 1: Update status to extracting ──
      await updateStatus(userId, bookId, "extracting", 10);

      // ── Step 2: Download video from Firebase Storage ──
      const file = bucket.file(videoPath);
      const [videoBuffer] = await file.download();

      // ── Step 3: Upload video to Gemini Files API ──
      await updateStatus(userId, bookId, "extracting", 20);

      const uploadedFile = await ai.files.upload({
        file: new Blob([videoBuffer], { type: "video/mp4" }),
        config: { mimeType: "video/mp4" },
      });

      // Poll until file is active
      let fileState = await ai.files.get({ name: uploadedFile.name! });
      let pollCount = 0;
      while (fileState.state === "PROCESSING" && pollCount < 60) {
        await new Promise((r) => setTimeout(r, 3000));
        fileState = await ai.files.get({ name: uploadedFile.name! });
        pollCount++;
      }

      if (fileState.state !== "ACTIVE") {
        throw new Error(`File processing failed. State: ${fileState.state}`);
      }

      // ── Step 4: Extract text via Gemini Video Understanding ──
      await updateStatus(userId, bookId, "extracting", 40);

      const extractionResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                fileData: {
                  fileUri: fileState.uri!,
                  mimeType: "video/mp4",
                },
              },
              {
                text: `You are an expert OCR system. Extract ALL visible text from every page shown in this video.
This is a video of someone slowly turning through the pages of a book.

Instructions:
- Return the text in reading order, page by page
- Include ONLY the main body text
- EXCLUDE: page numbers, headers, footers, endnote numbers/superscripts, decorative elements
- Fix obvious OCR errors (broken words across lines, misread characters)
- Ensure proper sentence flow across page boundaries
- Mark chapter boundaries with [CHAPTER: chapter title]
- Return clean, natural reading text with proper paragraph breaks
- If you cannot read text on a page, skip it silently`,
              },
            ],
          },
        ],
      });

      const rawText = extractionResponse.text || "";

      if (!rawText || rawText.length < 50) {
        throw new Error(
          "Failed to extract meaningful text from the video. The video may not contain readable text."
        );
      }

      // ── Step 5: Clean the extracted text ──
      await updateStatus(userId, bookId, "extracting", 60);

      const cleaningResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Clean this book text for audiobook narration. The text was extracted from video frames of book pages.

Rules:
- Remove any remaining page numbers, footnote markers, or reference numbers
- Fix broken words and OCR artifacts
- Ensure smooth sentence flow (text from adjacent pages should read naturally)
- Keep [CHAPTER: title] markers exactly as they are
- Remove duplicate text (from overlapping video frames)
- Fix punctuation and spacing issues
- Return clean, natural prose ready for text-to-speech narration
- Do NOT add any commentary, headers, or metadata — just the clean book text

Text to clean:
${rawText}`,
              },
            ],
          },
        ],
      });

      const cleanText = cleaningResponse.text || rawText;

      // Extract chapters from the cleaned text
      const chapters = extractChapters(cleanText);

      await updateStatus(userId, bookId, "generating_audio", 65, {
        extractedText: cleanText,
        chapters: chapters.map((c) => ({
          title: c.title,
          textOffset: c.textOffset,
          startTime: 0,
        })),
      });

      // ── Step 6: Generate TTS audio in chunks ──
      // Remove chapter markers from text for TTS
      const ttsText = cleanText.replace(/\[CHAPTER:\s*.+?\]/g, "").trim();
      const textChunks = splitTextIntoChunks(ttsText);
      const audioBuffers: Buffer[] = [];
      let totalAudioDuration = 0;

      for (let i = 0; i < textChunks.length; i++) {
        const progress = 65 + Math.round((i / textChunks.length) * 30);
        await updateStatus(userId, bookId, "generating_audio", progress);

        const ttsResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [
            {
              role: "user",
              parts: [{ text: textChunks[i] }],
            },
          ],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName,
                },
              },
            },
          },
        });

        const audioPart =
          ttsResponse.candidates?.[0]?.content?.parts?.[0];
        if (audioPart?.inlineData?.data) {
          const pcmBuffer = Buffer.from(audioPart.inlineData.data, "base64");
          audioBuffers.push(pcmBuffer);
          // Calculate duration: PCM 24kHz 16-bit mono = 48000 bytes per second
          totalAudioDuration += pcmBuffer.length / 48000;
        }

        // Rate limit: wait 500ms between TTS calls
        if (i < textChunks.length - 1) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      if (audioBuffers.length === 0) {
        throw new Error("No audio was generated from the text.");
      }

      // ── Step 7: Combine PCM buffers and add WAV header ──
      const combinedPcm = Buffer.concat(audioBuffers);
      const wavHeader = createWavHeader(combinedPcm.length, 24000, 1, 16);
      const wavBuffer = Buffer.concat([wavHeader, combinedPcm]);

      // ── Step 8: Upload WAV to Firebase Storage ──
      await updateStatus(userId, bookId, "generating_audio", 95);

      const audioPath = `users/${userId}/audio/${bookId}.wav`;
      const audioFile = bucket.file(audioPath);
      await audioFile.save(wavBuffer, {
        metadata: {
          contentType: "audio/wav",
          metadata: {
            bookId,
            voiceName,
            generatedAt: new Date().toISOString(),
          },
        },
      });

      // Calculate chapter start times proportionally
      const totalChars = ttsText.length;
      const chaptersWithTimes = chapters.map((ch) => {
        const charOffset = ch.textOffset;
        const proportion = totalChars > 0 ? charOffset / totalChars : 0;
        return {
          title: ch.title,
          textOffset: ch.textOffset,
          startTime: Math.round(proportion * totalAudioDuration),
        };
      });

      // ── Step 9: Update Firestore with completion status ──
      await updateStatus(userId, bookId, "ready", 100, {
        audioUri: audioPath,
        duration: Math.round(totalAudioDuration),
        chapters: chaptersWithTimes,
      });

      // Clean up the Gemini uploaded file
      try {
        await ai.files.delete({ name: uploadedFile.name! });
      } catch {
        // Non-critical, ignore cleanup errors
      }

      return {
        success: true,
        audioPath,
        duration: Math.round(totalAudioDuration),
        chaptersCount: chaptersWithTimes.length,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("processVideo error:", error);

      await updateStatus(userId, bookId, "error", 0, {
        errorMessage,
      });

      throw new HttpsError("internal", errorMessage);
    }
  }
);

/**
 * Returns a signed download URL for a book's audio file.
 */
export const getBookAudio = onCall(
  { secrets: [geminiApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated.");
    }

    const { audioPath } = request.data;

    if (!audioPath) {
      throw new HttpsError("invalid-argument", "audioPath is required.");
    }

    // Verify the file belongs to the authenticated user
    if (!audioPath.startsWith(`users/${request.auth.uid}/`)) {
      throw new HttpsError(
        "permission-denied",
        "Cannot access another user's files."
      );
    }

    const file = bucket.file(audioPath);
    const [exists] = await file.exists();

    if (!exists) {
      throw new HttpsError("not-found", "Audio file not found.");
    }

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    return { url };
  }
);

/**
 * Retries processing for a failed book.
 */
export const retryProcessing = onCall(
  {
    timeoutSeconds: 540,
    memory: "1GiB",
    secrets: [geminiApiKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated.");
    }

    const userId = request.auth.uid;
    const { bookId } = request.data;

    if (!bookId) {
      throw new HttpsError("invalid-argument", "bookId is required.");
    }

    const bookDoc = await db
      .collection("users")
      .doc(userId)
      .collection("books")
      .doc(bookId)
      .get();

    if (!bookDoc.exists) {
      throw new HttpsError("not-found", "Book not found.");
    }

    const bookData = bookDoc.data()!;

    // Reset status and re-trigger processing
    await updateStatus(userId, bookId, "extracting", 0, {
      errorMessage: admin.firestore.FieldValue.delete(),
    });

    // Call processVideo logic (re-use by calling the function)
    // In practice, you'd refactor the logic into a shared function
    // For now, return the data needed to call processVideo from the client
    return {
      bookId,
      videoPath: bookData.videoUri,
      voiceName: bookData.voiceName,
    };
  }
);
