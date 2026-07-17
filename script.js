// ---------- 常量 SVG 图标 ----------
const DEFAULT_COVER_SVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23ffffff" rx="8"/%3E%3Ccircle cx="50" cy="42" r="14" fill="none" stroke="%23333333" stroke-width="2.5"/%3E%3Ccircle cx="50" cy="42" r="4" fill="%23333333"/%3E%3Cpath d="M 28 65 L 28 88" stroke="%23333333" stroke-width="2.5" fill="none" stroke-linecap="round"/%3E%3Ccircle cx="28" cy="88" r="4" fill="%23333333"/%3E%3Cpath d="M 28 75 Q 28 68 40 68 L 72 68" stroke="%23333333" stroke-width="2.5" fill="none" stroke-linecap="round"/%3E%3Ccircle cx="72" cy="88" r="4" fill="%23333333"/%3E%3C/svg%3E';

const DEFAULT_ALBUM_SVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%232c2e3a" rx="8"/%3E%3Ccircle cx="50" cy="50" r="30" fill="none" stroke="%23cbbfaa" stroke-width="2"/%3E%3Ccircle cx="50" cy="50" r="18" fill="none" stroke="%23cbbfaa" stroke-width="1.5"/%3E%3Ccircle cx="50" cy="50" r="6" fill="%23cbbfaa"/%3E%3C/svg%3E';

const SVG_PLAY = '<svg viewBox="0 0 24 24"><polygon points="7 4 20 12 7 20 7 4" stroke="currentColor" stroke-width="2" fill="currentColor"/></svg>';
const SVG_PAUSE = '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" stroke="currentColor" stroke-width="0" fill="currentColor"/><rect x="14" y="4" width="4" height="16" stroke="currentColor" stroke-width="0" fill="currentColor"/></svg>';
const SVG_ADD = '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
const SVG_CHECK = '<svg viewBox="0 0 24 24"><polyline points="5 12 10 17 19 7" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>';
const SVG_DELETE = '<svg viewBox="0 0 24 24"><path d="M 6 7 L 6 20 Q 6 22 8 22 L 16 22 Q 18 22 18 20 L 18 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="4" y1="7" x2="20" y2="7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><line x1="10" y1="11" x2="10" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="14" y1="11" x2="14" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M 9 7 L 9 4 Q 9 3 10 3 L 14 3 Q 15 3 15 4 L 15 7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const SVG_SPEAKER = '<svg viewBox="0 0 24 24"><path d="M 4 9 L 4 15 L 8 15 L 13 20 L 13 4 L 8 9 Z" stroke="currentColor" stroke-width="2" fill="currentColor" stroke-linejoin="round"/><path d="M 16 8 Q 19 12 16 16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';

// 带样式的内联小图标（用于按钮文本前）
const ICON_PLAY_SM = '<svg viewBox="0 0 24 24" style="display:inline-block;vertical-align:middle;width:16px;height:16px;margin-right:4px;"><polygon points="7 4 20 12 7 20 7 4" stroke="currentColor" stroke-width="2" fill="currentColor"/></svg>';
const SVG_SEARCH_SM = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" fill="none"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2"/></svg>';
const DEFAULT_ARTIST_SVG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%232c2e3a" rx="8"/%3E%3Ccircle cx="50" cy="38" r="15" fill="none" stroke="%23cbbfaa" stroke-width="2.5"/%3E%3Cpath d="M 28 88 Q 28 65 50 65 Q 72 65 72 88" stroke="%23cbbfaa" stroke-width="2.5" fill="none" stroke-linecap="round"/%3E%3C/svg%3E';

// ---------- 歌词解析 ----------
function parseLyricsFull(content) {
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    let songName = "未知歌曲",
        artistAlbum = "未知艺术家";
    if (lines.length >= 1) songName = lines[0].trim();
    if (lines.length >= 2) artistAlbum = lines[1].trim();
    const timeline = [];
    let currentAlign = "left";
    let currentSinger = "";
    for (let line of lines) {
        let dirMatch = line.match(/^\[(left|right|all|center)\]\s*(.*?)[：:]\s*$/);
        if (dirMatch) {
            const dir = dirMatch[1];
            let singerRaw = dirMatch[2].trim();
            if (dir === "left") { currentAlign = "left";
                currentSinger = singerRaw || ""; } else if (dir === "right") { currentAlign = "right";
                currentSinger = singerRaw || ""; } else if (dir === "all" || dir === "center") { currentAlign = "center";
                currentSinger = ""; }
            continue;
        }
        let otherMatch = line.match(/^\[other\]\s*(.*?)[：:]\s*$/);
        if (otherMatch) {
            currentAlign = "left";
            currentSinger = otherMatch[1].trim() || "";
            continue;
        }
        const regex = /(?:\[)?(\d{1,2}):(\d{1,2})\.(\d{1,6})(?:\])?\s*(.+)/;
        const m = line.match(regex);
        if (m) {
            const minutes = parseInt(m[1], 10);
            const seconds = parseInt(m[2], 10);
            let msStr = m[3];
            let millis = parseInt(msStr, 10);
            if (isNaN(millis)) millis = 0;
            else if (msStr.length === 1) millis *= 100;
            else if (msStr.length === 2) millis *= 10;
            let text = m[4].trim();
            if (text) {
                const timeSec = minutes * 60 + seconds + millis / 1000;
                timeline.push({ time: parseFloat(timeSec.toFixed(3)), text, align: currentAlign, singer: currentSinger });
            }
        }
    }
    timeline.sort((a, b) => a.time - b.time);
    return { songName, artistAlbum, timeline };
}

// ---------- Web Audio 均衡器 (8段) ----------
let audioCtx = null,
    sourceNode = null,
    gainNode = null,
    analyserNode = null;
let filters = [];
let surroundEnabled = false;
let pannerNode = null;
let surroundAnim = null;
let surroundTime = 0;
let beatAnimationId = null;

const eqFreqs = [60, 150, 400, 1000, 2400, 6000, 10000, 16000];
let eqValues = [0, 0, 0, 0, 0, 0, 0, 0];

function initAudioContext() {
    if (!audioCtx && window.AudioContext) {
        audioCtx = new(window.AudioContext || window.webkitAudioContext)();
        gainNode = audioCtx.createGain();
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 256;
        for (let i = 0; i < eqFreqs.length; i++) {
            let filter = audioCtx.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = eqFreqs[i];
            filter.Q.value = 1;
            filter.gain.value = eqValues[i];
            filters.push(filter);
        }
        if (filters.length) {
            let prev = filters[0];
            for (let i = 1; i < filters.length; i++) {
                filters[i - 1].connect(filters[i]);
            }
            filters[filters.length - 1].connect(analyserNode);
            analyserNode.connect(gainNode);
        }
        gainNode.connect(audioCtx.destination);
    }
}

function applyEQ() {
    if (!filters.length) return;
    for (let i = 0; i < filters.length; i++) {
        filters[i].gain.value = eqValues[i];
    }
}

function setupSurround() {
    if (!audioCtx) return;
    if (surroundEnabled) {
        if (!pannerNode) {
            pannerNode = audioCtx.createStereoPanner();
            pannerNode.pan.value = 0;
        }
        if (filters.length) {
            filters[filters.length - 1].disconnect();
            filters[filters.length - 1].connect(pannerNode);
            pannerNode.connect(gainNode);
        } else {
            if (sourceNode) sourceNode.disconnect();
            try { if (!sourceNode || !sourceNode.mediaElement) sourceNode = audioCtx.createMediaElementSource(audio); } catch(e) {}
            if (sourceNode) { sourceNode.connect(pannerNode); pannerNode.connect(gainNode); }
        }
        startSurroundAnimation();
    } else {
        if (pannerNode) {
            pannerNode.disconnect();
            if (filters.length) {
                filters[filters.length - 1].disconnect();
                filters[filters.length - 1].connect(gainNode);
            } else if (sourceNode) {
                sourceNode.disconnect();
                try { if (!sourceNode.mediaElement) sourceNode = audioCtx.createMediaElementSource(audio); } catch(e) {}
                if (sourceNode) sourceNode.connect(gainNode);
            }
        }
        if (surroundAnim) cancelAnimationFrame(surroundAnim);
    }
}

function startSurroundAnimation() {
    if (surroundAnim) cancelAnimationFrame(surroundAnim);
    if (!surroundEnabled || !pannerNode) return;

    function animate() {
        if (!surroundEnabled || !pannerNode || !audioCtx || !audioCtx.destination) return;
        surroundTime += 0.016;
        const pan = Math.sin(surroundTime * 0.8) * 0.6;
        pannerNode.pan.value = pan;
        surroundAnim = requestAnimationFrame(animate);
    }
    animate();
}

function connectEQToAudio() {
    if (!audioCtx) return;
    try {
        if (!sourceNode || !sourceNode.mediaElement) {
            sourceNode = audioCtx.createMediaElementSource(audio);
        }
    } catch(e) {}
    if (!sourceNode) return;
    sourceNode.disconnect();
    if (filters.length) {
        sourceNode.connect(filters[0]);
    } else {
        sourceNode.connect(gainNode);
    }
    if (surroundEnabled && pannerNode) {
        if (filters.length) {
            filters[filters.length - 1].disconnect();
            filters[filters.length - 1].connect(pannerNode);
            pannerNode.connect(gainNode);
        } else {
            sourceNode.disconnect();
            sourceNode.connect(pannerNode);
            pannerNode.connect(gainNode);
        }
    }
    gainNode.gain.value = userSettings.volume / 100;
}

// 预设
const presets = {
    flat: [0, 0, 0, 0, 0, 0, 0, 0],
    pop: [2, 3, 4, 3, 2, 1, 0, 0],
    classical: [2, 3, 4, 4, 3, 2, 1, 1],
    bassBoost: [6, 5, 4, 0, 0, 0, 0, 0],
    trebleBoost: [0, 0, 0, 0, 2, 4, 5, 6],
    bassCut: [-4, -3, -2, 0, 0, 0, 0, 0],
    trebleCut: [0, 0, 0, 0, -2, -3, -4, -5],
    guitar: [3, 2, 1, 2, 3, 4, 3, 2],
    vocalClear: [-11, -9, -2, 12, -12, 12, 4, 9]
};

function applyPreset(name) {
    const vals = presets[name];
    if (vals) {
        for (let i = 0; i < eqValues.length; i++) eqValues[i] = vals[i];
        for (let i = 0; i < eqSliders.length; i++) {
            eqSliders[i].value = eqValues[i];
            eqValuesDisplay[i].innerText = eqValues[i];
        }
        applyEQ();
        saveSettings();
    }
}

function resetEQ() {
    eqValues.fill(0);
    for (let i = 0; i < eqSliders.length; i++) {
        eqSliders[i].value = 0;
        eqValuesDisplay[i].innerText = 0;
    }
    applyEQ();
    saveSettings();
}

let eqSliders = [],
    eqValuesDisplay = [];

function buildEQGrid() {
    const container = document.getElementById('eqGrid');
    container.innerHTML = '';
    for (let i = 0; i < eqFreqs.length; i++) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'eq-item';
        const label = document.createElement('div');
        label.className = 'eq-label';
        label.innerText = eqFreqs[i] + 'Hz';
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = -12;
        slider.max = 12;
        slider.step = 1;
        slider.value = eqValues[i];
        slider.classList.add('eq-slider-vertical');
        // 垂直滑块属性
        slider.style.height = '100px';
        slider.style.width = '6px';
        const valueSpan = document.createElement('span');
        valueSpan.className = 'eq-value';
        valueSpan.innerText = eqValues[i];
        slider.addEventListener('input', (idx => (e) => {
            eqValues[idx] = parseInt(e.target.value);
            valueSpan.innerText = eqValues[idx];
            applyEQ();
            saveSettings();
        })(i));
        itemDiv.appendChild(label);
        itemDiv.appendChild(slider);
        itemDiv.appendChild(valueSpan);
        container.appendChild(itemDiv);
        eqSliders.push(slider);
        eqValuesDisplay.push(valueSpan);
    }
}

// ---------- 播放器核心 ----------
let playlist = [],
    currentSongId = null;
let isPlaying = false,
    animFrame = null,
    isRepeat = false;
let audio = new Audio();
let userSettings = {
    volume: 80,
    lyricFontSize: 22,
    lyricOffset: 80,
    renderQuality: "high",
    idleTimeout: 0,
    surround: false,
    eqValues: [0, 0, 0, 0, 0, 0, 0, 0]
};
let idleTimer = null;
let isScrolling = false;
let scrollRestoreTimer = null;
let isAutoScrolling = false; // 标记是否正在自动滚动
let isMouseOverLyrics = false; // 标记鼠标是否悬停在歌词区域

