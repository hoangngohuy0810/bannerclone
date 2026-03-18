import { db, storage } from "./firebaseConfig";
import firebase from 'firebase/app';
import { GeneratedImage } from "../types";

/**
 * Uploads a base64 image to Firebase Storage and returns the public URL.
 */
const uploadImageToStorage = async (userId: string, imageBase64: string, type: 'generated' | 'reference'): Promise<string> => {
  // Create a unique filename
  const filename = `${type}_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
  
  // Storage Ref v8
  const storageRef = storage.ref(`users/${userId}/${type}/${filename}`);

  // Upload the base64 string
  await storageRef.putString(imageBase64, 'data_url');

  // Get download URL
  return await storageRef.getDownloadURL();
};

/**
 * Saves a generated banner to Firestore linked to the user.
 */
export const saveGeneratedBannerToHistory = async (
  userId: string, 
  generatedImage: GeneratedImage,
  metadata: { prompt: string; style: string }
) => {
  try {
    // 1. Upload the image to Storage (so we don't bloat Firestore with base64)
    const imageUrl = await uploadImageToStorage(userId, generatedImage.url, 'generated');

    // 2. Save metadata to Firestore using v8 syntax
    await db.collection("history").add({
      userId: userId,
      imageUrl: imageUrl,
      style: generatedImage.style,
      aspectRatio: generatedImage.aspectRatio,
      prompt: metadata.prompt,
      createdAt: firebase.firestore.Timestamp.now(),
      localId: generatedImage.id // Keep local ID for reference if needed
    });
    
    return imageUrl; // Return new cloud URL
  } catch (error) {
    console.error("Error saving to history:", error);
    throw error;
  }
};

/**
 * Fetches user's generation history.
 */
export const getUserHistory = async (userId: string): Promise<GeneratedImage[]> => {
  try {
    // Firestore Query v8
    const q = db.collection("history")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc");

    const querySnapshot = await q.get();
    const history: GeneratedImage[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      history.push({
        id: doc.id,
        url: data.imageUrl,
        style: data.style,
        aspectRatio: data.aspectRatio || '3:4' // Default to 3:4 if missing in old records
      });
    });

    return history;
  } catch (error) {
    console.error("Error fetching history:", error);
    return [];
  }
};