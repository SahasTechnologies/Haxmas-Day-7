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

const treeImage = "images/tree.png";
const placements = [];
let maskCanvas = null;
let maskCtx = null;
let maskReady = false;

const random = (min, max) => Math.random() * (max - min) + min;

function clearDecorations() {
    const container = document.getElementById('decorations');
    container.innerHTML = '';
    placements.length = 0;
}

function isOpaque(x, y) {
    if (!maskReady || !maskCtx) return true;
    
    const pixelX = Math.floor(x);
    const pixelY = Math.floor(y);
    
    if (pixelX < 0 || pixelY < 0 || pixelX >= maskCanvas.width || pixelY >= maskCanvas.height) {
        return false;
    }

    const data = maskCtx.getImageData(pixelX, pixelY, 1, 1).data;
    return data[3] > 10;
}

function getPointOnTree() {
    const container = document.getElementById('tree-container');
    const tree = document.getElementById('tree');
    const cRect = container.getBoundingClientRect();
    const tRect = tree.getBoundingClientRect();

    const offsetX = tRect.left - cRect.left;
    const offsetY = tRect.top - cRect.top;

    for (let i = 0; i < 200; i++) {
        const randX = random(0, tRect.width);
        const randY = random(0, tRect.height);

        const maskX = (randX / tRect.width) * maskCanvas.width;
        const maskY = (randY / tRect.height) * maskCanvas.height;

        if (isOpaque(maskX, maskY)) {
            return {
                x: ((offsetX + randX) / cRect.width) * 100,
                y: ((offsetY + randY) / cRect.height) * 100
            };
        }
    }
    return { x: 50, y: 60 };
}

function hasOverlap(point, size, containerRect) {
    const x = (point.x / 100) * containerRect.width;
    const y = (point.y / 100) * containerRect.height;
    const radius = size / 2;

    return placements.some(p => {
        const px = (p.x / 100) * containerRect.width;
        const py = (p.y / 100) * containerRect.height;
        const dist = Math.hypot(x - px, y - py);
        return dist < (radius + (p.size / 2) + 6);
    });
}

function createBauble() {
    const container = document.getElementById('tree-container');
    const cRect = container.getBoundingClientRect();
    const tree = document.getElementById('tree');
    const tRect = tree.getBoundingClientRect();

    const scale = tRect.height > 0 ? (tRect.height / 1120) : 1;
    const size = random(30 * scale, (30 * scale) + 15); // Simple sizing logic

    let position = null;
    for (let i = 0; i < 250; i++) {
        const candidate = getPointOnTree();
        if (!hasOverlap(candidate, size, cRect)) {
            position = candidate;
            break;
        }
    }

    if (!position) return;

    const img = document.createElement('img');
    const src = baubleImages[Math.floor(Math.random() * baubleImages.length)];
    
    img.className = 'ornament';
    img.src = src;
    img.style.width = `${size}px`;
    img.style.height = `${size}px`;
    img.style.left = `${position.x}%`;
    img.style.top = `${position.y}%`;

    const rotation = random(-20, 20);
    img.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;

    img.addEventListener('click', () => {
        let newSrc = src;
        while (newSrc === src) {
            newSrc = baubleImages[Math.floor(Math.random() * baubleImages.length)];
        }
        img.src = newSrc;
        img.style.transform = `translate(-50%, -50%) scale(1.25) rotate(${rotation + 15}deg)`;
        
        setTimeout(() => {
            img.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
        }, 250);
    });

    document.getElementById('decorations').appendChild(img);
    placements.push({ x: position.x, y: position.y, size });
}