// SVG 图标常量
const PLAY_ICON = '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" stroke-width="2" fill="currentColor"/></svg>';
const PAUSE_ICON = '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none"/></svg>';

// DOM 元素引用
const fsCoverImg = document.getElementById('fullscreenCoverImg'),
    fsSongTitle = document.getElementById('fullscreenSongTitle'),
    fsArtist = document.getElementById('fullscreenArtist');
const fsPlayPause = document.getElementById('fullscreenPlayPause'),
    fsPrevBtn = document.getElementById('fullscreenPrevBtn'),
    fsNextBtn = document.getElementById('fullscreenNextBtn');
const fsProgressFill = document.getElementById('fullscreenProgressFill'),
    fsProgressBg = document.getElementById('fullscreenProgressBg'),
    fsCurrentTime = document.getElementById('fullscreenCurrentTime'),
    fsDuration = document.getElementById('fullscreenDuration'),
    fullscreenProgressThumb = document.getElementById('fullscreenProgressThumb');
const fsRepeatBtn = document.getElementById('fullscreenRepeatBtn'),
    fsMenuBtn = document.getElementById('fullscreenMenuBtn'),
    fsLyricsList = document.getElementById('fullscreenLyricsList'),
    fsLyricsScroll = document.getElementById('fullscreenLyricsScroll');
const mobileCoverImg = document.getElementById('mobileCoverImg'),
    mobileSongTitle = document.getElementById('mobileSongTitle'),
    mobileArtist = document.getElementById('mobileArtist');
const mobilePlayPause = document.getElementById('mobilePlayPause'),
    mobilePrevBtn = document.getElementById('mobilePrevBtn'),
    mobileNextBtn = document.getElementById('mobileNextBtn');
const mobileProgressFill = document.getElementById('mobileProgressFill'),
    mobileProgressBg = document.getElementById('mobileProgressBg'),
    mobileCurrentTime = document.getElementById('mobileCurrentTime'),
    mobileDuration = document.getElementById('mobileDuration'),
    mobileProgressThumb = document.getElementById('mobileProgressThumb');
const mobileRepeatBtn = document.getElementById('mobileRepeatBtn'),
    mobileMenuBtn = document.getElementById('mobileMenuBtn'),
    mobileLyricsList = document.getElementById('mobileLyricsList'),
    mobileLyricsContainer = document.getElementById('mobileLyricsContainer');
const dynamicBg = document.getElementById('dynamicBg'),
    bgOverlay = document.getElementById('bgOverlay'),
    appContainer = document.getElementById('playerApp');
const playlistModal = document.getElementById('playlistManagerModal'),
    closePlaylistModalBtn = document.getElementById('closePlaylistModalBtn');
const playlistModalList = document.getElementById('playlistModalList');
const openSettingsBtn = document.getElementById('openSettingsBtn'),
    backFromSettingsBtn = document.getElementById('backFromSettingsBtn');
const mainPanelDiv = document.getElementById('mainPanel'),
    settingsPanelDiv = document.getElementById('settingsPanel');
const volumeSlider = document.getElementById('volumeSlider'),
    lyricFontSizeSlider = document.getElementById('lyricFontSize'),
    lyricOffsetSlider = document.getElementById('lyricOffset');
const renderQualitySelect = document.getElementById('renderQuality'),
    idleTimeoutInput = document.getElementById('idleTimeout');
const surroundToggle = document.getElementById('surroundToggle');

function formatTime(sec) { if (isNaN(sec)) return "0:00"; const m = Math.floor(sec / 60),
        s = Math.floor(sec % 60); return `${m}:${s < 10 ? '0' + s : s}`; }

function updateBackgroundFromCover(src) {
    if (!src) return;
    dynamicBg.style.backgroundImage = `url('${src}')`;
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 50, 50);
        const data = ctx.getImageData(0, 0, 50, 50).data;
        let r = 0,
            g = 0,
            b = 0,
            count = 0;
        for (let i = 0; i < data.length; i += 4) { r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++; }
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);
        bgOverlay.style.background = `linear-gradient(135deg, rgba(0,0,0,0.7), rgba(${r},${g},${b},0.68))`;
    };
    img.src = src;
}

let currentLyricsTimeline = [],
    fsDomItems = [],
    mobileDomItems = [],
    lastFsIdx = -1,
    lastMobileIdx = -1;

function renderBothPanels() {
    fsLyricsList.innerHTML = '';
    mobileLyricsList.innerHTML = '';
    fsDomItems = [];
    mobileDomItems = [];
    let structured = [];
    for (let i = 0; i < currentLyricsTimeline.length; i++) {
        structured.push({ type: 'lyric', ...currentLyricsTimeline[i] });
        if (i < currentLyricsTimeline.length - 1 && currentLyricsTimeline[i + 1].time - currentLyricsTimeline[i].time >= 10) {
            const nextAlign = currentLyricsTimeline[i + 1].align; // 获取下一句的对齐方式
            structured.push({ type: 'interlude', start: currentLyricsTimeline[i].time, end: currentLyricsTimeline[i + 1].time, nextAlign: nextAlign });
        }
    }
    structured.forEach(item => {
        if (item.type === 'lyric') {
            const fsDiv = document.createElement('div');
            fsDiv.className = `fs-lyric-item ${item.align}`;
            fsDiv.setAttribute('data-time', item.time);
            fsDiv.onclick = () => { if (audio && !isNaN(item.time)) audio.currentTime = item.time;
                onUserInteraction(); };
            let singerHtml = (item.singer && item.align !== 'center') ? `<span class="fs-singer-name">${escapeHtml(item.singer)}</span>` : '';
            if (item.align === 'right') fsDiv.innerHTML = `${singerHtml}<span class="fs-lyric-text-wrapper"><span class="fs-lyric-text">${escapeHtml(item.text)}</span></span>`;
            else fsDiv.innerHTML = `<span class="fs-lyric-text-wrapper"><span class="fs-lyric-text">${escapeHtml(item.text)}</span></span>${singerHtml}`;
            fsLyricsList.appendChild(fsDiv);
            fsDomItems.push({ el: fsDiv, type: 'lyric', time: item.time });
            const mobDiv = document.createElement('div');
            mobDiv.className = `lyric-item upcoming ${item.align}`;
            mobDiv.setAttribute('data-time', item.time);
            mobDiv.onclick = () => { if (audio && !isNaN(item.time)) audio.currentTime = item.time;
                onUserInteraction(); };
            let mobSingerHtml = (item.singer && item.align !== 'center') ? `<span class="singer-name">${escapeHtml(item.singer)}</span>` : '';
            if (item.align === 'right') mobDiv.innerHTML = `${mobSingerHtml}<span class="lyric-text-wrapper"><span class="lyric-text">${escapeHtml(item.text)}</span></span>`;
            else mobDiv.innerHTML = `<span class="lyric-text-wrapper"><span class="lyric-text">${escapeHtml(item.text)}</span></span>${mobSingerHtml}`;
            mobileLyricsList.appendChild(mobDiv);
            mobileDomItems.push({ el: mobDiv, type: 'lyric', time: item.time });
        } else if (item.type === 'interlude') {
            // 根据下一句的对齐方式决定呼吸点位置
            let fsDotClass = 'fs-interlude-dots hidden';
            let mobDotClass = 'interlude-dots hidden';
            if (item.nextAlign === 'right') {
                fsDotClass += ' right';
                mobDotClass += ' right';
            } else if (item.nextAlign === 'center') {
                fsDotClass += ' center';
                mobDotClass += ' center';
            }
            const fsInter = document.createElement('div');
            fsInter.className = fsDotClass;
            fsInter.innerHTML = `<div class="fs-dot"></div><div class="fs-dot"></div><div class="fs-dot"></div><span style="margin-left:6px;font-size:0.7rem;"></span>`;
            fsInter.setAttribute('data-start', item.start);
            fsInter.setAttribute('data-end', item.end);
            fsLyricsList.appendChild(fsInter);
            fsDomItems.push({ el: fsInter, type: 'interlude', start: item.start, end: item.end });

            const mobInter = document.createElement('div');
            mobInter.className = mobDotClass;
            mobInter.innerHTML = `<div class="dot"></div><div class="dot"></div><div class="dot"></div><span style="margin-left:6px;font-size:0.7rem;"></span>`;
            mobInter.setAttribute('data-start', item.start);
            mobInter.setAttribute('data-end', item.end);
            mobileLyricsList.appendChild(mobInter);
            mobileDomItems.push({ el: mobInter, type: 'interlude', start: item.start, end: item.end });
        }
    });
    applyLyricFontSize();
}

function updateUIByPlaybackTime(currentSec) {
    // 优化：只更新需要变化的元素，避免全量遍历
    
    // 桌面端歌词更新
    let fsActiveIdx = -1;
    // 如果时间为0，默认选中第一行歌词
    if (currentSec <= 0 && fsDomItems.length > 0) {
        for (let i = 0; i < fsDomItems.length; i++) {
            if (fsDomItems[i].type === 'lyric') {
                fsActiveIdx = i;
                break;
            }
        }
    } else {
        for (let i = fsDomItems.length - 1; i >= 0; i--) {
            if (fsDomItems[i].type === 'lyric' && fsDomItems[i].time <= currentSec) {
                fsActiveIdx = i;
                break;
            }
        }
    }
    
    // 更新所有桌面端歌词的模糊状态 - 从当前行扩散，越远越模糊
    fsDomItems.forEach((item, idx) => {
        if (item.type !== 'lyric') return;
        const el = item.el;
        // 滚动时取消所有模糊效果
        if (isScrolling) {
            el.style.filter = 'none';
            el.style.opacity = '';
            return;
        }
        // 根据与当前播放行的距离计算模糊程度
        const distance = fsActiveIdx >= 0 ? Math.abs(idx - fsActiveIdx) : 999;
        // 当前播放的歌词不模糊
        if (distance === 0) {
            el.style.filter = 'none';
            el.style.opacity = '';
        } else {
            // 距离越远越模糊，最大模糊5px
            const blurAmount = Math.min(distance * 0.8, 5);
            el.style.filter = `blur(${blurAmount}px)`;
            el.style.opacity = Math.max(1 - distance * 0.12, 0.2);
        }
    });
    
    // 更新歌词状态
    if (fsActiveIdx !== lastFsIdx) {
        // 重置所有歌词状态，然后重新设置
        fsDomItems.forEach((item, idx) => {
            if (item.type !== 'lyric') return;
            const el = item.el;
            if (idx === fsActiveIdx) {
                // 当前歌词
                el.classList.remove('sung', 'upcoming');
                el.classList.add('active');
                // 添加刷新动画
                el.classList.remove('refresh');
                void el.offsetWidth; // 触发重排
                el.classList.add('refresh');
                setTimeout(() => { el.classList.remove('refresh'); }, 500);
            } else if (idx < fsActiveIdx) {
                // 已唱过的歌词（在当前歌词之前）
                el.classList.remove('active', 'upcoming', 'refresh');
                el.classList.add('sung');
            } else {
                // 未唱的歌词（在当前歌词之后）
                el.classList.remove('active', 'sung', 'refresh');
                el.classList.add('upcoming');
            }
        });
        // 滚动时不自动滚动歌词
        if (fsActiveIdx >= 0 && !isScrolling && fsLyricsScroll) {
            isAutoScrolling = true;
            const newEl = fsDomItems[fsActiveIdx].el;
            const containerRect = fsLyricsScroll.getBoundingClientRect();
            const elementRect = newEl.getBoundingClientRect();
            const offset = elementRect.top - (containerRect.top + containerRect.height / 2 - userSettings.lyricOffset);
            fsLyricsScroll.scrollBy({ top: offset, behavior: 'smooth' });
            setTimeout(() => { isAutoScrolling = false; }, 500);
        }
        lastFsIdx = fsActiveIdx;
    }
    
    // 移动端歌词更新
    let mobileActiveIdx = -1;
    // 如果时间为0，默认选中第一行歌词
    if (currentSec <= 0 && mobileDomItems.length > 0) {
        for (let i = 0; i < mobileDomItems.length; i++) {
            if (mobileDomItems[i].type === 'lyric') {
                mobileActiveIdx = i;
                break;
            }
        }
    } else {
        for (let i = mobileDomItems.length - 1; i >= 0; i--) {
            if (mobileDomItems[i].type === 'lyric' && mobileDomItems[i].time <= currentSec) {
                mobileActiveIdx = i;
                break;
            }
        }
    }
    
    // 更新所有移动端歌词的模糊状态 - 从当前行扩散，越远越模糊
    mobileDomItems.forEach((item, idx) => {
        if (item.type !== 'lyric') return;
        const el = item.el;
        // 滚动时取消所有模糊效果
        if (isScrolling) {
            el.style.filter = 'none';
            el.style.opacity = '';
            return;
        }
        // 根据与当前播放行的距离计算模糊程度
        const distance = mobileActiveIdx >= 0 ? Math.abs(idx - mobileActiveIdx) : 999;
        // 当前播放的歌词不模糊
        if (distance === 0) {
            el.style.filter = 'none';
            el.style.opacity = '';
        } else {
            // 距离越远越模糊，最大模糊4px（移动端稍微弱一点）
            const blurAmount = Math.min(distance * 0.6, 4);
            el.style.filter = `blur(${blurAmount}px)`;
            el.style.opacity = Math.max(1 - distance * 0.1, 0.25);
        }
    });
    
    if (mobileActiveIdx !== lastMobileIdx) {
        // 重置所有歌词状态，然后重新设置
        mobileDomItems.forEach((item, idx) => {
            if (item.type !== 'lyric') return;
            const el = item.el;
            if (idx === mobileActiveIdx) {
                // 当前歌词
                el.classList.remove('sung', 'upcoming');
                el.classList.add('active');
                // 添加刷新动画
                el.classList.remove('refresh');
                void el.offsetWidth; // 触发重排
                el.classList.add('refresh');
                setTimeout(() => { el.classList.remove('refresh'); }, 400);
            } else if (idx < mobileActiveIdx) {
                // 已唱过的歌词（在当前歌词之前）
                el.classList.remove('active', 'upcoming', 'refresh');
                el.classList.add('sung');
            } else {
                // 未唱的歌词（在当前歌词之后）
                el.classList.remove('active', 'sung', 'refresh');
                el.classList.add('upcoming');
            }
        });
        // 滚动时不自动滚动歌词
        if (mobileActiveIdx >= 0 && !isScrolling) {
            isAutoScrolling = true;
            const newEl = mobileDomItems[mobileActiveIdx].el;
            requestAnimationFrame(() => {
                const cr = mobileLyricsContainer.getBoundingClientRect();
                const er = newEl.getBoundingClientRect();
                const offset = er.top - (cr.top + cr.height / 2 - userSettings.lyricOffset);
                mobileLyricsContainer.scrollBy({ top: offset, behavior: 'smooth' });
                setTimeout(() => { isAutoScrolling = false; }, 500);
            });
        }
        lastMobileIdx = mobileActiveIdx;
    }
    
    // 间奏点更新（使用 requestAnimationFrame 节流）
    if (!updateInterludeTimer) {
        updateInterludeTimer = requestAnimationFrame(() => {
            fsDomItems.forEach(it => {
                if (it.type === 'interlude') {
                    const inRange = currentSec >= it.start && currentSec <= it.end;
                    it.el.classList.toggle('hidden', !inRange);
                }
            });
            mobileDomItems.forEach(it => {
                if (it.type === 'interlude') {
                    const inRange = currentSec >= it.start && currentSec <= it.end;
                    it.el.classList.toggle('hidden', !inRange);
                }
            });
            updateInterludeTimer = null;
        });
    }
}
let updateInterludeTimer = null;

