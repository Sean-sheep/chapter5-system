/**
 * 加密模块
 * 提供前端加密通信功能
 */

// 加密工具类
const CryptoUtils = {
    // 生成RSA密钥对
    async generateKeyPair() {
        try {
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: 'RSA-OAEP',
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: 'SHA-256'
                },
                true,
                ['encrypt', 'decrypt']
            );
            
            return keyPair;
        } catch (error) {
            console.error('生成密钥对失败:', error);
            throw error;
        }
    },
    
    // 导出公钥为PEM格式
    async exportPublicKey(publicKey) {
        try {
            const exported = await window.crypto.subtle.exportKey('spki', publicKey);
            const exportedAsString = this.arrayBufferToString(exported);
            const exportedAsBase64 = btoa(exportedAsString);
            return `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;
        } catch (error) {
            console.error('导出公钥失败:', error);
            throw error;
        }
    },
    
    // 导入PEM格式公钥
    async importPublicKey(pem) {
        try {
            const pemHeader = '-----BEGIN PUBLIC KEY-----';
            const pemFooter = '-----END PUBLIC KEY-----';
            const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
            const binaryDerString = atob(pemContents);
            const binaryDer = this.stringToArrayBuffer(binaryDerString);
            
            return await window.crypto.subtle.importKey(
                'spki',
                binaryDer,
                {
                    name: 'RSA-OAEP',
                    hash: 'SHA-256'
                },
                true,
                ['encrypt']
            );
        } catch (error) {
            console.error('导入公钥失败:', error);
            throw error;
        }
    },
    
    // 生成AES密钥
    async generateAESKey() {
        try {
            return await window.crypto.subtle.generateKey(
                {
                    name: 'AES-GCM',
                    length: 256
                },
                true,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.error('生成AES密钥失败:', error);
            throw error;
        }
    },
    
    // 导出AES密钥
    async exportAESKey(key) {
        try {
            const exported = await window.crypto.subtle.exportKey('raw', key);
            return this.arrayBufferToBase64(exported);
        } catch (error) {
            console.error('导出AES密钥失败:', error);
            throw error;
        }
    },
    
    // 导入AES密钥
    async importAESKey(keyData) {
        try {
            const rawKey = this.base64ToArrayBuffer(keyData);
            return await window.crypto.subtle.importKey(
                'raw',
                rawKey,
                {
                    name: 'AES-GCM'
                },
                true,
                ['encrypt', 'decrypt']
            );
        } catch (error) {
            console.error('导入AES密钥失败:', error);
            throw error;
        }
    },
    
    // 使用RSA加密
    async rsaEncrypt(publicKey, data) {
        try {
            const encoded = new TextEncoder().encode(data);
            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: 'RSA-OAEP'
                },
                publicKey,
                encoded
            );
            return this.arrayBufferToBase64(encrypted);
        } catch (error) {
            console.error('RSA加密失败:', error);
            throw error;
        }
    },
    
    // 使用AES加密
    async aesEncrypt(aesKey, data) {
        try {
            const encoded = new TextEncoder().encode(data);
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            
            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                aesKey,
                encoded
            );
            
            return {
                iv: this.arrayBufferToBase64(iv),
                ciphertext: this.arrayBufferToBase64(encrypted)
            };
        } catch (error) {
            console.error('AES加密失败:', error);
            throw error;
        }
    },
    
    // 使用AES解密
    async aesDecrypt(aesKey, encryptedData, iv) {
        try {
            const ivBuffer = this.base64ToArrayBuffer(iv);
            const encryptedBuffer = this.base64ToArrayBuffer(encryptedData);
            
            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: ivBuffer
                },
                aesKey,
                encryptedBuffer
            );
            
            return new TextDecoder().decode(decrypted);
        } catch (error) {
            console.error('AES解密失败:', error);
            throw error;
        }
    },
    
    // 生成HMAC签名
    async generateHMAC(key, data) {
        try {
            const encoded = new TextEncoder().encode(data);
            const signature = await window.crypto.subtle.sign(
                {
                    name: 'HMAC',
                    hash: 'SHA-256'
                },
                key,
                encoded
            );
            return this.arrayBufferToBase64(signature);
        } catch (error) {
            console.error('生成HMAC签名失败:', error);
            throw error;
        }
    },
    
    // 验证HMAC签名
    async verifyHMAC(key, data, signature) {
        try {
            const encoded = new TextEncoder().encode(data);
            const signatureBuffer = this.base64ToArrayBuffer(signature);
            
            return await window.crypto.subtle.verify(
                {
                    name: 'HMAC',
                    hash: 'SHA-256'
                },
                key,
                signatureBuffer,
                encoded
            );
        } catch (error) {
            console.error('验证HMAC签名失败:', error);
            throw error;
        }
    },
    
    // 工具方法：ArrayBuffer转字符串
    arrayBufferToString(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return binary;
    },
    
    // 工具方法：字符串转ArrayBuffer
    stringToArrayBuffer(str) {
        const buffer = new ArrayBuffer(str.length);
        const bufView = new Uint8Array(buffer);
        for (let i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return buffer;
    },
    
    // 工具方法：ArrayBuffer转Base64
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    },
    
    // 工具方法：Base64转ArrayBuffer
    base64ToArrayBuffer(base64) {
        const binary_string = atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    },
    
    // 生成随机字符串
    generateRandomString(length = 32) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return result;
    },
    
    // 生成消息ID
    generateMessageId() {
        return `${Date.now()}_${this.generateRandomString(16)}`;
    }
};

// 加密通信客户端
const SecureClient = {
    // 存储加密密钥
    keys: {
        publicKey: null,
        privateKey: null,
        aesKey: null,
        serverPublicKey: null
    },
    
    // 初始化加密客户端
    async init() {
        try {
            // 检查浏览器支持
            if (!window.crypto || !window.crypto.subtle) {
                throw new Error('您的浏览器不支持Web Crypto API');
            }
            
            // 生成RSA密钥对
            const keyPair = await CryptoUtils.generateKeyPair();
            this.keys.publicKey = keyPair.publicKey;
            this.keys.privateKey = keyPair.privateKey;
            
            console.log('加密客户端初始化成功');
        } catch (error) {
            console.error('初始化加密客户端失败:', error);
            throw new Error(`加密系统初始化失败: ${error.message}`);
        }
    },
    
    // 设置服务器公钥
    async setServerPublicKey(publicKeyPem) {
        try {
            if (!publicKeyPem) {
                throw new Error('服务器公钥不能为空');
            }
            
            this.keys.serverPublicKey = await CryptoUtils.importPublicKey(publicKeyPem);
            console.log('服务器公钥设置成功');
        } catch (error) {
            console.error('设置服务器公钥失败:', error);
            throw new Error(`设置服务器公钥失败: ${error.message}`);
        }
    },
    
    // 生成加密的请求数据
    async encryptRequest(data, isSSH = false) {
        try {
            // 检查服务器公钥是否已设置
            if (!this.keys.serverPublicKey) {
                throw new Error('服务器公钥未设置');
            }
            
            // 验证数据格式
            if (data === null || data === undefined) {
                throw new Error('加密数据不能为空');
            }
            
            // 生成AES密钥
            const aesKey = await CryptoUtils.generateAESKey();
            this.keys.aesKey = aesKey;
            
            // 导出AES密钥
            const aesKeyExported = await CryptoUtils.exportAESKey(aesKey);
            
            // 使用服务器公钥加密AES密钥
            const encryptedAesKey = await CryptoUtils.rsaEncrypt(this.keys.serverPublicKey, aesKeyExported);
            
            // 序列化数据
            let dataString;
            try {
                dataString = JSON.stringify(data);
            } catch (jsonError) {
                throw new Error('数据序列化失败');
            }
            
            // 使用AES加密数据
            const encryptedData = await CryptoUtils.aesEncrypt(aesKey, dataString);
            
            // 生成消息ID
            const messageId = CryptoUtils.generateMessageId();
            
            // 构建加密请求
            const encryptedRequest = {
                message_id: messageId,
                encryption: {
                    algorithm: 'RSA-OAEP-AES-GCM',
                    key_algorithm: 'RSA-OAEP',
                    data_algorithm: 'AES-GCM',
                    encrypted_key: encryptedAesKey,
                    iv: encryptedData.iv
                },
                data: {
                    type: isSSH ? 'ssh_credentials' : 'regular',
                    content: encryptedData.ciphertext
                },
                timestamp: Date.now(),
                version: '1.0'
            };
            
            return encryptedRequest;
        } catch (error) {
            console.error('加密请求失败:', error);
            throw new Error(`加密请求失败: ${error.message}`);
        }
    },
    
    // 解密服务器响应
    async decryptResponse(encryptedResponse) {
        try {
            // 验证响应格式
            if (!encryptedResponse || typeof encryptedResponse !== 'object') {
                throw new Error('无效的响应格式');
            }
            
            if (!encryptedResponse.data || !encryptedResponse.data.content) {
                throw new Error('响应数据不完整');
            }
            
            // 提取加密信息
            const content = encryptedResponse.data.content;
            const iv = content.iv;
            const ciphertext = content.ciphertext;
            
            if (!iv || !ciphertext) {
                throw new Error('缺少加密信息');
            }
            
            // 检查AES密钥是否存在
            if (!this.keys.aesKey) {
                throw new Error('AES密钥未设置');
            }
            
            // 使用AES密钥解密数据
            const decryptedData = await CryptoUtils.aesDecrypt(this.keys.aesKey, ciphertext, iv);
            
            // 解析JSON数据
            try {
                return JSON.parse(decryptedData);
            } catch (jsonError) {
                throw new Error('解密数据解析失败');
            }
        } catch (error) {
            console.error('解密响应失败:', error);
            throw new Error(`解密响应失败: ${error.message}`);
        }
    },
    
    // 重置加密状态
    reset() {
        this.keys = {
            publicKey: null,
            privateKey: null,
            aesKey: null,
            serverPublicKey: null
        };
        console.log('加密客户端状态已重置');
    },
    
    // 检查加密系统状态
    getStatus() {
        return {
            initialized: !!this.keys.privateKey,
            serverPublicKeySet: !!this.keys.serverPublicKey,
            hasAesKey: !!this.keys.aesKey
        };
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CryptoUtils, SecureClient };
}
