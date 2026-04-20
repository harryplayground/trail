let currentNums = [];
let hp = 3;
let level = 1;
let score = 0;
let timeLeft = 90; // 起始時間 90 秒
let timerInterval;
let isPaused = false; // 控制計時器暫停的狀態開關

const MAX_TIME = 120; // 時間上限
const monsters = ['👾', '👹', '🐲', '🌵', '👻', '🐙', '🧟', '🐺', '🐝', '👽', '🧛'];

/**
 * 虛擬鍵盤輸入處理
 */
function pressKey(val) {
    const input = document.getElementById('user-input');
    if (input.disabled) return;

    if (val === 'AC') {
        input.value = '';
    } else if (val === 'DEL') {
        input.value = input.value.slice(0, -1);
    } else {
        if (input.value.length < 25) {
            input.value += val;
        }
    }
}

/**
 * 初始化新遊戲 (換關)
 */
function newGame() {
    // 1. 恢復倒數與重置 UI 狀態
    isPaused = false; 
    document.getElementById('timer').classList.remove('timer-paused');
    document.getElementById('solution-modal').style.display = 'none';
    document.getElementById('user-input').disabled = false;
    document.getElementById('user-input').value = '';
    document.getElementById('feedback').innerText = '';

    // 啟動計時器 (僅在遊戲第一次啟動時執行)
    if (!timerInterval) {
        startTimer();
    }

    // 生成題目 (20% 機率出現無解)
    let isNoSolutionMode = Math.random() < 0.2;
    while (true) {
        let tempNums = Array.from({ length: 4 }, () => Math.floor(Math.random() * 13) + 1);
        if (canSolve(tempNums) === !isNoSolutionMode) {
            currentNums = tempNums;
            break;
        }
    }

    // 更新怪物圖標
    document.getElementById('monster-icon').innerText = monsters[Math.floor(Math.random() * monsters.length)];

    // 生成題目卡片與數字按鈕
    const display = document.getElementById('number-display');
    const keyContainer = document.getElementById('number-keys-container');
    display.innerHTML = '';
    keyContainer.innerHTML = '';

    currentNums.forEach(n => {
        let card = document.createElement('div');
        card.className = 'number-card';
        card.innerText = n;
        display.appendChild(card);

        let key = document.createElement('button');
        key.className = 'key';
        key.innerText = n;
        key.onclick = () => pressKey(n.toString());
        keyContainer.appendChild(key);
    });
    
    updateTimerDisplay();
}

/**
 * 檢查公式正確性
 */
function checkAnswer() {
    const feedback = document.getElementById('feedback');
    let rawInput = document.getElementById('user-input').value.trim();
    if (!rawInput) return;

    let processed = rawInput.replace(/x|×|X/g, '*').replace(/÷/g, '/');

    try {
        let used = (processed.match(/\d+/g) || []).map(Number).sort((a, b) => a - b);
        let goal = [...currentNums].sort((a, b) => a - b);

        if (JSON.stringify(used) !== JSON.stringify(goal)) {
            feedback.style.color = "#f1c40f";
            feedback.innerText = "❌ 必須使用且只使用這 4 個數字喔！";
            return;
        }

        let result = new Function(`return ${processed}`)();

        if (Math.abs(result - 24) < 1e-6) {
            handleSuccess(false); 
        } else {
            handleWrongAnswer(`結果是 ${result.toFixed(1)}`);
        }
    } catch (e) {
        feedback.style.color = "#f1c40f";
        feedback.innerText = "❓ 格式錯誤";
    }
}

/**
 * 點擊「無解」判斷
 */
function checkNoSolution() {
    if (!canSolve(currentNums)) {
        handleSuccess(true); 
    } else {
        handleWrongAnswer("這題其實是有解法的！");
    }
}

/**
 * 答對處理 (生存獎勵加秒)
 */
function handleSuccess(isNoSolutionChallenge) {
    let addTime = (level <= 10) ? 20 : 15;
    
    if (isNoSolutionChallenge) {
        addTime += 10; // 無解題額外獎勵
    }

    timeLeft = Math.min(timeLeft + addTime, MAX_TIME);
    score += (100 * level);
    level++;

    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = level;
    
    updateTimerDisplay(); 
    triggerEffect('shake');
    showResultModal(true, isNoSolutionChallenge ? 
        `洞察正確！成功識破怪物的幻覺，時間大幅增加 ${addTime}s！` : 
        `完美的攻擊！時間增加了 ${addTime}s。`);
}

/**
 * 答錯處理
 */
