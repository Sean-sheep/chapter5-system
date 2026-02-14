from flask import Blueprint, jsonify, request
import os
import json

# 创建蓝图
communication_api = Blueprint('communication', __name__)

# 生成模拟通信数据
mock_communication_data = []
for round_num in range(0, 51):
    for client_id in range(0, 3):
        # 生成模拟数据
        original_size = 1000000 + round_num * 10000 + client_id * 5000
        compressed_size = int(original_size * (0.4 - round_num * 0.005 + client_id * 0.02))
        compression_ratio = compressed_size / original_size
        savings = original_size - compressed_size
        savings_percentage = savings / original_size
        
        mock_communication_data.append({
            'round': round_num,
            'client_id': client_id,
            'original_size': original_size,
            'compressed_size': compressed_size,
            'compression_ratio': round(compression_ratio, 4),
            'savings': savings,
            'savings_percentage': round(savings_percentage, 4)
        })

@communication_api.route('/data', methods=['GET'])
def get_communication_data():
    """
    获取通信统计数据
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
        description: 成功获取通信统计数据
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
                  original_size:
                    type: integer
                  compressed_size:
                    type: integer
                  compression_ratio:
                    type: number
                  savings:
                    type: integer
                  savings_percentage:
                    type: number
            statistics:
              type: object
              properties:
                total_rounds:
                  type: integer
                total_clients:
                  type: integer
                avg_compression:
                  type: number
                total_savings:
                  type: integer
                savings_percentage:
                  type: number
    """
    try:
        # 获取查询参数
        client_id = request.args.get('client_id', type=int)
        start_round = request.args.get('start_round', type=int)
        end_round = request.args.get('end_round', type=int)
        
        # 过滤数据
        filtered_data = mock_communication_data.copy()
        
        if client_id is not None:
            filtered_data = [item for item in filtered_data if item['client_id'] == client_id]
        
        if start_round is not None:
            filtered_data = [item for item in filtered_data if item['round'] >= start_round]
        
        if end_round is not None:
            filtered_data = [item for item in filtered_data if item['round'] <= end_round]
        
        # 计算统计信息
        if filtered_data:
            avg_compression = sum(item['compression_ratio'] for item in filtered_data) / len(filtered_data)
            total_savings = sum(item['savings'] for item in filtered_data)
            total_original = sum(item['original_size'] for item in filtered_data)
            savings_percentage = total_savings / total_original if total_original > 0 else 0
            
            statistics = {
                'total_rounds': len(set(item['round'] for item in filtered_data)),
                'total_clients': len(set(item['client_id'] for item in filtered_data)),
                'avg_compression': round(avg_compression, 4),
                'total_savings': total_savings,
                'savings_percentage': round(savings_percentage, 4)
            }
        else:
            statistics = {
                'total_rounds': 0,
                'total_clients': 0,
                'avg_compression': 0,
                'total_savings': 0,
                'savings_percentage': 0
            }
        
        return jsonify({
            'data': filtered_data,
            'statistics': statistics
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'data': [],
            'statistics': {
                'total_rounds': 0,
                'total_clients': 0,
                'avg_compression': 0,
                'total_savings': 0,
                'savings_percentage': 0
            }
        }), 500
