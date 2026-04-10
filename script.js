let currentNums = [];
let hp = 3;
let level = 1;
let score = 0;
let timeLeft = 75;
let timerInterval;
let retryCount = 0;

const monsters = ['👾', '👹', '🐲', '🌵', '👻', '🐙', '🧟', '🐺', '🐝', '👽', '🧛'];

function newGame() {
    clearInterval(timerInterval);
    timeLeft = 75;
    updateTimerDisplay();
    startTimer();

    retryCount = 0;
    const display = document.getElementById('number-display');
    const feedback = document.getElementById('feedback');
    const inputField = document.getElementById('user-input');
    
    display.innerHTML = '';
    feedback.innerText = '';
    inputField.value = '';

    // 隨機怪物
    const monsterIcon = document.getElementById('monster-icon');
    if (monsterIcon) {
        monsterIcon.innerText = monsters[Math.floor(Math.random() * monsters.length)];
    }

    // 生成題目邏輯 (20%無解)
    let nums = [];
    let isNoSolutionMode = Math.random() < 0.2;
    while (true) {
        let tempNums = [];
        for (let i = 0; i < 4; i++) tempNums.push(Math.floor(Math.random() * 13) + 1);
        if (canSolve(tempNums) === !isNoSolutionMode) { nums = tempNums; break; }
    }

    currentNums = nums;
    currentNums.forEach(n => {
        let card = document.createElement('div');
        card.className = 'number-card';
        card.innerText = n;
        display.appendChild(card);
    });
}

function checkAnswer() {
    const feedback = document.getElementById('feedback');
    let rawInput = document.getElementById('user-input').value.trim();
    
    if (!rawInput) return;

    // 1. 符號標準化 (處理全形括號與乘除號)
    let processedInput = rawInput
        .replace(/（/g, '(').replace(/）/g, ')')
        .replace(/x|×|X/g, '*').replace(/÷/g, '/');

    try {
        // 2. 數字比對：提取輸入的所有數字
        let usedNums = processedInput.match(/\d+/g);
        if (!usedNums || usedNums.length !== 4) {
            feedback.style.color = "#f1c40f";
            feedback.innerText = "❌ 必須使用且只使用這 4 個數字喔！";
            return;
        }

        let sortedUsed = usedNums.map(Number).sort((a, b) => a - b);
        let sortedGoal = [...currentNums].sort((a, b) => a - b);

        if (JSON.stringify(sortedUsed) !== JSON.stringify(sortedGoal)) {
            feedback.style.color = "#f1c40f";
            feedback.innerText = "❌ 使用的數字與卡片不符！";
            return;
        }

        // 3. 計算結果
        // 使用 Function 代替直接 eval 稍微安全一點點
        let result = new Function(`return ${processedInput}`)();

        if (Math.abs(result - 24) < 1e-6) {
            triggerEffect('shake');
            score += (10 + timeLeft);
            document.getElementById('score').innerText = score;
            feedback.style.color = "#2ecc71";
            feedback.innerText = `💥 完美的一擊！結果是 24！(+${10 + timeLeft}分)`;
            clearInterval(timerInterval);
            level++;
            document.getElementById('level').innerText = level;
            setTimeout(newGame, 1500);
        } else {
            handleWrongAnswer(`計算結果是 ${result}`);
        }
    } catch (e) {
        feedback.style.color = "#f1c40f";
        feedback.innerText = "❓ 格式錯誤 ( 檢查括號或符號 )";
    }
}

function handleWrongAnswer(msg) {
    const feedback = document.getElementById('feedback');
    if (retryCount < 1) {
        retryCount++;
        feedback.style.color = "#f1c40f";
        feedback.innerText = `⚠️ 輸入錯誤，你有一次補答機會！`;
    } else {
        triggerEffect('flash');
        feedback.style.color = "#e74c3c";
        feedback.innerText = `❌ ${msg}，挑戰失敗！`;
        reduceHP();
    }
}

function checkNoSolution() {
    if (!canSolve(currentNums)) {
        triggerEffect('shake');
        score += 20;
        document.getElementById('score').innerText = score;
        document.getElementById('feedback').style.color = "#2ecc71";
        document.getElementById('feedback').innerText = "🎯 洞察正確！這題真的無解。";
        clearInterval(timerInterval);
        level++;
        document.getElementById('level').innerText = level;
        setTimeout(newGame, 1500);
    } else {
        handleWrongAnswer("這題其實是有解的喔！");
    }
}

function triggerEffect(className) {
    const el = document.getElementById('monster-icon');
    if (el) {
        el.classList.add(className);
        setTimeout(() => el.classList.remove(className), 500);
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            triggerEffect('flash');
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

function reduceHP() {
    hp--;
    document.getElementById('hp').innerText = hp;
    if (hp <= 0) {
        alert(`💀 冒險結束！得分：${score}`);
        hp = 3; level = 1; score = 0;
        document.getElementById('score').innerText = score;
        newGame();
    } else {
        setTimeout(newGame, 1500);
    }
}

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
