from flask import Blueprint, jsonify, request
import os
import threading
from backend.utils.ssh_client import SSHClient
from backend.utils.crypto_utils import secure_server

# 创建蓝图
system_api = Blueprint('system', __name__)

# 数据目录路径
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'data')

# 创建线程本地存储，为每个线程维护独立的SSH客户端实例
thread_local = threading.local()

def get_ssh_client():
    """获取当前线程的SSH客户端实例"""
    if not hasattr(thread_local, 'ssh_client'):
        thread_local.ssh_client = SSHClient()
    return thread_local.ssh_client

# 检查数据文件是否存在
def check_data_exists():
    """检查数据文件是否存在"""
    communication_dir = os.path.join(DATA_DIR, 'communication')
    gamma_dir = os.path.join(DATA_DIR, 'gamma')
    tau_dir = os.path.join(DATA_DIR, 'tau')
    models_dir = os.path.join(DATA_DIR, 'models')
    
    # 检查目录是否存在
    communication_exists = os.path.exists(communication_dir) and len(os.listdir(communication_dir)) > 0
    gamma_exists = os.path.exists(gamma_dir) and len(os.listdir(gamma_dir)) > 0
    tau_exists = os.path.exists(tau_dir) and len(os.listdir(tau_dir)) > 0
    models_exists = os.path.exists(models_dir) and len(os.listdir(models_dir)) > 0
    
    return {
        'communication': communication_exists,
        'gamma': gamma_exists,
        'tau': tau_exists,
        'models': models_exists
    }

# 获取系统状态
@system_api.route('/status')
def get_system_status():
    """获取系统状态"""
    try:
        # 检查数据存在性
        data_exists = check_data_exists()
        
        # 检查是否所有数据都已加载
        all_data_loaded = all(data_exists.values())
        
        # 可用城市
        available_cities = ['Tokyo', 'Osaka', 'Nagoya']
        
        # 可用训练轮次
        available_rounds = list(range(0, 51))  # 假设0-50轮
        
        # 系统状态描述
        if all_data_loaded:
            system_status = '系统正常运行，所有数据已加载'
        else:
            missing_data = [key for key, value in data_exists.items() if not value]
            system_status = f'系统运行中，缺少数据: {missing_data}'
        
        return jsonify({
            'data_loaded': all_data_loaded,
            'available_cities': available_cities,
            'available_rounds': available_rounds,
            'system_status': system_status,
            'data_status': data_exists
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'data_loaded': False,
            'available_cities': [],
            'available_rounds': [],
            'system_status': '系统状态获取失败'
        }), 500

# SSH连接API
@system_api.route('/ssh/connect', methods=['POST'])
def ssh_connect():
    """连接到SSH服务器"""
    try:
        # 获取请求参数
        data = request.json
        hostname = data.get('hostname')
        username = data.get('username')
        password = data.get('password')
        key_filename = data.get('key_filename')
        port = data.get('port', 22)
        timeout = data.get('timeout', 30)
        max_retries = data.get('max_retries', 3)
        retry_delay = data.get('retry_delay', 5)
        
        # 验证必要参数
        if not hostname or not username:
            return jsonify({
                'success': False,
                'message': '缺少必要参数: hostname 和 username'
            }), 400
        
        # 连接到SSH服务器
        success, message = get_ssh_client().connect(
            hostname=hostname,
            username=username,
            password=password,
            key_filename=key_filename,
            port=port,
            timeout=timeout,
            max_retries=max_retries,
            retry_delay=retry_delay
        )
        
        return jsonify({
            'success': success,
            'message': message,
            'connection_status': get_ssh_client().get_connection_status()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'连接错误: {str(e)}'
        }), 500

# SSH执行命令API
@system_api.route('/ssh/execute', methods=['POST'])
def ssh_execute():
    """执行SSH命令"""
    try:
        # 获取请求参数
        data = request.json
        command = data.get('command')
        timeout = data.get('timeout', 60)
        
        # 验证必要参数
        if not command:
            return jsonify({
                'success': False,
                'message': '缺少必要参数: command'
            }), 400
        
        # 执行命令
        success, stdout, stderr, error_msg = get_ssh_client().execute_command(
            command=command,
            timeout=timeout
        )
        
        return jsonify({
            'success': success,
            'stdout': stdout,
            'stderr': stderr,
            'message': error_msg if not success else '命令执行成功'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'执行错误: {str(e)}'
        }), 500

