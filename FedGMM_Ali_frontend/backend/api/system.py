from flask import Blueprint, jsonify
import os

# 创建蓝图
system_api = Blueprint('system', __name__)

# 数据目录路径
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'data')

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
