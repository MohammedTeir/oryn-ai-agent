import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createCredentialVault } from './vault';

// A platform guard prevents use of a web or non-Android fallback as a secure
// Android storage implementation. No caller is wired to the preview yet.
export const credentialVault = createCredentialVault({
  isAvailableAsync: async () => Platform.OS === 'android' && await SecureStore.isAvailableAsync(),
  setItemAsync: (key, value) => SecureStore.setItemAsync(key, value),
  getItemAsync: key => SecureStore.getItemAsync(key),
  deleteItemAsync: key => SecureStore.deleteItemAsync(key),
});
