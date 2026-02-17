/**
 * 主JavaScript文件
 * 包含通用函数和工具方法
 */

// 全局变量
const API_BASE_URL = 'http://localhost:5001/api';

// 通用工具函数
const Utils = {
    // 发送API请求
    async fetchAPI(endpoint, method = 'GET', data = null, encrypt = false, isSSH = false) {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            
            const config = {
                method,
                headers,
                credentials: 'include'
            };
            
            if (data) {
                if (encrypt) {
                    // 加密请求数据
                    const encryptedRequest = await SecureClient.encryptRequest(data, isSSH);
                    config.body = JSON.stringify(encryptedRequest);
                } else {
                    config.body = JSON.stringify(data);
                }
            }
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const responseData = await response.json();
            
            // 处理加密的响应
            if (encrypt && responseData.encryption) {
                return await SecureClient.decryptResponse(responseData);
            }
            
            return responseData;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    },
    
    // 显示加载状态
    showLoading(element) {
        element.innerHTML = '<div class="loading-container"><div class="loading"></div></div>';
    },
    
    // 隐藏加载状态
    hideLoading(element) {
        element.innerHTML = '';
    },
    
    // 显示错误消息
    showError(element, message) {
        element.innerHTML = `<div class="error">${message}</div>`;
    },
    
    // 显示警告消息
    showWarning(element, message) {
        element.innerHTML = `<div class="warning">${message}</div>`;
    },
    
    // 显示信息消息
    showInfo(element, message) {
        element.innerHTML = `<div class="info">${message}</div>`;
    },
    
    // 格式化数字
    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    },
    
    // 格式化百分比
    formatPercentage(num, decimals = 2) {
        return `${(num * 100).toFixed(decimals)}%`;
    },
    
    // 格式化时间
    formatTime(ms) {
        return `${(ms / 1000).toFixed(2)}s`;
    },
    
    // 生成CSV文件
    generateCSV(data, filename) {
        if (!data || data.length === 0) {
            return;
        }
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => row[header]).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },
    
    // 检查数据文件是否存在
    async checkDataExists() {
        try {
            const response = await this.fetchAPI('/system/status');
            return response.data_loaded;
        } catch (error) {
            console.error('检查数据存在性失败:', error);
            return false;
        }
    },
    
    // 获取系统状态
    async getSystemStatus() {
        try {
            const response = await this.fetchAPI('/system/status');
            return response;
        } catch (error) {
            console.error('获取系统状态失败:', error);
            return {
                data_loaded: false,
                available_cities: [],
                available_rounds: [],
                system_status: '系统状态获取失败'
            };
        }
    },
    
    // 初始化页面
    async initPage() {
        // 添加导航菜单高亮
        this.initNavigation();
        
        // 添加响应式处理
        this.initResponsive();
        
        // 初始化加密客户端
        await this.initEncryption();
    },
    
    // 初始化加密客户端
    async initEncryption() {
        try {
            // 初始化加密客户端
            await SecureClient.init();
            
            // 获取服务器公钥
            const response = await this.fetchAPI('/system/public-key');
            if (response.success) {
                const serverPublicKey = response.public_key;
                await SecureClient.setServerPublicKey(serverPublicKey);
                console.log('加密系统初始化成功');
            }
        } catch (error) {
            console.error('初始化加密系统失败:', error);
            // 继续执行，不阻止页面加载
        }
    },
    
    // 初始化导航菜单
    initNavigation() {
        const navLinks = document.querySelectorAll('.nav a');
        const currentPath = window.location.pathname;
        
        navLinks.forEach(link => {
            const linkPath = new URL(link.href).pathname;
            if (currentPath === linkPath) {
                link.classList.add('active');
            }
        });
    },
    
    // 初始化响应式处理
    initResponsive() {
        // 响应式导航菜单
        const handleResize = () => {
            const nav = document.querySelector('.nav ul');
            if (window.innerWidth < 992) {
                nav.style.flexDirection = 'column';
                nav.style.alignItems = 'center';
            } else {
                nav.style.flexDirection = 'row';
                nav.style.alignItems = 'center';
            }
        };
        
        window.addEventListener('resize', handleResize);
        handleResize();
    }
};

