const MODES = {
    focus: { label: "Tập trung", minutes: 25 },
    short: { label: "Nghỉ ngắn", minutes: 5 },
    long: { label: "Nghỉ dài", minutes: 15 },
};

const timeEl = document.getElementById("time");
const modeButtons = document.querySelectorAll("[data-mode]");

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
    modeButtons.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.mode === currentMode);
    });
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

function setMode(mode) {
    stop();
    currentMode = mode;
    remainingSeconds = MODES[mode].minutes * 60;
    render();
}

render();

document.getElementById("start").addEventListener("click", start);
document.getElementById("pause").addEventListener("click", stop);
document.getElementById("reset").addEventListener("click", () => setMode(currentMode));

modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
});