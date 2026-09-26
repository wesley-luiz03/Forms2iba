import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getBufferKey(): Buffer | null {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    return null;
  }
  try {
    return Buffer.from(keyHex, 'hex');
  } catch {
    return null;
  }
}

export function encrypt(text: string | null | undefined): string | null {
  if (!text || typeof text !== 'string' || text.trim() === '' || text === '—' || text === 'NÃO SE APLICA') {
    return text || null;
  }

  const key = getBufferKey();
  if (!key) return text;

  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch {
    return text;
  }
}

export function decrypt(encryptedText: string | null | undefined): string | null {
  if (!encryptedText || typeof encryptedText !== 'string' || !encryptedText.includes(':')) {
    return encryptedText || null;
  }

  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    return encryptedText;
  }

  const key = getBufferKey();
  if (!key) return encryptedText;

  try {
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return encryptedText;
  }
}