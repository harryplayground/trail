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
    const nextBtn = document.getElementById('btn-next');
    const ansDisplay = document.getElementById('correct-answer-display');
    
    // 初始化介面
    display.innerHTML = '';
    feedback.innerText = '';
    ansDisplay.innerText = '';
    inputField.value = '';
    inputField.disabled = false; // 重新啟用輸入
    if(nextBtn) nextBtn.style.display = 'none'; // 隱藏下一題按鈕

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

// 修改：當答對或兩次答錯後，顯示「下一場戰鬥」按鈕
function showNextButton() {
    clearInterval(timerInterval); // 停止計時
    const nextBtn = document.getElementById('btn-next');
    const inputField = document.getElementById('user-input');
    if(nextBtn) nextBtn.style.display = 'inline-block';
    if(inputField) inputField.disabled = true; // 鎖定輸入框
}

function checkAnswer() {
    const feedback = document.getElementById('feedback');
    let rawInput = document.getElementById('user-input').value.trim();
    if (!rawInput) return;

    let processedInput = rawInput
        .replace(/（/g, '(').replace(/）/g, ')')
        .replace(/x|×|X/g, '*').replace(/÷/g, '/');

    try {
        let usedNums = (processedInput.match(/\d+/g) || []).map(Number).sort((a,b)=>a-b);
        let goalNums = [...currentNums].sort((a, b) => a - b);

        if (JSON.stringify(usedNums) !== JSON.stringify(goalNums)) {
            feedback.style.color = "#f1c40f";
            feedback.innerText = "❌ 必須使用且只使用這 4 個數字喔！";
            return;
        }

        let result = new Function(`return ${processedInput}`)();

        if (Math.abs(result - 24) < 1e-6) {
            triggerEffect('shake');
            score += (10 + timeLeft);
            document.getElementById('score').innerText = score;
            feedback.style.color = "#2ecc71";
            feedback.innerText = `💥 完美的一擊！結果是 24！(+${10 + timeLeft}分)`;
            level++;
            document.getElementById('level').innerText = level;
            showNextButton(); // 顯示手動進入下一題按鈕
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
    const ansDisplay = document.getElementById('correct-answer-display');

    if (retryCount < 1) {
        retryCount++;
        feedback.style.color = "#f1c40f";
        feedback.innerText = `⚠️ 輸入錯誤，你有一次補答機會！`;
    } else {
        triggerEffect('flash');
        feedback.style.color = "#e74c3c";
        feedback.innerText = `❌ ${msg}，挑戰失敗！`;
        
        // 1. 顯示正確答案
        const solution = solve24(currentNums);
        ansDisplay.innerText = solution ? `💡 正確答案參考：${solution}` : "💡 這題經鑑定真的無解！";
        
        reduceHP();
    }
}

// 輔助函式：尋找一個可行解
function solve24(nums) {
    const ops = ['+', '-', '*', '/'];
    const generate = (arr) => {
        if (arr.length === 1) {
            if (Math.abs(arr[0].val - 24) < 1e-6) return arr[0].str;
            return null;
        }
        for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr.length; j++) {
                if (i === j) continue;
                let nextArr = arr.filter((_, idx) => idx !== i && idx !== j);
                let a = arr[i], b = arr[j];
                let results = [
                    { val: a.val + b.val, str: `(${a.str}+${b.str})` },
                    { val: a.val - b.val, str: `(${a.str}-${b.str})` },
                    { val: a.val * b.val, str: `(${a.str}*${b.str})` }
                ];
                if (b.val !== 0) results.push({ val: a.val / b.val, str: `(${a.str}/${b.str})` });
                
                for (let res of results) {
                    let final = generate([...nextArr, res]);
                    if (final) return final;
                }
            }
        }
        return null;
    };
    return generate(nums.map(n => ({ val: n, str: n.toString() })));
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
        showNextButton(); // 失敗後也顯示手動跳下一題
    }
}

// 其餘功能 (checkNoSolution, triggerEffect, startTimer, canSolve...) 保留不變
function checkNoSolution() {
    if (!canSolve(currentNums)) {
        triggerEffect('shake');
        score += 20;
        document.getElementById('score').innerText = score;
        document.getElementById('feedback').style.color = "#2ecc71";
        document.getElementById('feedback').innerText = "🎯 洞察正確！這題真的無解。";
        level++;
        document.getElementById('level').innerText = level;
        showNextButton();
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
            document.getElementById('feedback').innerText = "⏰ 時間到！";
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
