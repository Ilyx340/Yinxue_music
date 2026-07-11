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
        } else {
            gainNode.connect(audioCtx.destination);
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
            sourceNode = audioCtx.createMediaElementSource(audio);
            sourceNode.connect(pannerNode);
            pannerNode.connect(gainNode);
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
                sourceNode = audioCtx.createMediaElementSource(audio);
                sourceNode.connect(gainNode);
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
    if (!audioCtx || !sourceNode) return;
    try {
        if (sourceNode.mediaElement) sourceNode.disconnect();
        sourceNode = audioCtx.createMediaElementSource(audio);
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
    } catch (e) { console.warn("EQ连接失败", e); }
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
const modalAudioFile = document.getElementById('modalAudioFile'),
    modalLyricsFile = document.getElementById('modalLyricsFile'),
    modalCoverFile = document.getElementById('modalCoverFile');
const modalAddSongBtn = document.getElementById('modalAddSongBtn'),
    playlistModalList = document.getElementById('playlistModalList');
const demoSongBtn = document.getElementById('demoSongBtn'),
    marrySongBtn = document.getElementById('marrySongBtn');
const transitionMask = document.getElementById('transitionMask'),
    transitionText = document.getElementById('transitionText');
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
    
    // 只更新状态变化的行
    if (fsActiveIdx !== lastFsIdx) {
        // 清除旧的 active 状态
        if (lastFsIdx >= 0 && fsDomItems[lastFsIdx]?.type === 'lyric') {
            const oldEl = fsDomItems[lastFsIdx].el;
            oldEl.classList.remove('active');
            oldEl.classList.add('sung');
        }
        // 设置新的 active 状态
        if (fsActiveIdx >= 0) {
            const newEl = fsDomItems[fsActiveIdx].el;
            newEl.classList.add('active');
            newEl.classList.remove('sung');
            // 滚动时不自动滚动歌词
            if (!isScrolling && fsLyricsScroll) {
                isAutoScrolling = true;
                const containerRect = fsLyricsScroll.getBoundingClientRect();
                const elementRect = newEl.getBoundingClientRect();
                const offset = elementRect.top - (containerRect.top + containerRect.height / 2 - userSettings.lyricOffset);
                fsLyricsScroll.scrollBy({ top: offset, behavior: 'smooth' });
                // 动画结束后重置标志
                setTimeout(() => { isAutoScrolling = false; }, 500);
            }
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
        if (lastMobileIdx >= 0 && mobileDomItems[lastMobileIdx]?.type === 'lyric') {
            const oldEl = mobileDomItems[lastMobileIdx].el;
            oldEl.classList.remove('active');
            oldEl.classList.add('sung');
        }
        if (mobileActiveIdx >= 0) {
            const newEl = mobileDomItems[mobileActiveIdx].el;
            newEl.classList.add('active');
            newEl.classList.remove('sung', 'upcoming');
            // 滚动时不自动滚动歌词
            if (!isScrolling) {
                isAutoScrolling = true;
                requestAnimationFrame(() => {
                    const cr = mobileLyricsContainer.getBoundingClientRect();
                    const er = newEl.getBoundingClientRect();
                    const offset = er.top - (cr.top + cr.height / 2 - userSettings.lyricOffset);
                    mobileLyricsContainer.scrollBy({ top: offset, behavior: 'smooth' });
                    // 动画结束后重置标志
                    setTimeout(() => { isAutoScrolling = false; }, 500);
                });
            }
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
        if (animFrame) cancelAnimationFrame(animFrame);
        animFrame = null;
        stopBeatAnimation();
    } else {
        if (!audio.src && playlist.length === 0) { showPlaylistModal(); return; }
        if (!audio.src && playlist.length > 0) { playSongById(playlist[playlist.length - 1].id); return; }
        audio.play().then(() => { isPlaying = true;
            fsPlayPause.innerHTML = PAUSE_ICON;
            mobilePlayPause.innerHTML = PAUSE_ICON;
            startAnimation();
            startBeatAnimation(); }).catch(() => {});
    }
}

function prevSong() { if (!playlist.length) return; let idx = playlist.findIndex(s => s.id === currentSongId); if (idx === -1) idx = 0; let newIdx = (idx - 1 + playlist.length) % playlist.length;
    playSongById(playlist[newIdx].id);
    onUserInteraction(); }

function nextSong() { if (!playlist.length) return; let idx = playlist.findIndex(s => s.id === currentSongId); if (idx === -1) idx = 0; let newIdx = (idx + 1) % playlist.length;
    playSongById(playlist[newIdx].id);
    onUserInteraction(); }

function toggleRepeat() { isRepeat = !isRepeat;
    fsRepeatBtn.classList.toggle('repeat-active', isRepeat);
    mobileRepeatBtn.classList.toggle('repeat-active', isRepeat);
    onUserInteraction(); }

function playSongById(id) {
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
    currentLyricsTimeline = song.lyricsTimeline || [];
    renderBothPanels();
    
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
    if (!audioCtx) initAudioContext();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    setTimeout(() => {
        if (audioCtx) {
            sourceNode = audioCtx.createMediaElementSource(audio);
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
    }, 50);
    audio.volume = userSettings.volume / 100;
    audio.play().then(() => { isPlaying = true;
        fsPlayPause.innerHTML = PAUSE_ICON;
        mobilePlayPause.innerHTML = PAUSE_ICON;
        startAnimation();
        startBeatAnimation(); }).catch(() => {});
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
        if (playlist.length) playSongById(playlist[0].id);
        else {
            audio.pause();
            isPlaying = false;
            fsPlayPause.innerHTML = PLAY_ICON;
            mobilePlayPause.innerHTML = PLAY_ICON;
            audio.src = "";
            fsSongTitle.textContent = "暂无歌曲";
            fsArtist.textContent = "点击菜单添加";
            mobileSongTitle.textContent = "暂无歌曲";
            mobileArtist.textContent = "点击菜单添加";
            const def = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%232c2e3a'/%3E%3Ctext x='50' y='55' font-size='12' fill='%23cbbfaa' text-anchor='middle'%3E🎵%3C/text%3E%3C/svg%3E";
            fsCoverImg.src = def;
            mobileCoverImg.src = def;
            updateBackgroundFromCover(def);
            currentLyricsTimeline = [];
            renderBothPanels();
            currentSongId = null;
        }
    }
    updatePlaylistModalUI();
    onUserInteraction();
}

function addNewSong(audioFile, lyricsFile, coverFile) {
    if (!audioFile) { alert("请选择音频文件"); return; }
    const audioUrl = URL.createObjectURL(audioFile);
    let coverUrl = coverFile ? URL.createObjectURL(coverFile) : 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%232c2e3a\'/%3E%3Ctext x=\'50\' y=\'55\' font-size=\'12\' fill=\'%23cbbfaa\' text-anchor=\'middle\'%3E🎵%3C/text%3E%3C/svg%3E';
    let songName = audioFile.name.replace(/\.(mp3|m4a|flac)$/i, '') || "未知歌曲";
    let artist = "未知艺术家";
    let lyricsTimeline = [];
    const finalize = (parsedName, parsedArtist, timeline) => { if (parsedName && parsedName != "未知歌曲") songName = parsedName; if (parsedArtist && parsedArtist != "未知艺术家") artist = parsedArtist; if (timeline?.length) lyricsTimeline = timeline; const newSong = { id: Date.now(), name: songName, artist: artist, audioUrl, coverUrl, lyricsTimeline };
        playlist.push(newSong); if (!currentSongId) playSongById(newSong.id);
        updatePlaylistModalUI(); };
    if (lyricsFile) { const reader = new FileReader();
        reader.onload = (e) => { const { songName: lrcSong, artistAlbum, timeline } = parseLyricsFull(e.target.result);
            finalize(lrcSong, artistAlbum, timeline); };
        reader.readAsText(lyricsFile, "UTF-8"); } else finalize(null, null, []);
    onUserInteraction();
}

async function addModelSong() {
    const basePath = '';
    const audioUrl = `${basePath}男模.mp3`;
    const lyricsUrl = `${basePath}男模.txt`;
    const coverUrl = `${basePath}男模.jpg`;
    demoSongBtn.textContent = ' 加载男模...';
    demoSongBtn.style.opacity = '0.7';
    demoSongBtn.style.pointerEvents = 'none';
    let lyricsTimeline = [],
        songName = "男模",
        artist = "未知艺术家",
        coverDataUrl = null;
    try { const resp = await fetch(lyricsUrl); if (resp.ok) { const txt = await resp.text(); const { songName: pn, artistAlbum: aa, timeline } = parseLyricsFull(txt); if (pn && pn != "未知歌曲") songName = pn; if (aa && aa != "未知艺术家") artist = aa; if (timeline?.length) lyricsTimeline = timeline; } } catch (e) {}
    try { const resp = await fetch(coverUrl); if (resp.ok) { const blob = await resp.blob();
            coverDataUrl = await new Promise(resolve => { const fr = new FileReader();
                fr.onloadend = () => resolve(fr.result);
                fr.readAsDataURL(blob); }); } } catch (e) {}
    const coverFinal = coverDataUrl || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%232c2e3a\'/%3E%3Ctext x=\'50\' y=\'55\' font-size=\'12\' fill=\'%23cbbfaa\' text-anchor=\'middle\'%3E🎵%3C/text%3E%3C/svg%3E';
    playlist.push({ id: Date.now(), name: songName, artist: artist, audioUrl, coverUrl: coverFinal, lyricsTimeline });
    if (!currentSongId) playSongById(playlist[playlist.length - 1].id);
    updatePlaylistModalUI();
    demoSongBtn.textContent = '添加官方歌曲《男模》';
    demoSongBtn.style.opacity = '1';
    demoSongBtn.style.pointerEvents = 'auto';
    alert(`《男模》已添加！\n歌名: ${songName}\n歌手: ${artist}\n歌词行数: ${lyricsTimeline.length}`);
    onUserInteraction();
}

async function addMarrySong() {
    const basePath = '';
    const audioUrl = `${basePath}今天你要嫁给我.mp3`;
    const lyricsUrl = `${basePath}今天你要嫁给我.txt`;
    const coverUrl = `${basePath}今天你要嫁给我.jpg`;
    marrySongBtn.textContent = '加载歌曲...';
    marrySongBtn.style.opacity = '0.7';
    marrySongBtn.style.pointerEvents = 'none';
    let lyricsTimeline = [],
        songName = "今天你要嫁给我",
        artist = "陶喆 / 蔡依林",
        coverDataUrl = null;
    try { const resp = await fetch(lyricsUrl); if (resp.ok) { const txt = await resp.text(); const { songName: pn, artistAlbum: aa, timeline } = parseLyricsFull(txt); if (pn && pn != "未知歌曲") songName = pn; if (aa && aa != "未知艺术家") artist = aa; if (timeline?.length) lyricsTimeline = timeline; } } catch (e) {}
    try { const resp = await fetch(coverUrl); if (resp.ok) { const blob = await resp.blob();
            coverDataUrl = await new Promise(resolve => { const fr = new FileReader();
                fr.onloadend = () => resolve(fr.result);
                fr.readAsDataURL(blob); }); } } catch (e) {}
    const coverFinal = coverDataUrl || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%232c2e3a\'/%3E%3Ctext x=\'50\' y=\'55\' font-size=\'12\' fill=\'%23cbbfaa\' text-anchor=\'middle\'%3E🎵%3C/text%3E%3C/svg%3E';
    playlist.push({ id: Date.now(), name: songName, artist: artist, audioUrl, coverUrl: coverFinal, lyricsTimeline });
    if (!currentSongId) playSongById(playlist[playlist.length - 1].id);
    updatePlaylistModalUI();
    marrySongBtn.textContent = '添加《今天你要嫁给我》';
    marrySongBtn.style.opacity = '1';
    marrySongBtn.style.pointerEvents = 'auto';
    alert(`《今天你要嫁给我》已添加！\n歌名: ${songName}\n歌手: ${artist}\n歌词行数: ${lyricsTimeline.length}`);
    onUserInteraction();
}

async function addRainSong() {
    const basePath = '';
    const audioUrl = `${basePath}那天下雨了.mp3`;
    const lyricsUrl = `${basePath}那天下雨了.txt`;
    const coverUrl = `${basePath}那天下雨了.jpg`;
    const rainSongBtn = document.getElementById('rainSongBtn');
    if (rainSongBtn) {
        rainSongBtn.textContent = '加载歌曲...';
        rainSongBtn.style.opacity = '0.7';
        rainSongBtn.style.pointerEvents = 'none';
    }
    let lyricsTimeline = [],
        songName = "那天下雨了",
        artist = "未知艺术家",
        coverDataUrl = null;
    try { const resp = await fetch(lyricsUrl); if (resp.ok) { const txt = await resp.text(); const { songName: pn, artistAlbum: aa, timeline } = parseLyricsFull(txt); if (pn && pn != "未知歌曲") songName = pn; if (aa && aa != "未知艺术家") artist = aa; if (timeline?.length) lyricsTimeline = timeline; } } catch (e) {}
    try { const resp = await fetch(coverUrl); if (resp.ok) { const blob = await resp.blob();
            coverDataUrl = await new Promise(resolve => { const fr = new FileReader();
                fr.onloadend = () => resolve(fr.result);
                fr.readAsDataURL(blob); }); } } catch (e) {}
    const coverFinal = coverDataUrl || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%232c2e3a\'/%3E%3Ctext x=\'50\' y=\'55\' font-size=\'12\' fill=\'%23cbbfaa\' text-anchor=\'middle\'%3E🎵%3C/text%3E%3C/svg%3E';
    playlist.push({ id: Date.now(), name: songName, artist: artist, audioUrl, coverUrl: coverFinal, lyricsTimeline });
    if (!currentSongId) playSongById(playlist[playlist.length - 1].id);
    updatePlaylistModalUI();
    if (rainSongBtn) {
        rainSongBtn.textContent = '添加《那天下雨了》';
        rainSongBtn.style.opacity = '1';
        rainSongBtn.style.pointerEvents = 'auto';
    }
    alert(`《那天下雨了》已添加！\n歌名: ${songName}\n歌手: ${artist}\n歌词行数: ${lyricsTimeline.length}`);
    onUserInteraction();
}

function updatePlaylistModalUI() {
    playlistModalList.innerHTML = '';
    if (playlist.length === 0) { playlistModalList.innerHTML = '<div style="text-align:center;opacity:0.6;padding:20px;">暂无歌曲，请点击下方添加</div>'; return; }
    playlist.forEach(song => { const div = document.createElement('div');
        div.className = 'playlist-song-item';
        div.innerHTML = `<img class="playlist-song-cover" src="${song.coverUrl}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%232c2e3a\'/%3E%3Ctext x=\'50\' y=\'55\' font-size=\'12\' fill=\'%23cbbfaa\' text-anchor=\'middle\'%3E🎵%3C/text%3E%3C/svg%3E'"><div class="playlist-song-info"><div class="playlist-song-name">${escapeHtml(song.name)}</div><div class="playlist-song-artist">${escapeHtml(song.artist)}</div></div><button class="playlist-delete-btn" data-id="${song.id}">🗑️</button>`;
        div.querySelector('.playlist-delete-btn').addEventListener('click', (e) => { e.stopPropagation();
            deleteSongById(song.id); });
        div.addEventListener('click', () => { playSongById(song.id);
            closePlaylistModal(); });
        playlistModalList.appendChild(div); });
}

function escapeHtml(str) { return str.replace(/[&<>]/g, function(m) { if (m === '&') return '&amp;'; if (m === '<') return '&lt;'; if (m === '>') return '&gt;'; return m; }); }

function showPlaylistModal() { playlistModal.classList.add('show');
    updatePlaylistModalUI();
    onUserInteraction(); }

function closePlaylistModal() { playlistModal.classList.remove('show'); }

function handleModalAddSong() { const a = modalAudioFile.files[0],
        l = modalLyricsFile.files[0],
        c = modalCoverFile.files[0]; if (!a) { alert("请选择音频文件"); return; }
    addNewSong(a, l, c);
    modalAudioFile.value = '';
    modalLyricsFile.value = '';
    modalCoverFile.value = '';
    closePlaylistModal();
    onUserInteraction(); }

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
    idleTimeoutInput.value = userSettings.idleTimeout;
    surroundToggle.checked = userSettings.surround || false;
    surroundEnabled = userSettings.surround || false;
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
    userSettings.idleTimeout = parseInt(idleTimeoutInput.value);
    userSettings.surround = surroundToggle.checked;
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

function onUserInteraction() { resetIdleTimer(); }

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
modalAddSongBtn.addEventListener('click', handleModalAddSong);
demoSongBtn.addEventListener('click', addModelSong);
marrySongBtn.addEventListener('click', addMarrySong);
document.getElementById('rainSongBtn')?.addEventListener('click', addRainSong);
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
            mobilePlayPause.innerHTML = PLAY_ICON; if (animFrame) cancelAnimationFrame(animFrame);
            animFrame = null; } else playSongById(playlist[nextIdx].id); } else { audio.pause();
        isPlaying = false;
        fsPlayPause.innerHTML = PLAY_ICON;
        mobilePlayPause.innerHTML = PLAY_ICON; if (animFrame) cancelAnimationFrame(animFrame);
        animFrame = null; }
    onUserInteraction();
});
audio.addEventListener('timeupdate', () => updateUIByPlaybackTime(audio.currentTime));

