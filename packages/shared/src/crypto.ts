// Simple encryption/decryption utilities using Web Crypto API
// This is for state recovery, not security-critical data

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

/**
 * Derive a crypto key from a token string
 */
async function deriveKey(token: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(token.padEnd(32, '0').slice(0, 32)),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('nofus-state-recovery'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data with a token
 */
export async function encryptState(data: unknown, token: string): Promise<string> {
  try {
    const key = await deriveKey(token);
    const encoder = new TextEncoder();
    const dataStr = JSON.stringify(data);
    const dataBytes = encoder.encode(dataStr);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      dataBytes
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Failed to encrypt state:', error);
    throw error;
  }
}

/**
 * Decrypt data with a token
 */
export async function decryptState<T = unknown>(encryptedStr: string, token: string): Promise<T> {
  try {
    const key = await deriveKey(token);
    
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedStr), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    const dataStr = decoder.decode(decrypted);
    return JSON.parse(dataStr) as T;
  } catch (error) {
    console.error('Failed to decrypt state:', error);
    throw error;
  }
}
