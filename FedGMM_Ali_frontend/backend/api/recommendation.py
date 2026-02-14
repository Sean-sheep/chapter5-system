from flask import Blueprint, jsonify, request
import os
import json

# 创建蓝图
recommendation_api = Blueprint('recommendation_api', __name__)

# 模拟城市数据
cities = ['北京', '上海', '广州', '深圳', '杭州']

# 模拟推荐数据
mock_recommendation_data = {
    '北京': [
        {'place_id': 1, 'name': '故宫博物院', 'category': '文化古迹', 'score': 4.8, 'price': '高', 'popularity': 98},
        {'place_id': 2, 'name': '长城', 'category': '文化古迹', 'score': 4.7, 'price': '中', 'popularity': 95},
        {'place_id': 3, 'name': '颐和园', 'category': '文化古迹', 'score': 4.6, 'price': '中', 'popularity': 90},
        {'place_id': 4, 'name': '天坛', 'category': '文化古迹', 'score': 4.5, 'price': '低', 'popularity': 85},
        {'place_id': 5, 'name': '王府井', 'category': '购物', 'score': 4.3, 'price': '高', 'popularity': 80}
    ],
    '上海': [
        {'place_id': 1, 'name': '外滩', 'category': '景点', 'score': 4.7, 'price': '低', 'popularity': 96},
        {'place_id': 2, 'name': '上海迪士尼', 'category': '主题公园', 'score': 4.6, 'price': '高', 'popularity': 92},
        {'place_id': 3, 'name': '东方明珠', 'category': '景点', 'score': 4.5, 'price': '中', 'popularity': 88},
        {'place_id': 4, 'name': '豫园', 'category': '文化古迹', 'score': 4.4, 'price': '低', 'popularity': 83},
        {'place_id': 5, 'name': '南京路', 'category': '购物', 'score': 4.3, 'price': '中', 'popularity': 85}
    ],
    '广州': [
        {'place_id': 1, 'name': '广州塔', 'category': '景点', 'score': 4.6, 'price': '中', 'popularity': 90},
        {'place_id': 2, 'name': '陈家祠', 'category': '文化古迹', 'score': 4.5, 'price': '低', 'popularity': 82},
        {'place_id': 3, 'name': '白云山', 'category': '自然景观', 'score': 4.4, 'price': '低', 'popularity': 85},
        {'place_id': 4, 'name': '沙面', 'category': '景点', 'score': 4.3, 'price': '低', 'popularity': 80},
        {'place_id': 5, 'name': '北京路', 'category': '购物', 'score': 4.2, 'price': '中', 'popularity': 83}
    ],
    '深圳': [
        {'place_id': 1, 'name': '世界之窗', 'category': '主题公园', 'score': 4.5, 'price': '中', 'popularity': 88},
        {'place_id': 2, 'name': '东部华侨城', 'category': '主题公园', 'score': 4.4, 'price': '高', 'popularity': 85},
        {'place_id': 3, 'name': '深圳湾公园', 'category': '自然景观', 'score': 4.3, 'price': '低', 'popularity': 82},
        {'place_id': 4, 'name': '莲花山公园', 'category': '自然景观', 'score': 4.2, 'price': '低', 'popularity': 80},
        {'place_id': 5, 'name': '华强北', 'category': '购物', 'score': 4.1, 'price': '中', 'popularity': 78}
    ],
    '杭州': [
        {'place_id': 1, 'name': '西湖', 'category': '自然景观', 'score': 4.9, 'price': '低', 'popularity': 99},
        {'place_id': 2, 'name': '灵隐寺', 'category': '文化古迹', 'score': 4.7, 'price': '低', 'popularity': 92},
        {'place_id': 3, 'name': '千岛湖', 'category': '自然景观', 'score': 4.6, 'price': '中', 'popularity': 88},
        {'place_id': 4, 'name': '宋城', 'category': '主题公园', 'score': 4.5, 'price': '高', 'popularity': 85},
        {'place_id': 5, 'name': '西溪湿地', 'category': '自然景观', 'score': 4.4, 'price': '中', 'popularity': 82}
    ]
}

