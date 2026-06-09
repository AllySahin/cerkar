const { createHash } = require("crypto");

// admin:cerkar_secret hash'i hesapla
const password = "admin";
const salt = "cerkar_secret";
const hash = createHash("sha256")
  .update(`${password}:${salt}`)
  .digest("hex");

console.log("Password:", password);
console.log("Hash:", hash);
console.log("\nSupabase'de çalıştır:");
console.log(`
INSERT INTO profiles (username, password_hash, full_name, role)
VALUES (
  'admin',
  '${hash}',
  'Admin',
  'admin'
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = '${hash}';
`);
