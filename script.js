let currentNums = [];
let hp = 3;
let level = 1;
let timeLeft = 75;
let timerInterval;
let retryCount = 0; // 用於紀錄補答機會

function newGame() {
    // 重置計時器
    clearInterval(timerInterval);
    timeLeft = 75;
    updateTimerDisplay();
    startTimer();

    // 重置補答機會與介面
    retryCount = 0;
    const display = document.getElementById('number-display');
    const feedback = document.getElementById('feedback');
    const inputField = document.getElementById('user-input');
    
    display.innerHTML = '';
    feedback.innerText = '';
    inputField.value = '';

    // 生成題目 (邏輯同前，確保 20% 無解)
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

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            document.getElementById('feedback').innerText = "⏰ 時間到！怪物發動了偷襲！";
            reduceHP();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerEl = document.getElementById('timer');
    timerEl.innerText = timeLeft;
    // 時間少於 10 秒時變紅警告
    timerEl.style.color = timeLeft <= 10 ? "#e74c3c" : "#fff";
}

function checkAnswer() {
    let input = document.getElementById('user-input').value.replace(/\s/g, '');
    const feedback = document.getElementById('feedback');
    input = input.replace(/x/g, '*').replace(/×/g, '*').replace(/÷/g, '/');

    try {
        let usedNums = input.match(/\d+/g).map(Number).sort((a,b)=>a-b);
        let goalNums = [...currentNums].sort((a,b)=>a-b);

        if (JSON.stringify(usedNums) !== JSON.stringify(goalNums)) {
            feedback.innerText = "❌ 數字不符！";
            return;
        }

        let result = eval(input);
        if (Math.abs(result - 24) < 1e-6) {
            feedback.style.color = "#2ecc71";
            feedback.innerText = "💥 攻擊成功！";
            clearInterval(timerInterval);
            level++;
            document.getElementById('level').innerText = level;
            setTimeout(newGame, 1500);
        } else {
            handleWrongAnswer(`結果是 ${result}，不是 24。`);
        }
    } catch (e) {
        feedback.innerText = "❓ 格式錯誤";
    }
}

function handleWrongAnswer(msg) {
    const feedback = document.getElementById('feedback');
    if (retryCount < 1) {
        retryCount++;
        feedback.style.color = "#f1c40f";
        feedback.innerText = `⚠️ ${msg} 還有一次補答機會！`;
    } else {
        feedback.style.color = "#e74c3c";
        feedback.innerText = `❌ ${msg} 挑戰失敗！`;
        reduceHP();
    }
}

function checkNoSolution() {
    if (!canSolve(currentNums)) {
        document.getElementById('feedback').style.color = "#2ecc71";
        document.getElementById('feedback').innerText = "🎯 判斷正確！";
        clearInterval(timerInterval);
        level++;
        document.getElementById('level').innerText = level;
        setTimeout(newGame, 1500);
    } else {
        handleWrongAnswer("這題其實是有解的喔！");
    }
}

function reduceHP() {
    hp--;
    document.getElementById('hp').innerText = hp;
    if (hp <= 0) {
        alert("💀 冒險結束！");
        hp = 3; level = 1;
        newGame();
    } else {
        // 扣血後自動換下一題
        setTimeout(newGame, 1500);
    }
}

// 核心求解演算法保留 (canSolve...) 同前
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
