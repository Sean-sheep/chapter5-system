import rsa
import base64
import json
import os
import time
import hashlib
import hmac
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CryptoUtils:
    """加密工具类"""
    
    def __init__(self, key_dir='./keys'):
        """
        初始化加密工具
        
        Args:
            key_dir: 密钥存储目录
        """
        self.key_dir = key_dir
        self.private_key = None
        self.public_key = None
        self._ensure_key_dir()
        self._load_or_generate_keys()
    
    def _ensure_key_dir(self):
        """确保密钥目录存在"""
        if not os.path.exists(self.key_dir):
            os.makedirs(self.key_dir)
    
    def _load_or_generate_keys(self):
        """加载或生成RSA密钥对"""
        private_key_path = os.path.join(self.key_dir, 'private_key.pem')
        public_key_path = os.path.join(self.key_dir, 'public_key.pem')
        
        try:
            # 尝试加载现有密钥
            if os.path.exists(private_key_path) and os.path.exists(public_key_path):
                try:
                    with open(private_key_path, 'rb') as f:
                        private_key_data = f.read()
                    
                    with open(public_key_path, 'rb') as f:
                        public_key_data = f.read()
                    
                    # 加载密钥
                    self.private_key = rsa.PrivateKey.load_pkcs1(private_key_data)
                    self.public_key = rsa.PublicKey.load_pkcs1(public_key_data)
                    
                    logger.info('成功加载现有RSA密钥对')
                except Exception as load_error:
                    logger.warning(f'加载现有密钥失败，将生成新密钥: {str(load_error)}')
                    # 删除损坏的密钥文件
                    if os.path.exists(private_key_path):
                        os.remove(private_key_path)
                    if os.path.exists(public_key_path):
                        os.remove(public_key_path)
                    # 生成新密钥对
                    self._generate_new_keys(private_key_path, public_key_path)
            else:
                # 生成新密钥对
                self._generate_new_keys(private_key_path, public_key_path)
        except Exception as e:
            logger.error(f'加载或生成密钥失败: {str(e)}')
            raise
    
    def _generate_new_keys(self, private_key_path, public_key_path):
        """生成新的RSA密钥对"""
        # 生成新密钥对
        self.private_key, self.public_key = rsa.newkeys(2048)
        
        # 保存密钥
        with open(private_key_path, 'wb') as f:
            f.write(self.private_key.save_pkcs1())
        
        with open(public_key_path, 'wb') as f:
            f.write(self.public_key.save_pkcs1())
        
        logger.info('成功生成并保存新的RSA密钥对')
    
    def get_public_key_pem(self):
        """
        获取公钥的PEM格式
        
        Returns:
            str: PEM格式的公钥
        """
        try:
            public_key_pem = self.public_key.save_pkcs1().decode('utf-8')
            return f'-----BEGIN RSA PUBLIC KEY-----\n{public_key_pem}\n-----END RSA PUBLIC KEY-----'
        except Exception as e:
            logger.error(f'获取公钥PEM格式失败: {str(e)}')
            raise
    
    def rsa_decrypt(self, encrypted_data):
        """
        使用RSA私钥解密
        
        Args:
            encrypted_data: 加密的数据（base64编码）
            
        Returns:
            str: 解密后的数据
        """
        try:
            encrypted_bytes = base64.b64decode(encrypted_data)
            decrypted_bytes = rsa.decrypt(encrypted_bytes, self.private_key)
            return decrypted_bytes.decode('utf-8')
        except rsa.DecryptionError:
            logger.error('RSA解密失败: 解密错误')
            raise ValueError('RSA解密失败')
        except Exception as e:
            logger.error(f'RSA解密失败: {str(e)}')
            raise
    
    def aes_decrypt(self, encrypted_data, key, iv):
        """
        使用AES-GCM解密
        
        Args:
            encrypted_data: 加密的数据（base64编码）
            key: AES密钥（base64编码）
            iv: 初始化向量（base64编码）
            
        Returns:
            str: 解密后的数据
        """
        try:
            # 解码base64数据
            key_bytes = base64.b64decode(key)
            iv_bytes = base64.b64decode(iv)
            ciphertext_bytes = base64.b64decode(encrypted_data)
            
            # 创建解密器
            cipher = Cipher(
                algorithms.AES(key_bytes),
                modes.GCM(iv_bytes),
                backend=default_backend()
            )
            decryptor = cipher.decryptor()
            
            # 解密数据
            decrypted_bytes = decryptor.update(ciphertext_bytes) + decryptor.finalize()
            
            return decrypted_bytes.decode('utf-8')
        except Exception as e:
            logger.error(f'AES解密失败: {str(e)}')
            raise ValueError('AES解密失败')
    
    def verify_hmac(self, data, signature, key):
        """
        验证HMAC签名
        
        Args:
            data: 原始数据
            signature: HMAC签名（base64编码）
            key: HMAC密钥
            
        Returns:
            bool: 签名是否有效
        """
        try:
            signature_bytes = base64.b64decode(signature)
            h = hmac.new(key.encode('utf-8'), data.encode('utf-8'), hashlib.sha256)
            return hmac.compare_digest(h.digest(), signature_bytes)
        except Exception as e:
            logger.error(f'验证HMAC签名失败: {str(e)}')
            return False
    
    def hash_password(self, password):
        """
        哈希密码
        
        Args:
            password: 原始密码
            
        Returns:
            str: 哈希后的密码
        """
        try:
            hashed = hashlib.sha256(password.encode('utf-8')).hexdigest()
            return hashed
        except Exception as e:
            logger.error(f'哈希密码失败: {str(e)}')
            raise

