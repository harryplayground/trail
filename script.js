let gameMode = 'survival'; // 'survival' 或 'practice'
let currentNums = [];
let hp = 3;
let level = 1;
let score = 0;
let timeLeft = 75; 
let timerInterval;
let isPaused = false; 
let wrongCount = 0; // 新增：單題錯誤計數器

const MAX_TIME = 120; 
const monsters = ['👾', '👹', '🐲', '🌵', '👻', '🐙', '🧟', '🐺', '🐝', '👽', '🧛'];
const mentors = ['🧙‍♂️', '🤖', '🎓', '🦉', '💡'];

/**
 * 進入模式選擇
 */
function selectMode(mode) {
    gameMode = mode;
    
    // --- 更新點 1：徹底重置所有數據 (解決問題 1 & 4) ---
    level = 1; 
    score = 0;
    hp = 3;
    wrongCount = 0; 
    isPaused = false;

    // 清除舊的計時器防止累加
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    document.getElementById('start-menu').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    
    // 強制更新 UI 文字顯示，確保畫面同步重置
    document.getElementById('level').innerText = level;
    document.getElementById('hp').innerText = hp;
    document.getElementById('score').innerText = score;

    if (gameMode === 'survival') {
        timeLeft = 75;
        document.getElementById('hp-stat').style.display = 'block';
        document.getElementById('score-label').innerHTML = `🪙 分數: <span id="score">${score}</span>`;
        document.getElementById('practice-controls').style.display = 'none';
        document.getElementById('mode-tip').innerText = "提示：答對增加秒數。勇者，在時間耗盡前擊敗更多敵人吧！";
    } else {
        timeLeft = 0;
        document.getElementById('hp-stat').style.display = 'none';
        document.getElementById('score-label').innerHTML = `✅ 已完成: <span id="score">${score}</span>`;
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
    wrongCount = 0; // 重置單題錯誤計數
    document.getElementById('timer').classList.remove('timer-paused');
    document.getElementById('solution-modal').style.display = 'none';
    document.getElementById('user-input').disabled = false;
    document.getElementById('user-input').value = '';
    document.getElementById('feedback').innerText = '';

    if (!timerInterval) {
        startTimer();
    }

    if (gameMode === 'practice') timeLeft = 0;

    let isNoSolutionMode = Math.random() < 0.2;
    while (true) {
        let tempNums = Array.from({ length: 4 }, () => Math.floor(Math.random() * 13) + 1);
        if (canSolve(tempNums) === !isNoSolutionMode) {
            currentNums = tempNums;
            break;
        }
    }

    const iconList = (gameMode === 'survival') ? monsters : mentors;
    document.getElementById('monster-icon').innerText = iconList[Math.floor(Math.random() * iconList.length)];

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

        if (used.length === 0) throw new Error("Format Error");

        if (JSON.stringify(used) !== JSON.stringify(goal)) {
            feedback.style.color = "#f1c40f";
            feedback.innerText = "❌ 必須使用且只使用這 4 個數字喔！";
            return;
        }

        let result = new Function(`return ${processed}`)();

        if (Math.abs(result - 24) < 1e-6) {
            // --- 更新點 2：答對時清空反饋文字，確保進入下一題 (解決問題 2) ---
            feedback.innerText = "";
            handleSuccess(false); 
        } else {
            handleWrongAnswer(`結果是 ${result.toFixed(1)}`);
        }
    } catch (e) {
        feedback.style.color = "#f1c40f";
        feedback.innerText = "❓ 格式錯誤";
    }
}

function checkNoSolution() {
    if (!canSolve(currentNums)) {
        handleSuccess(true); 
    } else {
        handleWrongAnswer("這題其實是有解法的！");
    }
}

function handleSuccess(isNoSolutionChallenge) {
    let addTime = 0;
    if (gameMode === 'survival') {
        addTime = (level <= 10) ? 20 : 15;
        if (isNoSolutionChallenge) addTime += 10;
        timeLeft = Math.min(timeLeft + addTime, MAX_TIME);
        score += (100 * level);
    } else {
        score++; 
    }

    level++;
    document.getElementById('score').innerText = score;
    document.getElementById('level').innerText = level;
    
    updateTimerDisplay(); 
    triggerEffect('shake');
    
    let successMsg = gameMode === 'survival' ? 
        (isNoSolutionChallenge ? `洞察正確！成功識破幻覺，時間增加 ${addTime}s！` : `完美的攻擊！時間增加了 ${addTime}s。`) :
        "太棒了！你成功解開了這道題。";
        
    showResultModal(true, successMsg);
}

/**
 * 答錯處理 (更新點 3：新增更正機會，解決問題 3)
 */
function handleWrongAnswer(msg) {
    if (gameMode === 'survival') {
        wrongCount++;
        if (wrongCount < 2) {
            // 第一次答錯：僅震動與提示，不扣血也不扣秒
            triggerEffect('shake');
            const feedback = document.getElementById('feedback');
            feedback.style.color = "#f1c40f";
            feedback.innerText = `❌ ${msg}。再試一次，剩餘一次更正機會！`;
        } else {
            // 第二次答錯：正式懲罰
            timeLeft = Math.max(0, timeLeft - 10); 
            updateTimerDisplay();
            triggerEffect('flash');
            reduceHP(false, msg);
        }
    } else {
        document.getElementById('feedback').style.color = "#e74c3c";
        document.getElementById('feedback').innerText = `❌ ${msg}，再試試看！`;
        triggerEffect('flash');
    }
}

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

function startTimer() {
    timerInterval = setInterval(() => {
        if (isPaused) return;

        if (gameMode === 'survival') {
            timeLeft--;
            if (timeLeft <= 0) reduceHP(true);
        } else {
            timeLeft++; 
        }
        updateTimerDisplay();
    }, 1000);
}

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

function showHint() {
    const solutions = findAllSolutions(currentNums);
    const feedback = document.getElementById('feedback');
    if (solutions.length > 0) {
        const hintMatch = solutions[0].match(/\(([^()]+)\)/);
        const firstStep = hintMatch ? hintMatch[1] : solutions[0].substring(0, 5);
        feedback.style.color = "#f39c12";
        feedback.innerText = `💡 導師提示：可以試著先計算 (${firstStep})`;
    } else {
        feedback.style.color = "#f39c12";
        feedback.innerText = "💡 導師提示：這題真的沒有解法，試試點擊「此題無解」。";
    }
}

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
        solSection.style.display = 'block';
        const solutions = findAllSolutions(currentNums);
        document.getElementById('all-solutions-list').innerHTML = 
            solutions.length > 0 ? solutions.map(s => `<div>${s}</div>`).join('') : "此題無解";
    }

    modal.style.display = 'block';
}

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

function triggerEffect(name) {
    const box = document.getElementById('monster-box');
    if (box) {
        box.classList.add(name);
        setTimeout(() => box.classList.remove(name), 500);
    }
}

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
