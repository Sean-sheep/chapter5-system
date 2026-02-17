import requests
import json

# 测试推荐展示API
url = 'http://localhost:5001/api/recommendation/generate'
headers = {'Content-Type': 'application/json'}
data = {
    'city': '北京',
    'user_id': 1,
    'top_k': 5,
    'round': 50
}

response = requests.post(url, headers=headers, data=json.dumps(data))
print('推荐展示API测试结果:')
print('状态码:', response.status_code)
print('响应内容:', response.json())

# 测试多城市对比API
url = 'http://localhost:5001/api/recommendation/compare'
data = {
    'cities': ['北京', '上海', '广州'],
    'user_id': 1,
    'top_k': 5,
    'round': 50
}

response = requests.post(url, headers=headers, data=json.dumps(data))
print('\n多城市对比API测试结果:')
print('状态码:', response.status_code)
print('响应内容:', response.json())
