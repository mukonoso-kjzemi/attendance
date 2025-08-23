import { db } from './config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const settingsRef = doc(db, 'config', 'settings');

export const getAutoCheckoutTime = async (): Promise<string | null> => {
  try {
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.autoCheckoutTime || null;
    }
    return null;
  } catch (error) {
    console.error("Failed to get auto checkout time:", error);
    return null;
  }
};

export const setAutoCheckoutTime = async (time: string): Promise<void> => {
  try {
    await setDoc(settingsRef, { autoCheckoutTime: time }, { merge: true });
  } catch (error) {
    console.error("Failed to set auto checkout time:", error);
    throw new Error('設定の保存に失敗しました。');
  }
};
