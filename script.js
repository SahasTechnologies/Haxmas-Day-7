const starImages = [
    "images/stars/star1.png",
    "images/stars/star2.png",
    "images/stars/star3.png",
    "images/stars/star4.png",
    "images/stars/star5.png",
    "images/stars/star6.png"
];
const baubleImages = [
    "images/ornaments/1.png",
    "images/ornaments/2.png",
    "images/ornaments/3.png",
    "images/ornaments/4.png",
    "images/ornaments/5.png",
    "images/ornaments/6.png",
    "images/ornaments/7.png",
    "images/ornaments/8.png",
    "images/ornaments/9.png",
    "images/ornaments/10.png"
];

let treeMaskCanvas = null;
let treeMaskCtx = null;
let treeMaskReady = false;

function clearDecorations() {
    const decorationsContainer = document.getElementById('decorations');
    decorationsContainer.innerHTML = '';
}

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function isTreePixelOpaque(localX, localY) {
    if (!treeMaskReady || !treeMaskCtx || !treeMaskCanvas) return true;

    const x = Math.floor(localX);
    const y = Math.floor(localY);
    if (x < 0 || y < 0 || x >= treeMaskCanvas.width || y >= treeMaskCanvas.height) return false;

    const data = treeMaskCtx.getImageData(x, y, 1, 1).data;
    const alpha = data[3];
    return alpha > 10;
}

function samplePointOnTreeImage() {
    const container = document.getElementById('tree-container');
    const tree = document.getElementById('tree');
    const containerRect = container.getBoundingClientRect();
    const treeRect = tree.getBoundingClientRect();

    if (containerRect.width === 0 || containerRect.height === 0 || treeRect.width === 0 || treeRect.height === 0) {
        return { xPercent: 50, yPercent: 60 };
    }

    const treeLeft = treeRect.left - containerRect.left;
    const treeTop = treeRect.top - containerRect.top;

    // Try a bunch of random points until we land on a non-transparent pixel.
    for (let i = 0; i < 200; i++) {
        const xInTree = randomBetween(0, treeRect.width);
        const yInTree = randomBetween(0, treeRect.height);

        const localX = (xInTree / treeRect.width) * (treeMaskCanvas ? treeMaskCanvas.width : 1);
        const localY = (yInTree / treeRect.height) * (treeMaskCanvas ? treeMaskCanvas.height : 1);

        if (isTreePixelOpaque(localX, localY)) {
            const xInContainer = treeLeft + xInTree;
            const yInContainer = treeTop + yInTree;

            return {
                xPercent: (xInContainer / containerRect.width) * 100,
                yPercent: (yInContainer / containerRect.height) * 100
            };
        }
    }

    // Fallback (should rarely happen)
    return { xPercent: 50, yPercent: 60 };
}

function addBauble() {
    const decorationsContainer = document.getElementById('decorations');
    const img = document.createElement('img');
    img.className = 'ornament';
    img.alt = 'Bauble ornament';

    const randomImg = baubleImages[Math.floor(Math.random() * baubleImages.length)];
    img.src = randomImg;
    img.dataset.imageSrc = randomImg;

    const { xPercent, yPercent } = samplePointOnTreeImage();
    img.style.left = `${xPercent}%`;
    img.style.top = `${yPercent}%`;

    const tree = document.getElementById('tree');
    const treeRect = tree.getBoundingClientRect();
    const scale = treeRect.height > 0 ? (treeRect.height / 1120) : 1;
    const minSize = Math.max(30, 50 * scale);
    const maxSize = Math.max(minSize + 15, 80 * scale);
    const size = randomBetween(minSize, maxSize);
    img.style.width = `${size}px`;
    img.style.height = `${size}px`;

    const rotation = randomBetween(-20, 20);
    img.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;

    img.addEventListener('click', function () {
        const currentRelativeSrc = this.dataset.imageSrc;
        let newRelativeSrc = currentRelativeSrc;
        while (newRelativeSrc === currentRelativeSrc) {
            newRelativeSrc = baubleImages[Math.floor(Math.random() * baubleImages.length)];
        }
        this.dataset.imageSrc = newRelativeSrc;
        this.src = newRelativeSrc;

        this.style.transform = `translate(-50%, -50%) scale(1.25) rotate(${rotation + 15}deg)`;
        setTimeout(() => {
            this.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
        }, 250);
    });

    decorationsContainer.appendChild(img);
}