@recommendation_api.route('/generate', methods=['POST'])
def generate_recommendation():
    """
    生成推荐结果
    ---
    parameters:
      - name: city
        in: body
        type: string
        required: true
        description: 城市
      - name: user_id
        in: body
        type: integer
        required: true
        description: 用户ID
      - name: top_k
        in: body
        type: integer
        required: true
        description: 返回前K个推荐
      - name: round
        in: body
        type: integer
        description: 训练轮次
    responses:
      200:
        description: 成功生成推荐结果
        schema:
          type: object
          properties:
            recommendations:
              type: array
              items:
                type: object
                properties:
                  place_id:
                    type: integer
                  name:
                    type: string
                  category:
                    type: string
                  score:
                    type: number
                  price:
                    type: string
                  popularity:
                    type: integer
            city:
              type: string
            user_id:
              type: integer
            top_k:
              type: integer
    """
    try:
        # 获取请求数据
        data = request.get_json()
        city = data.get('city')
        user_id = data.get('user_id')
        top_k = data.get('top_k', 5)
        round_num = data.get('round')
        
        # 验证参数
        if not city or not user_id:
            return jsonify({'error': '缺少必要参数'}), 400
        
        if city not in cities:
            return jsonify({'error': '城市不存在'}), 400
        
        # 获取推荐数据
        recommendations = mock_recommendation_data.get(city, [])
        
        # 根据用户ID调整推荐顺序（模拟个性化）
        import random
        random.seed(user_id)
        random.shuffle(recommendations)
        
        # 截取前K个
        recommendations = recommendations[:top_k]
        
        # 为每个推荐添加排名
        for i, rec in enumerate(recommendations):
            rec['rank'] = i + 1
        
        return jsonify({
            'recommendations': recommendations,
            'city': city,
            'user_id': user_id,
            'top_k': top_k
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@recommendation_api.route('/compare', methods=['POST'])
def compare_cities():
    """
    多城市推荐对比
    ---
    parameters:
      - name: cities
        in: body
        type: array
        items:
          type: string
        required: true
        description: 城市列表
      - name: user_id
        in: body
        type: integer
        required: true
        description: 用户ID
      - name: top_k
        in: body
        type: integer
        required: true
        description: 返回前K个推荐
      - name: round
        in: body
        type: integer
        description: 训练轮次
    responses:
      200:
        description: 成功获取多城市对比数据
        schema:
          type: object
          properties:
            comparisons:
              type: array
              items:
                type: object
                properties:
                  city:
                    type: string
                  recommendations:
                    type: array
                    items:
                      type: object
                      properties:
                        place_id:
                          type: integer
                        name:
                          type: string
                        category:
                          type: string
                        score:
                          type: number
                        price:
                          type: string
                        popularity:
                          type: integer
                        rank:
                          type: integer
            user_id:
              type: integer
            top_k:
              type: integer
    """
    try:
        # 获取请求数据
        data = request.get_json()
        city_list = data.get('cities', [])
        user_id = data.get('user_id')
        top_k = data.get('top_k', 5)
        round_num = data.get('round')
        
        # 验证参数
        if not city_list or not user_id:
            return jsonify({'error': '缺少必要参数'}), 400
        
        # 过滤无效城市
        valid_cities = [city for city in city_list if city in cities]
        if not valid_cities:
            return jsonify({'error': '没有有效的城市'}), 400
        
        # 获取每个城市的推荐数据
        comparisons = []
        for city in valid_cities:
            # 获取推荐数据
            recommendations = mock_recommendation_data.get(city, [])
            
            # 根据用户ID调整推荐顺序（模拟个性化）
            import random
            random.seed(user_id)
            random.shuffle(recommendations)
            
            # 截取前K个
            recommendations = recommendations[:top_k]
            
            # 为每个推荐添加排名
            for i, rec in enumerate(recommendations):
                rec['rank'] = i + 1
            
            comparisons.append({
                'city': city,
                'recommendations': recommendations
            })
        
        return jsonify({
            'comparisons': comparisons,
            'user_id': user_id,
            'top_k': top_k
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