// 数据加载器
const DataLoader = {
    // 加载通信统计数据
    async loadCommunicationData(clientId = null, roundRange = null) {
        try {
            const params = new URLSearchParams();
            if (clientId) {
                params.append('client_id', clientId);
            }
            if (roundRange) {
                params.append('start_round', roundRange[0]);
                params.append('end_round', roundRange[1]);
            }
            
            const queryString = params.toString() ? `?${params.toString()}` : '';
            const response = await Utils.fetchAPI(`/communication/data${queryString}`);
            return response;
        } catch (error) {
            console.error('加载通信数据失败:', error);
            return { data: [], statistics: {} };
        }
    },
    
    // 加载自适应迭代数据
    async loadAdaptiveIterationData(clientId = null, roundRange = null) {
        try {
            const params = new URLSearchParams();
            if (clientId) {
                params.append('client_id', clientId);
            }
            if (roundRange) {
                params.append('start_round', roundRange[0]);
                params.append('end_round', roundRange[1]);
            }
            
            const queryString = params.toString() ? `?${params.toString()}` : '';
            const response = await Utils.fetchAPI(`/adaptive/data${queryString}`);
            return response;
        } catch (error) {
            console.error('加载自适应迭代数据失败:', error);
            return { data: [] };
        }
    },
    
    // 加载个性化权重数据
    async loadPersonalizationData(round = null, clientIds = null) {
        try {
            const params = new URLSearchParams();
            if (round) {
                params.append('round', round);
            }
            if (clientIds) {
                clientIds.forEach(id => params.append('client_id', id));
            }
            
            const queryString = params.toString() ? `?${params.toString()}` : '';
            const response = await Utils.fetchAPI(`/personalization/data${queryString}`);
            return response;
        } catch (error) {
            console.error('加载个性化权重数据失败:', error);
            return { data: [] };
        }
    },
    
    // 加载推荐数据
    async loadRecommendationData(city, userId, topK, round) {
        try {
            const response = await Utils.fetchAPI('/recommendation/generate', 'POST', {
                city,
                user_id: userId,
                top_k: topK,
                round
            });
            return response;
        } catch (error) {
            console.error('加载推荐数据失败:', error);
            return { recommendations: [] };
        }
    },
    
    // 加载多城市对比数据
    async loadComparisonData(cities, userId, topK, round) {
        try {
            const response = await Utils.fetchAPI('/recommendation/compare', 'POST', {
                cities,
                user_id: userId,
                top_k: topK,
                round
            });
            return response;
        } catch (error) {
            console.error('加载多城市对比数据失败:', error);
            return { comparisons: [] };
        }
    }
};

