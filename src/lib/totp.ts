import { createHmac, randomBytes } from "crypto";
import QRCode from "qrcode";

const SERVICE_NAME = "Cerkar Makina";
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(base32: string): Buffer {
  const cleaned = base32.toUpperCase().replace(/=/g, "").replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const val = BASE32_CHARS.indexOf(cleaned[i]);
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

export function generateTotpSecret(): string {
  const buffer = randomBytes(20);
  return base32Encode(buffer);
}

export function generateTotpUri(username: string, secret: string): string {
  const encodedService = encodeURIComponent(SERVICE_NAME);
  const encodedUser = encodeURIComponent(username);
  return `otpauth://totp/${encodedService}:${encodedUser}?secret=${secret}&issuer=${encodedService}&algorithm=SHA1&digits=6&period=30`;
}

export async function generateTotpSetup(username: string) {
  const secret = generateTotpSecret();
  const otpauthUrl = generateTotpUri(username, secret);
  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

  return {
    secret,
    otpauthUrl,
    qrCodeUrl,
  };
}

export function verifyTotpToken(token: string, secret: string, window = 1): boolean {
  if (!token || !secret) return false;
  const cleanToken = token.replace(/[\s-]/g, "");
  if (!/^\d{6}$/.test(cleanToken)) return false;

  try {
    const key = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const currentStep = Math.floor(epoch / 30);

    for (let i = -window; i <= window; i++) {
      const step = currentStep + i;
      const buf = Buffer.alloc(8);
      buf.writeBigInt64BE(BigInt(step), 0);

      const hmac = createHmac("sha1", key).update(buf).digest();
      const offset = hmac[hmac.length - 1] & 0xf;
      const code =
        ((hmac[offset] & 0x7f) << 24 |
          (hmac[offset + 1] & 0xff) << 16 |
          (hmac[offset + 2] & 0xff) << 8 |
          (hmac[offset + 3] & 0xff)) %
        1000000;

      const generatedToken = code.toString().padStart(6, "0");
      if (generatedToken === cleanToken) {
        return true;
      }
    }
  } catch (error) {
    console.error("[TOTP] Verification error:", error);
  }

  return false;
}