function alignStar() {
    if (!maskReady || !maskCtx) return;

    const container = document.getElementById('tree-container');
    const tree = document.getElementById('tree');
    const star = document.getElementById('star');
    const cRect = container.getBoundingClientRect();
    const tRect = tree.getBoundingClientRect();

    const w = maskCanvas.width;
    const h = maskCanvas.height;
    
    let tipX = w / 2;
    let tipY = -1;

    for (let y = 0; y < h; y++) {
        let xSum = 0;
        let count = 0;
        for (let x = 0; x < w; x += 2) {
            if (maskCtx.getImageData(x, y, 1, 1).data[3] > 10) {
                xSum += x;
                count++;
            }
        }
        if (count > 0) {
            tipY = y;
            tipX = xSum / count;
            break;
        }
    }

    if (tipY < 0) return;

    const finalX = (tRect.left - cRect.left) + ((tipX / w) * tRect.width);
    const finalY = (tRect.top - cRect.top) + ((tipY / h) * tRect.height);

    const starH = star.offsetHeight || 0;
    star.style.left = `${finalX}px`;
    star.style.top = `${Math.max(0, finalY - (starH * 0.75))}px`;
}

function runDecoration() {
    clearDecorations();
    const tree = document.getElementById('tree');
    
    if (!tree.complete || !maskReady) {
        setTimeout(runDecoration, 100);
        return;
    }

    const now = new Date();
    const isDec = now.getMonth() === 11;
    const day = now.getDate();
    
    let limit = 12;
    if (isDec) {
        limit = day <= 25 ? (25 - day) : Math.floor(random(10, 26));
    }

    for (let i = 0; i < limit; i++) {
        createBauble();
    }
}

function startCountdown() {
    const el = document.getElementById('countdown');
    if (!el) return;

    const update = () => {
        const now = new Date();
        const year = now.getFullYear();
        let target = new Date(year, 11, 25);
        
        if (now > target) {
            target = new Date(year + 1, 11, 25);
        }

        const diff = target - now;
        if (diff <= 0) {
            el.textContent = 'Merry Christmas!';
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);

        el.textContent = `${d} days ${h} hours ${m} minutes ${s} seconds until Christmas`;
    };

    update();
    setInterval(update, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('loading-overlay');
    const sources = [...new Set([treeImage, ...starImages, ...baubleImages])];

    const promises = sources.map(src => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = reject;
        img.src = src;
    }));

    Promise.all(promises).then(() => {
        document.body.classList.remove('is-preloading');
        if (overlay) overlay.classList.add('hidden');
        init();
    }).catch(() => {
        document.body.classList.remove('is-preloading');
        if (overlay) overlay.classList.add('hidden');
        init();
    });
});

function init() {
    const dateEl = document.getElementById('date');
    dateEl.textContent = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    startCountdown();

    const tree = document.getElementById('tree');
    
    const prepareMask = () => {
        maskCanvas = document.createElement('canvas');
        maskCanvas.width = tree.naturalWidth;
        maskCanvas.height = tree.naturalHeight;
        maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
        maskCtx.drawImage(tree, 0, 0);
        maskReady = true;
        alignStar();
    };

    if (tree.complete) {
        prepareMask();
    } else {
        tree.addEventListener('load', prepareMask);
    }

    window.addEventListener('resize', alignStar);

    const star = document.getElementById('star');
    if (star) {
        star.addEventListener('click', () => {
            star.src = starImages[Math.floor(Math.random() * starImages.length)];
        });
        
        if (star.complete) alignStar();
        else star.addEventListener('load', alignStar);
    }

    const decorateBtn = document.getElementById('decorate-button');
    let decorated = false;
    
    decorateBtn.addEventListener('click', () => {
        if (!decorated) {
            runDecoration();
            decorateBtn.textContent = 'Take it down';
            decorated = true;
        } else {
            clearDecorations();
            decorateBtn.textContent = 'Decorate the Tree!';
            decorated = false;
        }
    });

    const changeStarBtn = document.getElementById('change-star-button');
    changeStarBtn.addEventListener('click', () => {
        const starEl = document.getElementById('star');
        starEl.src = starImages[Math.floor(Math.random() * starImages.length)];
    });

    const creditsBtn = document.getElementById('credits-button');
    const creditsDrop = document.getElementById('credits-dropdown');

    creditsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        creditsDrop.classList.toggle('open');
    });

    document.addEventListener('click', () => {
        creditsDrop.classList.remove('open');
    });

    creditsDrop.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}
