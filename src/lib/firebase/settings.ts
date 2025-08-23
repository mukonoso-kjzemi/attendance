import { db } from './config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const settingsRef = doc(db, 'config', 'settings');

export const getSettings = async (): Promise<any> => {
  try {
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return {};
  } catch (error) {
    console.error("Failed to get settings:", error);
    return {};
  }
};

export const updateSettings = async (data: any): Promise<void> => {
  try {
    await setDoc(settingsRef, data, { merge: true });
  } catch (error) {
    console.error("Failed to update settings:", error);
    throw new Error('設定の保存に失敗しました。');
  }
};