// 图表生成器
const ChartGenerator = {
    // 生成压缩比例图表
    generateCompressionChart(data, container) {
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="info">没有数据可显示</div>';
            return;
        }
        
        // 使用Chart.js生成图表
        const ctx = container.getContext('2d');
        
        // 准备数据
        const rounds = [...new Set(data.map(item => item.round))].sort((a, b) => a - b);
        const clients = [...new Set(data.map(item => item.client_id))];
        
        const datasets = clients.map((client, index) => {
            const clientData = data.filter(item => item.client_id === client);
            const compressionRatios = rounds.map(round => {
                const item = clientData.find(d => d.round === round);
                return item ? item.compression_ratio : null;
            });
            
            return {
                label: `客户端 ${client}`,
                data: compressionRatios,
                borderColor: this.getColor(index),
                backgroundColor: this.getColor(index, 0.1),
                borderWidth: 2,
                tension: 0.1
            };
        });
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: rounds,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '压缩比例随轮次变化'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '压缩比例'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '轮次'
                        }
                    }
                }
            }
        });
    },
    
    // 生成τ*趋势图表
    generateTauTrendChart(data, container) {
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="info">没有数据可显示</div>';
            return;
        }
        
        const ctx = container.getContext('2d');
        
        // 准备数据
        const rounds = [...new Set(data.map(item => item.round))].sort((a, b) => a - b);
        const clients = [...new Set(data.map(item => item.client_id))];
        
        const datasets = clients.map((client, index) => {
            const clientData = data.filter(item => item.client_id === client);
            const tauValues = rounds.map(round => {
                const item = clientData.find(d => d.round === round);
                return item ? item.tau_star : null;
            });
            
            return {
                label: `客户端 ${client}`,
                data: tauValues,
                borderColor: this.getColor(index),
                backgroundColor: this.getColor(index, 0.1),
                borderWidth: 2,
                tension: 0.1
            };
        });
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: rounds,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'τ* 随轮次变化'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'τ* 值'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '轮次'
                        }
                    }
                }
            }
        });
    },
    
    // 生成γ权重分布图表
    generateGammaDistributionChart(data, container) {
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="info">没有数据可显示</div>';
            return;
        }
        
        const ctx = container.getContext('2d');
        
        // 准备数据
        const clients = [...new Set(data.map(item => item.client_id))];
        const submodels = data[0].gamma ? Object.keys(data[0].gamma) : [];
        
        const datasets = submodels.map((submodel, index) => {
            const submodelData = clients.map(client => {
                const item = data.find(d => d.client_id === client);
                return item && item.gamma ? item.gamma[submodel] : 0;
            });
            
            return {
                label: `子模型 ${submodel}`,
                data: submodelData,
                backgroundColor: this.getColor(index)
            };
        });
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: clients.map(client => `客户端 ${client}`),
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'γ 权重分布'
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '权重值'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '客户端'
                        }
                    }
                }
            }
        });
    },
    
    // 生成γ权重趋势图表
    generateGammaTrendChart(data, container, clientId) {
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="info">没有数据可显示</div>';
            return;
        }
        
        const ctx = container.getContext('2d');
        
        // 准备数据
        const clientData = data.filter(item => item.client_id === clientId);
        const rounds = [...new Set(clientData.map(item => item.round))].sort((a, b) => a - b);
        const submodels = clientData[0].gamma ? Object.keys(clientData[0].gamma) : [];
        
        const datasets = submodels.map((submodel, index) => {
            const submodelData = rounds.map(round => {
                const item = clientData.find(d => d.round === round);
                return item && item.gamma ? item.gamma[submodel] : 0;
            });
            
            return {
                label: `子模型 ${submodel}`,
                data: submodelData,
                borderColor: this.getColor(index),
                backgroundColor: this.getColor(index, 0.1),
                borderWidth: 2,
                tension: 0.1
            };
        });
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: rounds,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `客户端 ${clientId} 的 γ 权重趋势`
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '权重值'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '轮次'
                        }
                    }
                }
            }
        });
    },
    
    // 获取颜色
    getColor(index, alpha = 1) {
        const colors = [
            `rgba(52, 152, 219, ${alpha})`,  // 蓝色
            `rgba(46, 204, 113, ${alpha})`,  // 绿色
            `rgba(231, 76, 60, ${alpha})`,   // 红色
            `rgba(155, 89, 182, ${alpha})`,  // 紫色
            `rgba(52, 73, 94, ${alpha})`,    // 深灰色
            `rgba(241, 196, 15, ${alpha})`,  // 黄色
            `rgba(230, 126, 34, ${alpha})`,  // 橙色
            `rgba(149, 165, 166, ${alpha})`  // 浅灰色
        ];
        
        return colors[index % colors.length];
    }
};

