const MODES = {
    focus: { label: "Tập trung", minutes: 25 },
    short: { label: "Nghỉ ngắn", minutes: 5 },
    long: { label: "Nghỉ dài", minutes: 15 },
};

const timeEl = document.getElementById("time");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const modeButtons = document.querySelectorAll("[data-mode]");

let currentMode = "focus";
let remainingSeconds = MODES[currentMode].minutes * 60;
let timerId = null;
let completedSessions = 0;

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function render() {
    const time = formatTime(remainingSeconds);
    timeEl.textContent = time;
    document.title = `${time} - ${MODES[currentMode].label}`;
    modeButtons.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.mode === currentMode);
    });
}

function tick() {
    remainingSeconds -= 1;
    render();
    if (remainingSeconds <= 0) {
        finishSession();
    }
}

function start() {
    if (timerId !== null) return;
    statusEl.textContent = "";
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

function finishSession() {
    stop();
    if (currentMode === "focus") {
        completedSessions += 1;
        countEl.textContent = completedSessions;
        const next = completedSessions % 4 === 0 ? "long" : "short";
        setMode(next);
        statusEl.textContent = `Hết giờ tập trung! Đến lúc ${MODES[next].label.toLowerCase()}.`;
    } else {
        setMode("focus");
        statusEl.textContent = "Hết giờ nghỉ! Quay lại tập trung nào.";
    }
}

render();

document.getElementById("start").addEventListener("click", start);
document.getElementById("pause").addEventListener("click", stop);
document.getElementById("reset").addEventListener("click", () => setMode(currentMode));

modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
});