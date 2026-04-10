let currentNums = [];
let hp = 3;
let level = 1;

function newGame() {
    const display = document.getElementById('number-display');
    const feedback = document.getElementById('feedback');
    const inputField = document.getElementById('user-input');
    
    if (!display) return;

    display.innerHTML = '';
    feedback.innerText = '';
    inputField.value = '';

    let nums = [];
    let isNoSolutionMode = Math.random() < 0.2; // 20% 機率出無解題
    
    while (true) {
        let tempNums = [];
        for (let i = 0; i < 4; i++) {
            tempNums.push(Math.floor(Math.random() * 13) + 1);
        }
        let solvable = canSolve(tempNums);
        if (isNoSolutionMode && !solvable) {
            nums = tempNums;
            break;
        } else if (!isNoSolutionMode && solvable) {
            nums = tempNums;
            break;
        }
    }

    currentNums = nums;
    currentNums.forEach(n => {
        let card = document.createElement('div');
        card.className = 'number-card';
        card.innerText = n;
        display.appendChild(card);
    });
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

function checkAnswer() {
    let input = document.getElementById('user-input').value.replace(/\s/g, '');
    const feedback = document.getElementById('feedback');
    
    // 符號標準化 (把 x 轉成 *)
    input = input.replace(/x/g, '*').replace(/×/g, '*').replace(/÷/g, '/');

    try {
        // 提取所有數字並排序比對
        let usedNums = input.match(/\d+/g).map(Number).sort((a,b)=>a-b);
        let goalNums = [...currentNums].sort((a,b)=>a-b);

        if (JSON.stringify(usedNums) !== JSON.stringify(goalNums)) {
            feedback.style.color = "#f1c40f";
            feedback.innerText = "❌ 數字必須跟卡片一模一樣喔！";
            return;
        }

        let result = eval(input);
        if (Math.abs(result - 24) < 1e-6) {
            feedback.style.color = "#2ecc71";
            feedback.innerText = "💥 攻擊成功！下一關！";
            level++;
            document.getElementById('level').innerText = level;
            setTimeout(newGame, 1500);
        } else {
            feedback.style.color = "#e74c3c";
            feedback.innerText = `⚠️ 結果是 ${result}，不是 24 喔！`;
            reduceHP();
        }
    } catch (e) {
        feedback.style.color = "#f1c40f";
        feedback.innerText = "❓ 咒語格式錯誤（括號不對稱或符號寫錯）";
    }
}

function checkNoSolution() {
    const feedback = document.getElementById('feedback');
    if (!canSolve(currentNums)) {
        feedback.style.color = "#2ecc71";
        feedback.innerText = "🎯 洞察正確！這題無解，怪物跑了！";
        level++;
        document.getElementById('level').innerText = level;
        setTimeout(newGame, 1500);
    } else {
        feedback.style.color = "#e74c3c";
        feedback.innerText = "❌ 這題其實有解喔！再想一下。";
        reduceHP();
    }
}

function reduceHP() {
    hp--;
    document.getElementById('hp').innerText = hp;
    if (hp <= 0) {
        alert("💀 冒險失敗！重頭來過。");
        hp = 3; level = 1;
        document.getElementById('hp').innerText = hp;
        document.getElementById('level').innerText = level;
        newGame();
    }
}

window.onload = newGame;