# SSH获取连接状态API
@system_api.route('/ssh/status')
def ssh_status():
    """获取SSH连接状态"""
    try:
        return jsonify({
            'success': True,
            'connection_status': get_ssh_client().get_connection_status()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取状态错误: {str(e)}'
        }), 500

# SSH关闭连接API
@system_api.route('/ssh/close', methods=['POST'])
def ssh_close():
    """关闭SSH连接"""
    try:
        success = get_ssh_client().close()
        return jsonify({
            'success': success,
            'message': '连接已关闭' if success else '关闭连接失败'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'关闭连接错误: {str(e)}'
        }), 500

# 获取服务器公钥
@system_api.route('/public-key')
def get_public_key():
    """获取服务器公钥"""
    try:
        public_key = secure_server.crypto.get_public_key_pem()
        return jsonify({
            'public_key': public_key,
            'success': True
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取公钥失败: {str(e)}'
        }), 500

# 处理加密的SSH凭证
@system_api.route('/ssh-credentials', methods=['POST'])
def handle_ssh_credentials():
    """处理加密的SSH凭证"""
    try:
        # 获取加密的请求数据
        encrypted_request = request.json
        
        # 解密请求
        decrypted_data = secure_server.decrypt_request(encrypted_request)
        
        # 检查数据类型
        if decrypted_data['data_type'] != 'ssh_credentials':
            return jsonify({
                'success': False,
                'message': '无效的数据类型'
            }), 400
        
        # 处理SSH凭证
        ssh_data = decrypted_data['data']
        result = secure_server.process_ssh_credentials(ssh_data)
        
        # 尝试使用凭证连接
        try:
            # 提取连接参数
            hostname = ssh_data.get('hostname')
            port = ssh_data.get('port', 22)
            username = ssh_data.get('username')
            password = ssh_data.get('password')
            private_key = ssh_data.get('private_key')
            passphrase = ssh_data.get('passphrase')
            
            # 连接到SSH服务器
            success, message = get_ssh_client().connect(
                hostname=hostname,
                username=username,
                password=password,
                key_filename=None,  # 这里可以根据需要调整
                port=port,
                timeout=30,
                max_retries=3,
                retry_delay=5
            )
            
            result['connection_test'] = {
                'success': success,
                'message': message
            }
            
        except Exception as conn_error:
            result['connection_test'] = {
                'success': False,
                'message': f'连接测试失败: {str(conn_error)}'
            }
        
        return jsonify({
            'success': True,
            'data': result,
            'message': 'SSH凭证处理成功'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'处理SSH凭证失败: {str(e)}'
        }), 500

# 启动训练任务
@system_api.route('/train/start', methods=['POST'])
def start_training():
    """启动训练任务"""
    try:
        # 获取请求参数
        data = request.json
        
        # 提取训练参数
        city = data.get('city', 'Tokyo')
        rounds = data.get('rounds', 50)
        gamma = data.get('gamma', 0.1)
        tau = data.get('tau', 0.5)
        compression = data.get('compression', True)
        adaptive = data.get('adaptive', True)
        personalization = data.get('personalization', True)
        
        # 验证必要参数
        if not city:
            return jsonify({
                'success': False,
                'message': '缺少必要参数: city'
            }), 400
        
        # 构建训练命令
        train_command = f'python train.py --city {city} --rounds {rounds} --gamma {gamma} --tau {tau}'
        
        # 添加可选参数
        if compression:
            train_command += ' --compression'
        if adaptive:
            train_command += ' --adaptive'
        if personalization:
            train_command += ' --personalization'
        
        # 检查SSH连接状态
        if not get_ssh_client().connected:
            return jsonify({
                'success': False,
                'message': 'SSH未连接，请先连接到服务器'
            }), 400
        
        # 执行训练命令（使用nohup后台执行）
        background_command = f'nohup {train_command} > train_{city}_{rounds}.log 2>&1 &'
        success, stdout, stderr, error_msg = get_ssh_client().execute_command(
            command=background_command,
            timeout=30
        )
        
        if success:
            # 命令执行成功，返回训练任务信息
            return jsonify({
                'success': True,
                'message': '训练任务已启动',
                'task_info': {
                    'city': city,
                    'rounds': rounds,
                    'gamma': gamma,
                    'tau': tau,
                    'compression': compression,
                    'adaptive': adaptive,
                    'personalization': personalization,
                    'command': train_command,
                    'log_file': f'train_{city}_{rounds}.log'
                }
            })
        else:
            # 命令执行失败
            return jsonify({
                'success': False,
                'message': f'启动训练任务失败: {error_msg}',
                'stderr': stderr
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'启动训练任务错误: {str(e)}'
        }), 500