function updateProgressAndTime() {
    if (!audio.duration || !isPlaying) return;
    const p = audio.currentTime / audio.duration * 100;
    fsProgressFill.style.width = p + '%';
    mobileProgressFill.style.width = p + '%';
    // 更新滑块位置
    if (fullscreenProgressThumb) fullscreenProgressThumb.style.left = p + '%';
    if (mobileProgressThumb) mobileProgressThumb.style.left = p + '%';
    fsCurrentTime.textContent = formatTime(audio.currentTime);
    mobileCurrentTime.textContent = formatTime(audio.currentTime);
    if (formatTime(audio.duration) !== fsDuration.textContent) {
        fsDuration.textContent = formatTime(audio.duration);
        mobileDuration.textContent = formatTime(audio.duration);
    }
    updateUIByPlaybackTime(audio.currentTime);
}

function startAnimation() {
    if (animFrame) cancelAnimationFrame(animFrame);
    let lastTime = 0;
    const tick = (currentTime) => {
        if (!isPlaying) return;
        // 控制更新频率，避免过度更新
        if (currentTime - lastTime >= 16) { // ~60fps
            updateProgressAndTime();
            lastTime = currentTime;
        }
        animFrame = requestAnimationFrame(tick);
    };
    animFrame = requestAnimationFrame(tick);
}

function togglePlayPause() {
    onUserInteraction();
    if (isPlaying) {
        audio.pause();
        isPlaying = false;
        fsPlayPause.innerHTML = PLAY_ICON;
        mobilePlayPause.innerHTML = PLAY_ICON;
        updateSidebarPlayerState(false);
        if (animFrame) cancelAnimationFrame(animFrame);
        animFrame = null;
        stopBeatAnimation();
    } else {
        if (!audio.src && playlist.length === 0) { showPlaylistModal(); return; }
        if (!audio.src && playlist.length > 0) { playSongById(playlist[playlist.length - 1].id, true); return; }
        audio.play().then(() => { isPlaying = true;
            fsPlayPause.innerHTML = PAUSE_ICON;
            mobilePlayPause.innerHTML = PAUSE_ICON;
            updateSidebarPlayerState(true);
            startAnimation();
            startBeatAnimation();
        }).catch(e => {
            console.error('播放失败:', e);
            // 强制恢复音频上下文后重试
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume().then(() => {
                    audio.volume = userSettings.volume / 100;
                    audio.play().then(() => {
                        isPlaying = true;
                        fsPlayPause.innerHTML = PAUSE_ICON;
                        mobilePlayPause.innerHTML = PAUSE_ICON;
                        updateSidebarPlayerState(true);
                        startAnimation();
                        startBeatAnimation();
                    }).catch(e2 => {
                        console.error('重试播放失败:', e2);
                        // 终极 fallback：绕过 Web Audio 直接播放
                        if (sourceNode) sourceNode.disconnect();
                        sourceNode = null;
                        audio.volume = userSettings.volume / 100;
                        audio.play().then(() => {
                            isPlaying = true;
                            fsPlayPause.innerHTML = PAUSE_ICON;
                            mobilePlayPause.innerHTML = PAUSE_ICON;
                            updateSidebarPlayerState(true);
                            startAnimation();
                            startBeatAnimation();
                        }).catch(e3 => console.error('终极播放失败:', e3));
                    });
                }).catch(e2 => {
                    console.error('恢复音频上下文失败:', e2);
                    // 终极 fallback：绕过 Web Audio 直接播放
                    if (sourceNode) sourceNode.disconnect();
                    sourceNode = null;
                    audio.volume = userSettings.volume / 100;
                    audio.play().then(() => {
                        isPlaying = true;
                        fsPlayPause.innerHTML = PAUSE_ICON;
                        mobilePlayPause.innerHTML = PAUSE_ICON;
                        updateSidebarPlayerState(true);
                        startAnimation();
                        startBeatAnimation();
                    }).catch(e3 => console.error('终极播放失败:', e3));
                });
            } else {
                // 终极 fallback：绕过 Web Audio 直接播放
                if (sourceNode) sourceNode.disconnect();
                sourceNode = null;
                audio.volume = userSettings.volume / 100;
                audio.play().then(() => {
                    isPlaying = true;
                    fsPlayPause.innerHTML = PAUSE_ICON;
                    mobilePlayPause.innerHTML = PAUSE_ICON;
                    updateSidebarPlayerState(true);
                    startAnimation();
                    startBeatAnimation();
                }).catch(e2 => console.error('终极播放失败:', e2));
            }
        });
    }
}

function prevSong() { if (!playlist.length) return; let idx = playlist.findIndex(s => s.id === currentSongId); if (idx === -1) idx = 0; let newIdx = (idx - 1 + playlist.length) % playlist.length;
    playSongById(playlist[newIdx].id, true);
    onUserInteraction(); }

function nextSong() { if (!playlist.length) return; let idx = playlist.findIndex(s => s.id === currentSongId); if (idx === -1) idx = 0; let newIdx = (idx + 1) % playlist.length;
    playSongById(playlist[newIdx].id, true);
    onUserInteraction(); }

function toggleRepeat() { isRepeat = !isRepeat;
    fsRepeatBtn.classList.toggle('repeat-active', isRepeat);
    mobileRepeatBtn.classList.toggle('repeat-active', isRepeat);
    onUserInteraction(); }

function playSongById(id, bypassWebAudio = true) {
    const song = playlist.find(s => s.id === id);
    if (!song) return;
    if (audio.src) URL.revokeObjectURL(audio.src);
    audio.src = song.audioUrl;
    currentSongId = song.id;
    fsSongTitle.textContent = song.name;
    fsArtist.textContent = song.artist;
    mobileSongTitle.textContent = song.name;
    mobileArtist.textContent = song.artist;
    fsCoverImg.src = song.coverUrl;
    mobileCoverImg.src = song.coverUrl;
    updateBackgroundFromCover(song.coverUrl);
    updateSidebarPlayer(song);
    currentLyricsTimeline = song.lyricsTimeline || [];
    renderBothPanels();
    // 切换歌曲时强制滚到歌词最顶部
    if (fsLyricsScroll) fsLyricsScroll.scrollTop = 0;
    if (mobileLyricsContainer) mobileLyricsContainer.scrollTop = 0;
    
    // 设置浏览器原生媒体控件元数据
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.name,
            artist: song.artist,
            artwork: [
                { src: song.coverUrl, sizes: '96x96', type: 'image/jpeg' },
                { src: song.coverUrl, sizes: '128x128', type: 'image/jpeg' },
                { src: song.coverUrl, sizes: '192x192', type: 'image/jpeg' },
                { src: song.coverUrl, sizes: '256x256', type: 'image/jpeg' },
                { src: song.coverUrl, sizes: '384x384', type: 'image/jpeg' },
                { src: song.coverUrl, sizes: '512x512', type: 'image/jpeg' }
            ]
        });
        
        // 设置媒体会话操作
        navigator.mediaSession.setActionHandler('play', () => audio.play());
        navigator.mediaSession.setActionHandler('pause', () => audio.pause());
        navigator.mediaSession.setActionHandler('previoustrack', prevSong);
        navigator.mediaSession.setActionHandler('nexttrack', nextSong);
    }
    audio.load();
    // 直接播放 fallback：不经过 Web Audio 链路，确保有声音
    audio.volume = userSettings.volume / 100;
    
    if (!bypassWebAudio) {
        // 尝试初始化 Web Audio 链路（用于均衡器和环绕）
        if (!audioCtx) initAudioContext();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        setTimeout(() => {
            if (audioCtx) {
                try {
                    if (!sourceNode || !sourceNode.mediaElement) {
                        sourceNode = audioCtx.createMediaElementSource(audio);
                    }
                } catch(e) {
                    // 音频源节点已存在，复用即可
                }
                if (sourceNode) {
                    sourceNode.disconnect();
                    if (filters.length) sourceNode.connect(filters[0]);
                    else sourceNode.connect(gainNode);
                    if (surroundEnabled && pannerNode) {
                        if (filters.length) {
                            filters[filters.length - 1].disconnect();
                            filters[filters.length - 1].connect(pannerNode);
                            pannerNode.connect(gainNode);
                        } else {
                            sourceNode.disconnect();
                            sourceNode.connect(pannerNode);
                            pannerNode.connect(gainNode);
                        }
                    }
                    gainNode.gain.value = userSettings.volume / 100;
                }
            }
        }, 50);
    } else {
        // 绕过 Web Audio 直接播放
        if (sourceNode) sourceNode.disconnect();
        sourceNode = null;
        console.log('绕过 Web Audio 直接播放');
    }
    audio.play().then(() => { isPlaying = true;
        fsPlayPause.innerHTML = PAUSE_ICON;
        mobilePlayPause.innerHTML = PAUSE_ICON;
        updateSidebarPlayerState(true);
        startAnimation();
        startBeatAnimation();
    }).catch(e => {
        console.error('播放失败:', e);
        // 强制恢复音频上下文后重试
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().then(() => audio.play()).catch(e2 => {
                console.error('重试播放失败:', e2);
                // 终极 fallback：直接设置音量并播放
                audio.volume = userSettings.volume / 100;
                audio.play().catch(e3 => console.error('终极播放失败:', e3));
            });
        } else {
            // 终极 fallback：直接设置音量并播放
            audio.volume = userSettings.volume / 100;
            audio.play().catch(e2 => console.error('终极播放失败:', e2));
        }
    });
    updatePlaylistModalUI();
    onUserInteraction();
}

