/**
 * 遊戲變數設定
 */
let currentNums = [];
let hp = 3;
let level = 1;

/**
 * 核心功能：初始化新遊戲 / 下一關
 */
function newGame() {
    const display = document.getElementById('number-display');
    const feedback = document.getElementById('feedback');
    const inputField = document.getElementById('user-input');
    
    display.innerHTML = '';
    feedback.innerText = '';
    inputField.value = '';

    let nums = [];
    // 設定 20% 的機率出現無解題，80% 出現有解題
    let forceNoSolution = Math.random() < 0.2; 
    let hasSolution = false;
    
    // 循環直到找到符合條件（有解或無解）的題目
    while (true) {
        nums = [];
        for (let i = 0; i < 4; i++) {
            nums.push(Math.floor(Math.random() * 13) + 1);
        }
        
        hasSolution = canSolve(nums);

        if (forceNoSolution && !hasSolution) {
            console.log("系統：產生了一道無解題");
            break; 
        } else if (!forceNoSolution && hasSolution) {
            console.log("系統：產生了一道有解題");
            break; 
        }
        // 若不符合機率設定的條件，則重新循環生成
    }

    currentNums = nums;

    // 渲染卡片介面
    currentNums.forEach(n => {
        let card = document.createElement('div');
        card.className = 'number-card';
        card.innerText = n;
        display.appendChild(card);
    });
}

/**
 * 核心演算法：檢查四個數字是否有解 (遞迴)
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

            let combinations = [
                nums[i] + nums[j],
                nums[i] - nums[j],
                nums[i] * nums[j]
            ];
            if (nums[j] !== 0) combinations.push(nums[i] / nums[j]);

            for (let res of combinations) {
                if (canSolve([...nextNums, res], target)) return true;
            }
        }
    }
    return false;
}

/**
 * 玩家動作：提交答案檢查
 */
function checkAnswer() {
    const input = document.getElementById('user-input').value.trim();
    const feedback = document.getElementById('feedback');
    
    if (!input) return;

    try {
        // 1. 驗證數字使用是否正確
        let usedNums = input.match(/\d+/g);
        if (!usedNums || usedNums.length !== 4) {
            feedback.style.color = "#f1c40f";
            feedback.innerText = "❌ 必須精確使用這 4 個數字喔！";
            return;
        }
        
        let sortedUsed = usedNums.map(Number).sort((a, b) => a - b);
        let sortedCurrent = [...currentNums].sort((a, b) => a - b);
        
        if (JSON.stringify(sortedUsed) !== JSON.stringify(sortedCurrent)) {
            feedback.style.color = "#f1c40f";
            feedback.innerText = "❌ 數字不符合，請檢查是否有寫錯或多用。";
            return;
        }

        // 2. 計算結果
        let result = eval(input);

        if (Math.abs(result - 24) < 1e-6) {
            feedback.style.color = "#2ecc71";
            feedback.innerText = "💥 完美的一擊！怪物被打倒了！";
            level++;
            document.getElementById('level').innerText = level;
            setTimeout(newGame, 1500);
        } else {
            feedback.style.color = "#e74c3c";
            feedback.innerText = `⚠️ 計算結果是 ${result}，不是 24 哦！`;
            reduceHP();
        }
    } catch (e) {
        feedback.style.color = "#f1c40f";
        feedback.innerText = "❓ 咒語格式錯了，檢查一下括號和符號。";
    }
}

/**
 * 玩家動作：判斷無解
 */
function checkNoSolution() {
    const feedback = document.getElementById('feedback');
    const isActuallySolvable = canSolve(currentNums);

    if (!isActuallySolvable) {
        feedback.style.color = "#2ecc71";
        feedback.innerText = "🎯 洞察力驚人！這題確實無解，怪物逃走了！";
        level++;
        document.getElementById('level').innerText = level;
        setTimeout(newGame, 1500);
    } else {
        feedback.style.color = "#e74c3c";
        feedback.innerText = "❌ 其實是有解的喔！再動動腦筋。";
        reduceHP();
    }
}

/**
 * 生命值管理
 */
function reduceHP() {
    hp--;
    document.getElementById('hp').innerText = hp;
    if (hp <= 0) {
        alert("💀 冒險者倒下了... 重新開始吧！");
        hp = 3;
        level = 1;
        document.getElementById('hp').innerText = hp;
        document.getElementById('level').innerText = level;
        newGame();
    }
}

// 頁面載入後啟動遊戲
window.onload = newGame;