# 获取训练任务状态
@system_api.route('/train/status', methods=['POST'])
def get_training_status():
    """获取训练任务状态"""
    try:
        # 获取请求参数
        data = request.json
        log_file = data.get('log_file')
        
        # 验证必要参数
        if not log_file:
            return jsonify({
                'success': False,
                'message': '缺少必要参数: log_file'
            }), 400
        
        # 检查SSH连接状态
        if not get_ssh_client().connected:
            return jsonify({
                'success': False,
                'message': 'SSH未连接，请先连接到服务器'
            }), 400
        
        # 检查日志文件是否存在
        check_file_command = f'ls -la {log_file}'
        success, stdout, stderr, error_msg = get_ssh_client().execute_command(
            command=check_file_command,
            timeout=30
        )
        
        if not success:
            return jsonify({
                'success': False,
                'message': f'日志文件不存在: {error_msg}'
            }), 404
        
        # 检查是否有训练进程在运行
        check_process_command = f'ps aux | grep "train.py" | grep -v grep'
        success, stdout, stderr, error_msg = get_ssh_client().execute_command(
            command=check_process_command,
            timeout=30
        )
        
        # 读取日志文件末尾内容
        tail_command = f'tail -50 {log_file}'
        success, log_content, stderr, error_msg = get_ssh_client().execute_command(
            command=tail_command,
            timeout=30
        )
        
        # 分析日志内容，提取训练进度
        progress = 0
        status = 'running'
        error = False
        error_message = ''
        
        # 简单的进度提取逻辑
        if log_content:
            # 查找包含轮次信息的行
            lines = log_content.split('\n')
            for line in lines:
                if 'Round' in line:
                    import re
                    match = re.search(r'Round (\d+)/(\d+)', line)
                    if match:
                        current_round = int(match.group(1))
                        total_rounds = int(match.group(2))
                        progress = int((current_round / total_rounds) * 100)
                # 查找错误信息
                if 'Error' in line or 'error' in line:
                    error = True
                    error_message = line
                    status = 'error'
                # 查找训练完成信息
                if 'Training completed' in line:
                    progress = 100
                    status = 'completed'
        
        # 检查进程是否在运行
        if not stdout.strip() and status == 'running':
            # 进程不在运行，但状态仍为running，可能是已完成或出错
            if error:
                status = 'error'
            else:
                status = 'completed'
        
        return jsonify({
            'success': True,
            'message': '获取训练状态成功',
            'status': status,
            'progress': progress,
            'error': error,
            'error_message': error_message,
            'log_content': log_content
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'获取训练状态错误: {str(e)}'
        }), 500

# 停止训练任务
@system_api.route('/train/stop', methods=['POST'])
def stop_training():
    """停止训练任务"""
    try:
        # 检查SSH连接状态
        if not get_ssh_client().connected:
            return jsonify({
                'success': False,
                'message': 'SSH未连接，请先连接到服务器'
            }), 400
        
        # 查找并终止训练进程
        stop_command = f'pkill -f "train.py"'
        success, stdout, stderr, error_msg = get_ssh_client().execute_command(
            command=stop_command,
            timeout=30
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': '训练任务已停止'
            })
        else:
            return jsonify({
                'success': False,
                'message': f'停止训练任务失败: {error_msg}'
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'停止训练任务错误: {str(e)}'
        }), 500