function deleteSongById(id) {
    let idx = playlist.findIndex(s => s.id === id);
    if (idx === -1) return;
    const song = playlist[idx];
    if (song.audioUrl?.startsWith('blob:')) URL.revokeObjectURL(song.audioUrl);
    if (song.coverUrl?.startsWith('blob:')) URL.revokeObjectURL(song.coverUrl);
    playlist.splice(idx, 1);
    if (currentSongId === id) {
        if (playlist.length) playSongById(playlist[0].id, true);
        else {
            audio.pause();
            isPlaying = false;
            fsPlayPause.innerHTML = PLAY_ICON;
            mobilePlayPause.innerHTML = PLAY_ICON;
            updateSidebarPlayerState(false);
            audio.src = "";
            fsSongTitle.textContent = "暂无歌曲";
            fsArtist.textContent = "点击菜单添加";
            mobileSongTitle.textContent = "暂无歌曲";
            mobileArtist.textContent = "点击菜单添加";
            fsCoverImg.src = DEFAULT_COVER_SVG;
            mobileCoverImg.src = DEFAULT_COVER_SVG;
            updateBackgroundFromCover(DEFAULT_COVER_SVG);
            currentLyricsTimeline = [];
            renderBothPanels();
            currentSongId = null;
            updateSidebarPlayer(null);
        }
    }
    updatePlaylistModalUI();
    onUserInteraction();
}

function updatePlaylistModalUI() {
    playlistModalList.innerHTML = '';
    if (playlist.length === 0) { playlistModalList.innerHTML = '<div style="text-align:center;opacity:0.6;padding:20px;">暂无歌曲，请返回主页搜索添加</div>'; return; }
    playlist.forEach(song => { const div = document.createElement('div');
        div.className = 'playlist-song-item';
        div.innerHTML = `<img class="playlist-song-cover" src="${song.coverUrl}" onerror="this.src='${DEFAULT_COVER_SVG}'"><div class="playlist-song-info"><div class="playlist-song-name">${escapeHtml(song.name)}</div><div class="playlist-song-artist">${escapeHtml(song.artist)}</div></div><button class="playlist-delete-btn" data-id="${song.id}">${SVG_DELETE}</button>`;
        div.querySelector('.playlist-delete-btn').addEventListener('click', (e) => { e.stopPropagation();
            deleteSongById(song.id); });
        div.addEventListener('click', () => { playSongById(song.id, true);
            closePlaylistModal(); });
        playlistModalList.appendChild(div); });
}

function escapeHtml(str) { return str.replace(/[&<>]/g, function(m) { if (m === '&') return '&amp;'; if (m === '<') return '&lt;'; if (m === '>') return '&gt;'; return m; }); }

function showPlaylistModal() { playlistModal.classList.add('show');
    updatePlaylistModalUI();
    onUserInteraction(); }

function closePlaylistModal() { playlistModal.classList.remove('show'); }

// 设置函数
function loadSettings() {
    const saved = localStorage.getItem('yinXueSettings');
    if (saved) {
        try { Object.assign(userSettings, JSON.parse(saved)); } catch (e) {}
    }
    if (userSettings.eqValues) eqValues = [...userSettings.eqValues];
    volumeSlider.value = userSettings.volume;
    lyricFontSizeSlider.value = userSettings.lyricFontSize;
    lyricOffsetSlider.value = userSettings.lyricOffset;
    renderQualitySelect.value = userSettings.renderQuality;
    if (idleTimeoutInput) idleTimeoutInput.value = userSettings.idleTimeout;
    surroundToggle.checked = userSettings.surround || false;
    surroundEnabled = userSettings.surround || false;
    const lightModeToggle = document.getElementById('lightModeToggle');
    if (lightModeToggle) {
        lightModeToggle.checked = userSettings.lightMode || false;
        toggleLightMode(userSettings.lightMode || false);
    }
    document.getElementById('fontSizeValue').innerText = userSettings.lyricFontSize + 'px';
    document.getElementById('offsetValue').innerText = userSettings.lyricOffset + 'px';
    if (audio) audio.volume = userSettings.volume / 100;
    applyLyricFontSize();
    applyRenderQuality();
    resetIdleTimer();
    for (let i = 0; i < eqSliders.length && i < eqValues.length; i++) {
        eqSliders[i].value = eqValues[i];
        eqValuesDisplay[i].innerText = eqValues[i];
    }
    applyEQ();
    if (surroundEnabled) setupSurround();
}

function saveSettings() {
    userSettings.volume = parseInt(volumeSlider.value);
    userSettings.lyricFontSize = parseInt(lyricFontSizeSlider.value);
    userSettings.lyricOffset = parseInt(lyricOffsetSlider.value);
    userSettings.renderQuality = renderQualitySelect.value;
    if (idleTimeoutInput) userSettings.idleTimeout = parseInt(idleTimeoutInput.value);
    userSettings.surround = surroundToggle.checked;
    const lightModeToggle = document.getElementById('lightModeToggle');
    if (lightModeToggle) userSettings.lightMode = lightModeToggle.checked;
    userSettings.eqValues = [...eqValues];
    localStorage.setItem('yinXueSettings', JSON.stringify(userSettings));
    if (gainNode) gainNode.gain.value = userSettings.volume / 100;
    else audio.volume = userSettings.volume / 100;
    applyLyricFontSize();
    applyRenderQuality();
    resetIdleTimer();
}

function applyLyricFontSize() {
    const size = userSettings.lyricFontSize;
    document.querySelectorAll('.fs-lyric-text').forEach(el => el.style.fontSize = size + 'px');
    document.querySelectorAll('.lyric-text').forEach(el => el.style.fontSize = size + 'px');
    let style = document.getElementById('dynamic-font-style');
    if (style) style.remove();
    style = document.createElement('style');
    style.id = 'dynamic-font-style';
    style.textContent = `
            .fs-lyric-item.active .fs-lyric-text { font-size: ${size + 4}px !important; }
            .lyric-item.active .lyric-text { font-size: ${size + 2}px !important; }
        `;
    document.head.appendChild(style);
}

function applyRenderQuality() {
    const auras = document.querySelectorAll('.glow');
    if (userSettings.renderQuality === 'high') {
        auras.forEach(el => el.style.display = 'block');
    } else if (userSettings.renderQuality === 'medium') {
        auras.forEach((el, idx) => { if (idx >= 2) el.style.display = 'none';
            else el.style.display = 'block'; });
    } else {
        auras.forEach(el => el.style.display = 'none');
    }
}

function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    if (userSettings.idleTimeout > 0 && isPlaying) {
        idleTimer = setTimeout(() => {
            if (audio && !audio.paused) {
                audio.pause();
                isPlaying = false;
                fsPlayPause.innerHTML = PLAY_ICON;
                mobilePlayPause.innerHTML = PLAY_ICON;
                if (animFrame) cancelAnimationFrame(animFrame);
                animFrame = null;
            }
        }, userSettings.idleTimeout * 1000);
    }
}

function onUserInteraction() {
    resetIdleTimer();
    // 恢复音频上下文（浏览器要求必须由用户交互触发）
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(e => console.warn('恢复音频上下文失败', e));
    }
}

// 事件绑定
fsPlayPause.addEventListener('click', togglePlayPause);
mobilePlayPause.addEventListener('click', togglePlayPause);
fsPrevBtn.addEventListener('click', prevSong);
mobilePrevBtn.addEventListener('click', prevSong);
fsNextBtn.addEventListener('click', nextSong);
mobileNextBtn.addEventListener('click', nextSong);
fsRepeatBtn.addEventListener('click', toggleRepeat);
mobileRepeatBtn.addEventListener('click', toggleRepeat);
fsMenuBtn.addEventListener('click', showPlaylistModal);
mobileMenuBtn.addEventListener('click', showPlaylistModal);
closePlaylistModalBtn.addEventListener('click', closePlaylistModal);
window.addEventListener('click', (e) => { if (e.target === playlistModal) closePlaylistModal(); });
fsProgressBg.addEventListener('click', (e) => { if (!audio.duration) return; const rect = fsProgressBg.getBoundingClientRect(); let p = (e.clientX - rect.left) / rect.width;
    p = Math.min(1, Math.max(0, p));
    audio.currentTime = p * audio.duration;
    updateProgressAndTime();
    onUserInteraction(); });
mobileProgressBg.addEventListener('click', (e) => { if (!audio.duration) return; const rect = mobileProgressBg.getBoundingClientRect(); let p = (e.clientX - rect.left) / rect.width;
    p = Math.min(1, Math.max(0, p));
    audio.currentTime = p * audio.duration;
    updateProgressAndTime();
    onUserInteraction(); });
audio.addEventListener('ended', () => {
    if (isRepeat && currentSongId) { audio.currentTime = 0;
        audio.play().catch(() => {}); } else if (playlist.length) { let idx = playlist.findIndex(s => s.id === currentSongId); let nextIdx = (idx + 1) % playlist.length; if (nextIdx === 0 && idx === playlist.length - 1) { audio.pause();
            isPlaying = false;
            fsPlayPause.innerHTML = PLAY_ICON;
            mobilePlayPause.innerHTML = PLAY_ICON;
            updateSidebarPlayerState(false);
            if (animFrame) cancelAnimationFrame(animFrame);
            animFrame = null; } else playSongById(playlist[nextIdx].id, true); } else { audio.pause();
        isPlaying = false;
        fsPlayPause.innerHTML = PLAY_ICON;
        mobilePlayPause.innerHTML = PLAY_ICON;
        updateSidebarPlayerState(false);
        if (animFrame) cancelAnimationFrame(animFrame);
        animFrame = null; }
    onUserInteraction();
});
audio.addEventListener('timeupdate', () => updateUIByPlaybackTime(audio.currentTime));

window.addEventListener('click', onUserInteraction);
window.addEventListener('touchstart', onUserInteraction);
window.addEventListener('mousemove', onUserInteraction);
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        const homePage = document.getElementById('homePage');
        if (homePage && homePage.classList.contains('active')) {
            const activeView = document.querySelector('.home-view.active');
            if (activeView && activeView.id === 'viewLyrics') {
                e.preventDefault();
                togglePlayPause();
            }
        } else {
            const tag = e.target.tagName.toLowerCase();
            if (tag !== 'input' && tag !== 'textarea' && !e.target.isContentEditable) {
                e.preventDefault();
                togglePlayPause();
            }
        }
    }
});

// 滚动事件处理 - 只有鼠标悬停在歌词区域时滚动才触发预览模式，5秒后恢复
function handleScroll() {
    // 只有鼠标手动滚动才触发，自动滚动不算
    if (isAutoScrolling) return;
    // 只有鼠标悬停在歌词区域时才进入预览模式
    if (!isMouseOverLyrics) return;
    
    isScrolling = true;
    // 清除之前的恢复定时器
    if (scrollRestoreTimer) clearTimeout(scrollRestoreTimer);
    // 5秒后恢复模糊效果和自动滚动
    scrollRestoreTimer = setTimeout(() => {
        isScrolling = false;
        // 强制更新歌词状态
        if (audio && audio.currentTime) {
            updateUIByPlaybackTime(audio.currentTime);
        }
    }, 5000);
}

// 监听歌词区域的滚动事件
fsLyricsScroll?.addEventListener('scroll', handleScroll);
mobileLyricsContainer?.addEventListener('scroll', handleScroll);

// 鼠标进入歌词区域时标记，离开时取消
fsLyricsScroll?.addEventListener('mouseenter', () => { isMouseOverLyrics = true; });
fsLyricsScroll?.addEventListener('mouseleave', () => { isMouseOverLyrics = false; });

// 初始化
// 初始化
buildEQGrid();
initAudioContext();
loadSettings();
renderBothPanels();
updateBackgroundFromCover(fsCoverImg.src);
updateUIByPlaybackTime(0);

// 清理函数 - 用于页面卸载时释放资源
function cleanup() {
    if (animFrame) cancelAnimationFrame(animFrame);
    if (surroundAnim) cancelAnimationFrame(surroundAnim);
    if (updateInterludeTimer) cancelAnimationFrame(updateInterludeTimer);
    if (idleTimer) clearTimeout(idleTimer);
    if (scrollRestoreTimer) clearTimeout(scrollRestoreTimer);
    
    // 释放所有 blob URL
    playlist.forEach(song => {
        if (song.audioUrl?.startsWith('blob:')) URL.revokeObjectURL(song.audioUrl);
        if (song.coverUrl?.startsWith('blob:')) URL.revokeObjectURL(song.coverUrl);
    });
    
    // 关闭音频上下文
    if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
    }
}

function toggleCoverClick() {
    const app = document.getElementById('playerApp');
    const homePage = document.getElementById('homePage');
    const isFullscreen = app && app.classList.contains('web-fullscreen');
    if (isFullscreen) {
        app.classList.remove('web-fullscreen');
        if (homePage) homePage.classList.add('active');
        homeSwitchView('search');
        loadHomeData();
    } else {
        if (homePage) homePage.classList.remove('active');
        if (currentSongId && app) {
            app.classList.add('web-fullscreen');
        }
    }
    onUserInteraction();
}

