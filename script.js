class LotterySystem {
    constructor() {
        this.prizes = [];
        this.wonPrizes = [];
        this.tasks = [];
        this.lotteryChances = 0;
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isSpinning = false;
        this.currentRotation = 0;
        
        // 加载本地存储的数据
        this.loadData();
        this.updateDisplay();
        this.drawWheel();
    }

    // 添加奖品
    addPrize(name, rate) {
        // 移除奖品数量限制检查
        /*
        if (this.prizes.length >= 10) {
            alert('最多只能添加10个奖品！');
            return false;
        }
        */
        
        // 验证输入
        if (!name) {
            alert('请输入奖品名称！');
            return false;
        }
        
        // 验证概率
        const numRate = parseFloat(rate);
        if (isNaN(numRate) || numRate < 0 || numRate > 100) {
            alert('请输入有效的概率值（0-100）！');
            return false;
        }
        
        // 检查总概率是否超过100%
        const currentTotal = this.getTotalRate();
        if (currentTotal + numRate > 100) {
            alert(`总概率不能超过100%！当前总概率：${currentTotal.toFixed(1)}%，剩余可分配：${(100 - currentTotal).toFixed(1)}%`);
            return false;
        }
        
        // 添加奖品
        const prize = {
            id: Date.now(),
            name: name,
            rate: numRate
        };
        
        this.prizes.push(prize);
        this.saveData();
        this.updateDisplay();
        this.drawWheel();
        
        return true;
    }

    // 删除奖品
    deletePrize(id) {
        this.prizes = this.prizes.filter(prize => prize.id !== id);
        this.saveData();
        this.updateDisplay();
        this.drawWheel();
    }

    // 获取总概率
    getTotalRate() {
        return this.prizes.reduce((sum, prize) => sum + prize.rate, 0);
    }

    // 添加任务
    addTask(name) {
        if (!name) {
            alert('请输入任务名称！');
            return false;
        }
        
        const task = {
            id: Date.now(),
            name: name,
            completed: false,
            createdTime: new Date().toLocaleString()
        };
        
        this.tasks.push(task);
        this.saveData();
        this.updateDisplay();
        
        return true;
    }

    // 删除任务
    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.updateLotteryChances();
        this.saveData();
        this.updateDisplay();
    }

    // 切换任务完成状态
    toggleTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.completed = !task.completed;
            this.updateLotteryChances();
            this.saveData();
            this.updateDisplay();
        }
    }

    // 更新抽奖机会
    updateLotteryChances() {
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const totalTasks = this.tasks.length;
        
        // 如果所有任务都完成了，获得一次抽奖机会
        if (totalTasks > 0 && completedTasks === totalTasks) {
            // 检查是否是新完成的（避免重复给机会）
            const wasAllCompleted = this.allTasksCompleted;
            if (!wasAllCompleted) {
                this.lotteryChances += 1;
                this.allTasksCompleted = true;
            }
        } else {
            this.allTasksCompleted = false;
        }
    }

    // 抽奖逻辑
    spin() {
        if (this.isSpinning) return;
        if (this.prizes.length === 0) {
            alert('请先添加奖品！');
            return;
        }
        
        // 检查抽奖机会
        if (this.lotteryChances <= 0) {
            alert('没有抽奖机会！请完成所有任务后再来抽奖。');
            return;
        }

        // 消耗一次抽奖机会
        this.lotteryChances -= 1;
        this.saveData();
        this.updateDisplay();

        this.isSpinning = true;
        document.getElementById('spinBtn').disabled = true;
        // 移除以下两行，不再操作result元素
        // document.getElementById('result').textContent = '';
        // document.getElementById('result').className = 'result';

        // 先计算抽奖结果（与轮盘无关）
        const result = this.calculateResult();

        // 随机旋转角度（纯动画效果）
        const spinAngle = Math.random() * 360 + 1800; // 至少转5圈
        this.currentRotation += spinAngle;

        // 应用旋转动画
        this.canvas.style.transform = `rotate(${this.currentRotation}deg)`;

        // 动画结束后显示结果
        setTimeout(() => {
            this.showResult(result);
            this.isSpinning = false;
            document.getElementById('spinBtn').disabled = false;
        }, 3000);
    }

    // 计算抽奖结果（基于概率，与轮盘位置无关）
    calculateResult() {
        if (this.prizes.length === 0) {
            return null;
        }

        // 生成随机数
        const random = Math.random() * 100;
        let cumulativeRate = 0;

        // 按照概率顺序检查每个奖品
        for (let i = 0; i < this.prizes.length; i++) {
            cumulativeRate += this.prizes[i].rate;
            if (random <= cumulativeRate) {
                return this.prizes[i];
            }
        }

        // 如果没有中奖（总概率小于100%的情况）
        return null;
    }

    // 显示结果
    showResult(prize) {
        const modal = document.getElementById('resultModal');
        const modalIcon = document.getElementById('modalIcon');
        const modalMessage = document.getElementById('modalMessage');
        const modalPrize = document.getElementById('modalPrize');
        
        if (prize) {
            // 中奖情况
            modal.className = 'modal win-modal';
            modalIcon.textContent = '🎉';
            modalMessage.textContent = '恭喜中奖!';
            modalPrize.textContent = prize.name;
            
            // 添加到已获得奖品
            this.wonPrizes.push({
                ...prize,
                wonTime: new Date().toLocaleString()
            });
            this.saveData();
            this.updateWonPrizes();
        } else {
            // 未中奖情况
            modal.className = 'modal lose-modal';
            modalIcon.textContent = '😔';
            modalMessage.textContent = '很遗憾，这次没有中奖，再试一次吧！';
            modalPrize.textContent = '';
        }
        
        // 显示弹窗
        modal.style.display = 'block';
        
        // 移除以下代码段，不再显示绿色横幅
        /*
        const resultDiv = document.getElementById('result');
        if (prize) {
            resultDiv.textContent = `🎉 恭喜您中奖了！获得：${prize.name}`;
            resultDiv.className = 'result win';
        } else {
            resultDiv.textContent = '😔 很遗憾，这次没有中奖，再试一次吧！';
            resultDiv.className = 'result lose';
        }
        */
    }

    // 绘制转盘
    drawWheel() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 定义十种颜色
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#FF9F43', '#6C5CE7'
        ];
        
        // 每个扇形占据36度（360度/10）
        const sliceAngle = (2 * Math.PI) / 10;
        let currentAngle = 0;

        // 绘制10个均匀的扇形
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            
            ctx.fillStyle = colors[i];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 注释掉文字显示部分
            /*
            // 如果有奖品，在对应扇形中显示奖品名称
            if (this.prizes[i]) {
                const textAngle = currentAngle + sliceAngle / 2;
                const textX = centerX + Math.cos(textAngle) * (radius * 0.7);
                const textY = centerY + Math.sin(textAngle) * (radius * 0.7);
                
                ctx.save();
                ctx.translate(textX, textY);
                ctx.rotate(textAngle + Math.PI / 2);
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px Microsoft YaHei';
                ctx.textAlign = 'center';
                ctx.fillText(this.prizes[i].name, 0, 0);
                ctx.restore();
            }
            */

            currentAngle += sliceAngle;
        }

        // 如果没有奖品，显示提示
        if (this.prizes.length === 0) {
            ctx.fillStyle = '#999';
            ctx.font = '16px Microsoft YaHei';
            ctx.textAlign = 'center';
            ctx.fillText('请先添加奖品', centerX, centerY);
        }
    }

    // 更新显示
    updateDisplay() {
        this.updatePrizeList();
        this.updateStats();
        this.updateWonPrizes();
        this.updateTaskList();
        this.updateTaskStats();
    }

    // 更新奖品列表
    updatePrizeList() {
        const prizeList = document.getElementById('prizeList');
        prizeList.innerHTML = '';

        this.prizes.forEach(prize => {
            const prizeItem = document.createElement('div');
            prizeItem.className = 'prize-item';
            prizeItem.innerHTML = `
                <div class="prize-info">
                    <div class="prize-name">${prize.name}</div>
                    <div class="prize-rate">概率: ${prize.rate}%</div>
                    ${prize.description ? `<div class="prize-desc">${prize.description}</div>` : ''}
                </div>
                <button class="delete-btn" onclick="lottery.deletePrize(${prize.id})">删除</button>
            `;
            prizeList.appendChild(prizeItem);
        });
    }

    // 更新统计信息
    updateStats() {
        const totalRate = this.getTotalRate();
        const remainingRate = 100 - totalRate;
        
        document.getElementById('totalRate').textContent = `${totalRate.toFixed(1)}%`;
        document.getElementById('remainingRate').textContent = `${remainingRate.toFixed(1)}%`;
        document.getElementById('noPrizeRate').textContent = `${remainingRate.toFixed(1)}%`;
    }

    // 更新已获得奖品
    updateWonPrizes() {
        const wonPrizeList = document.getElementById('wonPrizeList');
        
        wonPrizeList.innerHTML = '';
        
        if (this.wonPrizes.length === 0) {
            wonPrizeList.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">暂无获得奖品</div>';
            return;
        }

        // 逐条显示每个获得的奖品
        this.wonPrizes.forEach((prize, index) => {
            const wonItem = document.createElement('div');
            wonItem.className = 'won-prize-item';
            wonItem.innerHTML = `
                <div class="prize-info">
                    <div class="prize-name">${prize.name}</div>
                    <div class="prize-time">获得时间: ${prize.wonTime}</div>
                </div>
                <button class="delete-won-btn" onclick="lottery.deleteWonPrize(${index})">❌</button>
            `;
            wonPrizeList.appendChild(wonItem);
        });
    }

    // 删除单条获得奖品记录
    deleteWonPrize(index) {
        if (index >= 0 && index < this.wonPrizes.length) {
            this.wonPrizes.splice(index, 1);
            this.saveData();
            this.updateDisplay();
        }
    }

    // 更新任务列表
    updateTaskList() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';

        if (this.tasks.length === 0) {
            taskList.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">暂无任务</div>';
            return;
        }

        this.tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskItem.innerHTML = `
                <div class="task-info">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                           onchange="lottery.toggleTask(${task.id})">
                    <div class="task-name">${task.name}</div>
                </div>
                <div class="task-actions">
                    <button class="delete-task-btn" onclick="lottery.deleteTask(${task.id})">删除</button>
                </div>
            `;
            taskList.appendChild(taskItem);
        });
    }

    // 更新任务统计
    updateTaskStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        
        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('lotteryChances').textContent = this.lotteryChances;
    }

    // 保存数据到本地存储
    saveData() {
        localStorage.setItem('lotteryPrizes', JSON.stringify(this.prizes));
        localStorage.setItem('lotteryWonPrizes', JSON.stringify(this.wonPrizes));
        localStorage.setItem('lotteryTasks', JSON.stringify(this.tasks));
        localStorage.setItem('lotteryChances', this.lotteryChances.toString());
        localStorage.setItem('allTasksCompleted', this.allTasksCompleted ? 'true' : 'false');
    }

    // 从本地存储加载数据
    loadData() {
        const savedPrizes = localStorage.getItem('lotteryPrizes');
        const savedWonPrizes = localStorage.getItem('lotteryWonPrizes');
        const savedTasks = localStorage.getItem('lotteryTasks');
        const savedChances = localStorage.getItem('lotteryChances');
        const savedAllCompleted = localStorage.getItem('allTasksCompleted');
        
        if (savedPrizes) {
            this.prizes = JSON.parse(savedPrizes);
        }
        
        if (savedWonPrizes) {
            this.wonPrizes = JSON.parse(savedWonPrizes);
        }
        
        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
        }
        
        if (savedChances) {
            this.lotteryChances = parseInt(savedChances) || 0;
        }
        
        if (savedAllCompleted) {
            this.allTasksCompleted = savedAllCompleted === 'true';
        }
    }
}

// 全局变量和函数
let lottery;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    lottery = new LotterySystem();
});

// 添加奖品函数
function addPrize() {
    const name = document.getElementById('prizeName').value.trim();
    const rate = document.getElementById('prizeRate').value;
    
    if (lottery.addPrize(name, rate)) {
        // 清空表单
        document.getElementById('prizeName').value = '';
        document.getElementById('prizeRate').value = '';
    }
}

// 添加任务函数
function addTask() {
    const name = document.getElementById('taskName').value.trim();
    
    if (lottery.addTask(name)) {
        // 清空表单
        document.getElementById('taskName').value = '';
    }
}

// 抽奖函数
function spin() {
    lottery.spin();
}

// 回车键添加奖品和任务
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement.id === 'prizeName' || activeElement.id === 'prizeRate') {
            addPrize();
        } else if (activeElement.id === 'taskName') {
            addTask();
        }
    }
});


// 关闭结果弹窗
function closeResultModal() {
    const modal = document.getElementById('resultModal');
    modal.style.display = 'none';
}

// 点击弹窗外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('resultModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}