function handleWrongAnswer(msg) {
    timeLeft = Math.max(0, timeLeft - 10); 
    updateTimerDisplay();
    triggerEffect('flash');
    reduceHP(false, msg);
}

/**
 * 扣除 HP 與結束邏輯
 */
function reduceHP(isTimeOut, msg = "") {
    hp--;
    document.getElementById('hp').innerText = hp;

    if (hp <= 0 || (isTimeOut && timeLeft <= 0)) {
        clearInterval(timerInterval);
        alert(`💀 冒險結束！勇者在第 ${level} 關倒下了。\n最終得分：${score}`);
        location.reload(); 
    } else {
        let failMsg = isTimeOut ? 
            "⏰ 時間耗盡！勇者露出了破綻，受到 1 點傷害並換題。" : 
            `💥 ${msg}！受到反擊扣除 10s 與 1 點 HP，強制更換關卡。`;
        showResultModal(false, failMsg);
    }
}

/**
 * 生存計時器核心 (整合暫停功能)
 */
function startTimer() {
    timerInterval = setInterval(() => {
        if (isPaused) return; // 如果被鎖死暫停，就不往下跑

        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            reduceHP(true);
        }
    }, 1000);
}

/**
 * 更新計時器顯示與顏色
 */
function updateTimerDisplay() {
    const timerEl = document.getElementById('timer');
    if (!timerEl) return;
    
    timerEl.innerText = timeLeft;

    if (timeLeft > 40) {
        timerEl.style.color = "#2ecc71";
    } else if (timeLeft > 15) {
        timerEl.style.color = "#f1c40f";
    } else {
        timerEl.style.color = "#e74c3c";
    }
}

/**
 * 結果彈窗 (觸發暫停)
 */
function showResultModal(isSuccess, message) {
    isPaused = true; // 鎖死時間倒數
    document.getElementById('timer').classList.add('timer-paused'); // 加入 CSS 視覺鎖死效果

    const modal = document.getElementById('solution-modal');
    const title = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-msg');
    const solSection = document.getElementById('solution-section');

    title.innerText = isSuccess ? "🎊 戰勝怪物！" : "💀 戰鬥失敗...";
    title.style.color = isSuccess ? "#2ecc71" : "#e74c3c";
    msgEl.innerText = message;
    document.getElementById('user-input').disabled = true;

    if (isSuccess) {
        solSection.style.display = 'none';
    } else {
        solSection.style.display = 'block';
        const solutions = findAllSolutions(currentNums);
        document.getElementById('all-solutions-list').innerHTML = 
            solutions.length > 0 ? solutions.map(s => `<div>${s}</div>`).join('') : "此題無解";
    }

    modal.style.display = 'block';
}

/**
 * 暴力搜索解法 (用於提供參考答案)
 */
function findAllSolutions(nums) {
    let res = new Set();
    const solve = (arr) => {
        if (arr.length === 1) {
            if (Math.abs(arr[0].val - 24) < 1e-6) res.add(arr[0].str);
            return;
        }
        for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr.length; j++) {
                if (i === j) continue;
                let a = arr[i], b = arr[j], next = arr.filter((_, k) => k !== i && k !== j);
                solve([...next, { val: a.val + b.val, str: `(${a.str}+${b.str})` }]);
                solve([...next, { val: a.val - b.val, str: `(${a.str}-${b.str})` }]);
                solve([...next, { val: a.val * b.val, str: `(${a.str}×${b.str})` }]);
                if (b.val !== 0) solve([...next, { val: a.val / b.val, str: `(${a.str}÷${b.str})` }]);
            }
        }
    };
    solve(nums.map(n => ({ val: n, str: n.toString() })));
    return Array.from(res).slice(0, 3);
}

/**
 * 視覺效果
 */
function triggerEffect(name) {
    const box = document.getElementById('monster-box');
    if (box) {
        box.classList.add(name);
        setTimeout(() => box.classList.remove(name), 500);
    }
}

/**
 * 判斷是否有解
 */
function canSolve(nums) {
    if (nums.length === 1) return Math.abs(nums[0] - 24) < 1e-6;
    for (let i = 0; i < nums.length; i++) {
        for (let j = 0; j < nums.length; j++) {
            if (i === j) continue;
            let a = nums[i], b = nums[j], next = nums.filter((_, k) => k !== i && k !== j);
            if (canSolve([...next, a + b]) || canSolve([...next, a - b]) || 
                canSolve([...next, a * b]) || (b !== 0 && canSolve([...next, a / b]))) return true;
        }
    }
    return false;
}

window.onload = newGame;