// 页面卸载时清理
window.addEventListener('beforeunload', cleanup);
window.addEventListener('unload', cleanup);
document.getElementById('fullscreenCoverTrigger').addEventListener('click', toggleCoverClick);
document.getElementById('mobileCoverTrigger').addEventListener('click', toggleCoverClick);
document.getElementById('sidebarPlayerCover').addEventListener('click', toggleCoverClick);
document.getElementById('fullscreenSongInfo').addEventListener('click', showPlaylistModal);
document.getElementById('mobileSongInfo').addEventListener('click', showPlaylistModal);
if (openSettingsBtn) openSettingsBtn.addEventListener('click', () => { if (mainPanelDiv) mainPanelDiv.classList.add('hide'); if (settingsPanelDiv) settingsPanelDiv.classList.add('active'); });
if (backFromSettingsBtn) backFromSettingsBtn.addEventListener('click', () => { if (mainPanelDiv) mainPanelDiv.classList.remove('hide'); if (settingsPanelDiv) settingsPanelDiv.classList.remove('active'); saveSettings(); });
volumeSlider.addEventListener('input', () => { userSettings.volume = parseInt(volumeSlider.value); if (gainNode) gainNode.gain.value = userSettings.volume / 100;
    else audio.volume = userSettings.volume / 100;
    saveSettings();
    onUserInteraction(); });
lyricFontSizeSlider.addEventListener('input', () => { userSettings.lyricFontSize = parseInt(lyricFontSizeSlider.value);
    document.getElementById('fontSizeValue').innerText = userSettings.lyricFontSize + 'px';
    applyLyricFontSize();
    saveSettings(); });
lyricOffsetSlider.addEventListener('input', () => { userSettings.lyricOffset = parseInt(lyricOffsetSlider.value);
    document.getElementById('offsetValue').innerText = userSettings.lyricOffset + 'px';
    saveSettings(); });
renderQualitySelect.addEventListener('change', () => { userSettings.renderQuality = renderQualitySelect.value;
    applyRenderQuality();
    saveSettings(); });
if (idleTimeoutInput) idleTimeoutInput.addEventListener('change', () => { if (idleTimeoutInput) userSettings.idleTimeout = parseInt(idleTimeoutInput.value);
    resetIdleTimer();
    saveSettings(); });
surroundToggle.addEventListener('change', () => { surroundEnabled = surroundToggle.checked;
    setupSurround();
    saveSettings(); });
const lightModeToggle = document.getElementById('lightModeToggle');
if (lightModeToggle) {
    lightModeToggle.addEventListener('change', () => {
        toggleLightMode(lightModeToggle.checked);
        saveSettings();
    });
}

function toggleLightMode(enabled) {
    const body = document.body;
    if (enabled) {
        body.classList.add('light-mode');
    } else {
        body.classList.remove('light-mode');
    }
}

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        if (preset === 'flat') resetEQ();
        else applyPreset(preset);
    });
});

// ---------- 音频节奏可视化效果 ----------
function startBeatAnimation() {
    if (beatAnimationId) cancelAnimationFrame(beatAnimationId);
    if (!analyserNode || !audioCtx || !isPlaying) return;

    const frequencyData = new Uint8Array(analyserNode.frequencyBinCount);
    const auras = document.querySelectorAll('.glow');
    const bgOverlay = document.getElementById('bgOverlay');
    const dynamicBg = document.getElementById('dynamicBg');
    
    let lastBeatTime = 0;
    let beatIntensity = 0;
    let smoothIntensity = 0;

    function animate() {
        if (!isPlaying || !analyserNode) return;

        analyserNode.getByteFrequencyData(frequencyData);
        
        // 计算低频能量（鼓点）
        let lowEnergy = 0;
        for (let i = 0; i < frequencyData.length * 0.15; i++) {
            lowEnergy += frequencyData[i];
        }
        lowEnergy /= frequencyData.length * 0.15;
        
        // 计算中频能量（人声/旋律）
        let midEnergy = 0;
        for (let i = Math.floor(frequencyData.length * 0.15); i < frequencyData.length * 0.5; i++) {
            midEnergy += frequencyData[i];
        }
        midEnergy /= frequencyData.length * 0.35;

        // 检测节拍
        const currentTime = Date.now();
        if (lowEnergy > 60 && currentTime - lastBeatTime > 80) {
            beatIntensity = Math.min(lowEnergy / 180, 1);
            lastBeatTime = currentTime;
        } else {
            beatIntensity *= 0.85;
        }

        // 平滑过渡
        smoothIntensity += (beatIntensity - smoothIntensity) * 0.15;

        // 光晕强烈跳动效果
        auras.forEach((auras, idx) => {
            const baseScale = 1 + smoothIntensity * (0.2 + idx * 0.08);
            const baseOpacity = 0.6 + smoothIntensity * 0.5;
            auras.style.transform = `translate(-50%, -50%) scale(${baseScale})`;
            auras.style.opacity = baseOpacity;
            auras.style.filter = `blur(${90 - smoothIntensity * 30}px)`;
        });

        // 背景亮度和缩放变化
        const brightness = 1 + smoothIntensity * 0.2;
        const scale = 1 + smoothIntensity * 0.05;
        bgOverlay.style.backdropFilter = `brightness(${brightness})`;
        dynamicBg.style.transform = `scale(${scale})`;

        // 闪烁效果
        if (smoothIntensity > 0.4) {
            bgOverlay.style.boxShadow = `inset 0 0 150px rgba(236, 217, 180, ${smoothIntensity * 0.3})`;
        } else {
            bgOverlay.style.boxShadow = 'none';
        }

        beatAnimationId = requestAnimationFrame(animate);
    }

    animate();
}

function stopBeatAnimation() {
    if (beatAnimationId) {
        cancelAnimationFrame(beatAnimationId);
        beatAnimationId = null;
    }
    // 恢复默认状态
    const auras = document.querySelectorAll('.glow');
    const bgOverlay = document.getElementById('bgOverlay');
    const dynamicBg = document.getElementById('dynamicBg');
    
    auras.forEach((auras, idx) => {
        auras.style.transform = '';
        auras.style.opacity = '';
    });
    bgOverlay.style.backdropFilter = '';
    dynamicBg.style.transform = '';
    bgOverlay.style.boxShadow = 'none';
}

// ================================================================
//  网易云音乐 API 搜索与集成
// ================================================================
const WYY_API_BASE = 'http://localhost:5000'; // 本地 Python API 服务地址
const WYY_PAGE_SIZE = 30;

// API 路径映射（原版 Python 后端的路径）
const API_PATHS = {
    search: '/search',        // POST
    song: '/song',            // POST
    playlist: '/playlist',    // GET
    album: '/album',          // GET
    download: '/download',    // POST
    lyric: '/lyric',          // GET
};

let wyyCurrentResults = [];
let wyyIsLoadingMore = false;
let wyyHasMore = false;
let wyyCurrentPage = 1;

async function wyyApiRequest(path, params = {}, method = 'POST') {
    const qs = new URLSearchParams(params).toString();
    let url = WYY_API_BASE + path;
    
    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://music.163.com'
        }
    };
    
    if (method === 'GET') {
        if (qs) url += '?' + qs;
        options.method = 'GET';
    } else {
        options.method = 'POST';
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        options.body = qs;
    }
    
    console.log('📡 网易云请求:', url, method, params);
    
    const resp = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(12000)
    });
    
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    if (data.status !== 200 && data.code !== 200 && data.code !== 0) {
        throw new Error(data.msg || data.message || '请求失败');
    }
    return data;
}

async function wyyCheckApiStatus() {
    const badge = document.getElementById('wyyApiBadge');
    const text = document.getElementById('wyyApiStatusText');
    if (!badge || !text) return;
    try {
        // 使用 GET /search 检测
        await wyyApiRequest('/search', { keyword: 'test', limit: 1 }, 'GET');
        badge.className = 'wyy-api-badge';
        text.textContent = '已连接';
        wyySetStatus('本地 API 已连接', 'success');
    } catch (_) {
        badge.className = 'wyy-api-badge offline';
        text.textContent = '未连接';
        wyySetStatus('本地 API 未连接，请检查服务是否启动', 'error');
    }
}

function wyySetStatus(msg, type) {
    const el = document.getElementById('wyyStatus');
    if (!el) return;
    el.textContent = msg;
    el.className = 'wyy-status';
    if (type === 'error') el.classList.add('error');
    if (type === 'success') el.classList.add('success');
    if (type === 'warning') el.classList.add('warning');
}

function wyyShowLoading(show) {
    const btn = document.getElementById('wyySearchBtn2');
    if (!btn) return;
    btn.disabled = show;
    btn.textContent = show ? '搜索中…' : '搜索';
}

