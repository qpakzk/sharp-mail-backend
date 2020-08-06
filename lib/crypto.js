const { AES, enc } = require('crypto-js');

const key = 'secret';

exports.encrypt = text => {
    const encrypted = AES.encrypt(text, key).toString();
    console.info('==== encrypted =====');
    console.log(encrypted);
    return encrypted;
}

exports.decrypt = text => {
    const decrypted = AES.decrypt(text, key).toString(enc.Utf8);
    console.info('==== decrypted =====');
    console.log(decrypted);
    return decrypted;
}