from flask import Blueprint, jsonify, request
import os
import json

# 创建蓝图
personalization_api = Blueprint('personalization_api', __name__)

# 模拟数据
mock_personalization_data = []
for round_num in range(1, 11):
    for client_id in range(1, 5):
        # 生成γ权重，确保和为1
        gamma1 = round(0.3 + round_num * 0.02 + client_id * 0.01, 3)
        gamma2 = round(0.3 + round_num * 0.01 + client_id * 0.02, 3)
        gamma3 = round(0.4 - round_num * 0.03 - client_id * 0.03, 3)
        
        # 确保权重和为1
        total = gamma1 + gamma2 + gamma3
        gamma1 = round(gamma1 / total, 3)
        gamma2 = round(gamma2 / total, 3)
        gamma3 = round(gamma3 / total, 3)
        
        mock_personalization_data.append({
            'round': round_num,
            'client_id': client_id,
            'gamma': {
                '1': gamma1,
                '2': gamma2,
                '3': gamma3
            },
            'personalization_accuracy': round(0.65 + round_num * 0.02 + client_id * 0.015, 3),
            'global_accuracy': round(0.6 + round_num * 0.02, 3)
        })

@personalization_api.route('/data', methods=['GET'])
def get_personalization_data():
    """
    获取个性化权重数据
    ---
    parameters:
      - name: client_id
        in: query
        type: integer
        description: 客户端ID
      - name: round
        in: query
        type: integer
        description: 轮次
    responses:
      200:
        description: 成功获取个性化权重数据
        schema:
          type: object
          properties:
            data:
              type: array
              items:
                type: object
                properties:
                  round:
                    type: integer
                  client_id:
                    type: integer
                  gamma:
                    type: object
                    additionalProperties:
                      type: number
                  personalization_accuracy:
                    type: number
                  global_accuracy:
                    type: number
    """
    try:
        # 获取查询参数
        client_id = request.args.get('client_id', type=int)
        round_num = request.args.get('round', type=int)
        
        # 过滤数据
        filtered_data = mock_personalization_data.copy()
        
        if client_id:
            filtered_data = [item for item in filtered_data if item['client_id'] == client_id]
        
        if round_num:
            filtered_data = [item for item in filtered_data if item['round'] == round_num]
        
        # 计算统计信息
        statistics = {
            'total_rounds': len(set(item['round'] for item in filtered_data)),
            'total_clients': len(set(item['client_id'] for item in filtered_data)),
            'average_personalization_accuracy': round(sum(item['personalization_accuracy'] for item in filtered_data) / len(filtered_data), 3) if filtered_data else 0,
            'average_global_accuracy': round(sum(item['global_accuracy'] for item in filtered_data) / len(filtered_data), 3) if filtered_data else 0
        }
        
        return jsonify({
            'data': filtered_data,
            'statistics': statistics
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'data': [],
            'statistics': {}
        }), 500
