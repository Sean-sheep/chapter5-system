/**
 * 主JavaScript文件
 * 包含通用函数和工具方法
 */

// 全局变量
const API_BASE_URL = 'http://localhost:5001/api';

// 通用工具函数
const Utils = {
    // 发送API请求
    async fetchAPI(endpoint, method = 'GET', data = null) {
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
                config.body = JSON.stringify(data);
            }
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            return await response.json();
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
    initPage() {
        // 添加导航菜单高亮
        this.initNavigation();
        
        // 添加响应式处理
        this.initResponsive();
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

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    Utils.initPage();
});