async function wyyFetchCoversForResults(results) {
    if (!results || results.length === 0) return;
    const ids = results.map(s => s.id).join(',');
    try {
        const detailData = await wyyApiRequest('/song/detail', { ids: ids });
        const songs = detailData.songs || [];
        const coverMap = {};
        songs.forEach(song => {
            const album = song.al || song.album || {};
            let cover = album.picUrl || album.pic || '';
            if (cover) cover = cover.replace(/^http:\/\//, 'https://');
            coverMap[song.id] = cover;
        });
        results.forEach(item => {
            if (coverMap[item.id]) item.cover = coverMap[item.id];
        });
    } catch (e) {
        console.warn('批量获取封面失败:', e);
    }
}

function wyyRenderSongs(songs) {
    const container = document.getElementById('wyyResults');
    if (!container) return;
    container.innerHTML = '';
    if (!songs || songs.length === 0) {
        container.innerHTML = '<div class="wyy-empty-hint">😅 没有歌曲</div>';
        return;
    }
    songs.forEach((song, index) => wyyCreateSongItem(song, index, container));
}

function wyyCreateSongItem(song, index, container) {
    const div = document.createElement('div');
    div.className = 'home-result-item';
    const inPlaylist = playlist.some(s => s.id === song.id);
    const isCurrent = currentSongId === song.id;
   // 兼容两种格式：数组 或 字符串
let artistName = '未知歌手';
if (Array.isArray(song.artists)) {
    artistName = song.artists.map(a => a.name).join(' / ');
} else if (typeof song.artists === 'string') {
    artistName = song.artists;
} else if (song.ar && Array.isArray(song.ar)) {
    artistName = song.ar.map(a => a.name).join(' / ');
} else if (song.artist && typeof song.artist === 'string') {
    artistName = song.artist;
}
    let coverSrc = song.cover || '';
    if (!coverSrc) {
        coverSrc = DEFAULT_COVER_SVG;
    }
    div.innerHTML = '<div class="home-result-index">' + (index + 1) + '</div>' +
        '<img class="home-result-cover" src="' + coverSrc + '" referrerpolicy="origin" onerror="this.src=\'' + DEFAULT_COVER_SVG + '\'" />' +
        '<div class="home-result-info">' +
            '<div class="home-result-name">' + escapeHtml(song.name) + (isCurrent ? ' <span class="home-speaker-icon">' + SVG_SPEAKER + '</span>' : '') + '</div>' +
            '<div class="home-result-sub">' + escapeHtml(artistName || '未知歌手') + '</div>' +
        '</div>' +
        '<button class="home-result-action ' + (inPlaylist ? 'home-result-added' : '') + '" onclick="event.stopPropagation(); homeAddSong(' + song.id + ')">' +
            (inPlaylist ? SVG_CHECK : SVG_ADD) +
    '</button>';
    div.addEventListener('click', () => showHomeSongDetail(song));
    container.appendChild(div);
}

async function wyySearch(page) {
    if (page === undefined) page = 1;
    const keyword = document.getElementById('wyySearchInput').value.trim();
    if (!keyword) { wyySetStatus('请输入歌名或歌手', 'error'); return; }

    wyySetStatus('搜索中…');
    if (page === 1) {
        wyyShowLoading(true);
        document.getElementById('wyyResults').innerHTML = '<div class="wyy-loading-text">搜索中…</div>';
        document.getElementById('wyyLoadMore').classList.add('hidden');
    } else {
        wyyIsLoadingMore = true;
        document.getElementById('wyyLoadMore').textContent = '加载中…';
    }

    try {
        const offset = (page - 1) * WYY_PAGE_SIZE;
        // 原版后端使用 GET /search?keyword=&limit=&offset=
        const data = await wyyApiRequest('/search', {
            keyword: keyword,
            limit: WYY_PAGE_SIZE,
            offset: offset
        }, 'GET');
        
        const songs = data.data || [];
        const total = data.total || 0;

        let rawResults = songs.map(s => ({
  		id: s.id,
    		name: s.name,
    		artists: s.artists || s.ar || s.artist || '未知歌手',
		duration: s.duration || 0,
	    cover: s.picUrl || s.cover || ''	
        }));

        // ... 后续渲染逻辑保持不变
        if (page === 1) {
            wyyCurrentPage = 1;
            wyyCurrentResults = rawResults;
            wyyRenderSongs(wyyCurrentResults);
            wyySetStatus('找到 ' + wyyCurrentResults.length + ' 首歌曲', 'success');
        } else {
            wyyCurrentPage = page;
            wyyCurrentResults = wyyCurrentResults.concat(rawResults);
            wyyRenderSongs(wyyCurrentResults);
            wyySetStatus('已加载 ' + wyyCurrentResults.length + ' 首', 'success');
        }

        wyyHasMore = (wyyCurrentResults.length < total) && (songs.length === WYY_PAGE_SIZE);
        document.getElementById('wyyLoadMore').classList.toggle('hidden', !wyyHasMore);
        if (wyyHasMore) document.getElementById('wyyLoadMore').textContent = '加载更多';
    } catch (e) {
        if (page === 1) {
            document.getElementById('wyyResults').innerHTML = '<div class="wyy-loading-text">' + e.message + '</div>';
        } else {
            document.getElementById('wyyLoadMore').textContent = '加载失败，点击重试';
        }
        wyySetStatus(e.message, 'error');
    }
    if (page === 1) wyyShowLoading(false);
    wyyIsLoadingMore = false;
}

function wyyLoadMore() {
    if (wyyIsLoadingMore || !wyyHasMore) return;
    wyySearch(wyyCurrentPage + 1);
}

function wyyQuickSearch(keyword) {
    document.getElementById('wyySearchInput').value = keyword;
    wyySearch();
}

async function wyyAddSong(songId, autoPlay = false) {
    const existingSong = playlist.find(s => s.id === songId);
    if (existingSong) {
        if (autoPlay) {
            playSongById(songId, true);
        }
        const modal = document.getElementById('playlistManagerModal');
        if (modal && modal.classList.contains('show')) {
            closePlaylistModal();
        }
        return;
    }

    try {
        const statusEl = document.getElementById('wyyStatus');
        if (statusEl) {
            wyySetStatus('加载歌曲…', 'warning');
        }

        // 原版后端使用 POST /song
        const songData = await wyyApiRequest('/song', {
            url: String(songId),
            level: 'exhigh',
            type: 'json'
        }, 'POST');

        const data = songData.data || songData;
        if (!data) throw new Error('歌曲详情为空');

        const cover = data.pic || data.cover || '';
        const url = data.url;
        if (!url) {
            if (statusEl) {
                wyySetStatus('无法播放（可能受版权保护）', 'error');
            }
            return;
        }

        let lyricsTimeline = [];
        if (data.lyric) {
            try {
                let lyricText = data.lyric;
                if (data.tlyric) {
                }
                lyricsTimeline = wyyParseLyricsToTimeline(lyricText, (data.duration || 0) / 1000);
            } catch (_) {}
        }

        const newSong = {
            id: songId,
            name: data.name || songData.name,
            artist: data.ar_name || data.artist || '未知歌手',
            audioUrl: url,
            coverUrl: cover,
            lyricsTimeline: lyricsTimeline
        };
        playlist.push(newSong);

        updatePlaylistModalUI();
        updateSidebarPlayer(currentSongId ? playlist.find(s => s.id === currentSongId) : newSong);

        // 根据 autoPlay 参数决定是否立即播放
        if (autoPlay) {
            playSongById(songId, true);
        }

        if (wyyCurrentResults && wyyCurrentResults.length > 0) {
            wyyRenderSongs(wyyCurrentResults);
        }
        // 刷新主页搜索结果
        if (homeSearchResults.song && homeSearchResults.song.length > 0) {
            const currentDetail = homeDetailCurrentSong;
            if (currentDetail && currentDetail.id === songId) {
                showHomeSongDetail(currentDetail);
            } else {
                renderHomeSongResults(homeSearchResults.song);
            }
        }
        if (statusEl) {
            wyySetStatus('已添加：' + (data.name || songData.name), 'success');
        }
    } catch (e) {
        if (document.getElementById('wyyStatus')) {
            wyySetStatus(e.message, 'error');
        }
    }
}

function wyyParseLyricsToTimeline(lrc, durationSec) {
    if (lrc.charCodeAt(0) === 0xFEFF) lrc = lrc.slice(1);
    const lines = lrc.split(/\r?\n/).filter(l => l.trim());
    const result = [];
    for (const line of lines) {
        const m = line.match(/\[(\d{1,2}):(\d{1,2})(?:\.|:)(\d{1,6})\]\s*(.+)/);
        if (m) {
            const minutes = parseInt(m[1], 10);
            const seconds = parseInt(m[2], 10);
            let ms = parseInt(m[3], 10);
            if (isNaN(ms)) ms = 0;
            else if (m[3].length === 1) ms *= 100;
            else if (m[3].length === 2) ms *= 10;
            const time = minutes * 60 + seconds + ms / 1000;
            const text = m[4].trim();
            if (text) result.push({ time: parseFloat(time.toFixed(3)), text, align: 'left', singer: '' });
        }
    }
    result.sort((a, b) => a.time - b.time);
    if (durationSec && durationSec > 0) {
        return result.filter(item => item.time <= durationSec + 10);
    }
    return result;
}

function wyyShowSearchPanel() {
    mainPanelDiv.classList.add('hide');
    settingsPanelDiv.classList.remove('active');
    const wyyPanel = document.getElementById('wyySearchPanel');
    if (wyyPanel) wyyPanel.classList.add('active');
    wyyCheckApiStatus();
}

function wyyBackFromSearch() {
    const wyyPanel = document.getElementById('wyySearchPanel');
    if (wyyPanel) wyyPanel.classList.remove('active');
    mainPanelDiv.classList.remove('hide');
}

// 网易云搜索面板事件绑定
const openWyySearchBtn = document.getElementById('openWyySearchBtn');
const backFromWyySearchBtn = document.getElementById('backFromWyySearchBtn');
if (openWyySearchBtn) openWyySearchBtn.addEventListener('click', wyyShowSearchPanel);
if (backFromWyySearchBtn) backFromWyySearchBtn.addEventListener('click', wyyBackFromSearch);

// 初始化网易云 API 检测
setTimeout(() => wyyCheckApiStatus(), 1000);
setInterval(() => { if (document.getElementById('wyySearchPanel')?.classList.contains('active')) wyyCheckApiStatus(); }, 30000);

// 测试直接播放函数
function testDirectPlay() {
    if (!audio.src) return;
    // 绕过 Web Audio 直接播放
    if (sourceNode) sourceNode.disconnect();
    sourceNode = null;
    audio.volume = userSettings.volume / 100;
    audio.play().then(() => {
        isPlaying = true;
        fsPlayPause.innerHTML = PAUSE_ICON;
        mobilePlayPause.innerHTML = PAUSE_ICON;
        startAnimation();
        startBeatAnimation();
    }).catch(e => console.error('测试播放失败:', e));
}

let homeCurrentTab = 'song';
let homeSearchResults = { song: [], album: [], artist: [] };
let homeSearchKeyword = '';
let homeSearchOffset = 0;
const HOME_SEARCH_LIMIT = 20;

const HOME_RANKING_PLAYLISTS = [
    { id: '19723756', name: '飙升榜' },
    { id: '3779629', name: '新歌榜' },
    { id: '2884035', name: '原创榜' },
    { id: '3778678', name: '热歌榜' }
];

function updateSidebarPlayer(song) {
    const coverImg = document.querySelector('#sidebarPlayerCover img');
    const playerName = document.getElementById('sidebarPlayerName');
    const playerArtist = document.getElementById('sidebarPlayerArtist');
    
    if (coverImg) {
        coverImg.style.display = 'block';
        coverImg.style.visibility = 'visible';
        coverImg.style.width = '100%';
        coverImg.style.height = '100%';
        coverImg.style.objectFit = 'cover';
        coverImg.src = song?.coverUrl || DEFAULT_COVER_SVG;
        coverImg.onerror = function() {
            this.src = DEFAULT_COVER_SVG;
        };
    }
    if (playerName) playerName.textContent = song?.name || '未播放';
    if (playerArtist) playerArtist.textContent = song?.artist || '';
    updateSidebarPlayerState(isPlaying);
}

function updateSidebarPlayerState(playing) {
    const playIcon = document.getElementById('sidebarPlayIcon');
    if (playIcon) {
        if (playing) {
            playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none"/>';
        } else {
            playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" stroke-width="2" fill="currentColor"/>';
        }
    }
}

function openLyricsInterface() {
    const homePage = document.getElementById('homePage');
    if (homePage && homePage.classList.contains('active')) {
        homeClosePanel();
    }
    if (currentSongId) {
        appContainer.classList.toggle('web-fullscreen');
        onUserInteraction();
    }
}

function homeShowPanel() {
    const homePage = document.getElementById('homePage');
    if (homePage) {
        homePage.classList.add('active');
        homeSwitchView('search');
        loadHomeData();
        const currentSong = currentSongId ? playlist.find(s => s.id === currentSongId) : null;
        updateSidebarPlayer(currentSong);
    }
}

function homeClosePanel() {
    const homePage = document.getElementById('homePage');
    if (homePage) homePage.classList.remove('active');
}

function homeBackFromPanel() {
    homeClosePanel();
}

function homeSwitchTab(tab) {
    homeCurrentTab = tab;
    document.querySelectorAll('.home-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    const input = document.getElementById('homeSearchInput');
    if (tab === 'song') input.placeholder = '搜索歌曲...';
    else if (tab === 'album') input.placeholder = '搜索专辑...';
    else if (tab === 'artist') input.placeholder = '搜索歌手...';
}

async function homeSearch() {
    homeSwitchView('search');
    const keyword = document.getElementById('homeSearchInput').value.trim();
    const resultsDiv = document.getElementById('homeResults');
    const loadMoreBtn = document.getElementById('homeLoadMoreBtn');
    if (!keyword) {
        resultsDiv.innerHTML = '<div class="home-empty">请输入搜索关键词</div>';
        const searchBackBtn = document.getElementById('searchBackBtn');
        if (searchBackBtn) searchBackBtn.classList.remove('visible');
        if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
        return;
    }
    homeSearchKeyword = keyword;
    homeSearchOffset = 0;
    resultsDiv.innerHTML = '<div class="home-empty">搜索中...</div>';
    if (loadMoreBtn) loadMoreBtn.classList.add('hidden');

    try {
        const data = await wyyApiRequest('/search', {
            keyword: keyword,
            limit: HOME_SEARCH_LIMIT,
            offset: homeSearchOffset
        }, 'GET');
        const songs = data.data || [];
        const total = data.total || 0;
        const normalizedSongs = songs.map(s => ({
            id: s.id,
            name: s.name,
            artists: s.artists || s.ar || s.artist || '未知歌手',
            duration: s.duration || 0,
            cover: s.picUrl || s.cover || ''
        }));
        await wyyFetchCoversForResults(normalizedSongs);
        homeSearchResults.song = normalizedSongs;
        homeSearchOffset = normalizedSongs.length;
        renderHomeSongResults(normalizedSongs);
        if (loadMoreBtn && homeSearchOffset < total) {
            loadMoreBtn.classList.remove('hidden');
        }
    } catch (e) {
        resultsDiv.innerHTML = '<div class="home-empty">搜索失败: ' + e.message + '</div>';
    }
}

async function homeSearchLoadMore() {
    const loadMoreBtn = document.getElementById('homeLoadMoreBtn');
    if (!loadMoreBtn || !homeSearchKeyword) return;
    loadMoreBtn.textContent = '加载中...';
    loadMoreBtn.disabled = true;
    try {
        const data = await wyyApiRequest('/search', {
            keyword: homeSearchKeyword,
            limit: HOME_SEARCH_LIMIT,
            offset: homeSearchOffset
        }, 'GET');
        const songs = data.data || [];
        const total = data.total || 0;
        const normalizedSongs = songs.map(s => ({
            id: s.id,
            name: s.name,
            artists: s.artists || s.ar || s.artist || '未知歌手',
            duration: s.duration || 0,
            cover: s.picUrl || s.cover || ''
        }));
        await wyyFetchCoversForResults(normalizedSongs);
        homeSearchResults.song = homeSearchResults.song.concat(normalizedSongs);
        homeSearchOffset += normalizedSongs.length;
        renderHomeSongResults(homeSearchResults.song);
        if (homeSearchOffset >= total) {
            loadMoreBtn.classList.add('hidden');
        } else {
            loadMoreBtn.textContent = '加载更多';
        }
    } catch (e) {
        loadMoreBtn.textContent = '加载失败，点击重试';
    }
    loadMoreBtn.disabled = false;
}

let homeDetailCurrentSong = null;

function renderHomeSongResults(songs) {
    const searchBackBtn = document.getElementById('searchBackBtn');
    if (searchBackBtn) searchBackBtn.classList.remove('visible');
    const resultsDiv = document.getElementById('homeResults');
    if (!songs.length) {
        resultsDiv.innerHTML = '<div class="home-empty">未找到相关歌曲</div>';
        return;
    }
    resultsDiv.innerHTML = '';
    const listDiv = document.createElement('div');
    listDiv.style.display = 'flex';
    listDiv.style.flexDirection = 'column';
    listDiv.style.gap = '8px';
    songs.forEach((song, idx) => {
        let artistName = '未知歌手';
        if (Array.isArray(song.artists)) {
            artistName = song.artists.map(a => a.name).join(' / ');
        } else if (typeof song.artists === 'string') {
            artistName = song.artists;
        } else if (song.ar && Array.isArray(song.ar)) {
            artistName = song.ar.map(a => a.name).join(' / ');
        } else if (song.artist && typeof song.artist === 'string') {
            artistName = song.artist;
        }
        const cover = song.cover || song.picUrl || '';
        const inPlaylist = playlist.some(s => s.id === song.id);
        const isCurrent = currentSongId === song.id;
        const div = document.createElement('div');
        div.className = 'home-result-item';
        div.innerHTML = `
            <div class="home-result-index">${idx + 1}</div>
            <img class="home-result-cover" src="${cover}" referrerpolicy="origin" onerror="this.src='${DEFAULT_COVER_SVG}'" />
            <div class="home-result-info">
                <div class="home-result-name">${escapeHtml(song.name)}${isCurrent ? ' <span class="home-speaker-icon">' + SVG_SPEAKER + '</span>' : ''}</div>
                <div class="home-result-sub">${escapeHtml(artistName)}</div>
            </div>
            <button class="home-result-action ${inPlaylist ? 'home-result-added' : ''}" onclick="event.stopPropagation(); homeAddSong(${song.id})">
                ${inPlaylist ? SVG_CHECK : SVG_ADD}
            </button>
        `;
        div.addEventListener('click', () => showHomeSongDetail(song));
        listDiv.appendChild(div);
    });
    resultsDiv.appendChild(listDiv);
}

function showHomeSongDetail(song) {
    homeDetailCurrentSong = song;
    let artistName = '未知歌手';
    if (Array.isArray(song.artists)) {
        artistName = song.artists.map(a => a.name).join(' / ');
    } else if (typeof song.artists === 'string') {
        artistName = song.artists;
    } else if (song.ar && Array.isArray(song.ar)) {
        artistName = song.ar.map(a => a.name).join(' / ');
    } else if (song.artist && typeof song.artist === 'string') {
        artistName = song.artist;
    }
    const cover = song.cover || song.picUrl || DEFAULT_COVER_SVG;
    const inPlaylist = playlist.some(s => s.id === song.id);
    const isCurrent = currentSongId === song.id;
    const isRankingView = document.getElementById('viewRanking').classList.contains('active');
    const resultsDiv = isRankingView ? document.getElementById('rankingContent') : document.getElementById('homeResults');
    resultsDiv.innerHTML = '';
    const detailDiv = document.createElement('div');
    detailDiv.className = 'home-song-detail';
    const backBtnHTML = isRankingView ? '<button class="home-detail-btn home-detail-back" onclick="homeBackFromRankingDetail()">← 返回榜单</button>' : '';
    detailDiv.innerHTML = backBtnHTML + `
        <div style="display:flex;gap:30px;align-items:flex-start;flex-wrap:wrap;">
            <img class="home-detail-cover" src="${cover}" referrerpolicy="origin" onerror="this.src='${DEFAULT_COVER_SVG}'" />
            <div style="flex:1;min-width:250px;">
                <div class="home-detail-name">${escapeHtml(song.name)}${isCurrent ? ' <span class="home-speaker-icon">' + SVG_SPEAKER + '</span>' : ''}</div>
                <div class="home-detail-artist">
                    <strong class="home-detail-label">歌手：</strong>${escapeHtml(artistName)}
                </div>
                <div class="home-detail-actions" style="display:flex;gap:12px;flex-wrap:wrap;">
                    <button class="home-detail-btn ${inPlaylist ? 'home-detail-added' : ''}" onclick="homeAddSong(${song.id})">
                        ${inPlaylist ? '<span class="home-icon-btn">' + SVG_CHECK + '</span> 已在播放列表' : '<span class="home-icon-btn">' + SVG_ADD + '</span> 添加到播放列表'}
                    </button>
                    <button class="home-detail-btn home-detail-play" onclick="homePlaySong(${song.id})">
                        <span class="home-icon-btn">${SVG_PLAY}</span> 立即播放
                    </button>
                    <button class="home-detail-btn" onclick="homeSearchArtist('${escapeHtml(artistName).replace(/'/g, "\\'")}')">
                        <span class="home-icon-btn">${SVG_SEARCH_SM}</span> 搜索该歌手
                    </button>
                </div>
            </div>
        </div>
        <div class="home-detail-lyrics" id="homeDetailLyrics"><div class="home-empty">加载歌词中...</div></div>
    `;
    resultsDiv.appendChild(detailDiv);
    homeLoadSongLyrics(song.id);
    if (!isRankingView) {
        const searchBackBtn = document.getElementById('searchBackBtn');
        if (searchBackBtn) searchBackBtn.classList.add('visible');
    }
}

function homeBackFromRankingDetail() {
    const pl = HOME_RANKING_PLAYLISTS.find(p => p.id === rankingActiveTab);
    if (pl) {
        loadRankingSection(pl.id, pl.name);
    }
}

function homeBackToSearch() {
    const searchBackBtn = document.getElementById('searchBackBtn');
    if (searchBackBtn) searchBackBtn.classList.remove('visible');
    if (homeSearchResults.song && homeSearchResults.song.length > 0) {
        renderHomeSongResults(homeSearchResults.song);
    } else {
        document.getElementById('homeResults').innerHTML = '<div class="home-empty">请输入搜索关键词</div>';
    }
}

function homeSearchArtist(artistName) {
    document.getElementById('homeSearchInput').value = artistName;
    homeSearch();
}

async function homeLoadSongLyrics(songId) {
    const lyricsDiv = document.getElementById('homeDetailLyrics');
    if (!lyricsDiv) return;
    try {
        const songData = await wyyApiRequest('/song', { url: String(songId), level: 'exhigh', type: 'json' }, 'POST');
        const data = songData.data || songData;
        let lrc = '';
        if (data.lrc && data.lrc.lyric) {
            lrc = data.lrc.lyric;
        } else if (data.lyric) {
            lrc = data.lyric;
        }
        if (!lrc) {
            lyricsDiv.innerHTML = '<div class="home-empty">暂无歌词</div>';
            return;
        }
        const parsed = wyyParseLyricsToTimeline(lrc, (data.duration || 0) / 1000);
        if (!parsed || parsed.length === 0) {
            lyricsDiv.innerHTML = '<div class="home-empty">暂无歌词</div>';
            return;
        }
        lyricsDiv.innerHTML = '';
        let structured = [];
        for (let i = 0; i < parsed.length; i++) {
            structured.push({ type: 'lyric', ...parsed[i] });
            if (i < parsed.length - 1 && parsed[i + 1].time - parsed[i].time >= 10) {
                structured.push({ type: 'interlude', nextAlign: parsed[i + 1].align });
            }
        }
        structured.forEach(item => {
            if (item.type === 'lyric') {
                const div = document.createElement('div');
                div.className = 'home-lyric-line ' + (item.align || 'left');
                let singerHtml = (item.singer && item.align !== 'center') ? '<span class="home-lyric-singer">' + escapeHtml(item.singer) + '</span>' : '';
                if (item.align === 'right') {
                    div.innerHTML = singerHtml + '<span class="home-lyric-text">' + escapeHtml(item.text) + '</span>';
                } else {
                    div.innerHTML = '<span class="home-lyric-text">' + escapeHtml(item.text) + '</span>' + singerHtml;
                }
                lyricsDiv.appendChild(div);
            } else if (item.type === 'interlude') {
                const inter = document.createElement('div');
                let cls = 'home-lyric-interlude';
                if (item.nextAlign === 'right') cls += ' right';
                else if (item.nextAlign === 'center') cls += ' center';
                inter.className = cls;
                inter.innerHTML = '<span class="home-lyric-dot"></span><span class="home-lyric-dot"></span><span class="home-lyric-dot"></span>';
                lyricsDiv.appendChild(inter);
            }
        });
    } catch (e) {
        lyricsDiv.innerHTML = '<div class="home-empty">加载歌词失败</div>';
    }
}

function renderHomeAlbumResults(albums) {
    const resultsDiv = document.getElementById('homeResults');
    if (!albums.length) {
        resultsDiv.innerHTML = '<div class="home-empty">未找到相关专辑</div>';
        return;
    }
    resultsDiv.innerHTML = '<div class="home-album-grid" style="grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));">';
    const grid = resultsDiv.querySelector('.home-album-grid');
    albums.forEach(album => {
        const cover = album.picUrl || album.cover || '';
        const div = document.createElement('div');
        div.className = 'home-album-item';
        div.innerHTML = `
            <img class="home-album-cover" src="${cover}" referrerpolicy="origin" onerror="this.src='${DEFAULT_ALBUM_SVG}'" />
            <div class="home-album-name">${escapeHtml(album.name)}</div>
        `;
        div.addEventListener('click', () => homeSearchAlbumSongs(album.id, album.name));
        grid.appendChild(div);
    });
}

function renderHomeArtistResults(artists) {
    const resultsDiv = document.getElementById('homeResults');
    if (!artists.length) {
        resultsDiv.innerHTML = '<div class="home-empty">未找到相关歌手</div>';
        return;
    }
    resultsDiv.innerHTML = '<div class="home-artist-grid">';
    const grid = resultsDiv.querySelector('.home-artist-grid');
    artists.forEach(artist => {
        const cover = artist.picUrl || artist.img1v1Url || '';
        const div = document.createElement('div');
        div.className = 'home-artist-item';
        div.innerHTML = `
            <img class="home-artist-cover" src="${cover}" referrerpolicy="origin" onerror="this.src='${DEFAULT_ARTIST_SVG}'" />
            <div class="home-artist-name">${escapeHtml(artist.name)}</div>
        `;
        div.addEventListener('click', () => homeSearchArtistSongs(artist.id, artist.name));
        grid.appendChild(div);
    });
}

async function homeAddSong(songId) {
    await wyyAddSong(songId, false);
}

async function homePlaySong(songId) {
    await wyyAddSong(songId, true);
}

async function homeSearchAlbumSongs(albumId, albumName) {
    const resultsDiv = document.getElementById('homeResults');
    resultsDiv.innerHTML = '<div class="home-empty">加载专辑歌曲中...</div>';
    try {
        const data = await wyyApiRequest('/album', { id: albumId }, 'GET');
        const songs = data.songs || [];
        const cover = data.album?.picUrl || '';
        resultsDiv.innerHTML = `<div class="home-section-title">专辑: ${escapeHtml(albumName)}</div>`;
        songs.forEach((song, index) => {
            const artistName = song.ar?.map(a => a.name).join(' / ') || '未知歌手';
            const songCover = song.al?.picUrl || cover;
            const inPlaylist = playlist.some(s => s.id === song.id);
            const isCurrent = currentSongId === song.id;
            const div = document.createElement('div');
            div.className = 'home-result-item';
            div.innerHTML = `
                <div class="home-result-index">${index + 1}</div>
                <img class="home-result-cover" src="${songCover}" referrerpolicy="origin" onerror="this.src='${DEFAULT_COVER_SVG}'" />
                <div class="home-result-info">
                    <div class="home-result-name">${escapeHtml(song.name)}${isCurrent ? ' <span class="home-speaker-icon">' + SVG_SPEAKER + '</span>' : ''}</div>
                    <div class="home-result-sub">${escapeHtml(artistName)}</div>
                </div>
                <button class="home-result-action ${inPlaylist ? 'home-result-added' : ''}" onclick="event.stopPropagation(); homeAddSong(${song.id})">
                    ${inPlaylist ? SVG_CHECK : '<span class="home-icon-btn">' + SVG_ADD + '</span> 待播'}
                </button>
            `;
            div.addEventListener('click', () => showHomeSongDetail(song));
            resultsDiv.appendChild(div);
        });
    } catch (e) {
        resultsDiv.innerHTML = '<div class="home-empty">加载失败: ' + e.message + '</div>';
    }
}

async function homeSearchArtistSongs(artistId, artistName) {
    const resultsDiv = document.getElementById('homeResults');
    resultsDiv.innerHTML = '<div class="home-empty">加载歌手热门歌曲中...</div>';
    try {
        const data = await wyyApiRequest('/artist/songs', { id: artistId, limit: 30 }, 'GET');
        const songs = data.songs || [];
        resultsDiv.innerHTML = `<div class="home-section-title">歌手: ${escapeHtml(artistName)} - 热门歌曲</div>`;
        songs.forEach((song, index) => {
            const artistName = song.ar?.map(a => a.name).join(' / ') || '未知歌手';
            const cover = song.al?.picUrl || '';
            const inPlaylist = playlist.some(s => s.id === song.id);
            const isCurrent = currentSongId === song.id;
            const div = document.createElement('div');
            div.className = 'home-result-item';
            div.innerHTML = `
                <div class="home-result-index">${index + 1}</div>
                <img class="home-result-cover" src="${cover}" referrerpolicy="origin" onerror="this.src='${DEFAULT_COVER_SVG}'" />
                <div class="home-result-info">
                    <div class="home-result-name">${escapeHtml(song.name)}${isCurrent ? ' <span class="home-speaker-icon">' + SVG_SPEAKER + '</span>' : ''}</div>
                    <div class="home-result-sub">${escapeHtml(artistName)}</div>
                </div>
                <button class="home-result-action ${inPlaylist ? 'home-result-added' : ''}" onclick="event.stopPropagation(); homeAddSong(${song.id})">
                    ${inPlaylist ? SVG_CHECK : '<span class="home-icon-btn">' + SVG_ADD + '</span> 待播'}
                </button>
            `;
            div.addEventListener('click', () => showHomeSongDetail(song));
            resultsDiv.appendChild(div);
        });
    } catch (e) {
        resultsDiv.innerHTML = '<div class="home-empty">加载失败: ' + e.message + '</div>';
    }
}

async function loadHomeData() {
    loadHomeRecommended();
    loadHomeAlbums();
    loadHomeArtists();
    loadHomeRanking();
}

async function loadHomeRecommended() {
    const container = document.getElementById('homeRecommended');
    if (!container) return;
    if (playlist.length > 0) {
        container.innerHTML = '';
        playlist.slice(0, 8).forEach(song => {
            const div = document.createElement('div');
            div.className = 'home-rec-item';
            div.innerHTML = `
                <img class="home-rec-cover" src="${song.coverUrl || ''}" referrerpolicy="origin" onerror="this.src='${DEFAULT_COVER_SVG}'" />
                <div class="home-rec-info">
                    <div class="home-rec-name">${escapeHtml(song.name)}</div>
                    <div class="home-rec-artist">${escapeHtml(song.artist)}</div>
                </div>
            `;
            div.addEventListener('click', () => {
                playSongById(song.id, true);
            });
            container.appendChild(div);
        });
    } else {
        container.innerHTML = '<div class="home-empty">暂无推荐，请添加歌曲到播放列表</div>';
    }
}

async function loadHomeAlbums() {
    const container = document.getElementById('homeAlbums');
    if (!container) return;
    try {
        const data = await wyyApiRequest('/search', { keyword: '热门专辑', type: 10, limit: 8 }, 'GET');
        const albums = data.data || [];
        container.innerHTML = '';
        albums.forEach(album => {
            const div = document.createElement('div');
            div.className = 'home-album-item';
            div.innerHTML = `
                <img class="home-album-cover" src="${album.picUrl || ''}" referrerpolicy="origin" onerror="this.src='${DEFAULT_ALBUM_SVG}'" />
                <div class="home-album-name">${escapeHtml(album.name)}</div>
            `;
            div.addEventListener('click', () => homeSearchAlbumSongs(album.id, album.name));
            container.appendChild(div);
        });
    } catch (e) {
        container.innerHTML = '<div class="home-empty">加载失败</div>';
    }
}

async function loadHomeArtists() {
    const container = document.getElementById('homeArtists');
    if (!container) return;
    try {
        const data = await wyyApiRequest('/search', { keyword: '热门歌手', type: 100, limit: 8 }, 'GET');
        const artists = data.data || [];
        container.innerHTML = '';
        artists.forEach(artist => {
            const div = document.createElement('div');
            div.className = 'home-artist-item';
            div.innerHTML = `
                <img class="home-artist-cover" src="${artist.picUrl || artist.img1v1Url || ''}" referrerpolicy="origin" onerror="this.src='${DEFAULT_ARTIST_SVG}'" />
                <div class="home-artist-name">${escapeHtml(artist.name)}</div>
            `;
            div.addEventListener('click', () => homeSearchArtistSongs(artist.id, artist.name));
            container.appendChild(div);
        });
    } catch (e) {
        container.innerHTML = '<div class="home-empty">加载失败</div>';
    }
}

// 榜单数据缓存
const rankingCache = {};
let rankingActiveTab = '';

async function loadHomeRanking() {
    const container = document.getElementById('homeRanking');
    if (!container) return;
    if (container.dataset.loaded === 'true') return;
    
    container.innerHTML = '<div class="home-empty">加载中...</div>';
    
    let tabsHTML = '<div class="ranking-tabs">';
    HOME_RANKING_PLAYLISTS.forEach((pl, index) => {
        tabsHTML += `<div class="ranking-tab ${index === 0 ? 'active' : ''}" data-playlist="${pl.id}" onclick="switchRankingTab('${pl.id}')">${pl.name}</div>`;
    });
    tabsHTML += '</div>';
    
    container.innerHTML = `
        ${tabsHTML}
        <div class="ranking-content" id="rankingContent">
            <div class="home-empty">加载中...</div>
        </div>
    `;
    
    container.dataset.loaded = 'true';
    
    const defaultPl = HOME_RANKING_PLAYLISTS[0];
    rankingActiveTab = defaultPl.id;
    await loadRankingSection(defaultPl.id, defaultPl.name);
}

function switchRankingTab(playlistId) {
    if (rankingActiveTab === playlistId) return;
    rankingActiveTab = playlistId;
    
    document.querySelectorAll('.ranking-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.playlist === playlistId);
    });
    
    const pl = HOME_RANKING_PLAYLISTS.find(p => p.id === playlistId);
    if (pl) {
        loadRankingSection(pl.id, pl.name);
    }
}

async function loadRankingSection(playlistId, playlistName) {
    const contentEl = document.getElementById('rankingContent');
    if (!contentEl) return;
    
    if (rankingCache[playlistId]) {
        renderRankingSongs(contentEl, rankingCache[playlistId], playlistId);
        return;
    }
    
    contentEl.innerHTML = '<div class="home-empty">加载中...</div>';
    
    try {
        const data = await wyyApiRequest('/playlist', { id: playlistId });
        const playlistData = data.data || data;
        const tracks = (playlistData.playlist?.tracks || playlistData.songs || []).slice(0, 100);
        const songs = tracks.map(t => ({
            id: t.id,
            name: t.name,
            artists: typeof t.artists === 'string' ? t.artists : ((t.ar || t.artists || []).map(a => a.name || a).join(' / ') || '未知歌手'),
            cover: (t.al?.picUrl || t.picUrl || '')
        }));
        
        rankingCache[playlistId] = songs;
        renderRankingSongs(contentEl, songs, playlistId);
    } catch (e) {
        contentEl.innerHTML = '<div class="home-empty">加载失败</div>';
    }
}

function renderRankingSongs(contentEl, songs, playlistId) {
    contentEl.innerHTML = '';
    if (songs.length === 0) {
        contentEl.innerHTML = '<div class="home-empty">暂无歌曲</div>';
        return;
    }
    
    const pl = HOME_RANKING_PLAYLISTS.find(p => p.id === playlistId);
    const headerDiv = document.createElement('div');
    headerDiv.className = 'ranking-content-header';
    headerDiv.innerHTML = `
        <span class="ranking-content-title">${pl ? pl.name : ''}</span>
        <button class="ranking-play-all-btn" onclick="event.stopPropagation(); playRankingSection('${playlistId}', '${pl ? pl.name : ''}')">
            <span class="ranking-icon-play">${SVG_PLAY}</span> 播放全部
        </button>
    `;
    contentEl.appendChild(headerDiv);
    
    const listDiv = document.createElement('div');
    listDiv.className = 'ranking-content-list';
    songs.forEach((song, index) => {
        wyyCreateSongItem(song, index, listDiv);
    });
    contentEl.appendChild(listDiv);
}

function toggleRankingSection(sectionId) {
    const playlistId = sectionId.replace('ranking-section-', '');
    const contentEl = document.getElementById(`ranking-content-${playlistId}`);
    const btnEl = document.getElementById(`collapse-btn-${playlistId}`);
    
    if (!contentEl) return;
    
    const isCollapsed = contentEl.classList.toggle('collapsed');
    
    if (btnEl) {
        const icon = btnEl.querySelector('.ranking-icon-collapse');
        if (icon) {
            icon.textContent = isCollapsed ? '▶' : '▼';
        }
    }
}

async function playRankingSection(playlistId, playlistName) {
    const contentEl = document.getElementById('rankingContent');
    if (!contentEl) return;
    
    const songItems = contentEl.querySelectorAll('.wyy-song-item');
    if (songItems.length === 0) return;
    
    for (const item of songItems) {
        const songId = parseInt(item.dataset.songId);
        if (songId) {
            await wyyAddSong(songId, false);
        }
    }
    
    const firstSongId = parseInt(songItems[0]?.dataset.songId);
    if (firstSongId) {
        playSongById(firstSongId, true);
    }
}

// 主页事件绑定
const closeHomeBtn = document.getElementById('closeHomeBtn');
if (closeHomeBtn) closeHomeBtn.addEventListener('click', homeClosePanel);

document.querySelectorAll('.home-tab').forEach(tab => {
    tab.addEventListener('click', () => homeSwitchTab(tab.dataset.tab));
});

document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
        const view = item.dataset.view;
        homeSwitchView(view);
    });
});

