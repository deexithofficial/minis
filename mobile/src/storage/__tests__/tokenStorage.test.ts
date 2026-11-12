import * as SecureStore from 'expo-secure-store';
import { saveToken, getToken, clearToken } from '../tokenStorage';

jest.mock('expo-secure-store');

test('saves, reads, and clears the token under a fixed key', async () => {
  await saveToken('tok-123');
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('minis.token', 'tok-123');
  (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('tok-123');
  expect(await getToken()).toBe('tok-123');
  await clearToken();
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('minis.token');
});
