let currentNums = [];
let hp = 3;
let level = 1;
let score = 0;
let timeLeft = 75;
let timerInterval;
let retryCount = 0;

const monsters = ['👾', '👹', '🐲', '🌵', '👻', '🐙', '🧟', '🐺', '🐝', '👽', '🧛'];

/**
 * 彈出式視窗控制
 */
function closeModal() {
    document.getElementById('solution-modal').style.display = 'none';
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
 * 初始化新遊戲
 */
function newGame() {
    closeModal(); // 確保開始新局時關閉視窗
    clearInterval(timerInterval);
    timeLeft = 75;
    updateTimerDisplay();
    startTimer();

    retryCount = 0;
    const display = document.getElementById('number-display');
    const numKeysContainer = document.getElementById('number-keys-container');
    const feedback = document.getElementById('feedback');
    const inputField = document.getElementById('user-input');
    const nextBtn = document.getElementById('btn-next');
    
    // 初始化介面
    display.innerHTML = '';
    if (numKeysContainer) numKeysContainer.innerHTML = '';
    feedback.innerText = '';
    inputField.value = '';
    inputField.disabled = false; 
    if(nextBtn) nextBtn.style.display = 'none';

    // 隨機怪物
    const monsterIcon = document.getElementById('monster-icon');
    if (monsterIcon) {
        monsterIcon.innerText = monsters[Math.floor(Math.random() * monsters.length)];
    }

    // 生成題目邏輯 (20% 無解模式)
    let nums = [];
    let isNoSolutionMode = Math.random() < 0.2;
    while (true) {
        let tempNums = [];
        for (let i = 0; i < 4; i++) tempNums.push(Math.floor(Math.random() * 13) + 1);
        if (canSolve(tempNums) === !isNoSolutionMode) { nums = tempNums; break; }
    }

    currentNums = nums;

    // 生成卡片與鍵盤按鈕
    currentNums.forEach(n => {
        let card = document.createElement('div');
        card.className = 'number-card';
        card.innerText = n;
        display.appendChild(card);

        if (numKeysContainer) {
            let key = document.createElement('button');
            key.className = 'key';
            key.innerText = n;
            key.onclick = () => pressKey(n.toString());
            numKeysContainer.appendChild(key);
        }
    });
}

/**
 * 顯示「進入下一場戰鬥」按鈕並鎖定輸入
 */
function showNextButton() {
    clearInterval(timerInterval); 
    const nextBtn = document.getElementById('btn-next');
    const inputField = document.getElementById('user-input');
    if(nextBtn) nextBtn.style.display = 'inline-block';
    if(inputField) inputField.disabled = true; 
}

/**
 * 檢查答案
 */
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
            showNextButton();
        } else {
            handleWrongAnswer(`計算結果是 ${result}`);
        }
    } catch (e) {
        feedback.style.color = "#f1c40f";
        feedback.innerText = "❓ 格式錯誤 ( 檢查括號或符號 )";
    }
}

/**
 * 錯誤處理與補答機制 (整合彈出視窗顯示所有解法)
 */
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
        
        // 顯示所有解法的彈出視窗
        const allSolutions = findAllSolutions(currentNums);
        const listContainer = document.getElementById('all-solutions-list');
        
        if (allSolutions.length > 0) {
            listContainer.innerHTML = allSolutions.map((s, i) => `<div>${i+1}. ${s}</div>`).join('');
        } else {
            listContainer.innerHTML = "這組數字真的無法湊成 24 喔！";
        }
        
        document.getElementById('solution-modal').style.display = 'block';
        reduceHP();
    }
}

/**
 * 核心：尋找所有可行計法 (用於補答失敗後的顯示)
 */
function findAllSolutions(nums) {
    let solutions = new Set();
    const generate = (arr) => {
        if (arr.length === 1) {
            if (Math.abs(arr[0].val - 24) < 1e-6) solutions.add(arr[0].str);
            return;
        }
        for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr.length; j++) {
                if (i === j) continue;
                let nextArr = arr.filter((_, idx) => idx !== i && idx !== j);
                let a = arr[i], b = arr[j];
                let ops = [
                    { val: a.val + b.val, str: `(${a.str}+${b.str})` },
                    { val: a.val - b.val, str: `(${a.str}-${b.str})` },
                    { val: a.val * b.val, str: `${a.str}×${b.str}` }
                ];
                if (b.val !== 0) ops.push({ val: a.val / b.val, str: `${a.str}÷${b.str}` });
                for (let res of ops) generate([...nextArr, res]);
            }
        }
    };
    generate(nums.map(n => ({ val: n, str: n.toString() })));
    return Array.from(solutions).slice(0, 6); // 取前 6 組顯示
}

/**
 * 扣除生命值
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
        showNextButton();
    }
}

/**
 * 此題無解判斷
 */
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

/**
 * 怪物特效
 */
function triggerEffect(className) {
    const el = document.getElementById('monster-icon');
    if (el) {
        el.classList.add(className);
        setTimeout(() => el.classList.remove(className), 500);
    }
}

/**
 * 計時器
 */
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

/**
 * 檢查是否有解
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