homeCurrentTab = 'song';

function homeSwitchView(view) {
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });
    document.querySelectorAll('.home-view').forEach(v => {
        v.classList.toggle('active', v.id === 'view' + view.charAt(0).toUpperCase() + view.slice(1));
    });
    const titles = { search: '搜索', recommend: '推荐', ranking: '榜单', lyrics: '歌词', settings: '设置' };
    const titleEl = document.getElementById('homeViewTitle');
    if (titleEl) titleEl.textContent = titles[view] || view;
    
    if (view === 'lyrics') {
        loadLyricsSongList();
    } else if (view === 'ranking') {
        loadHomeRanking();
    }
}

function loadLyricsSongList() {
    const container = document.getElementById('lyricsSongList');
    if (!container) return;
    if (playlist.length === 0) {
        container.innerHTML = '<div class="home-empty">播放列表为空</div>';
        return;
    }
    container.innerHTML = '';
    playlist.forEach((song, idx) => {
        const div = document.createElement('div');
        div.className = 'lyrics-song-item' + (song.id === currentSongId ? ' playing' : '');
        div.innerHTML = `
            <img class="lyrics-song-cover" src="${song.coverUrl || ''}" referrerpolicy="origin" onerror="this.src='${DEFAULT_COVER_SVG}'" />
            <div class="lyrics-song-info">
                <div class="lyrics-song-name">${escapeHtml(song.name)}</div>
                <div class="lyrics-song-artist">${escapeHtml(song.artist)}</div>
            </div>
            <div class="lyrics-song-actions">
                <button title="播放" onclick="event.stopPropagation(); playSongById(${song.id}, true)">${SVG_PLAY}</button>
                <button title="删除" onclick="event.stopPropagation(); removeFromPlaylist(${idx})">${SVG_DELETE}</button>
            </div>
        `;
        div.addEventListener('click', () => playSongById(song.id, true));
        container.appendChild(div);
    });
}

function removeFromPlaylist(idx) {
    if (idx >= 0 && idx < playlist.length) {
        const removed = playlist.splice(idx, 1)[0];
        if (removed.id === currentSongId) {
            if (playlist.length > 0) {
                playSongById(playlist[Math.min(idx, playlist.length - 1)].id, true);
            } else {
                currentSongId = null;
                audio.src = '';
                updatePlayPauseUI(false);
            }
        }
        updatePlaylistModalUI();
        loadLyricsSongList();
    }
}

// 默认打开主页界面
setTimeout(() => {
    homeShowPanel();
}, 300);

function updatePlayPauseUI(playing) {
    updateSidebarPlayerState(playing);
}