window.addEventListener('click', onUserInteraction);
window.addEventListener('touchstart', onUserInteraction);
window.addEventListener('mousemove', onUserInteraction);
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
    }
});

// 滚动事件处理 - 取消模糊效果和自动滚动，5秒后恢复
function handleScroll() {
    // 只有鼠标手动滚动才触发，自动滚动不算
    if (isAutoScrolling) return;
    
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

// 页面卸载时清理
window.addEventListener('beforeunload', cleanup);
window.addEventListener('unload', cleanup);
document.getElementById('fullscreenCoverTrigger').addEventListener('click', () => { appContainer.classList.toggle('web-fullscreen');
    onUserInteraction(); });
document.getElementById('mobileCoverTrigger').addEventListener('click', () => { appContainer.classList.toggle('web-fullscreen');
    onUserInteraction(); });
document.getElementById('fullscreenSongInfo').addEventListener('click', showPlaylistModal);
document.getElementById('mobileSongInfo').addEventListener('click', showPlaylistModal);
openSettingsBtn.addEventListener('click', () => { mainPanelDiv.classList.add('hide');
    settingsPanelDiv.classList.add('active'); });
backFromSettingsBtn.addEventListener('click', () => { mainPanelDiv.classList.remove('hide');
    settingsPanelDiv.classList.remove('active');
    saveSettings(); });
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
idleTimeoutInput.addEventListener('change', () => { userSettings.idleTimeout = parseInt(idleTimeoutInput.value);
    resetIdleTimer();
    saveSettings(); });
surroundToggle.addEventListener('change', () => { surroundEnabled = surroundToggle.checked;
    setupSurround();
    saveSettings(); });
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