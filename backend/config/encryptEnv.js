require('dotenv').config();
const CryptoJS = require('crypto-js');
const fs = require('fs');

const secretKey = ENCRYPTION_KEY

const data = {
  DB_CONNECT: process.env.DB_CONNECT ,
  JWT_SECRET: process.env.JWT_SECRET
};

const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
console.log('Encrypted Data:', encryptedData);

// Sauvegarder les données chiffrées dans un fichier (optionnel)
fs.writeFileSync('.env.encrypted', encryptedData);
console.log('.env.encrypted file created with encrypted data');
