import unittest
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from FedGMM_Ali_frontend.backend.app import app

class TestAPI(unittest.TestCase):
    def setUp(self):
        # 创建测试客户端
        self.app = app.test_client()
        self.app.testing = True
    
    def test_system_status(self):
        """测试系统状态API"""
        response = self.app.get('/api/system/status')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('data_loaded', data)
        self.assertIn('available_cities', data)
        self.assertIn('available_rounds', data)
        self.assertIn('system_status', data)
    
    def test_communication_data(self):
        """测试通信数据API"""
        response = self.app.get('/api/communication/data')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('data', data)
        self.assertIn('statistics', data)
    
    def test_adaptive_data(self):
        """测试自适应迭代数据API"""
        response = self.app.get('/api/adaptive/data')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('data', data)
        self.assertIn('statistics', data)
    
    def test_personalization_data(self):
        """测试个性化权重数据API"""
        response = self.app.get('/api/personalization/data')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('data', data)
        self.assertIn('statistics', data)
    
    def test_recommendation_generate(self):
        """测试推荐生成API"""
        test_data = {
            'city': '北京',
            'user_id': 1,
            'top_k': 5
        }
        response = self.app.post('/api/recommendation/generate', json=test_data)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('recommendations', data)
        self.assertIn('city', data)
        self.assertIn('user_id', data)
        self.assertIn('top_k', data)
    
    def test_recommendation_compare(self):
        """测试多城市推荐对比API"""
        test_data = {
            'cities': ['北京', '上海'],
            'user_id': 1,
            'top_k': 5
        }
        response = self.app.post('/api/recommendation/compare', json=test_data)
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIn('comparisons', data)
        self.assertIn('user_id', data)
        self.assertIn('top_k', data)

if __name__ == '__main__':
    unittest.main()
