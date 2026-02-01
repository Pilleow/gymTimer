const screens = [
    document.getElementById("screen1"), // minutes (0-9)
    document.getElementById("screen2"), // tens of seconds (0-5)
    document.getElementById("screen3"), // ones of seconds (0-9)
];

const startRollSound = new Audio("assets/tiktiktik.mp3");
const endRollSound = new Audio("assets/aw-dangit.mp3");
const ringSound = new Audio("assets/ring.wav");

let spinning = false;
let countdownInterval = null;

// ---------- helpers ----------
function setScreenDigit(screenEl, digit) {
    screenEl.textContent = String(digit);
}

function getTimeFromScreens() {
    const m  = parseInt(screens[0].textContent ?? "0", 10) || 0;
    const t  = parseInt(screens[1].textContent ?? "0", 10) || 0;
    const o  = parseInt(screens[2].textContent ?? "0", 10) || 0;

    // enforce ranges
    const minutes = clamp(m, 0, 2);
    const tens    = clamp(t, 0, 5);
    const ones    = clamp(o, 0, 9);

    return minutes * 60 + (tens * 10 + ones);
}

function setTimeToScreens(totalSeconds) {
    totalSeconds = Math.max(0, totalSeconds);

    const minutes = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;

    const tens = Math.floor(sec / 10);
    const ones = sec % 10;

    setScreenDigit(screens[0], clamp(minutes, 0, 2));
    setScreenDigit(screens[1], clamp(tens, 0, 5));
    setScreenDigit(screens[2], clamp(ones, 0, 9));
}

function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
}

function ring() {
    ringSound.currentTime = 0;
    // This will work reliably because start() is triggered by a user gesture (lever pull)
    ringSound.play();
}

// ---------- "roll" logic ----------
function randInt(min, maxInclusive) {
    return Math.floor(Math.random() * (maxInclusive - min + 1)) + min;
}

// During rolling we show random *valid* timer digits
function randomValidTimeDigits() {
    const minutes = randInt(0, 2);
    const tens    = randInt(0, 5);
    const ones    = randInt(0, 9);
    return [minutes, tens, ones];
}

function spinTick() {
    const [m, t, o] = randomValidTimeDigits();
    setScreenDigit(screens[0], m);
    setScreenDigit(screens[1], t);
    setScreenDigit(screens[2], o);
}

// ---------- countdown ----------
function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

function startCountdownFromScreens() {
    stopCountdown();

    let remaining = getTimeFromScreens();

    // If it rolled to 0:00, ring immediately and stop
    if (remaining <= 0) {
        setTimeToScreens(0);
        ring();
        return;
    }

    countdownInterval = setInterval(() => {
        console.log(remaining)
        remaining -= 1;
        setTimeToScreens(remaining);

        if (remaining <= 0) {
            stopCountdown();
            ring();
        }
    }, 1000);
}

// ---------- public: called by lever ----------
function start() {
    if (spinning) return;

    // If you pull again, reset any previous countdown
    stopCountdown();
    startRollSound.volume = 0.9;
    startRollSound.play()

    spinning = true;

    const durationMs = Math.random() * 1000 + 500; // how long it "rolls"
    const intervalMs = 60;

    const endAt = performance.now() + durationMs;

    const timer = setInterval(() => {
        spinTick();

        if (performance.now() >= endAt) {
            clearInterval(timer);

            // Final "settle" to a valid time:
            spinTick();
            setScreenDigit(screens[0], 2);

            spinning = false;

            // Now the rolled digits become the countdown length:
            endRollSound.volume = .6;
            endRollSound.play()
            startCountdownFromScreens();
        }
    }, intervalMs);
}

// Optional: initialize to 0:00 on load
setTimeToScreens(0);


const introSound = new Audio("assets/intro.mp3");
loadScreen.addEventListener("click", () => {
    loadScreen.classList.add("play");
    introSound.play();
}, { once: true });