// 验证器
const Validator = {
    // 验证规则
    rules: {
        // 客户端ID验证
        clientId: {
            required: true,
            min: 1,
            max: 100,
            message: '客户端ID必须是1-100之间的整数'
        },
        // 轮次范围验证
        roundRange: {
            required: true,
            min: 1,
            max: 1000,
            message: '轮次必须是1-1000之间的整数'
        },
        // 城市验证
        city: {
            required: true,
            minLength: 2,
            maxLength: 20,
            message: '城市名称不能为空且长度必须在2-20之间'
        },
        // 用户ID验证
        userId: {
            required: true,
            min: 1,
            max: 1000000,
            message: '用户ID必须是1-1000000之间的整数'
        },
        // TopK验证
        topK: {
            required: true,
            min: 1,
            max: 50,
            message: '推荐数量必须是1-50之间的整数'
        },
        // 轮次验证
        round: {
            required: true,
            min: 0,
            max: 1000,
            message: '轮次必须是0-1000之间的整数'
        },
        // 客户端ID列表验证
        clientIds: {
            required: true,
            minLength: 1,
            maxLength: 20,
            message: '至少选择一个客户端，最多选择20个客户端'
        },
        // 城市列表验证
        cities: {
            required: true,
            minLength: 1,
            maxLength: 10,
            message: '至少选择一个城市，最多选择10个城市'
        }
    },
    
    // 验证单个值
    validateValue(value, rule) {
        if (rule.required && !value) {
            return rule.message || '该字段不能为空';
        }
        
        if (value === null || value === undefined || value === '') {
            return null;
        }
        
        const numValue = Number(value);
        if (rule.min !== undefined && numValue < rule.min) {
            return rule.message || `值不能小于${rule.min}`;
        }
        
        if (rule.max !== undefined && numValue > rule.max) {
            return rule.message || `值不能大于${rule.max}`;
        }
        
        if (rule.minLength !== undefined && value.length < rule.minLength) {
            return rule.message || `长度不能小于${rule.minLength}`;
        }
        
        if (rule.maxLength !== undefined && value.length > rule.maxLength) {
            return rule.message || `长度不能大于${rule.maxLength}`;
        }
        
        return null;
    },
    
    // 验证对象
    validate(data, rules) {
        const errors = {};
        
        for (const [field, rule] of Object.entries(rules)) {
            const value = data[field];
            const error = this.validateValue(value, rule);
            if (error) {
                errors[field] = error;
            }
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    },
    
    // 验证轮次范围
    validateRoundRange(range) {
        if (!range || range.length !== 2) {
            return '轮次范围必须是包含两个元素的数组';
        }
        
        const [start, end] = range;
        const startError = this.validateValue(start, this.rules.roundRange);
        const endError = this.validateValue(end, this.rules.roundRange);
        
        if (startError) return startError;
        if (endError) return endError;
        if (Number(start) > Number(end)) {
            return '开始轮次不能大于结束轮次';
        }
        
        return null;
    },
    
    // 验证客户端ID列表
    validateClientIds(ids) {
        if (!Array.isArray(ids)) {
            return '客户端ID列表必须是数组';
        }
        
        const error = this.validateValue(ids, this.rules.clientIds);
        if (error) return error;
        
        for (const id of ids) {
            const idError = this.validateValue(id, this.rules.clientId);
            if (idError) return idError;
        }
        
        return null;
    },
    
    // 验证城市列表
    validateCities(cities) {
        if (!Array.isArray(cities)) {
            return '城市列表必须是数组';
        }
        
        const error = this.validateValue(cities, this.rules.cities);
        if (error) return error;
        
        for (const city of cities) {
            const cityError = this.validateValue(city, this.rules.city);
            if (cityError) return cityError;
        }
        
        return null;
    },
    
    // 显示错误信息
    showError(element, error) {
        if (!element) return;
        
        // 移除现有的错误信息
        const existingError = element.nextElementSibling;
        if (existingError && existingError.classList.contains('validation-error')) {
            existingError.remove();
        }
        
        // 添加新的错误信息
        if (error) {
            const errorElement = document.createElement('div');
            errorElement.className = 'validation-error';
            errorElement.textContent = error;
            element.classList.add('input-error');
            element.parentNode.insertBefore(errorElement, element.nextSibling);
        } else {
            element.classList.remove('input-error');
        }
    },
    
    // 清除错误信息
    clearError(element) {
        if (!element) return;
        
        element.classList.remove('input-error');
        const existingError = element.nextElementSibling;
        if (existingError && existingError.classList.contains('validation-error')) {
            existingError.remove();
        }
    },
    
    // 添加实时验证
    addRealTimeValidation(element, rule) {
        if (!element) return;
        
        element.addEventListener('input', () => {
            const value = element.value;
            const error = this.validateValue(value, rule);
            this.showError(element, error);
        });
        
        element.addEventListener('blur', () => {
            const value = element.value;
            const error = this.validateValue(value, rule);
            this.showError(element, error);
        });
    },
    
    // 添加表单验证
    addFormValidation(form, validationRules) {
        if (!form) return;
        
        form.addEventListener('submit', (e) => {
            const formData = new FormData(form);
            const data = {};
            
            for (const [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            const validation = this.validate(data, validationRules);
            if (!validation.isValid) {
                e.preventDefault();
                
                // 显示所有错误
                for (const [field, error] of Object.entries(validation.errors)) {
                    const element = form.querySelector(`[name="${field}"]`);
                    this.showError(element, error);
                }
            }
        });
    }
};

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', async () => {
    await Utils.initPage();
});
