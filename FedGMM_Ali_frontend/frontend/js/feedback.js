/**
 * 操作结果反馈模块
 * 处理连接状态、任务状态的显示，以及错误提示和成功反馈
 */

const FeedbackManager = {
    // 初始化反馈管理器
    init() {
        // 创建全局反馈容器
        this.createFeedbackContainer();
        
        // 初始化连接状态监控
        this.initConnectionMonitor();
        
        // 初始化任务状态管理器
        this.initTaskManager();
    },
    
    // 创建全局反馈容器
    createFeedbackContainer() {
        // 检查是否已经存在反馈容器
        if (document.getElementById('feedback-container')) {
            return;
        }
        
        // 创建反馈容器
        const container = document.createElement('div');
        container.id = 'feedback-container';
        container.className = 'feedback-container';
        document.body.appendChild(container);
    },
    
    // 初始化连接状态监控
    initConnectionMonitor() {
        // 连接状态
        this.connectionStatus = {
            status: 'checking', // checking, connected, disconnected, error
            lastCheck: null,
            error: null
        };
        
        // 定期检查连接状态
        setInterval(() => this.checkConnectionStatus(), 5000);
        
        // 初始检查
        this.checkConnectionStatus();
    },
    
    // 检查连接状态
    async checkConnectionStatus() {
        try {
            this.connectionStatus.status = 'checking';
            this.updateConnectionStatusUI();
            
            // 发送一个简单的请求来检查连接
            const response = await fetch(`${API_BASE_URL}/system/status`, {
                method: 'GET',
                timeout: 3000
            });
            
            if (response.ok) {
                this.connectionStatus.status = 'connected';
                this.connectionStatus.error = null;
            } else {
                this.connectionStatus.status = 'error';
                this.connectionStatus.error = '服务器返回错误状态';
            }
        } catch (error) {
            this.connectionStatus.status = 'disconnected';
            this.connectionStatus.error = error.message;
        } finally {
            this.connectionStatus.lastCheck = new Date();
            this.updateConnectionStatusUI();
        }
    },
    
    // 更新连接状态UI
    updateConnectionStatusUI() {
        // 查找连接状态元素
        const statusElements = document.querySelectorAll('.connection-status');
        
        statusElements.forEach(element => {
            const status = this.connectionStatus.status;
            const error = this.connectionStatus.error;
            
            // 清除现有状态
            element.className = 'connection-status';
            element.innerHTML = '';
            
            // 添加状态图标和文本
            const statusIndicator = document.createElement('span');
            statusIndicator.className = `status-indicator status-${status}`;
            
            const statusText = document.createElement('span');
            statusText.className = 'status-text';
            
            switch (status) {
                case 'checking':
                    statusText.textContent = '检查连接中...';
                    break;
                case 'connected':
                    statusText.textContent = '已连接';
                    break;
                case 'disconnected':
                    statusText.textContent = '连接断开';
                    break;
                case 'error':
                    statusText.textContent = '连接错误';
                    break;
            }
            
            element.appendChild(statusIndicator);
            element.appendChild(statusText);
            
            // 添加错误信息
            if (error && (status === 'disconnected' || status === 'error')) {
                const errorElement = document.createElement('span');
                errorElement.className = 'status-error';
                errorElement.textContent = error;
                element.appendChild(errorElement);
            }
        });
    },
    
    // 初始化任务状态管理器
    initTaskManager() {
        this.tasks = new Map();
    },
    
    // 创建任务
    createTask(taskId, options = {}) {
        const defaultOptions = {
            title: '任务',
            description: '',
            autoRemove: true,
            duration: 5000
        };
        
        const taskOptions = { ...defaultOptions, ...options };
        
        this.tasks.set(taskId, {
            id: taskId,
            ...taskOptions,
            status: 'pending', // pending, running, completed, failed
            progress: 0,
            startTime: null,
            endTime: null,
            error: null
        });
        
        this.updateTaskUI(taskId);
        return taskId;
    },
    
    // 开始任务
    startTask(taskId) {
        const task = this.tasks.get(taskId);
        if (task) {
            task.status = 'running';
            task.startTime = new Date();
            this.updateTaskUI(taskId);
        }
    },
    
    // 更新任务进度
    updateTaskProgress(taskId, progress) {
        const task = this.tasks.get(taskId);
        if (task) {
            task.progress = Math.max(0, Math.min(100, progress));
            this.updateTaskUI(taskId);
        }
    },
    
    // 完成任务
    completeTask(taskId, message = '任务完成') {
        const task = this.tasks.get(taskId);
        if (task) {
            task.status = 'completed';
            task.endTime = new Date();
            task.message = message;
            this.updateTaskUI(taskId);
            
            // 自动移除
            if (task.autoRemove) {
                setTimeout(() => this.removeTask(taskId), task.duration);
            }
        }
    },
    
    // 失败任务
    failTask(taskId, error = '任务失败') {
        const task = this.tasks.get(taskId);
        if (task) {
            task.status = 'failed';
            task.endTime = new Date();
            task.error = error;
            this.updateTaskUI(taskId);
            
            // 自动移除
            if (task.autoRemove) {
                setTimeout(() => this.removeTask(taskId), task.duration);
            }
        }
    },
    
    // 移除任务
    removeTask(taskId) {
        this.tasks.delete(taskId);
        this.updateTaskUI(taskId, true);
    },
    
    // 更新任务UI
    updateTaskUI(taskId, remove = false) {
        const task = this.tasks.get(taskId);
        const taskElement = document.getElementById(`task-${taskId}`);
        
        // 如果要移除任务
        if (remove && taskElement) {
            taskElement.remove();
            return;
        }
        
        // 如果任务不存在
        if (!task) {
            return;
        }
        
        // 如果任务元素不存在，创建它
        if (!taskElement) {
            const container = document.getElementById('feedback-container') || document.body;
            const newTaskElement = document.createElement('div');
            newTaskElement.id = `task-${taskId}`;
            newTaskElement.className = 'task-item';
            container.appendChild(newTaskElement);
        }
        
        // 更新任务元素
        const currentTaskElement = document.getElementById(`task-${taskId}`);
        if (currentTaskElement) {
            currentTaskElement.className = `task-item task-${task.status}`;
            currentTaskElement.innerHTML = `
                <div class="task-header">
                    <span class="task-title">${task.title}</span>
                    <span class="task-status">${this.getTaskStatusText(task.status)}</span>
                </div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                ${task.status === 'running' ? `
                    <div class="task-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${task.progress}%"></div>
                        </div>
                        <span class="progress-text">${task.progress}%</span>
                    </div>
                ` : ''}
                ${task.message ? `<div class="task-message">${task.message}</div>` : ''}
                ${task.error ? `<div class="task-error">${task.error}</div>` : ''}
                <div class="task-actions">
                    <button class="btn btn-secondary btn-sm" onclick="FeedbackManager.removeTask('${taskId}')">关闭</button>
                </div>
            `;
        }
    },
    
    // 获取任务状态文本
    getTaskStatusText(status) {
        const statusMap = {
            pending: '等待中',
            running: '运行中',
            completed: '已完成',
            failed: '失败'
        };
        return statusMap[status] || status;
    },
    
    // 显示成功消息
    showSuccess(message, options = {}) {
        const defaultOptions = {
            title: '成功',
            duration: 3000,
            autoRemove: true
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        this.showMessage('success', mergedOptions.title, message, mergedOptions);
    },
    
    // 显示错误消息
    showError(message, options = {}) {
        const defaultOptions = {
            title: '错误',
            duration: 5000,
            autoRemove: true
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        this.showMessage('error', mergedOptions.title, message, mergedOptions);
    },
    
    // 显示警告消息
    showWarning(message, options = {}) {
        const defaultOptions = {
            title: '警告',
            duration: 4000,
            autoRemove: true
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        this.showMessage('warning', mergedOptions.title, message, mergedOptions);
    },
    
    // 显示信息消息
    showInfo(message, options = {}) {
        const defaultOptions = {
            title: '信息',
            duration: 3000,
            autoRemove: true
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        this.showMessage('info', mergedOptions.title, message, mergedOptions);
    },
    
    // 显示消息
    showMessage(type, title, message, options = {}) {
        const defaultOptions = {
            duration: 3000,
            autoRemove: true,
            id: null
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        const messageId = mergedOptions.id || `message-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const container = document.getElementById('feedback-container') || document.body;
        const messageElement = document.createElement('div');
        messageElement.id = messageId;
        messageElement.className = `feedback-message feedback-${type}`;
        messageElement.innerHTML = `
            <div class="message-header">
                <span class="message-title">${title}</span>
                ${mergedOptions.autoRemove ? '' : `<button class="message-close" onclick="FeedbackManager.removeMessage('${messageId}')">&times;</button>`}
            </div>
            <div class="message-content">${message}</div>
        `;
        
        container.appendChild(messageElement);
        
        // 添加动画效果
        setTimeout(() => {
            messageElement.classList.add('message-visible');
        }, 10);
        
        // 自动移除
        if (mergedOptions.autoRemove) {
            setTimeout(() => {
                this.removeMessage(messageId);
            }, mergedOptions.duration);
        }
        
        return messageId;
    },
    
    // 移除消息
    removeMessage(messageId) {
        const messageElement = document.getElementById(messageId);
        if (messageElement) {
            messageElement.classList.remove('message-visible');
            messageElement.classList.add('message-hidden');
            
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 300);
        }
    },
    
    // 显示加载状态
    showLoading(targetElement, message = '加载中...') {
        if (!targetElement) return;
        
        // 保存原始内容
        const originalContent = targetElement.innerHTML;
        targetElement.setAttribute('data-original-content', originalContent);
        
        // 显示加载状态
        targetElement.innerHTML = `
            <div class="loading-container">
                <div class="loading"></div>
                <span class="loading-text">${message}</span>
            </div>
        `;
        targetElement.classList.add('loading-active');
    },
    
    // 隐藏加载状态
    hideLoading(targetElement) {
        if (!targetElement) return;
        
        // 恢复原始内容
        const originalContent = targetElement.getAttribute('data-original-content');
        if (originalContent !== null) {
            targetElement.innerHTML = originalContent;
            targetElement.removeAttribute('data-original-content');
        } else {
            targetElement.innerHTML = '';
        }
        
        targetElement.classList.remove('loading-active');
    },
    
    // 显示确认对话框
    showConfirm(title, message, onConfirm, onCancel) {
        const dialogId = `confirm-${Date.now()}`;
        const container = document.getElementById('feedback-container') || document.body;
        
        const dialogElement = document.createElement('div');
        dialogElement.id = dialogId;
        dialogElement.className = 'confirm-dialog';
        dialogElement.innerHTML = `
            <div class="confirm-overlay"></div>
            <div class="confirm-content">
                <div class="confirm-header">
                    <h3>${title}</h3>
                    <button class="confirm-close" onclick="FeedbackManager.removeConfirm('${dialogId}')">&times;</button>
                </div>
                <div class="confirm-body">${message}</div>
                <div class="confirm-footer">
                    <button class="btn btn-secondary" onclick="FeedbackManager.removeConfirm('${dialogId}')${onCancel ? `; ${onCancel.toString()}` : ''}">取消</button>
                    <button class="btn btn-primary" onclick="FeedbackManager.removeConfirm('${dialogId}'); ${onConfirm.toString()}">确认</button>
                </div>
            </div>
        `;
        
        container.appendChild(dialogElement);
        
        // 添加动画效果
        setTimeout(() => {
            dialogElement.classList.add('dialog-visible');
        }, 10);
        
        return dialogId;
    },
    
    // 移除确认对话框
    removeConfirm(dialogId) {
        const dialogElement = document.getElementById(dialogId);
        if (dialogElement) {
            dialogElement.classList.remove('dialog-visible');
            dialogElement.classList.add('dialog-hidden');
            
            setTimeout(() => {
                if (dialogElement.parentNode) {
                    dialogElement.parentNode.removeChild(dialogElement);
                }
            }, 300);
        }
    }
};

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    FeedbackManager.init();
});