class SecureServer:
    """加密通信服务器"""
    
    def __init__(self):
        """初始化加密服务器"""
        try:
            self.crypto = CryptoUtils()
            logger.info('加密服务器初始化成功')
        except Exception as e:
            logger.error(f'初始化加密服务器失败: {str(e)}')
            raise
    
    def decrypt_request(self, encrypted_request):
        """
        解密客户端请求
        
        Args:
            encrypted_request: 加密的请求数据
            
        Returns:
            dict: 解密后的数据
        """
        try:
            # 验证请求格式
            if not isinstance(encrypted_request, dict):
                raise ValueError('无效的请求格式')
            
            # 验证必要字段
            required_fields = ['message_id', 'encryption', 'data', 'timestamp', 'version']
            for field in required_fields:
                if field not in encrypted_request:
                    raise ValueError(f'缺少必要字段: {field}')
            
            # 验证加密信息
            encryption_info = encrypted_request['encryption']
            if not isinstance(encryption_info, dict):
                raise ValueError('无效的加密信息格式')
            
            encrypted_aes_key = encryption_info.get('encrypted_key')
            iv = encryption_info.get('iv')
            
            if not encrypted_aes_key or not iv:
                raise ValueError('缺少加密信息')
            
            if not isinstance(encrypted_aes_key, str) or not isinstance(iv, str):
                raise ValueError('加密信息格式错误')
            
            # 解密AES密钥
            try:
                aes_key = self.crypto.rsa_decrypt(encrypted_aes_key)
            except Exception as e:
                raise ValueError(f'解密AES密钥失败: {str(e)}')
            
            # 验证数据信息
            data_info = encrypted_request['data']
            if not isinstance(data_info, dict):
                raise ValueError('无效的数据信息格式')
            
            encrypted_content = data_info.get('content')
            
            if not encrypted_content:
                raise ValueError('缺少加密内容')
            
            if not isinstance(encrypted_content, str):
                raise ValueError('加密内容格式错误')
            
            # 解密数据
            try:
                decrypted_content = self.crypto.aes_decrypt(encrypted_content, aes_key, iv)
            except Exception as e:
                raise ValueError(f'解密数据失败: {str(e)}')
            
            # 解析JSON数据
            try:
                data = json.loads(decrypted_content)
            except json.JSONDecodeError:
                raise ValueError('解密数据解析失败')
            
            # 验证数据类型
            data_type = data_info.get('type', 'regular')
            
            logger.info(f'成功解密请求，消息ID: {encrypted_request["message_id"]}, 数据类型: {data_type}')
            
            return {
                'data': data,
                'data_type': data_type,
                'message_id': encrypted_request['message_id'],
                'timestamp': encrypted_request['timestamp']
            }
        except ValueError as e:
            logger.error(f'解密请求失败: {str(e)}')
            raise
        except Exception as e:
            logger.error(f'解密请求失败: {str(e)}')
            raise ValueError(f'解密请求失败: {str(e)}')
    
    def encrypt_response(self, data, aes_key, iv):
        """
        加密服务器响应
        
        Args:
            data: 响应数据
            aes_key: AES密钥
            iv: 初始化向量
            
        Returns:
            dict: 加密后的响应
        """
        try:
            # 验证参数
            if not data:
                raise ValueError('响应数据不能为空')
            
            if not aes_key or not iv:
                raise ValueError('AES密钥和初始化向量不能为空')
            
            # 序列化数据
            try:
                data_string = json.dumps(data)
            except Exception as e:
                raise ValueError(f'数据序列化失败: {str(e)}')
            
            # 编码数据
            try:
                data_bytes = data_string.encode('utf-8')
                key_bytes = base64.b64decode(aes_key)
                iv_bytes = base64.b64decode(iv)
            except Exception as e:
                raise ValueError(f'数据编码失败: {str(e)}')
            
            # 创建加密器
            try:
                cipher = Cipher(
                    algorithms.AES(key_bytes),
                    modes.GCM(iv_bytes),
                    backend=default_backend()
                )
                encryptor = cipher.encryptor()
            except Exception as e:
                raise ValueError(f'创建加密器失败: {str(e)}')
            
            # 加密数据
            try:
                ciphertext = encryptor.update(data_bytes) + encryptor.finalize()
            except Exception as e:
                raise ValueError(f'加密数据失败: {str(e)}')
            
            # 编码加密数据
            try:
                encrypted_content = base64.b64encode(ciphertext).decode('utf-8')
            except Exception as e:
                raise ValueError(f'编码加密数据失败: {str(e)}')
            
            return {
                'encryption': {
                    'algorithm': 'AES-GCM',
                    'iv': iv
                },
                'data': {
                    'content': encrypted_content
                },
                'timestamp': int(time.time())
            }
        except ValueError as e:
            logger.error(f'加密响应失败: {str(e)}')
            raise
        except Exception as e:
            logger.error(f'加密响应失败: {str(e)}')
            raise ValueError(f'加密响应失败: {str(e)}')
    
    def process_ssh_credentials(self, ssh_data):
        """
        处理SSH凭证
        
        Args:
            ssh_data: SSH凭证数据
            
        Returns:
            dict: 处理结果
        """
        try:
            # 验证SSH凭证格式
            required_fields = ['hostname', 'username']
            for field in required_fields:
                if field not in ssh_data:
                    raise ValueError(f'缺少SSH凭证字段: {field}')
            
            # 验证可选字段
            if 'password' not in ssh_data and 'private_key' not in ssh_data:
                raise ValueError('SSH凭证必须包含密码或私钥')
            
            # 安全处理凭证（实际应用中应进行更严格的验证）
            logger.info(f'收到SSH凭证: 主机={ssh_data["hostname"]}, 用户={ssh_data["username"]}')
            
            # 这里可以添加凭证验证逻辑
            # 例如：尝试验证SSH连接
            
            return {
                'status': 'success',
                'message': 'SSH凭证处理成功',
                'details': {
                    'hostname': ssh_data['hostname'],
                    'username': ssh_data['username'],
                    'has_password': 'password' in ssh_data,
                    'has_private_key': 'private_key' in ssh_data
                }
            }
        except Exception as e:
            logger.error(f'处理SSH凭证失败: {str(e)}')
            raise

# 全局加密服务器实例
secure_server = SecureServer()
