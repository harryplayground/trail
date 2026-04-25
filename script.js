let gameMode = 'survival'; // 'survival' 或 'practice'
let currentNums = [];
let hp = 3;
let level = 1;
let score = 0;
let timeLeft = 90; 
let timerInterval;
let isPaused = false; 

const MAX_TIME = 120; 
const monsters = ['👾', '👹', '🐲', '🌵', '👻', '🐙', '🧟', '🐺', '🐝', '👽', '🧛'];
const mentors = ['🧙‍♂️', '🤖', '🎓', '🦉', '💡'];

/**
 * 進入模式選擇
 */
function selectMode(mode) {
    gameMode = mode;
    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    
    // 初始化數據
    if (gameMode === 'survival') {
        hp = 3;
        level = 1;
        score = 0;
        timeLeft = 90;
        document.getElementById('hp-stat').style.display = 'block';
        document.getElementById('score-label').innerHTML = `🪙 分數: <span id="score">0</span>`;
        document.getElementById('practice-controls').style.display = 'none';
        document.getElementById('mode-tip').innerText = "提示：答對增加秒數。勇者，在時間耗盡前擊敗更多敵人吧！";
    } else {
        level = 1;
        score = 0; // 練習模式用於計題數
        timeLeft = 0; // 正計時從 0 開始
        document.getElementById('hp-stat').style.display = 'none';
        document.getElementById('score-label').innerHTML = `✅ 已完成: <span id="score">0</span>`;
        document.getElementById('practice-controls').style.display = 'flex';
        document.getElementById('mode-tip').innerText = "提示：練習模式沒有時間壓力。若卡住了，可以點擊「獲取提示」。";
    }
    
    newGame();
}

/**
 * 返回首頁選單
 */
function goHome() {
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById('game-container').style.display = 'none';
    document.getElementById('start-menu').style.display = 'flex';
}

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
    isPaused = false; 
    document.getElementById('timer').classList.remove('timer-paused');
    document.getElementById('solution-modal').style.display = 'none';
    document.getElementById('user-input').disabled = false;
    document.getElementById('user-input').value = '';
    document.getElementById('feedback').innerText = '';

    if (!timerInterval) {
        startTimer();
    }

    // 練習模式換題重置小計時，生存模式保持剩餘時間
    if (gameMode === 'practice') timeLeft = 0;

    // 生成題目 (20% 機率出現無解)
    let isNoSolutionMode = Math.random() < 0.2;
    while (true) {
        let tempNums = Array.from({ length: 4 }, () => Math.floor(Math.random() * 13) + 1);
        if (canSolve(tempNums) === !isNoSolutionMode) {
            currentNums = tempNums;
            break;
        }
    }

    // 更新圖標：生存用怪物，練習用導師
    const iconList = (gameMode === 'survival') ? monsters : mentors;
    document.getElementById('monster-icon').innerText = iconList[Math.floor(Math.random() * iconList.length)];

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
 * 答對處理
 */
function handleSuccess(isNoSolutionChallenge) {
    if (gameMode === 'survival') {
        let addTime = (level <= 10) ? 20 : 15;
        if (isNoSolutionChallenge) addTime += 10;
        timeLeft = Math.min(timeLeft + addTime, MAX_TIME);
        score += (100 * level);
    } else {
        score++; // 練習模式計算已完成題數
    }

    level++;
    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = level;
    
    updateTimerDisplay(); 
    triggerEffect('shake');
    
    let successMsg = gameMode === 'survival' ? 
        (isNoSolutionChallenge ? `洞察正確！時間增加 ${addTime}s！` : `完美的攻擊！時間增加了 ${addTime}s。`) :
        "太棒了！你成功解開了這道題。";
        
    showResultModal(true, successMsg);
}

/**
 * 答錯處理
 */
function handleWrongAnswer(msg) {
    if (gameMode === 'survival') {
        timeLeft = Math.max(0, timeLeft - 10); 
        updateTimerDisplay();
        triggerEffect('flash');
        reduceHP(false, msg);
    } else {
        // 練習模式不扣分，僅提示
        document.getElementById('feedback').style.color = "#e74c3c";
        document.getElementById('feedback').innerText = `❌ ${msg}，再試試看！`;
        triggerEffect('flash');
    }
}

/**
 * 扣除 HP (生存模式專用)
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
            `💥 ${msg}！受到反擊扣除 10s 與 1 點 HP，強制換題。`;
        showResultModal(false, failMsg);
    }
}

/**
 * 計時器核心
 */
function startTimer() {
    timerInterval = setInterval(() => {
        if (isPaused) return;

        if (gameMode === 'survival') {
            timeLeft--;
            if (timeLeft <= 0) reduceHP(true);
        } else {
            timeLeft++; // 練習模式正計時
        }
        updateTimerDisplay();
    }, 1000);
}

/**
 * 更新計時器顯示
 */
function updateTimerDisplay() {
    const timerEl = document.getElementById('timer');
    if (!timerEl) return;
    timerEl.innerText = timeLeft;

    if (gameMode === 'survival') {
        if (timeLeft > 40) timerEl.style.color = "#2ecc71";
        else if (timeLeft > 15) timerEl.style.color = "#f1c40f";
        else timerEl.style.color = "#e74c3c";
    } else {
        timerEl.style.color = "#3498db";
    }
}

/**
 * 練習模式提示系統 (被動觸發)
 */
function showHint() {
    const solutions = findAllSolutions(currentNums);
    const feedback = document.getElementById('feedback');
    if (solutions.length > 0) {
        // 提取第一個括號內的運算作為第一步提示
        const hintMatch = solutions[0].match(/\(([^()]+)\)/);
        const firstStep = hintMatch ? hintMatch[1] : solutions[0].substring(0, 5);
        feedback.style.color = "#f39c12";
        feedback.innerText = `💡 導師提示：可以試著先計算 (${firstStep})`;
    } else {
        feedback.style.color = "#f39c12";
        feedback.innerText = "💡 導師提示：這題真的沒有解法，試試點擊「此題無解」。";
    }
}

/**
 * 結果彈窗 (暫停計時)
 */
function showResultModal(isSuccess, message) {
    isPaused = true; 
    document.getElementById('timer').classList.add('timer-paused');

    const modal = document.getElementById('solution-modal');
    const title = document.getElementById('modal-title');
    const msgEl = document.getElementById('modal-msg');
    const solSection = document.getElementById('solution-section');

    title.innerText = isSuccess ? "🎊 任務達成！" : "💀 戰鬥挫敗...";
    title.style.color = isSuccess ? "#2ecc71" : "#e74c3c";
    msgEl.innerText = message;
    document.getElementById('user-input').disabled = true;

    if (isSuccess && gameMode === 'survival') {
        solSection.style.display = 'none';
    } else {
        // 失敗或練習模式皆顯示答案
        solSection.style.display = 'block';
        const solutions = findAllSolutions(currentNums);
        document.getElementById('all-solutions-list').innerHTML = 
            solutions.length > 0 ? solutions.map(s => `<div>${s}</div>`).join('') : "此題無解";
    }

    modal.style.display = 'block';
}

/**
 * 暴力搜索解法 (保留)
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
 * 視覺特效
 */
function triggerEffect(name) {
    const box = document.getElementById('monster-box');
    if (box) {
        box.classList.add(name);
        setTimeout(() => box.classList.remove(name), 500);
    }
}

/**
 * 判斷是否有解 (核心演算)
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

// 啟動時不自動 newGame，待選擇模式後執行
