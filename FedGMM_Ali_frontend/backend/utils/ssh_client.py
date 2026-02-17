import paramiko
import time
import logging
from typing import Dict, Optional, Tuple

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SSHClient:
    """SSH客户端类，实现连接、认证、状态管理、错误处理和重试机制"""
    
    def __init__(self):
        """初始化SSH客户端"""
        self.client = None
        self.connected = False
        self.hostname = None
        self.username = None
    
    def connect(self, hostname: str, username: str, password: Optional[str] = None, 
                key_filename: Optional[str] = None, port: int = 22, 
                timeout: int = 30, max_retries: int = 3, retry_delay: int = 5) -> Tuple[bool, str]:
        """
        连接到SSH服务器
        
        Args:
            hostname: 服务器主机名或IP地址
            username: 用户名
            password: 密码（可选）
            key_filename: 私钥文件路径（可选）
            port: SSH端口
            timeout: 连接超时时间（秒）
            max_retries: 最大重试次数
            retry_delay: 重试间隔（秒）
        
        Returns:
            Tuple[bool, str]: (连接是否成功, 消息)
        """
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                logger.info(f"尝试连接到 {hostname}:{port} (重试 {retry_count+1}/{max_retries})")
                
                # 创建新的SSH客户端
                self.client = paramiko.SSHClient()
                self.client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
                
                # 连接服务器
                self.client.connect(
                    hostname=hostname,
                    username=username,
                    password=password,
                    key_filename=key_filename,
                    port=port,
                    timeout=timeout,
                    look_for_keys=False
                )
                
                # 连接成功
                self.connected = True
                self.hostname = hostname
                self.username = username
                message = f"成功连接到 {hostname}:{port} 作为用户 {username}"
                logger.info(message)
                return True, message
                
            except paramiko.AuthenticationException:
                error_msg = "认证失败，请检查用户名和密码/密钥"
                logger.error(error_msg)
                return False, error_msg
            
            except paramiko.SSHException as ssh_err:
                retry_count += 1
                error_msg = f"SSH错误: {str(ssh_err)}"
                logger.error(error_msg)
                
                if retry_count < max_retries:
                    logger.info(f"{retry_delay}秒后重试...")
                    time.sleep(retry_delay)
                else:
                    return False, f"连接失败，已达到最大重试次数: {error_msg}"
            
            except Exception as e:
                retry_count += 1
                error_msg = f"连接错误: {str(e)}"
                logger.error(error_msg)
                
                if retry_count < max_retries:
                    logger.info(f"{retry_delay}秒后重试...")
                    time.sleep(retry_delay)
                else:
                    return False, f"连接失败，已达到最大重试次数: {error_msg}"
    
    def execute_command(self, command: str, timeout: int = 60) -> Tuple[bool, str, str, str]:
        """
        执行SSH命令
        
        Args:
            command: 要执行的命令
            timeout: 命令执行超时时间（秒）
        
        Returns:
            Tuple[bool, str, str, str]: (执行是否成功, 标准输出, 标准错误, 错误消息)
        """
        if not self.connected or not self.client:
            return False, "", "", "未连接到服务器"
        
        try:
            logger.info(f"执行命令: {command}")
            
            # 执行命令
            stdin, stdout, stderr = self.client.exec_command(command, timeout=timeout)
            
            # 读取输出
            stdout_content = stdout.read().decode('utf-8')
            stderr_content = stderr.read().decode('utf-8')
            
            # 检查命令执行状态
            exit_status = stdout.channel.recv_exit_status()
            
            if exit_status == 0:
                logger.info(f"命令执行成功: {command}")
                return True, stdout_content, stderr_content, ""
            else:
                error_msg = f"命令执行失败，退出状态码: {exit_status}"
                logger.error(f"{error_msg}, 错误输出: {stderr_content}")
                return False, stdout_content, stderr_content, error_msg
                
        except paramiko.SSHException as ssh_err:
            error_msg = f"SSH执行错误: {str(ssh_err)}"
            logger.error(error_msg)
            return False, "", "", error_msg
        
        except Exception as e:
            error_msg = f"执行错误: {str(e)}"
            logger.error(error_msg)
            return False, "", "", error_msg
    
    def close(self) -> bool:
        """
        关闭SSH连接
        
        Returns:
            bool: 关闭是否成功
        """
        try:
            if self.client:
                self.client.close()
                self.connected = False
                logger.info(f"已关闭到 {self.hostname} 的连接")
            return True
        except Exception as e:
            logger.error(f"关闭连接时出错: {str(e)}")
            return False
    
    def get_connection_status(self) -> Dict[str, any]:
        """
        获取连接状态
        
        Returns:
            Dict[str, any]: 连接状态信息
        """
        return {
            "connected": self.connected,
            "hostname": self.hostname,
            "username": self.username
        }
    
    def __del__(self):
        """析构函数，确保连接被关闭"""
        self.close()
