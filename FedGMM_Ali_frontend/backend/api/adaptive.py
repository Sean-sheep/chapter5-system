from flask import Blueprint, jsonify, request
import os
import json

# 创建蓝图
adaptive_api = Blueprint('adaptive_api', __name__)

# 模拟数据
mock_adaptive_data = []
for round_num in range(1, 11):
    for client_id in range(1, 5):
        mock_adaptive_data.append({
            'round': round_num,
            'client_id': client_id,
            'tau_star': min(round(5 + round_num * 0.5 + client_id * 0.2, 2), 10),
            'accuracy': round(0.6 + round_num * 0.03 + client_id * 0.01, 3),
            'loss': round(1.2 - round_num * 0.05 - client_id * 0.01, 3)
        })

@adaptive_api.route('/data', methods=['GET'])
def get_adaptive_data():
    """
    获取自适应迭代数据
    ---
    parameters:
      - name: client_id
        in: query
        type: integer
        description: 客户端ID
      - name: start_round
        in: query
        type: integer
        description: 起始轮次
      - name: end_round
        in: query
        type: integer
        description: 结束轮次
    responses:
      200:
        description: 成功获取自适应迭代数据
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
                  tau_star:
                    type: number
                  accuracy:
                    type: number
                  loss:
                    type: number
    """
    try:
        # 获取查询参数
        client_id = request.args.get('client_id', type=int)
        start_round = request.args.get('start_round', type=int)
        end_round = request.args.get('end_round', type=int)
        
        # 过滤数据
        filtered_data = mock_adaptive_data.copy()
        
        if client_id:
            filtered_data = [item for item in filtered_data if item['client_id'] == client_id]
        
        if start_round:
            filtered_data = [item for item in filtered_data if item['round'] >= start_round]
        
        if end_round:
            filtered_data = [item for item in filtered_data if item['round'] <= end_round]
        
        # 计算统计信息
        statistics = {
            'total_rounds': len(set(item['round'] for item in filtered_data)),
            'total_clients': len(set(item['client_id'] for item in filtered_data)),
            'average_tau_star': round(sum(item['tau_star'] for item in filtered_data) / len(filtered_data), 2) if filtered_data else 0,
            'max_tau_star': max(item['tau_star'] for item in filtered_data) if filtered_data else 0,
            'min_tau_star': min(item['tau_star'] for item in filtered_data) if filtered_data else 0
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
