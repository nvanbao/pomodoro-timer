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
let endTime = null;

const STORAGE_KEY = "pomodoro-sessions";

function todayString() {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
}

function loadSessions() {
    try {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return data && data.date === todayString() ? data.count : 0;
    } catch (error) {
        return 0;
    }
}

function saveSessions(count) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayString(), count }));
    } catch (error) {
        // bỏ qua nếu trình duyệt chặn localStorage
    }
}

let completedSessions = loadSessions();

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
    remainingSeconds = Math.max(0, Math.round((endTime - Date.now()) / 1000));
    render();
    if (remainingSeconds <= 0) {
        finishSession();
    }
}

function start() {
    if (timerId !== null) return;
    statusEl.textContent = "";
    endTime = Date.now() + remainingSeconds * 1000;
    timerId = setInterval(tick, 500);
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
        saveSessions(completedSessions);
        const next = completedSessions % 4 === 0 ? "long" : "short";
        setMode(next);
        statusEl.textContent = `Hết giờ tập trung! Đến lúc ${MODES[next].label.toLowerCase()}.`;
    } else {
        setMode("focus");
        statusEl.textContent = "Hết giờ nghỉ! Quay lại tập trung nào.";
    }
}

render();
countEl.textContent = completedSessions;

document.getElementById("start").addEventListener("click", start);
document.getElementById("pause").addEventListener("click", stop);
document.getElementById("reset").addEventListener("click", () => setMode(currentMode));

modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
});