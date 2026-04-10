/**
 * 遊戲變數設定
 */
let currentNums = [];
let hp = 3;
let level = 1;

/**
 * 核心功能：初始化新遊戲
 */
function newGame() {
    // 確保這些 ID 在 HTML 中都存在
    const display = document.getElementById('number-display');
    const feedback = document.getElementById('feedback');
    const inputField = document.getElementById('user-input');
    
    if (!display || !feedback || !inputField) return;

    display.innerHTML = '';
    feedback.innerText = '';
    inputField.value = '';

    let nums = [];
    let forceNoSolution = Math.random() < 0.2; 
    let hasSolution = false;
    
    while (true) {
        nums = [];
        for (let i = 0; i < 4; i++) {
            nums.push(Math.floor(Math.random() * 13) + 1);
        }
        hasSolution = canSolve(nums);
        if (forceNoSolution && !hasSolution) break; 
        else if (!forceNoSolution && hasSolution) break; 
    }

    currentNums = nums;

    // 渲染卡片：確保 Class 名稱為 number-card 以對應 CSS
    currentNums.forEach(n => {
        let card = document.createElement('div');
        card.className = 'number-card'; 
        card.innerText = n;
        display.appendChild(card);
    });
}

/**
 * 核心演算法：檢查是否有解
 */
function canSolve(nums, target = 24) {
    if (nums.length === 1) {
        return Math.abs(nums[0] - target) < 1e-6;
    }
    for (let i = 0; i < nums.length; i++) {
        for (let j = 0; j < nums.length; j++) {
            if (i === j) continue;
            let nextNums = [];
            for (let k = 0; k < nums.length; k++) {
                if (k !== i && k !== j) nextNums.push(nums[k]);
            }
            let combinations = [nums[i] + nums[j], nums[i] - nums[j], nums[i] * nums[j]];
            if (nums[j] !== 0) combinations.push(nums[i] / nums[j]);
            for (let res of combinations) {
                if (canSolve([...nextNums, res], target)) return true;
            }
        }
    }
    return false;
}

/**
 * 提交答案檢查
 */
function checkAnswer() {
    let input = document.getElementById('user-input').value.trim();
    const feedback = document.getElementById('feedback');
    
    if (!input) return;

    // 容錯處理：將玩家可能輸入的 'x' 或 '×' 轉換為 '*'
    input = input.replace(/x/g, '*').replace(/×/g, '*').replace(/÷/g, '/');

    try {
        // 1. 驗證數字
        let usedNums = input.match(/\d+/g);
        if (!usedNums || usedNums.length !== 4) {
            feedback.style.color = "#f1c40f";
            feedback.innerText = "❌ 必須使用且只使用這 4 個數字喔！";
            return;
        }
        
        let sortedUsed = usedNums.map(Number).sort((a, b) => a - b);
        let sortedCurrent = [...currentNums].sort((a, b) => a - b);
        
        if (JSON.stringify(sortedUsed) !== JSON.stringify(sortedCurrent)) {
            feedback.style.color = "#f1c40f";
            feedback.innerText = "❌ 數字與題目不符！";
            return;
        }

        // 2. 計算結果
        let result = eval(input);

        if (Math.abs(result - 24) < 1e-6) {
            feedback.style.color = "#2ecc71";
            feedback.innerText = "💥 擊中要害！正確答案！";
            level++;
            document.getElementById('level').innerText = level;
            setTimeout(newGame, 1500);
        } else {
            feedback.style.color = "#e74c3c";
            feedback.innerText = `⚠️ 結果是 ${result}，再試試？`;
            reduceHP();
        }
    } catch (e) {
        feedback.style.color = "#f1c40f";
        feedback.innerText = "❓ 格式錯誤，請檢查括號或運算符號。";
    }
}

/**
 * 點擊「無解」按鈕
 */
function checkNoSolution() {
    const feedback = document.getElementById('feedback');
    if (canSolve(currentNums)) {
        feedback.style.color = "#e74c3c";
        feedback.innerText = "❌ 這題其實有解喔！再找找看。";
        reduceHP();
    } else {
        feedback.style.color = "#2ecc71";
        feedback.innerText = "🎯 厲害！這題真的無解。";
        level++;
        document.getElementById('level').innerText = level;
        setTimeout(newGame, 1500);
    }
}

function reduceHP() {
    hp--;
    document.getElementById('hp').innerText = hp;
    if (hp <= 0) {
        alert("💀 遊戲結束，重新開始！");
        hp = 3; level = 1;
        document.getElementById('hp').innerText = hp;
        document.getElementById('level').innerText = level;
        newGame();
    }
}

window.onload = newGame;
