const MODES = {
    focus: { label: "Tập trung", minutes: 25 },
    short: { label: "Nghỉ ngắn", minutes: 5 },
    long: { label: "Nghỉ dài", minutes: 15 },
};

const timeEl = document.getElementById("time");

let currentMode = "focus";
let remainingSeconds = MODES[currentMode].minutes * 60;
let timerId = null;

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function render() {
    timeEl.textContent = formatTime(remainingSeconds);
}

function tick() {
    remainingSeconds -= 1;
    render();
    if (remainingSeconds <= 0) {
        stop();
    }
}

function start() {
    if (timerId !== null) return;
    timerId = setInterval(tick, 1000);
}

function stop() {
    clearInterval(timerId);
    timerId = null;
}

render();

document.getElementById("start").addEventListener("click", start);
document.getElementById("pause").addEventListener("click", stop);