const leverArea = document.getElementById("leverArea");
const leverArm  = document.getElementById("leverArm");

let dragging = false;
let startY = 0;
let pull = 0; // 0..1

const maxPullPx = leverArea.clientHeight - leverArm.clientHeight;
const threshold = 0.8;

const svg = document.getElementById("linkLayer");

const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

line.setAttribute("stroke", "grey");
line.setAttribute("stroke-width", "20");

rect.setAttribute("width", "40");
rect.setAttribute("height", "70");
rect.setAttribute("fill", "grey");

svg.appendChild(line);
svg.appendChild(rect);

function updateLink()
{
    const areaRect  = leverArea.getBoundingClientRect();
    const armRect   = leverArm.getBoundingClientRect();

    // lever arm center
    const armX = armRect.left + armRect.width  / 2 - areaRect.left;
    const armY = armRect.top  + armRect.height / 2 - areaRect.top;

    // center-left of leverArea
    const anchorX = 0;
    const anchorY = areaRect.height / 2;

    line.setAttribute("x1", anchorX);
    line.setAttribute("y1", anchorY);
    line.setAttribute("x2", armX);
    line.setAttribute("y2", armY);

    // small rectangle centered on the anchor
    rect.setAttribute("x", anchorX - 8);
    rect.setAttribute("y", anchorY - 8);
}

function setLever(p) {
    pull = Math.max(0, Math.min(1, p));
    leverArm.style.transform = `translateY(${pull * maxPullPx}px)`;
    updateLink();
}


function resetLever() {
    leverArm.style.transition = "transform 500ms ease-out";
    startTracking();   // keep line in sync while CSS animates
    setLever(0);       // this triggers the CSS transition back
}

// Important for mobile: prevent scroll/pinch while dragging in this area
leverArea.style.touchAction = "none";

leverArea.addEventListener("pointerdown", (e) => {
    dragging = true;
    startY = e.clientY;
    leverArm.style.transition = "none";
    leverArea.setPointerCapture(e.pointerId);
});

leverArea.addEventListener("pointermove", (e) => {
    if (!dragging) return;

    const dy = e.clientY - startY;
    const p = dy / maxPullPx;

    setLever(p);
});

function release() {
    if (!dragging) return;
    dragging = false;

    if (pull >= threshold) {
        start();
    }

    resetLever();
}

let trackingRAF = 0;

function startTracking() {
    cancelAnimationFrame(trackingRAF);

    const tick = () => {
        updateLink();
        trackingRAF = requestAnimationFrame(tick);
    };

    trackingRAF = requestAnimationFrame(tick);
}

function stopTracking() {
    cancelAnimationFrame(trackingRAF);
    trackingRAF = 0;
}

updateLink();
leverArea.addEventListener("pointerup", release);
leverArea.addEventListener("pointercancel", release);
leverArm.addEventListener("transitionend", (e) => {
    if (e.propertyName === "transform") {
        stopTracking();
        updateLink(); // one final snap to be safe
    }
});