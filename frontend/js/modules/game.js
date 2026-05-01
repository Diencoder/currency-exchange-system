/**
 * Game Module - Rock Paper Scissors Engine
 * Demonstrates Encapsulation and Separation of Concerns
 */
export class RockPaperScissors {
    constructor() {
        this.playerScore = 0;
        this.cpuScore = 0;
        this.isPlaying = false;
        this.icons = {
            rock: 'fa-hand-rock',
            paper: 'fa-hand-paper',
            scissors: 'fa-hand-scissors'
        };

        // Cache DOM elements
        this.playerDisplay = document.getElementById('player-choice');
        this.cpuDisplay = document.getElementById('cpu-choice');
        this.resultText = document.getElementById('result-text');
        this.pScoreEl = document.getElementById('player-score');
        this.cScoreEl = document.getElementById('cpu-score');
    }

    playMove(playerChoice) {
        if (this.isPlaying) return;
        this.isPlaying = true;

        this.resetDisplays();

        // Show player choice
        this.playerDisplay.innerHTML = `<i class="fas ${this.icons[playerChoice]}"></i>`;
        this.playerDisplay.classList.add(`${playerChoice}-active`);

        // Simulate CPU thinking
        setTimeout(() => {
            const moves = ['rock', 'paper', 'scissors'];
            const cpuChoice = moves[Math.floor(Math.random() * 3)];

            // Show CPU choice
            this.cpuDisplay.classList.remove('skeleton');
            this.cpuDisplay.innerHTML = `<i class="fas ${this.icons[cpuChoice]}"></i>`;
            this.cpuDisplay.classList.add(`${cpuChoice}-active`);

            const result = this.calculateResult(playerChoice, cpuChoice);
            this.updateUI(result, this.playerDisplay, this.cpuDisplay);
            this.isPlaying = false;
        }, 800);
    }

    resetDisplays() {
        this.playerDisplay.className = 'choice-display';
        this.cpuDisplay.className = 'choice-display skeleton';
        this.cpuDisplay.innerHTML = '<i class="fas fa-robot"></i>';
        this.resultText.innerText = 'Analyzing...';
    }

    calculateResult(player, cpu) {
        if (player === cpu) return 'draw';
        if (
            (player === 'rock' && cpu === 'scissors') ||
            (player === 'paper' && cpu === 'rock') ||
            (player === 'scissors' && cpu === 'paper')
        ) {
            return 'win';
        }
        return 'loss';
    }

    updateUI(result, playerEl, cpuEl) {
        if (result === 'win') {
            this.playerScore++;
            this.resultText.innerText = 'YOU WIN! 🎉';
            this.resultText.style.background = 'linear-gradient(135deg, #0ECB81 0%, #fff 100%)';
            playerEl.classList.add('win-glow');
            this.showToast('Excellent! +1 Point');
        } else if (result === 'loss') {
            this.cpuScore++;
            this.resultText.innerText = 'CPU WINS 🤖';
            this.resultText.style.background = 'linear-gradient(135deg, #F6465D 0%, #fff 100%)';
            cpuEl.classList.add('win-glow');
            this.showToast('Better luck next time!', 'loss');
        } else {
            this.resultText.innerText = 'IT\'S A DRAW! 🤝';
            this.resultText.style.background = 'linear-gradient(135deg, #F0B90B 0%, #fff 100%)';
        }

        this.resultText.style.webkitBackgroundClip = 'text';
        this.pScoreEl.innerText = this.playerScore;
        this.cScoreEl.innerText = this.cpuScore;
    }

    showToast(msg, type = 'win') {
        const toast = document.getElementById('game-toast');
        const msgEl = document.getElementById('toast-msg');
        if (!toast || !msgEl) return;
        
        msgEl.innerText = msg;
        toast.style.background = type === 'win' ? '#0ECB81' : '#F6465D';
        toast.classList.add('toast-visible');

        setTimeout(() => {
            toast.classList.remove('toast-visible');
        }, 2000);
    }
}
