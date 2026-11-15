// Generates a self-signed code-signing keystore for the Android release build.
// Output: android/keystore/astra-release.p12 + android/key.properties
// The keystore is committed to the repo so every CI build (and every future
// release) uses the SAME signature — APK updates install over older versions.
//
// Re-run to replace the keystore (e.g. after a leak): node scripts/generate-keystore.mjs
// NOTE: replacing it changes the app signature; users must uninstall before reinstalling.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import forge from 'node-forge';

// Strong random password, regenerated each run (stored in key.properties)
const password = forge.util.bytesToHex(forge.random.getBytesSync(24));

// RSA 2048 key pair
const keys = forge.pki.rsa.generateKeyPair(2048);
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01' + forge.util.bytesToHex(forge.random.getBytesSync(16)).slice(0, 30);
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 25); // 25-year validity

const attrs = [
  { name: 'commonName', value: 'ASTRA Space Health' },
  { name: 'organizationName', value: 'ASTRA' },
  { shortName: 'OU', value: 'Engineering' },
  { shortName: 'C', value: 'US' },
];
cert.setSubject(attrs);
cert.setIssuer(attrs); // self-signed

cert.sign(keys.privateKey, forge.md.sha256.create());

// Build PKCS12 keystore (Java/Gradle reads this natively)
const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
  keys.privateKey,
  [cert],
  password,
  { algorithm: '3des', friendlyName: 'astra' }, // 3des = max Java keytool compatibility
);
const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
const p12Buffer = Buffer.from(p12Der, 'binary');

const keystoreDir = join(process.cwd(), 'android', 'keystore');
mkdirSync(keystoreDir, { recursive: true });
const keystorePath = join(keystoreDir, 'astra-release.p12');
writeFileSync(keystorePath, p12Buffer);

writeFileSync(
  join(process.cwd(), 'android', 'key.properties'),
  [
    'storeFile=../keystore/astra-release.p12',
    'storeType=PKCS12',
    `storePassword=${password}`,
    'keyAlias=astra',
    `keyPassword=${password}`,
    '',
  ].join('\n'),
);

console.log('Keystore written:', keystorePath);
console.log('key.properties written (android/key.properties)');
