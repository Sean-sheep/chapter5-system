from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入API路由
from backend.api.system import system_api
from backend.api.communication import communication_api
from backend.api.adaptive import adaptive_api
from backend.api.personalization import personalization_api
from backend.api.recommendation import recommendation_api

# 创建Flask应用
app = Flask(__name__)

# 启用CORS
CORS(app, resources={"/*": {"origins": "*"}})

# 注册API蓝图
app.register_blueprint(system_api, url_prefix='/api/system')
app.register_blueprint(communication_api, url_prefix='/api/communication')
app.register_blueprint(adaptive_api, url_prefix='/api/adaptive')
app.register_blueprint(personalization_api, url_prefix='/api/personalization')
app.register_blueprint(recommendation_api, url_prefix='/api/recommendation')

# 根路由
@app.route('/')
def index():
    return jsonify({
        'message': '城市旅游消费个性化推荐系统API',
        'version': '1.0.0',
        'endpoints': {
            'system': '/api/system/status',
            'communication': '/api/communication/data',
            'adaptive': '/api/adaptive/data',
            'personalization': '/api/personalization/data',
            'recommendation': '/api/recommendation/generate'
        }
    })

# 健康检查
@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    # 运行应用
    app.run(host='0.0.0.0', port=5001, debug=True)
