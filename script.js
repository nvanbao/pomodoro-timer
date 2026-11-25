const MODES = {
    focus: { label: "Tập trung", minutes: 25, max: 120 },
    short: { label: "Nghỉ ngắn", minutes: 5, max: 60 },
    long: { label: "Nghỉ dài", minutes: 15, max: 60 },
};

const timeEl = document.getElementById("time");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const progressEl = document.getElementById("progress-bar");
const modeButtons = document.querySelectorAll("[data-mode]");
const soundToggle = document.getElementById("sound-toggle");
const notificationToggle = document.getElementById("notification-toggle");
const soundTypeSelect = document.getElementById("sound-type");
const testSoundBtn = document.getElementById("test-sound");
const themeToggle = document.getElementById("theme-toggle");
const minuteInputs = {
    focus: document.getElementById("minutes-focus"),
    short: document.getElementById("minutes-short"),
    long: document.getElementById("minutes-long"),
};

const SETTINGS_KEY = "pomodoro-settings";

function loadSettings() {
    try {
        return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
    } catch (error) {
        return {};
    }
}

function saveSettings() {
    const data = {
        sound: soundToggle.checked,
        notification: notificationToggle.checked,
        soundType: soundTypeSelect.value,
    };
    Object.keys(MODES).forEach((mode) => {
        data[mode] = MODES[mode].minutes;
    });
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
    } catch (error) {
        // bỏ qua nếu trình duyệt chặn localStorage
    }
}

function clampMinutes(value, max) {
    const n = Math.round(Number(value));
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.min(n, max);
}

const savedSettings = loadSettings();
Object.keys(MODES).forEach((mode) => {
    if (savedSettings[mode] !== undefined) {
        MODES[mode].minutes = clampMinutes(savedSettings[mode], MODES[mode].max);
    }
    minuteInputs[mode].value = MODES[mode].minutes;
});
soundToggle.checked = savedSettings.sound !== false;
notificationToggle.checked = savedSettings.notification === true;
soundTypeSelect.value = savedSettings.soundType || "beep";

let currentMode = "focus";
let remainingSeconds = MODES[currentMode].minutes * 60;
let totalSeconds = remainingSeconds;
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
    const percent = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
    progressEl.style.width = `${Math.min(100, Math.max(0, percent))}%`;
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
    totalSeconds = remainingSeconds;
    render();
}

function playBeep(force = false) {
    if (!force && !soundToggle.checked) return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContextClass();
        const type = soundTypeSelect ? soundTypeSelect.value : "beep";

        if (type === "chime") {
            const now = ctx.currentTime;
            [587, 880].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                const startAt = now + i * 0.15;
                gain.gain.setValueAtTime(0.2, startAt);
                gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.6);
                osc.start(startAt);
                osc.stop(startAt + 0.6);
            });
        } else if (type === "low") {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "triangle";
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 440;
            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
            osc.start();
            osc.stop(ctx.currentTime + 1.0);
        } else {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
            osc.start();
            osc.stop(ctx.currentTime + 0.8);
        }
    } catch (error) {
        // bỏ qua nếu trình duyệt không hỗ trợ âm thanh
    }
}

function showNotification(title, body) {
    if (!notificationToggle.checked) return;
    if ("Notification" in window && Notification.permission === "granted") {
        try {
            new Notification(title, { body });
        } catch (error) {
            // bỏ qua nếu trình duyệt chặn
        }
    }
}

function finishSession() {
    stop();
    playBeep();
    const cardEl = document.querySelector(".card");
    if (cardEl) {
        cardEl.classList.remove("alert");
        void cardEl.offsetWidth;
        cardEl.classList.add("alert");
        setTimeout(() => cardEl.classList.remove("alert"), 2500);
    }
    if (currentMode === "focus") {
        completedSessions += 1;
        countEl.textContent = completedSessions;
        saveSessions(completedSessions);
        const next = completedSessions % 4 === 0 ? "long" : "short";
        setMode(next);
        const msg = `Hết giờ tập trung! Đến lúc ${MODES[next].label.toLowerCase()}.`;
        statusEl.textContent = msg;
        showNotification("Pomodoro Timer", msg);
    } else {
        setMode("focus");
        const msg = "Hết giờ nghỉ! Quay lại tập trung nào.";
        statusEl.textContent = msg;
        showNotification("Pomodoro Timer", msg);
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

Object.keys(MODES).forEach((mode) => {
    minuteInputs[mode].addEventListener("change", () => {
        MODES[mode].minutes = clampMinutes(minuteInputs[mode].value, MODES[mode].max);
        minuteInputs[mode].value = MODES[mode].minutes;
        saveSettings();
        if (mode === currentMode && timerId === null) setMode(currentMode);
    });
});

soundToggle.addEventListener("change", saveSettings);
soundTypeSelect.addEventListener("change", saveSettings);
testSoundBtn.addEventListener("click", () => playBeep(true));
notificationToggle.addEventListener("change", async () => {
    if (notificationToggle.checked) {
        if ("Notification" in window && Notification.permission !== "granted") {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                notificationToggle.checked = false;
            }
        }
    }
    saveSettings();
});

function toggleTimer() {
    if (timerId === null) {
        start();
    } else {
        stop();
    }
}

document.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const tag = event.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (event.code === "Space" && tag !== "BUTTON") {
        event.preventDefault();
        toggleTimer();
    } else if (event.key === "p" || event.key === "P") {
        toggleTimer();
    } else if (event.key === "r" || event.key === "R") {
        setMode(currentMode);
    } else if (event.key === "1") {
        setMode("focus");
    } else if (event.key === "2") {
        setMode("short");
    } else if (event.key === "3") {
        setMode("long");
    }
});

window.addEventListener("beforeunload", (event) => {
    if (timerId !== null) {
        event.preventDefault();
        event.returnValue = "";
    }
});

const THEME_KEY = "pomodoro-theme";
const savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme === "dark") {
    document.body.classList.add("dark");
} else if (savedTheme === "light") {
    document.body.classList.remove("dark");
}

themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    try {
        localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    } catch (e) {
        // bỏ qua nếu trình duyệt chặn localStorage
    }
});