function positionStarOnTreeTip() {
    if (!treeMaskReady || !treeMaskCtx || !treeMaskCanvas) return;

    const container = document.getElementById('tree-container');
    const tree = document.getElementById('tree');
    const star = document.getElementById('star');

    const containerRect = container.getBoundingClientRect();
    const treeRect = tree.getBoundingClientRect();

    if (containerRect.width === 0 || containerRect.height === 0 || treeRect.width === 0 || treeRect.height === 0) return;

    // Find the first row (from top) that has any opaque pixels.
    // Then average the x positions of opaque pixels on that row to get the "tip" x.
    const w = treeMaskCanvas.width;
    const h = treeMaskCanvas.height;
    let tipY = -1;
    let tipX = w / 2;

    for (let y = 0; y < h; y++) {
        let sumX = 0;
        let count = 0;

        // Sample every 2 pixels for speed.
        for (let x = 0; x < w; x += 2) {
            const alpha = treeMaskCtx.getImageData(x, y, 1, 1).data[3];
            if (alpha > 10) {
                sumX += x;
                count++;
            }
        }

        if (count > 0) {
            tipY = y;
            tipX = sumX / count;
            break;
        }
    }

    if (tipY < 0) return;

    const containerLeft = containerRect.left;
    const containerTop = containerRect.top;
    const treeLeftInContainer = treeRect.left - containerLeft;
    const treeTopInContainer = treeRect.top - containerTop;

    const tipXInTreePixels = (tipX / w) * treeRect.width;
    const tipYInTreePixels = (tipY / h) * treeRect.height;

    const tipXInContainer = treeLeftInContainer + tipXInTreePixels;
    const tipYInContainer = treeTopInContainer + tipYInTreePixels;

    // Place the star on the tip but clamp it so it never moves above the container.
    const starRect = star.getBoundingClientRect();
    const starHeight = starRect.height || star.naturalHeight || star.offsetHeight || 0;
    const desiredTop = tipYInContainer - starHeight * 0.75;
    const topPx = Math.max(0, desiredTop);

    star.style.left = `${tipXInContainer}px`;
    star.style.top = `${topPx}px`;
}

function decorateTree() {
    clearDecorations();

    const tree = document.getElementById('tree');
    if (!tree.complete || !treeMaskReady) {
        setTimeout(decorateTree, 100);
        return;
    }

    const date = new Date();
    const days = date.getDate();
    const month = date.getMonth() + 1;
    let numOrnaments = 12; // Default for non-December months
    if (month === 12) {
        if (days <= 25) {
            numOrnaments = 25 - days;
        } else {
            // After Dec 25th, spawn a random number of baubles otherwise tbh itll bug out
            numOrnaments = Math.floor(Math.random() * 16) + 10; // Random number between 10 and 25
        }
    }

    for (let i = 0; i < numOrnaments; i++) {
        addBauble();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const date = new Date();
    const dateElement = document.getElementById('date');
    dateElement.textContent = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const countdownElement = document.getElementById('countdown');

    function updateCountdown() {
        if (!countdownElement) return;
        const now = new Date();
        let targetYear = now.getFullYear();
        let target = new Date(targetYear, 11, 25, 0, 0, 0, 0); // December is month 11
        if (now >= target) {
            targetYear += 1;
            target = new Date(targetYear, 11, 25, 0, 0, 0, 0);
        }

        const diffMs = target - now;
        if (diffMs <= 0) {
            countdownElement.textContent = 'Merry Christmas!';
            return;
        }

        const totalSeconds = Math.floor(diffMs / 1000);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        countdownElement.textContent = `${days} days ${hours} hours ${minutes} minutes ${seconds} seconds until Christmas`;
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);

    const tree = document.getElementById('tree');
    tree.addEventListener('load', () => {
        treeMaskCanvas = document.createElement('canvas');
        treeMaskCanvas.width = tree.naturalWidth;
        treeMaskCanvas.height = tree.naturalHeight;
        treeMaskCtx = treeMaskCanvas.getContext('2d', { willReadFrequently: true });
        treeMaskCtx.drawImage(tree, 0, 0);
        treeMaskReady = true;

        positionStarOnTreeTip();
    });

    if (tree.complete) {
        treeMaskCanvas = document.createElement('canvas');
        treeMaskCanvas.width = tree.naturalWidth;
        treeMaskCanvas.height = tree.naturalHeight;
        treeMaskCtx = treeMaskCanvas.getContext('2d', { willReadFrequently: true });
        treeMaskCtx.drawImage(tree, 0, 0);
        treeMaskReady = true;

        positionStarOnTreeTip();
    }

    window.addEventListener('resize', () => {
        positionStarOnTreeTip();
    });

    const star = document.getElementById('star');
    if (star) {
        star.addEventListener('click', () => {
            const randomImg = starImages[Math.floor(Math.random() * starImages.length)];
            star.src = randomImg;
        });
        if (star.complete) {
            positionStarOnTreeTip();
        } else {
            star.addEventListener('load', positionStarOnTreeTip);
        }
    }

    const button = document.getElementById('decorate-button');
    const changeStarButton = document.getElementById('change-star-button');
    let decorated = false;

    changeStarButton.addEventListener('click', () => {
        const star = document.getElementById('star');
        const randomImg = starImages[Math.floor(Math.random() * starImages.length)];
        star.src = randomImg;
    });

    button.addEventListener('click', () => {
        if (!decorated) {
            decorateTree();
            button.textContent = 'Take it down';
            decorated = true;
        } else {
            clearDecorations();
            button.textContent = 'Decorate the Tree!';
            decorated = false;
        }
    });

    const creditsDropdown = document.getElementById('credits-dropdown');
    const creditsButton = document.getElementById('credits-button');

    creditsButton.addEventListener('click', (e) => {
        e.stopPropagation();
        creditsDropdown.classList.toggle('open');
    });

    document.addEventListener('click', () => {
        creditsDropdown.classList.remove('open');
    });

    creditsDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});