/**
 * 核心變數 (保留舊有 + 新增)
 */
let currentNums = [];
let hp = 3;
let level = 1;
let score = 0;           // 新增：計分
let timeLeft = 75;       // 保留：75秒計時
let timerInterval;
let retryCount = 0;      // 保留：補答機制

// 新增：怪物圖示陣列
const monsters = ['👾', '👹', '🐲', '🌵', '👻', '🐙', '🧟', '🐺', '🐝', '👽', '👾', '🧛'];

/**
 * 初始化遊戲 (保留邏輯 + 怪物隨機化)
 */
function newGame() {
    // 1. 重置計時器
    clearInterval(timerInterval);
    timeLeft = 75;
    updateTimerDisplay();
    startTimer();

    // 2. 重置狀態與介面
    retryCount = 0;
    const display = document.getElementById('number-display');
    const feedback = document.getElementById('feedback');
    const inputField = document.getElementById('user-input');
    
    display.innerHTML = '';
    feedback.innerText = '';
    inputField.value = '';

    // 3. 新增：隨機更換怪物圖示
    const monsterIcon = document.getElementById('monster-icon');
    if (monsterIcon) {
        const randomMonster = monsters[Math.floor(Math.random() * monsters.length)];
        monsterIcon.innerText = randomMonster;
    }

    // 4. 生成題目 (保留 20% 無解題邏輯)
    let nums = [];
    let isNoSolutionMode = Math.random() < 0.2; 
    while (true) {
        let tempNums = [];
        for (let i = 0; i < 4; i++) tempNums.push(Math.floor(Math.random() * 13) + 1);
        let solvable = canSolve(tempNums);
        if (isNoSolutionMode && !solvable) { nums = tempNums; break; }
        else if (!isNoSolutionMode && solvable) { nums = tempNums; break; }
    }

    currentNums = nums;
    currentNums.forEach(n => {
        let card = document.createElement('div');
        card.className = 'number-card';
        card.innerText = n;
        display.appendChild(card);
    });
}

/**
 * 提交答案檢查 (保留標準化符號 + 新增特效與計分)
 */
function checkAnswer() {
    let input = document.getElementById('user-input').value.trim();
    const feedback = document.getElementById('feedback');
    
    if (!input) return;

    // 保留：標準化符號 (x, ×, ÷ 轉換)
    input = input.replace(/\s/g, '').replace(/x/g, '*').replace(/×/g, '*').replace(/÷/g, '/');

    try {
        let usedNums = (input.match(/\d+/g) || []).map(Number).sort((a,b)=>a-b);
        let goalNums = [...currentNums].sort((a,b)=>a-b);

        if (JSON.stringify(usedNums) !== JSON.stringify(goalNums)) {
            feedback.style.color = "#f1c40f";
            feedback.innerText = "❌ 必須使用且只使用畫面上的四個數字！";
            return;
        }

        let result = eval(input);
        if (Math.abs(result - 24) < 1e-6) {
            // A. 答對：觸發攻擊特效
            triggerEffect('shake'); 
            
            // B. 答對：計分 (基礎10分 + 時間獎勵)
            score += (10 + timeLeft); 
            document.getElementById('score').innerText = score;
            
            feedback.style.color = "#2ecc71";
            feedback.innerText = `💥 攻擊成功！獲得 ${10 + timeLeft} 分！`;
            
            clearInterval(timerInterval);
            level++;
            document.getElementById('level').innerText = level;
            setTimeout(newGame, 1500);
        } else {
            handleWrongAnswer(`結果是 ${result}`);
        }
    } catch (e) {
        feedback.style.color = "#f1c40f";
        feedback.innerText = "❓ 咒語格式錯誤（檢查括號或符號）";
    }
}

/**
 * 補答與錯誤處理 (保留補答邏輯 + 統一提示訊息)
 */
function handleWrongAnswer(msg) {
    const feedback = document.getElementById('feedback');
    if (retryCount < 1) {
        retryCount++;
        feedback.style.color = "#f1c40f";
        feedback.innerText = `⚠️ 輸入錯誤，你有一次補答機會！`; // 依要求修改提示語
    } else {
        triggerEffect('flash'); // 受傷特效
        feedback.style.color = "#e74c3c";
        feedback.innerText = `❌ ${msg}，挑戰失敗！`;
        reduceHP();
    }
}

/**
 * 判斷無解按鈕 (保留邏輯 + 補答機制)
 */
function checkNoSolution() {
    const isActuallySolvable = canSolve(currentNums);
    if (!isActuallySolvable) {
        triggerEffect('shake');
        score += 20; // 無解判斷正確給予固定分數
        document.getElementById('score').innerText = score;
        document.getElementById('feedback').style.color = "#2ecc71";
        document.getElementById('feedback').innerText = "🎯 洞察正確！怪物被你的智慧嚇跑了！";
        clearInterval(timerInterval);
        level++;
        document.getElementById('level').innerText = level;
        setTimeout(newGame, 1500);
    } else {
        handleWrongAnswer("這題其實是有解的喔！");
    }
}

/**
 * 特效觸發器 (新增)
 */
function triggerEffect(className) {
    const el = document.getElementById('monster-icon');
    if (!el) return;
    el.classList.add(className);
    setTimeout(() => el.classList.remove(className), 500);
}

/**
 * 計時器邏輯 (保留)
 */
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            triggerEffect('flash');
            document.getElementById('feedback').innerText = "⏰ 時間到！被怪物偷襲了！";
            reduceHP();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerEl = document.getElementById('timer');
    if (timerEl) {
        timerEl.innerText = timeLeft;
        timerEl.style.color = timeLeft <= 10 ? "#e74c3c" : "#fff";
    }
}

/**
 * 生命值管理 (保留)
 */
function reduceHP() {
    hp--;
    document.getElementById('hp').innerText = hp;
    if (hp <= 0) {
        alert(`💀 冒險結束！最終得分：${score}`);
        hp = 3; level = 1; score = 0;
        document.getElementById('score').innerText = score;
        newGame();
    } else {
        setTimeout(newGame, 1500);
    }
}

/**
 * 核心演算法 (保留)
 */
function canSolve(nums, target = 24) {
    if (nums.length === 1) return Math.abs(nums[0] - target) < 1e-6;
    for (let i = 0; i < nums.length; i++) {
        for (let j = 0; j < nums.length; j++) {
            if (i === j) continue;
            let nextNums = nums.filter((_, idx) => idx !== i && idx !== j);
            let ops = [nums[i]+nums[j], nums[i]-nums[j], nums[i]*nums[j]];
            if (nums[j] !== 0) ops.push(nums[i]/nums[j]);
            for (let res of ops) {
                if (canSolve([...nextNums, res], target)) return true;
            }
        }
    }
    return false;
}

window.onload = newGame;
