document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const audio = $('audio');
  
  const DEFAULT_API_BASE = 'https://api.replow.org';
  let API_BASE = DEFAULT_API_BASE;
  let userCookie = '';

  const ICON = {
    play:'<svg viewBox="0 0 24 24"><path d="M7 6.5v11a1.5 1.5 0 0 0 2.3 1.3l8.5-5.5a1.5 1.5 0 0 0 0-2.6L9.3 5.2A1.5 1.5 0 0 0 7 6.5z" fill="currentColor"/></svg>',
    pause:'<svg viewBox="0 0 24 24"><rect x="7" y="5" width="3.6" height="14" rx="1.5" fill="currentColor"/><rect x="13.4" y="5" width="3.6" height="14" rx="1.5" fill="currentColor"/></svg>',
    lyric:'<svg class="ic" viewBox="0 0 24 24"><path d="M4 6.5h11M4 12h16M4 17.5h8"/></svg>',
    image:'<svg class="ic" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 15.5l-5-5L5 20"/></svg>',
    trash:'<svg class="ic" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/></svg>',
    loop:'<svg class="ic" viewBox="0 0 24 24"><path d="M17 2.5l3.5 3.5L17 9.5"/><path d="M3.5 12V9.5A3.5 3.5 0 0 1 7 6h13.5"/><path d="M7 21.5L3.5 18 7 14.5"/><path d="M20.5 12v2.5a3.5 3.5 0 0 1-3.5 3.5H3.5"/></svg>',
    one:'<svg class="ic" viewBox="0 0 24 24"><path d="M17 2.5l3.5 3.5L17 9.5"/><path d="M3.5 12V9.5A3.5 3.5 0 0 1 7 6h13.5"/><path d="M7 21.5L3.5 18 7 14.5"/><path d="M20.5 12v2.5a3.5 3.5 0 0 1-3.5 3.5H3.5"/><text x="12" y="15.2" font-size="8.5" font-weight="700" fill="currentColor" stroke="none" text-anchor="middle">1</text></svg>',
    shuffle:'<svg class="ic" viewBox="0 0 24 24"><path d="M3 6.5h3.4c2 0 3.1 1.3 4.5 3.6l2 3.3c1.4 2.3 2.5 3.6 4.5 3.6H21"/><path d="M17.5 3.5L21 6.5l-3.5 3"/><path d="M3 17.5h3.4c2 0 3.1-1.3 4.5-3.6"/><path d="M17.5 13.5L21 17.5l-3.5 3"/></svg>',
    mute:'<svg class="ic" viewBox="0 0 24 24"><path d="M4 9.5v5h3l4 3.5v-12L7 9.5H4z" fill="currentColor" stroke="none"/><path d="M15 9.5l5 5M20 9.5l-5 5"/></svg>',
    sound:'<svg class="ic" viewBox="0 0 24 24"><path d="M4 9.5v5h3l4 3.5v-12L7 9.5H4z" fill="currentColor" stroke="none"/><path d="M14.5 9a4 4 0 0 1 0 6"/></svg>',
    fs:'<svg class="ic" viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    fsExit:'<svg class="ic" viewBox="0 0 24 24"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>'
  };

  let songs=[], cur=-1, mode='loop', targetSongId=null, dragging=false, lyricIdx=-1, uid=0;
  let currentGlobalOffset = 0;
  let currentTabIndex = 0;
  let bgMode = 'cover';
  let customBgUrl = '';
  let searchType = 'song';
  
  let currentRandomBgUrl = ''; 
  let currentDetailCover = ''; 

  let viewList = []; 
  let detailSongs = []; 
  let viewType = 'home';
  let prevView = 'lib';

  // 扫码登录状态
  let qrKey = null;
  let qrTimer = null;
  let isLoggedIn = false;

  const libView=$('libView'), detailView=$('detailView'), playerView=$('playerView'), mini=$('mini');
  const gridList=$('gridList'), detailGridList=$('detailGridList'), lyricInner=$('lyricInner'), lyricWrap=$('lyricWrap');
  const barFill=$('barFill'), barDot=$('barDot'), bgLayer=$('bgLayer'), outroCredit=$('outroCredit');

  /* ============================================================
     核心网络请求封装 (自动带上 Cookie)
     ============================================================ */
  function apiFetch(url, options = {}) {
    let finalUrl = url;
    if (userCookie) {
      const sep = finalUrl.includes('?') ? '&' : '?';
      finalUrl += `${sep}cookie=${encodeURIComponent(userCookie)}`;
    }
    // 加上时间戳防缓存
    const sep2 = finalUrl.includes('?') ? '&' : '?';
    finalUrl += `${sep2}timestamp=${Date.now()}`;
    
    return fetch(finalUrl, options);
  }

  /* ============================================================
     视图切换与背景联动
     ============================================================ */
  function setView(name) {
    if (name === 'player') {
      prevView = detailView.classList.contains('on') ? 'detail' : 'lib';
    }
    libView.classList.toggle('on', name === 'lib');
    detailView.classList.toggle('on', name === 'detail');
    playerView.classList.toggle('on', name === 'player');
    
    if (name === 'player') {
      mini.classList.remove('show');
      requestAnimationFrame(()=>{ if(lyricIdx>=0) scrollToLine(lyricIdx, currentGlobalOffset); else centerFirst(currentGlobalOffset); });
    } else {
      if (cur >= 0) mini.classList.add('show');
      if (bgMode === 'cover') {
        if (name === 'lib') {
          const s = songs[cur];
          updateGlobalBg(s ? s.cover : null);
        } else if (name === 'detail') {
          updateGlobalBg(currentDetailCover);
        }
      }
    }
  }

  /* ============================================================
     Tab 滑动切换
     ============================================================ */
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabSlider = $('tabSlider');
  const navIndicator = $('navIndicator');

  function switchTab(index) {
    currentTabIndex = index;
    navTabs.forEach((t, i) => t.classList.toggle('active', i === index));
    tabSlider.style.transform = `translateX(-${index * 33.3333}%)`;

    const activeTab = navTabs[index];
    if (activeTab) {
      navIndicator.style.width = activeTab.offsetWidth + 'px';
      navIndicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
    }
  }

  navTabs.forEach((tab, i) => tab.addEventListener('click', () => switchTab(i)));
  $('openSettingsPlayer').addEventListener('click', () => { setView('lib'); switchTab(1); });
  window.addEventListener('resize', () => switchTab(currentTabIndex));

  /* ============================================================
     搜索类型
     ============================================================ */
  document.querySelectorAll('.search-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      searchType = tab.dataset.type;
      const kw = $('searchInput').value.trim();
      if (kw) doSearch();
      else if (searchType === 'song') { viewType = 'home'; loadRecommendPlaylists(); }
    });
  });

  /* ============================================================
     配置与背景图
     ============================================================ */
  function setStorage(key, value) {
    try { localStorage.setItem('yin_' + key, typeof value === 'string' ? value : JSON.stringify(value)); } catch(e) {}
  }
  function getStorage(key, defaultValue) {
    try {
      const val = localStorage.getItem('yin_' + key);
      if (val === null) return defaultValue;
      try { return JSON.parse(val); } catch { return val; }
    } catch(e) { return defaultValue; }
  }

  function loadSettings() {
    try {
      // 读取自定义 API
      API_BASE = getStorage('api_base', DEFAULT_API_BASE);
      $('apiBaseInput').value = API_BASE;

      // 读取登录态
      userCookie = getStorage('netease_cookie', '');
      if (userCookie) {
        isLoggedIn = true;
        updateLoginUI();
        verifyCookie();
      }

      const savedColor = getStorage('accent', '#ffffff');
      document.documentElement.style.setProperty('--accent', savedColor);
      document.querySelectorAll('.color-dot').forEach(d => d.classList.toggle('active', d.dataset.color === savedColor));
      const savedBlur = getStorage('blur', 50);
      $('sliderBlur').value = savedBlur; $('valBlur').textContent = savedBlur + 'px';
      document.documentElement.style.setProperty('--bg-blur', savedBlur + 'px');
      const savedDark = getStorage('dark', 25);
      $('sliderDark').value = savedDark; $('valDark').textContent = savedDark + '%';
      document.documentElement.style.setProperty('--bg-dark', (savedDark / 100).toFixed(2));
      const saved3D = getStorage('toggle3D', true);
      $('toggle3D').checked = saved3D; document.body.classList.toggle('no-3d', !saved3D);
      const savedSize = getStorage('lyricSize', 32);
      $('sliderLyricSize').value = savedSize; $('valLyricSize').textContent = savedSize + 'px';
      document.documentElement.style.setProperty('--lyric-size', savedSize + 'px');
      const savedSpacing = getStorage('lyricSpacing', 1.5);
      $('sliderLyricSpacing').value = savedSpacing * 10; $('valLyricSpacing').textContent = savedSpacing;
      document.documentElement.style.setProperty('--lyric-spacing', savedSpacing);
      const savedScale = getStorage('lyricScale', 1.05);
      $('sliderLyricScale').value = savedScale * 10; $('valLyricScale').textContent = savedScale;
      document.documentElement.style.setProperty('--lyric-scale', savedScale);
      bgMode = getStorage('bg_mode', 'cover');
      updateBgModeUI(bgMode); toggleCustomBgUI(bgMode);
    } catch(e) {}
  }
  loadSettings();

  // 自定义 API 地址保存
  $('apiBaseInput').addEventListener('change', (e) => {
    let val = e.target.value.trim();
    if (!val) val = DEFAULT_API_BASE;
    val = val.replace(/\/+$/, ''); 
    API_BASE = val;
    setStorage('api_base', API_BASE);
    e.target.value = API_BASE;
    toast('API 地址已保存');
    if (viewType === 'home' && !$('searchInput').value.trim()) loadRecommendPlaylists();
  });

  $('resetApiBtn').addEventListener('click', () => {
    API_BASE = DEFAULT_API_BASE;
    setStorage('api_base', API_BASE);
    $('apiBaseInput').value = API_BASE;
    toast('API 已恢复默认');
    if (viewType === 'home' && !$('searchInput').value.trim()) loadRecommendPlaylists();
  });

  function toggleCustomBgUI(mode) { $('customBgLabel').style.display = mode === 'custom' ? 'flex' : 'none'; }

  function updateBgModeUI(mode) {
    const btns = document.querySelectorAll('.bg-mode-btn');
    const indicator = $('bgModeIndicator');
    let idx = 0;
    btns.forEach((b, i) => {
      if (b.dataset.mode === mode) idx = i;
      b.classList.toggle('active', b.dataset.mode === mode);
    });
    indicator.style.transform = `translateX(${idx * 100}%)`;
  }

  function updateGlobalBg(coverUrl) {
    let finalUrl = 'none';
    if (bgMode === 'cover') {
      finalUrl = coverUrl ? `url("${coverUrl}")` : 'none';
    } else if (bgMode === 'random') {
      if (!currentRandomBgUrl) currentRandomBgUrl = `https://api.yppp.net/pc.php?t=${Date.now()}`;
      finalUrl = `url("${currentRandomBgUrl}")`;
    } else if (bgMode === 'custom' && customBgUrl) {
      finalUrl = `url("${customBgUrl}")`;
    }
    document.documentElement.style.setProperty('--current-bg', finalUrl);
  }

  document.querySelectorAll('.bg-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      bgMode = btn.dataset.mode; setStorage('bg_mode', bgMode);
      updateBgModeUI(bgMode); toggleCustomBgUI(bgMode);
      if (bgMode === 'random' && !currentRandomBgUrl) {
        currentRandomBgUrl = `https://api.yppp.net/pc.php?t=${Date.now()}`;
      }
      if (detailView.classList.contains('on')) updateGlobalBg(currentDetailCover);
      else { const s = songs[cur]; updateGlobalBg(s ? s.cover : null); }
    });
  });

  $('customBgInput').addEventListener('change', (e) => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    if (customBgUrl) URL.revokeObjectURL(customBgUrl);
    customBgUrl = URL.createObjectURL(f);
    if (bgMode !== 'custom') {
      bgMode = 'custom'; setStorage('bg_mode', bgMode);
      updateBgModeUI(bgMode); toggleCustomBgUI(bgMode);
    }
    updateGlobalBg(songs[cur] ? songs[cur].cover : null);
    toast('背景图片已应用（本次有效）');
  });

  /* ============================================================
     其他设置
     ============================================================ */
  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active'); document.documentElement.style.setProperty('--accent', dot.dataset.color);
      setStorage('accent', dot.dataset.color);
    });
  });

  $('extractColor').addEventListener('click', () => {
    if (cur < 0 || !songs[cur] || !songs[cur].cover) { toast('当前播放歌曲暂无封面'); return; }
    const img = new Image(); img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas'); canvas.width = 1; canvas.height = 1;
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, 1, 1);
        const data = ctx.getImageData(0, 0, 1, 1).data;
        let r = data[0] / 255, g = data[1] / 255, b = data[2] / 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) h = s = 0;
        else {
          let d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; }
          h /= 6;
        }
        l = 0.8; s = Math.min(s, 0.6);
        const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1/6) return p + (q - p) * 6 * t; if (t < 1/2) return q; if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p; };
        let newR, newG, newB;
        if (s === 0) newR = newG = newB = l;
        else { let q = l < 0.5 ? l * (1 + s) : l + s - l * s; let p = 2 * l - q; newR = hue2rgb(p, q, h + 1/3); newG = hue2rgb(p, q, h); newB = hue2rgb(p, q, h - 1/3); }
        const hex = '#' + [newR, newG, newB].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        document.documentElement.style.setProperty('--accent', hex); setStorage('accent', hex); toast('已提取并提亮主题色');
      } catch(e) { toast('无法提取颜色'); }
    };
    img.onerror = () => toast('提取颜色失败'); img.src = songs[cur].cover;
  });

  $('toggle3D').addEventListener('change', (e) => { document.body.classList.toggle('no-3d', !e.target.checked); setStorage('toggle3D', e.target.checked); });
  $('sliderBlur').addEventListener('input', e => { $('valBlur').textContent = e.target.value + 'px'; document.documentElement.style.setProperty('--bg-blur', e.target.value + 'px'); setStorage('blur', e.target.value); });
  $('sliderDark').addEventListener('input', e => { $('valDark').textContent = e.target.value + '%'; document.documentElement.style.setProperty('--bg-dark', (e.target.value / 100).toFixed(2)); setStorage('dark', e.target.value); });
  $('sliderLyricSize').addEventListener('input', e => { $('valLyricSize').textContent = e.target.value + 'px'; document.documentElement.style.setProperty('--lyric-size', e.target.value + 'px'); setStorage('lyricSize', e.target.value); });
  $('sliderLyricSpacing').addEventListener('input', e => { const v = (+e.target.value / 10).toFixed(1); $('valLyricSpacing').textContent = v; document.documentElement.style.setProperty('--lyric-spacing', v); setStorage('lyricSpacing', v); });
  $('sliderLyricScale').addEventListener('input', e => { const v = (+e.target.value / 10).toFixed(2); $('valLyricScale').textContent = v; document.documentElement.style.setProperty('--lyric-scale', v); setStorage('lyricScale', v); });

  /* ============================================================
     工具 & 解析
     ============================================================ */
  function fmt(s){if(!s||!isFinite(s)||s<0)return '0:00';s=Math.floor(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
  function esc(str){return String(str).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function baseName(n){return n.replace(/\.[^.]+$/,'').trim().toLowerCase();}
  function formatNum(n) { if (!n) return '0'; if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿'; if (n >= 10000) return (n / 10000).toFixed(1) + '万'; return n.toString(); }

  let toastTimer=null;
  function toast(msg){
    let el=document.querySelector('.toast');
    if(!el){ el=document.createElement('div'); el.className='toast'; document.body.appendChild(el); }
    el.textContent=msg; requestAnimationFrame(()=>el.classList.add('on'));
    clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('on'),2000);
  }

  function parseLrc(text){
    const out=[];
    text.split(/\r?\n/).forEach(raw=>{
      const stamps=[...raw.matchAll(/\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g)];
      if(!stamps.length)return;
      const content=raw.replace(/\[[^\]]*\]/g,'').trim();
      if(!content)return;
      const startM = stamps[0];
      const t = (+startM[1])*60 + (+startM[2]) + (startM[3] ? parseInt(startM[3].padEnd(3,'0'),10)/1000 : 0);
      let endT = null;
      if (stamps.length > 1) { const endM = stamps[1]; endT = (+endM[1])*60 + (+endM[2]) + (endM[3] ? parseInt(endM[3].padEnd(3,'0'),10)/1000 : 0); }
      out.push({ t, text: content, endT });
    });
    return out.sort((a,b)=>a.t-b.t);
  }

  const EMPTY_TAGS={title:null,artist:null,picture:null};
  function readTags(file){return new Promise(resolve=>{const blob=file.slice(0,4*1024*1024),reader=new FileReader();reader.onload=e=>{try{const buf=new Uint8Array(e.target.result);if(buf[0]===0x49&&buf[1]===0x44&&buf[2]===0x33)resolve(parseID3v2(buf));else if(buf[0]===0x66&&buf[1]===0x4c&&buf[2]===0x61&&buf[3]===0x43)resolve(parseFLAC(buf));else resolve(EMPTY_TAGS);}catch{resolve(EMPTY_TAGS);}};reader.onerror=()=>resolve(EMPTY_TAGS);reader.readAsArrayBuffer(blob);});}
  function decodeTextFrame(data){if(!data.length)return '';const enc=data[0],body=data.subarray(1);let text='';try{if(enc===0)text=new TextDecoder('iso-8859-1').decode(body);else if(enc===1)text=new TextDecoder('utf-16').decode(body);else if(enc===2)text=new TextDecoder('utf-16be').decode(body);else text=new TextDecoder('utf-8').decode(body);}catch{return '';}return text.replace(/\0+/g,' ').trim();}
  function decodeAPIC(data){if(data.length<6)return null;const enc=data[0];let p=1;while(p<data.length&&data[p]!==0)p++;const mime=new TextDecoder('iso-8859-1').decode(data.subarray(1,p))||'image/jpeg';p++;p++;if(enc===1||enc===2){while(p+1<data.length&&!(data[p]===0&&data[p+1]===0))p+=2;p+=2;}else{while(p<data.length&&data[p]!==0)p++;p++;}const img=data.subarray(p);if(img.length<16)return null;try{return URL.createObjectURL(new Blob([img.slice()],{type:mime}));}catch{return null;}}
  function parseID3v2(buf){const out={title:null,artist:null,picture:null};if(buf.length<10)return out;const ver=buf[3],flags=buf[5],size=(buf[6]<<21)|(buf[7]<<14)|(buf[8]<<7)|buf[9];let pos=10;if(flags&0x40){if(ver===4){const ext=(buf[pos]<<21)|(buf[pos+1]<<14)|(buf[pos+2]<<7)|buf[pos+3];pos+=Math.max(0,ext);}else{const ext=(buf[pos]<<24)|(buf[pos+1]<<16)|(buf[pos+2]<<8)|buf[pos+3];pos+=4+Math.max(0,ext);}}const end=Math.min(buf.length,10+size);while(pos+10<=end){const id=String.fromCharCode(buf[pos],buf[pos+1],buf[pos+2],buf[pos+3]);if(!/^[A-Z0-9]{4}$/.test(id))break;let frameSize;if(ver===4)frameSize=(buf[pos+4]<<21)|(buf[pos+5]<<14)|(buf[pos+6]<<7)|buf[pos+7];else frameSize=(buf[pos+4]<<24)|(buf[pos+5]<<16)|(buf[pos+6]<<8)|buf[pos+7];if(frameSize<=0||pos+10+frameSize>end)break;const start=pos+10,data=buf.subarray(start,start+frameSize);if(id==='TIT2')out.title=decodeTextFrame(data)||null;else if(id==='TPE1')out.artist=decodeTextFrame(data)||null;else if(id==='APIC')out.picture=decodeAPIC(data)||null;pos=start+frameSize;}return out;}
  function parseFLAC(buf){const out={title:null,artist:null,picture:null};let pos=4;while(pos+4<=buf.length){const header=buf[pos],last=header&0x80,type=header&0x7f,len=(buf[pos+1]<<16)|(buf[pos+2]<<8)|buf[pos+3],start=pos+4;if(start+len>buf.length)break;const data=buf.subarray(start,start+len);if(type===4){const dv=new DataView(data.buffer,data.byteOffset,data.byteLength);let p=0;if(data.length<8){pos=start+len;continue;}const vlen=dv.getUint32(p,true);p+=4+vlen;if(p+4>data.length){pos=start+len;continue;}const count=dv.getUint32(p,true);p+=4;for(let i=0;i<count&&p+4<=data.length;i++){const l=dv.getUint32(p,true);p+=4;if(p+l>data.length)break;const s=new TextDecoder('utf-8').decode(data.subarray(p,p+l));p+=l;const eq=s.indexOf('=');if(eq<=0)continue;const k=s.slice(0,eq).toUpperCase(),v=s.slice(eq+1).trim();if(k==='TITLE'&&!out.title)out.title=v;if(k==='ARTIST'&&!out.artist)out.artist=v;}}else if(type===6){const dv=new DataView(data.buffer,data.byteOffset,data.byteLength);let p=0;if(data.length<8){pos=start+len;continue;}p+=4;const mimeLen=dv.getUint32(p,false);p+=4;const mime=new TextDecoder('iso-8859-1').decode(data.subarray(p,p+mimeLen))||'image/jpeg';p+=mimeLen;const descLen=dv.getUint32(p,false);p+=4+descLen+16;if(p+4>data.length){pos=start+len;continue;}const dLen=dv.getUint32(p,false);p+=4;const img=data.subarray(p,p+dLen);if(img.length>16){try{out.picture=URL.createObjectURL(new Blob([img.slice()],{type:mime}));}catch{}}}pos=start+len;if(last)break;}return out;}

  /* ============================================================
     扫码登录逻辑
     ============================================================ */
  function updateLoginUI() {
    const btn = $('navLoginBtn');
    if (btn) {
      btn.textContent = isLoggedIn ? '退出登录' : '登录';
      btn.classList.toggle('primary', isLoggedIn);
    }
  }

  async function verifyCookie() {
    try {
      const res = await apiFetch(`${API_BASE}/login/status`);
      const data = await res.json();
      if (data.data?.profile?.userId || data.profile?.userId) {
        isLoggedIn = true;
      } else {
        isLoggedIn = false;
        userCookie = '';
        setStorage('netease_cookie', '');
      }
    } catch(e) {
      isLoggedIn = false;
    }
    updateLoginUI();
  }

  $('navLoginBtn').addEventListener('click', () => {
    if (isLoggedIn) {
      if (confirm('确定要退出当前网易云账号吗？')) {
        userCookie = '';
        isLoggedIn = false;
        setStorage('netease_cookie', '');
        updateLoginUI();
        toast('已退出登录');
        loadRecommendPlaylists(); // 刷新歌单
      }
    } else {
      $('loginMask').classList.add('on');
      startQrLogin();
    }
  });

  $('loginClose').addEventListener('click', () => { $('loginMask').classList.remove('on'); stopQrPolling(); });
  $('loginMask').addEventListener('click', e => { if (e.target === $('loginMask')) { $('loginMask').classList.remove('on'); stopQrPolling(); } });
  $('qrRefreshBtn').addEventListener('click', startQrLogin);

  function stopQrPolling() {
    if (qrTimer) { clearInterval(qrTimer); qrTimer = null; }
  }

  async function startQrLogin() {
    stopQrPolling();
    $('qrStatus').textContent = '正在获取二维码...';
    $('qrStatus').className = '';
    $('qrRefreshBtn').style.display = 'none';
    $('qrContainer').innerHTML = '<span style="color:#999;font-size:14px;">加载中...</span>';

    try {
      const keyRes = await fetch(`${API_BASE}/login/qr/key?timestamp=${Date.now()}`);
      const keyData = await keyRes.json();
      if (!keyData.data || !keyData.data.unikey) throw new Error('获取 key 失败');
      qrKey = keyData.data.unikey;

      const createRes = await fetch(`${API_BASE}/login/qr/create?key=${qrKey}&qrimg=true&timestamp=${Date.now()}`);
      const createData = await createRes.json();
      if (!createData.data || !createData.data.qrimg) throw new Error('生成二维码失败');

      $('qrContainer').innerHTML = `<img src="${createData.data.qrimg}" alt="QR" style="width:100%;height:100%;object-fit:contain;">`;
      $('qrStatus').textContent = '请使用网易云音乐 App 扫码';

      startQrPolling();
    } catch (e) {
      $('qrStatus').textContent = '加载失败，请重试';
      $('qrStatus').className = 'error';
      $('qrRefreshBtn').style.display = 'inline-flex';
    }
  }

  function startQrPolling() {
    stopQrPolling();
    qrTimer = setInterval(async () => {
      if (!qrKey) return;
      try {
        const res = await fetch(`${API_BASE}/login/qr/check?key=${qrKey}&timestamp=${Date.now()}`);
        const data = await res.json();
        const code = data.code || data.body?.code;
        
        if (code === 800) {
          stopQrPolling();
          $('qrStatus').textContent = '二维码已过期，请刷新';
          $('qrStatus').className = 'error';
          $('qrRefreshBtn').style.display = 'inline-flex';
        } else if (code === 801) {
          $('qrStatus').textContent = '等待扫码...';
        } else if (code === 802) {
          $('qrStatus').textContent = '已扫码，请在手机上确认';
          $('qrStatus').className = 'success';
        } else if (code === 803) {
          stopQrPolling();
          $('qrStatus').textContent = '登录成功！';
          $('qrStatus').className = 'success';
          
          const ck = data.cookie || data.body?.cookie;
          if (ck) {
            userCookie = Array.isArray(ck) ? ck.join('; ') : ck;
            setStorage('netease_cookie', userCookie);
            isLoggedIn = true;
            updateLoginUI();
            toast('登录成功');
            setTimeout(() => { $('loginMask').classList.remove('on'); loadRecommendPlaylists(); }, 1000);
          }
        }
      } catch(e) {}
    }, 2000);
  }

  /* ============================================================
     渲染
     ============================================================ */
  function renderCards(container, list, isDetail) {
    container.innerHTML = '';
    list.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'card';
      
      const isSong = item.source === 'local' || item.source === 'netease';
      const isPlaying = isSong && cur >= 0 && songs[cur] && songs[cur].nid === item.nid && songs[cur].source === item.source;
      if (isPlaying) card.classList.add('on');
      card.dataset.i = i;

      const actsHtml = isSong && !isDetail ? `
        <div class="card-acts">
          <button class="icon-btn" data-act="lyric" title="导入歌词">${ICON.lyric}</button>
          <button class="icon-btn" data-act="cover" title="设置封面">${ICON.image}</button>
          <button class="icon-btn" data-act="del" title="移除">${ICON.trash}</button>
        </div>
      ` : '';

      const overlayIcon = isSong ? 
        '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>' : 
        '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>';

      card.innerHTML = `
        <div class="card-cover"></div>
        <div class="card-gradient"></div>
        <div class="card-info">
          <div class="card-title">${esc(item.name)}</div>
          <div class="card-artist">${esc(item.artist)}</div>
        </div>
        <div class="card-duration">${item.dur ? fmt(item.dur) : ''}</div>
        <div class="play-overlay"><svg viewBox="0 0 24 24" style="width:22px;height:22px;margin-left:2px;">${overlayIcon}</svg></div>
        ${actsHtml}
      `;

      const coverEl = card.querySelector('.card-cover');
      const fallbackHtml = '<div style="position:absolute;inset:0;display:grid;place-items:center;"><svg class="ic" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>';
      
      if (item.cover) {
        const img = document.createElement('img');
        img.src = item.cover; img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'cover'; img.referrerPolicy = 'no-referrer';
        img.onerror = () => { img.remove(); coverEl.innerHTML = fallbackHtml; };
        coverEl.appendChild(img);
      } else {
        coverEl.innerHTML = fallbackHtml;
      }

      container.appendChild(card);
    });
  }

  function renderGrid() {
    renderCards(gridList, viewList, false);
    $('empty').style.display = viewList.length ? 'none' : 'block';
    if (viewList.length) {
      if (viewType === 'home') $('libSub').textContent = '推荐歌单';
      else if (viewType === 'search') $('libSub').textContent = `搜索结果`;
      else if (viewType === 'local') $('libSub').textContent = `本地音乐`;
    } else {
      $('libSub').textContent = '搜索或导入开始聆听';
    }
  }

  function renderLyrics(){
    const s=songs[cur];lyricIdx=-1;lyricInner.innerHTML='';
    $('breathAnim').classList.remove('on'); $('outroCredit').classList.remove('show'); currentGlobalOffset = 0;
    if(!s||!s.lyrics || !s.lyrics.length){
      lyricInner.innerHTML='<div class="lyric-empty">暂无歌词<span>网易云歌曲自动加载，本地歌曲可导入同名 .lrc 文件</span></div>';
      lyricInner.style.transform='translateY(0)';return;
    }
    s.lyrics.forEach(l=>{
      const d=document.createElement('div');d.className='lyric-line';d.textContent=l.text;
      d.addEventListener('click',()=>{audio.currentTime=l.t;});lyricInner.appendChild(d);
    });
    requestAnimationFrame(()=>{ centerFirst(); applyLineEffects(-2, 0); });
  }

  function applyLineEffects(activeIdx, nextIdx = 0) {
    const lines = lyricInner.children; if (!lines.length) return;
    for (let i = 0; i < lines.length; i++) {
      const el = lines[i]; if (!el.classList.contains('lyric-line')) continue;
      el.classList.remove('active');
      if (activeIdx === -3) { el.style.opacity = '0'; el.style.filter = 'blur(10px)'; el.style.transform = 'scale(0.9)'; el.style.fontWeight = '500'; el.style.textShadow = 'none'; continue; }
      if (activeIdx === -2) {
        if (i < nextIdx) { el.style.opacity = '0'; el.style.filter = 'blur(10px)'; el.style.transform = 'scale(0.9)'; }
        else { const delta = i - nextIdx; el.style.opacity = Math.max(0.2, 0.6 - delta * 0.1); el.style.filter = `blur(${Math.min(8, delta * 1.5 + 2)}px)`; el.style.transform = 'scale(0.92)'; }
        el.style.fontWeight = '500'; el.style.textShadow = 'none'; continue;
      }
      if (i < activeIdx) { el.style.opacity = '0'; el.style.filter = 'blur(8px)'; el.style.transform = 'scale(0.9)'; }
      else if (i === activeIdx) { el.classList.add('active'); el.style.opacity = '1'; el.style.filter = 'none'; el.style.transform = 'scale(var(--lyric-scale, 1.05))'; el.style.fontWeight = '800'; el.style.textShadow = '0 0 30px rgba(255,255,255,0.4)'; }
      else { const delta = i - activeIdx; el.style.opacity = Math.max(0.15, 0.6 - delta * 0.1); el.style.filter = `blur(${Math.min(6, delta * 1.5)}px)`; el.style.transform = 'scale(0.92)'; el.style.fontWeight = '500'; el.style.textShadow = 'none'; }
    }
  }

  function centerFirst(extraOffset = 0){
    if(!lyricWrap.clientHeight)return; const el=lyricInner.firstElementChild;if(!el)return;
    lyricInner.style.transform=`translateY(${lyricWrap.clientHeight/2 - (el.offsetTop+el.offsetHeight/2) + extraOffset - 20}px)`;
  }

  function scrollToLine(idx, extraOffset = 0){
    const el=lyricInner.children[idx]; if(!el||!lyricWrap.clientHeight)return;
    lyricInner.style.transform=`translateY(${lyricWrap.clientHeight/2 - (el.offsetTop+el.offsetHeight/2) + extraOffset - 20}px)`;
  }

  function renderQueue() {
    $('queueCount').textContent = songs.length;
    $('queueList').innerHTML = '';
    songs.forEach((s, i) => {
      const isCur = (i === cur);
      const el = document.createElement('div');
      el.className = 'queue-item' + (isCur ? ' on' : '');
      
      let coverHtml = s.cover ? `<img src="${s.cover}" referrerpolicy="no-referrer">` : `<svg class="ic" viewBox="0 0 24 24" style="width:16px;height:16px;opacity:0.5;"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
      
      el.innerHTML = `
        <div class="queue-item-cover">${coverHtml}</div>
        <div class="queue-item-info">
          <div class="queue-item-name">${esc(s.name)}</div>
          <div class="queue-item-artist">${esc(s.artist)}</div>
        </div>
        <button class="queue-item-del" data-del="${i}" title="移除">
          <svg class="ic" viewBox="0 0 24 24" style="width:14px;height:14px;"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      `;
      
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-del]')) {
          e.stopPropagation();
          songs.splice(i, 1);
          if (cur === i) {
            audio.pause(); audio.removeAttribute('src');
            cur = -1;
            if (songs.length > 0) playSong(Math.min(i, songs.length-1), false);
            else { updateNowPlaying(); syncPlayIcon(); renderGrid(); }
          } else if (cur > i) { cur--; }
          renderQueue(); renderGrid(); updateNowPlaying();
          return;
        }
        playSong(i, false);
      });
      
      $('queueList').appendChild(el);
    });
  }

  /* ============================================================
     接口数据解析
     ============================================================ */
  function showSearchError(msg) { const el = $('searchError'); el.textContent = msg; el.classList.add('show'); }
  function hideSearchError() { $('searchError').classList.remove('show'); }
  function normalizePic(url) { if (!url) return ''; let u = url.replace(/^http:/, 'https:'); if (u.startsWith('//')) u = 'https:' + u; return u; }

  async function loadRecommendPlaylists() {
    hideSearchError();
    try {
      // 推荐歌单接口，登录后有可能会推荐个性化内容
      const res = await apiFetch(`${API_BASE}/personalized?limit=30`);
      const data = await res.json();
      if (data.result) {
        viewList = data.result.map(p => ({
          id: ++uid, nid: p.id, name: p.name, artist: `歌单 · ${formatNum(p.playCount)} 播放`,
          cover: normalizePic(p.picUrl), hasExternalCover: true, lyrics: [], dur: 0, source: 'playlist'
        }));
        viewType = 'home';
        renderGrid();
      }
    } catch(e) { showSearchError('获取推荐歌单失败，请检查网络。'); }
  }

  async function doSearch() {
    const kw = $('searchInput').value.trim();
    if (!kw) { viewType = 'home'; loadRecommendPlaylists(); return; }
    hideSearchError();
    const btn = $('searchBtn'); btn.disabled = true; const oldText = btn.textContent; btn.textContent = '搜索中...';

    try {
      let typeParam = 1;
      if (searchType === 'playlist') typeParam = 1000;
      else if (searchType === 'album') typeParam = 10;
      else if (searchType === 'artist') typeParam = 100;

      const res = await apiFetch(`${API_BASE}/search?keywords=${encodeURIComponent(kw)}&type=${typeParam}&limit=30`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      viewType = 'search';
      if (searchType === 'song') {
        const list = (data.result && (data.result.songs || data.result.song)) || [];
        viewList = list.map(s => {
          const artists = (s.ar || s.artists || []).map(a => a.name).join(' / ') || '未知';
          const albumName = (s.al && s.al.name) || (s.album && s.album.name) || '';
          let rawPic = (s.al && s.al.picUrl) || (s.album && s.album.picUrl) || '';
          const pic = normalizePic(rawPic);
          return {
            id: ++uid, nid: s.id, name: s.name || '未知歌曲', artist: albumName ? `${artists} · ${albumName}` : artists,
            url: null, cover: pic || null, hasExternalCover: !!pic, lyrics: [], dur: (s.dt || s.duration || 0) / 1000, base: '', source: 'netease'
          };
        });
      } else if (searchType === 'playlist') {
        const list = (data.result && data.result.playlists) || [];
        viewList = list.map(p => ({
          id: ++uid, nid: p.id, name: p.name, artist: `歌单 · ${p.creator?.nickname || '未知'}`,
          cover: normalizePic(p.coverImgUrl), hasExternalCover: true, lyrics: [], dur: 0, source: 'playlist'
        }));
      } else if (searchType === 'album') {
        const list = (data.result && data.result.albums) || [];
        viewList = list.map(p => ({
          id: ++uid, nid: p.id, name: p.name, artist: `专辑 · ${p.artist?.name || '未知'}`,
          cover: normalizePic(p.picUrl), hasExternalCover: true, lyrics: [], dur: 0, source: 'album'
        }));
      } else if (searchType === 'artist') {
        const list = (data.result && data.result.artists) || [];
        viewList = list.map(p => ({
          id: ++uid, nid: p.id, name: p.name, artist: `歌手 · ${(p.alias || []).join(' / ') || '热门歌曲'}`,
          cover: normalizePic(p.picUrl || p.img1v1Url), hasExternalCover: true, lyrics: [], dur: 0, source: 'artist'
        }));
      }

      if (!viewList.length) { showSearchError('没有搜索到结果，请换个关键词试试'); return; }

      renderGrid();
      toast(`已加载 ${viewList.length} 个结果`);
      
      if (searchType === 'song') {
        const noPicSongs = viewList.filter(s => !s.cover);
        if (noPicSongs.length > 0) fetchSongDetails(noPicSongs);
      }
    } catch (e) {
      showSearchError('搜索失败：' + e.message);
    } finally {
      btn.disabled = false; btn.textContent = oldText;
    }
  }

  async function fetchSongDetails(songsToUpdate) {
    if (!songsToUpdate.length) return;
    const ids = songsToUpdate.slice(0, 50).map(s => s.nid).join(',');
    try {
      const res = await apiFetch(`${API_BASE}/song/detail?ids=${ids}`);
      const data = await res.json();
      if (data && data.songs && data.songs.length) {
        let updated = false;
        data.songs.forEach(ds => {
          const target = viewList.find(s => s.nid === ds.id);
          if (target && !target.cover) {
            let rawPic = (ds.al && ds.al.picUrl) || (ds.album && ds.album.picUrl) || '';
            const pic = normalizePic(rawPic);
            if (pic) { target.cover = pic; updated = true; }
          }
        });
        if (updated) renderGrid();
      }
    } catch(e) {}
  }

  async function fetchDetailCovers(songsToUpdate) {
    const ids = songsToUpdate.slice(0, 50).map(s => s.nid).join(',');
    try {
      const res = await apiFetch(`${API_BASE}/song/detail?ids=${ids}`);
      const data = await res.json();
      if (data && data.songs && data.songs.length) {
        let updated = false;
        data.songs.forEach(ds => {
          const target = detailSongs.find(s => s.nid === ds.id);
          if (target && !target.cover) {
            let rawPic = (ds.al && ds.al.picUrl) || (ds.album && ds.album.picUrl) || '';
            const pic = normalizePic(rawPic);
            if (pic) { target.cover = pic; updated = true; }
          }
        });
        if (updated) renderCards(detailGridList, detailSongs, true);
      }
    } catch(e) {}
  }

  async function loadDetailView(item) {
    currentDetailCover = item.cover; 
    setView('detail');
    
    $('detailSub').textContent = '加载中...';
    $('detailName').textContent = item.name;
    $('detailNavTitle').textContent = item.name; // 同步详情页导航栏标题
    $('detailDesc').textContent = item.artist;
    if (item.cover) $('detailCover').src = item.cover;
    else $('detailCover').removeAttribute('src');
    detailGridList.innerHTML = '';
    detailSongs = [];
    
    if (bgMode === 'cover') updateGlobalBg(item.cover);
    
    try {
      let apiUrl = '';
      if (item.source === 'playlist') apiUrl = `${API_BASE}/playlist/track/all?id=${item.nid}&limit=1000`;
      else if (item.source === 'album') apiUrl = `${API_BASE}/album?id=${item.nid}`;
      else if (item.source === 'artist') apiUrl = `${API_BASE}/artists?id=${item.nid}`;
      
      const res = await apiFetch(apiUrl);
      const data = await res.json();
      let rawSongs = [];
      if (item.source === 'playlist' && data.songs) rawSongs = data.songs;
      else if (item.source === 'album' && data.songs) rawSongs = data.songs;
      else if (item.source === 'artist' && data.hotSongs) rawSongs = data.hotSongs;
      
      if (!rawSongs || !rawSongs.length) {
        toast('该列表暂无歌曲'); $('detailSub').textContent = '0 首歌曲'; return;
      }
      
      detailSongs = rawSongs.map(s => {
        const artists = (s.ar || s.artists || []).map(a => a.name).join(' / ') || '未知';
        const albumName = (s.al && s.al.name) || (s.album && s.album.name) || '';
        let rawPic = (s.al && s.al.picUrl) || (s.album && s.album.picUrl) || '';
        const pic = normalizePic(rawPic);
        return {
          id: ++uid, nid: s.id, name: s.name || '未知歌曲',
          artist: albumName ? `${artists} · ${albumName}` : artists,
          url: null, cover: pic || null, hasExternalCover: !!pic,
          lyrics: [], dur: (s.dt || s.duration || 0) / 1000, base: '', source: 'netease'
        };
      });
      
      $('detailSub').textContent = `${detailSongs.length} 首歌曲`;
      renderCards(detailGridList, detailSongs, true);
      
      const noPicSongs = detailSongs.filter(s => !s.cover);
      if (noPicSongs.length) fetchDetailCovers(noPicSongs);
      
    } catch (e) {
      toast('加载详情失败：' + e.message);
      $('detailSub').textContent = '加载失败';
    }
  }

  async function loadNeteaseLyric(song) {
    if (!song || song.source !== 'netease' || song._lyricLoaded) return;
    song._lyricLoaded = true;
    try {
      const res = await apiFetch(`${API_BASE}/lyric?id=${song.nid}`);
      const data = await res.json();
      if (data && data.lrc && data.lrc.lyric) {
        const lines = parseLrc(data.lrc.lyric);
        if (lines.length) song.lyrics = lines;
      }
    } catch(e) { song._lyricLoaded = false; }
  }

  /* ============================================================
     交互与播放控制
     ============================================================ */
  $('detailBackBtn').addEventListener('click', () => setView('lib'));
  $('queueBtn').addEventListener('click', () => { renderQueue(); $('queueMask').classList.add('on'); });
  $('queueClose').addEventListener('click', () => $('queueMask').classList.remove('on'));
  $('queueMask').addEventListener('click', e => { if (e.target === $('queueMask')) $('queueMask').classList.remove('on'); });
  $('queueClear').addEventListener('click', () => {
    songs = []; cur = -1; audio.pause(); audio.removeAttribute('src');
    renderQueue(); updateNowPlaying(); renderGrid(); syncPlayIcon(); toast('已清空队列');
  });

  gridList.addEventListener('click', async e => {
    const card = e.target.closest('.card'); if (!card) return;
    const i = +card.dataset.i; const item = viewList[i];
    
    const actEl = e.target.closest('[data-act]');
    if (actEl) {
      e.stopPropagation();
      const act = actEl.dataset.act;
      if (act === 'del') {
        viewList.splice(i, 1); renderGrid();
      } else if (act === 'lyric') { targetSongId = item.id; $('lyricInput').click(); }
      else if (act === 'cover') { targetSongId = item.id; $('coverInput').click(); }
      return;
    }
    
    if (item.source === 'playlist' || item.source === 'album' || item.source === 'artist') {
      loadDetailView(item);
    } else {
      const songList = viewList.filter(x => x.source === 'local' || x.source === 'netease');
      const playIdx = songList.findIndex(x => x.nid === item.nid && x.source === item.source);
      if (playIdx !== -1) {
        songs = songList;
        playSong(playIdx, true);
        if ($('queueMask').classList.contains('on')) renderQueue();
      }
    }
  });

  detailGridList.addEventListener('click', e => {
    const card = e.target.closest('.card'); if (!card) return;
    const i = +card.dataset.i;
    songs = [...detailSongs];
    playSong(i, true);
    if ($('queueMask').classList.contains('on')) renderQueue();
  });

  $('detailPlayAll').addEventListener('click', () => {
    if (!detailSongs.length) return;
    songs = [...detailSongs];
    playSong(0, true);
    if ($('queueMask').classList.contains('on')) renderQueue();
  });

  async function playSong(i, openUI) {
    if (i < 0 || i >= songs.length) return;
    const song = songs[i];
    cur = i;
    
    if (bgMode === 'random') {
      currentRandomBgUrl = `https://api.yppp.net/pc.php?t=${Date.now()}`;
    }
    
    updateNowPlaying();
    if (openUI) setView('player');
    renderLyrics(); renderGrid();

    if (song.source === 'netease' && !song.url) {
      if (song.loading) return; 
      song.loading = true;
      lyricInner.innerHTML = '<div class="lyric-empty">正在获取播放链接...</div>';

      try {
        // 获取歌曲 URL 时带上登录 Cookie，可以解锁高音质和 VIP 歌曲
        const res = await apiFetch(`${API_BASE}/song/url/v1?id=${song.nid}&level=exhigh`);
        const data = await res.json();
        if (cur !== i) { song.loading = false; return; }

        const info = data && data.data && data.data[0];
        if (!info || !info.url) {
          toast('该歌曲暂不可播放（可能需要 VIP 或无版权）');
          lyricInner.innerHTML = '<div class="lyric-empty">该歌曲暂不可播放</div>';
          song.loading = false; return;
        }
        song.url = info.url.replace(/^http:/, 'https:');
        if (info.time) song.dur = info.time / 1000;
        song.loading = false;
        loadNeteaseLyric(song).then(() => { if (songs[cur] === song) renderLyrics(); });
      } catch (e) {
        if (cur !== i) return;
        toast('获取播放链接失败：' + e.message);
        lyricInner.innerHTML = '<div class="lyric-empty">加载失败</div>';
        song.loading = false; return;
      }
    }

    if (cur !== i) return;
    audio.src = song.url;
    audio.play().catch(()=>{});
    updateNowPlaying(); renderGrid();
  }

  function updateNowPlaying(){
    const s = (cur >= 0 && cur < songs.length) ? songs[cur] : null;
    const name = s ? s.name : '未播放';
    const artist = s ? s.artist : '网易云音乐';
    const cov = s && s.cover;

    $('sideName').textContent = name;
    $('sideArtist').textContent = artist;
    $('miniName').textContent = name;
    $('miniArtist').textContent = artist;
    $('outroCredit').textContent = s ? `${s.name} - ${s.artist}` : '';

    updateGlobalBg(cov);

    $('coverImg').style.backgroundImage = cov ? `url("${cov}")` : '';
    $('coverFallback').style.display = cov ? 'none' : 'grid';

    const mc = $('miniCover');
    mc.style.backgroundImage = cov ? `url("${cov}")` : '';
    mc.innerHTML = cov ? '' : '<svg class="ic" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';

    if (!playerView.classList.contains('on') && s) mini.classList.add('show');
  }

  function syncPlayIcon(){
    const playing = !audio.paused && audio.src;
    const icon = playing ? ICON.pause : ICON.play;
    const playBtn = $('playBtn');
    const miniPlay = $('miniPlay');
    if (playBtn.innerHTML !== icon) {
      playBtn.innerHTML = icon;
      miniPlay.innerHTML = icon;
      const svg1 = playBtn.querySelector('svg');
      const svg2 = miniPlay.querySelector('svg');
      if (svg1) { svg1.classList.remove('animate-icon'); void svg1.offsetWidth; svg1.classList.add('animate-icon'); }
      if (svg2) { svg2.classList.remove('animate-icon'); void svg2.offsetWidth; svg2.classList.add('animate-icon'); }
    }
  }

  function togglePlay(){
    if(cur < 0){ if(songs.length) playSong(0,false); return; }
    if(!audio.src){ playSong(cur,false); return; }
    audio.paused ? audio.play().catch(()=>{}) : audio.pause();
  }

  function step(dir){
    if(!songs.length) return;
    if(mode==='shuffle' && dir>0){
      if(songs.length===1){ playSong(cur,false); return; }
      let n; do { n = Math.floor(Math.random()*songs.length); } while(n===cur);
      playSong(n,false); return;
    }
    let n = cur + dir;
    if(n >= songs.length) n = 0;
    if(n < 0) n = songs.length - 1;
    playSong(n,false);
  }

  function onEnded(){
    if(mode==='one'){ audio.currentTime=0; audio.play().catch(()=>{}); return; }
    if(!songs.length) return;
    if(mode==='shuffle'){ step(1); return; }
    playSong(cur===songs.length-1?0:cur+1,false);
  }

  function updateProgress(){
    const d=audio.duration||0,t=audio.currentTime||0,p=d?Math.min(1,t/d):0;
    if(!dragging){ barFill.style.width=(p*100)+'%'; barDot.style.left=(p*100)+'%'; }
    $('curTime').textContent = fmt(t);
    $('durTime').textContent = d ? fmt(d) : '0:00';
  }

  function updateLyric(){
    const s = (cur >= 0 && cur < songs.length) ? songs[cur] : null;
    if(!s || !s.lyrics || !s.lyrics.length) return;
    const t = audio.currentTime;
    const lines = s.lyrics;
    let idx = -1;
    for(let i=0;i<lines.length;i++){ if(lines[i].t <= t) idx = i; else break; }
    let isInterlude = false, isOutro = false, displayIdx = idx, nextFocusIdx = 0;
    if(idx === -1){
      if(t < lines[0].t - 1){ isInterlude = true; displayIdx = -2; nextFocusIdx = 0; }
      else { displayIdx = 0; }
    } else if(idx >= 0){
      let isCurrentInterlude = false;
      const isLastLine = (idx === lines.length - 1);
      const nextT = isLastLine ? (audio.duration || Infinity) : lines[idx+1].t;
      const gap = nextT - lines[idx].t;
      if (isLastLine) {
        const lineEnd = lines[idx].endT || (lines[idx].t + 10);
        if (t > lineEnd) { isCurrentInterlude = true; isOutro = true; }
      } else {
        const isMark = lines[idx].text.includes('间奏') || lines[idx].text.includes('纯音乐');
        if (isMark || gap > 20) {
          let interludeStartT = lines[idx].endT || (lines[idx].t + 10);
          if (t > interludeStartT && t < nextT - 1) { isCurrentInterlude = true; nextFocusIdx = idx + 1; }
        }
      }
      if (isCurrentInterlude) { isInterlude = true; displayIdx = isOutro ? -3 : -2; }
      else { if (idx < lines.length - 1 && t >= lines[idx+1].t - 1) displayIdx = idx + 1; }
    }
    const breathEl = $('breathAnim'), outroEl = $('outroCredit');
    if (isInterlude) breathEl.classList.add('on'); else breathEl.classList.remove('on');
    if (isOutro) outroEl.classList.add('show'); else outroEl.classList.remove('show');
    if(displayIdx === lyricIdx) return;
    lyricIdx = displayIdx;
    if(lyricIdx === -3){ applyLineEffects(-3, lines.length - 1); scrollToLine(lines.length - 1, 0); }
    else if (lyricIdx === -2){ applyLineEffects(-2, nextFocusIdx); scrollToLine(nextFocusIdx, 80); }
    else { applyLineEffects(lyricIdx); if(lyricIdx >= 0) scrollToLine(lyricIdx, 0); }
  }

  function updateFsIcon(){
    const on = !!document.fullscreenElement;
    $('fsBtn').innerHTML = on ? ICON.fsExit : ICON.fs;
  }

  function toggleFullscreen(){
    if(!document.fullscreenElement){
      const el = document.documentElement;
      (el.requestFullscreen||el.webkitRequestFullscreen||el.msRequestFullscreen).call(el).catch(()=>{});
    } else {
      (document.exitFullscreen||document.webkitExitFullscreen||document.msExitFullscreen).call(document).catch(()=>{});
    }
  }

  /* ============================================================
     导入逻辑
     ============================================================ */
  const importMask=$('importMask'), modalBody=$('modalBody');
  let pending={audio:[],lyric:[],cover:[]};
  const AUDIO_EXT=['mp3','flac','wav','ogg','oga','m4a','aac','opus','webm','aiff','aif'],IMG_EXT=['jpg','jpeg','png','webp','gif','bmp','avif'];

  function classify(files){
    const r={audio:[],lyric:[],cover:[]};
    [...files].forEach(f=>{
      const ext=(f.name.split('.').pop()||'').toLowerCase();
      if(f.type.startsWith('audio/')||AUDIO_EXT.includes(ext))r.audio.push(f);
      else if(ext==='lrc')r.lyric.push(f);
      else if(f.type.startsWith('image/')||IMG_EXT.includes(ext))r.cover.push(f);
    });
    return r;
  }

  const DESC_DEFAULT={audio:'MP3 / FLAC / WAV / M4A / OGG…',lyric:'.lrc 歌词，按文件名匹配',cover:'JPG / PNG / WEBP，留空读取内嵌封面'};

  function updatePendingUI(){
    ['audio','lyric','cover'].forEach(kind=>{
      const row=modalBody.querySelector(`[data-kind="${kind}"]`),desc=modalBody.querySelector(`[data-desc="${kind}"]`),arr=pending[kind];
      row.classList.toggle('has',arr.length>0);
      if(!arr.length)desc.textContent=DESC_DEFAULT[kind];
      else if(arr.length===1)desc.textContent=arr[0].name;
      else desc.textContent=`${arr[0].name} 等 ${arr.length} 个文件`;
    });
  }

  function openModal(){pending={audio:[],lyric:[],cover:[]};updatePendingUI();modalBody.classList.remove('drag');importMask.classList.add('on');}
  function closeModal(){importMask.classList.remove('on');}

  $('openImport').addEventListener('click',openModal);
  $('modalClose').addEventListener('click',closeModal);
  $('modalCancel').addEventListener('click',closeModal);
  importMask.addEventListener('click',e=>{if(e.target===importMask)closeModal();});

  modalBody.addEventListener('click',e=>{
    const pickBtn=e.target.closest('[data-pick]');
    if(pickBtn){
      const kind=pickBtn.dataset.pick;
      const map={audio:'audioPickInput',lyric:'lyricPickInput',cover:'coverPickInput'};
      if(map[kind]) $(map[kind]).click();
      return;
    }
    const clearBtn=e.target.closest('[data-clear]');
    if(clearBtn){pending[clearBtn.dataset.clear]=[];updatePendingUI();}
  });

  $('audioPickInput').addEventListener('change',e=>{const c=classify(e.target.files);pending.audio.push(...c.audio);pending.lyric.push(...c.lyric);pending.cover.push(...c.cover);e.target.value='';updatePendingUI();});
  $('lyricPickInput').addEventListener('change',e=>{pending.lyric.push(...e.target.files);e.target.value='';updatePendingUI();});
  $('coverPickInput').addEventListener('change',e=>{pending.cover.push(...e.target.files);e.target.value='';updatePendingUI();});

  modalBody.addEventListener('dragover',e=>{e.preventDefault();modalBody.classList.add('drag');});
  modalBody.addEventListener('dragleave',e=>{if(!modalBody.contains(e.relatedTarget))modalBody.classList.remove('drag');});
  modalBody.addEventListener('drop',e=>{e.preventDefault();modalBody.classList.remove('drag');const c=classify(e.dataTransfer.files);pending.audio.push(...c.audio);pending.lyric.push(...c.lyric);pending.cover.push(...c.cover);updatePendingUI();});

  $('modalConfirm').addEventListener('click',async()=>{
    const {audio:audios,lyric:lrcs,cover:imgs}=pending;
    if(!audios.length&&!lrcs.length&&!imgs.length){toast('请至少选择一个文件');return;}
    closeModal();await doImport(audios,lrcs,imgs);
  });

  async function doImport(audios,lrcs,imgs){
    const created=[];
    for(const af of audios){
      const song={ id: ++uid, name: baseName(af.name) || af.name, artist: '本地音乐', url: URL.createObjectURL(af), cover: null, hasExternalCover: false, lyrics: [], dur: 0, base: baseName(af.name), source: 'local' };
      songs.push(song);created.push(song);
      const probe=new Audio();probe.preload='metadata';probe.src=song.url;
      probe.addEventListener('loadedmetadata',()=>{song.dur=probe.duration;probe.src='';renderGrid();},{once:true});
      readTags(af).then(tags=>{
        if(tags.title)song.name=tags.title;
        if(tags.artist)song.artist=tags.artist;
        if(tags.picture&&!song.hasExternalCover)song.cover=tags.picture;
        renderGrid();
        if(songs[cur]&&songs[cur].id===song.id){updateNowPlaying();renderLyrics();}
      });
    }

    const assignCover=(song,url)=>{if(!song)return;song.cover=url;song.hasExternalCover=true;};

    if(created.length===1){
      const only=created[0];
      if(imgs.length)assignCover(only,URL.createObjectURL(imgs[0]));
      for(const lf of lrcs){try{const lines=parseLrc(await lf.text());if(lines.length){only.lyrics=lines;break;}}catch{}}
    } else {
      for(const imf of imgs){const b=baseName(imf.name),s=created.find(x=>x.base===b&&!x.hasExternalCover);if(s)assignCover(s,URL.createObjectURL(imf));}
      for(const lf of lrcs){const b=baseName(lf.name),s=created.find(x=>x.base===b&&!x.lyrics.length);if(!s)continue;try{const lines=parseLrc(await lf.text());if(lines.length)s.lyrics=lines;}catch{}}
    }

    if(!audios.length&&cur>=0){
      const cs=songs[cur];
      if(imgs.length&&!cs.hasExternalCover)assignCover(cs,URL.createObjectURL(imgs[0]));
      if(!cs.lyrics.length){for(const lf of lrcs){try{const lines=parseLrc(await lf.text());if(lines.length){cs.lyrics=lines;break;}}catch{}}}
    }

    renderGrid();
    if(cur===-1&&created.length) playSong(songs.indexOf(created[0]),false);
    else if(cur>=0){updateNowPlaying();renderLyrics();}
    const added=created.length;
    if(added)toast(`已导入 ${added} 首歌曲`);else toast('已更新当前歌曲');
  }

  $('lyricInput').addEventListener('change',e=>{
    const f=e.target.files[0];e.target.value='';if(!f)return;
    const song=songs.find(s=>s.id===targetSongId);if(!song)return;
    const reader=new FileReader();
    reader.onload=()=>{
      const lines=parseLrc(String(reader.result));
      if(!lines.length){toast('没有解析到有效的歌词行');return;}
      song.lyrics=lines;
      if(songs[cur]&&songs[cur].id===song.id)renderLyrics();
      renderGrid();toast('歌词已更新');
    };
    reader.readAsText(f,'utf-8');
  });

  $('coverInput').addEventListener('change',e=>{
    const f=e.target.files[0];e.target.value='';if(!f)return;
    const song=songs.find(s=>s.id===targetSongId);if(!song)return;
    const reader=new FileReader();
    reader.onload=()=>{
      song.cover=reader.result; song.hasExternalCover=true;
      if(songs[cur]&&songs[cur].id===song.id)updateNowPlaying();
      renderGrid();toast('封面已更新');
    };
    reader.readAsDataURL(f);
  });

  $('backBtn').addEventListener('click',()=>{
    if (prevView === 'detail') setView('detail');
    else setView('lib');
  });
  $('playBtn').addEventListener('click',togglePlay);
  $('miniPlay').addEventListener('click',e=>{e.stopPropagation();togglePlay();});
  $('prevBtn').addEventListener('click',()=>step(-1));
  $('nextBtn').addEventListener('click',()=>step(1));
  $('miniNext').addEventListener('click',e=>{e.stopPropagation();step(1);});
  $('fsBtn').addEventListener('click',toggleFullscreen);
  document.addEventListener('fullscreenchange',updateFsIcon);
  document.addEventListener('webkitfullscreenchange',updateFsIcon);
  mini.addEventListener('click',e=>{if(e.target.closest('button'))return;if(cur>=0)setView('player');});

  const MODES=[
    {key:'loop',icon:ICON.loop,title:'列表循环'},
    {key:'one',icon:ICON.one,title:'单曲循环'},
    {key:'shuffle',icon:ICON.shuffle,title:'随机播放'}
  ];
  function syncMode(){
    const m=MODES.find(x=>x.key===mode),btn=$('modeBtn');
    btn.innerHTML=m.icon;btn.title=m.title;btn.classList.toggle('on',mode!=='loop');
  }
  $('modeBtn').addEventListener('click',()=>{
    const idx=MODES.findIndex(x=>x.key===mode);
    mode=MODES[(idx+1)%MODES.length].key;
    syncMode();
  });

  const progressEl=$('progress');
  function seekAt(clientX){
    const r=progressEl.getBoundingClientRect(),p=Math.min(1,Math.max(0,(clientX-r.left)/r.width));
    barFill.style.width=(p*100)+'%';barDot.style.left=(p*100)+'%';
    $('curTime').textContent=fmt(p*(audio.duration||0));
    if(audio.duration)audio.currentTime=p*audio.duration;
  }
  progressEl.addEventListener('pointerdown',e=>{if(!audio.duration)return;dragging=true;progressEl.setPointerCapture(e.pointerId);seekAt(e.clientX);});
  progressEl.addEventListener('pointermove',e=>{if(dragging)seekAt(e.clientX);});
  progressEl.addEventListener('pointerup',e=>{dragging=false;try{progressEl.releasePointerCapture(e.pointerId);}catch{}});

  const volRange=$('volRange');
  volRange.addEventListener('input',()=>{
    audio.volume = volRange.value / 100;
    audio.muted = false; syncVolIcon();
  });
  $('muteBtn').addEventListener('click',(e)=>{ e.stopPropagation(); $('volPop').classList.toggle('on'); });
  document.addEventListener('click', e => {
    if (!e.target.closest('.volume-wrapper')) $('volPop').classList.remove('on');
  });

  function syncVolIcon(){
    $('muteBtn').innerHTML = (audio.muted || audio.volume === 0) ? ICON.mute : ICON.sound;
  }

  let rafId = null;
  audio.addEventListener('timeupdate', () => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      updateProgress(); updateLyric(); rafId = null;
    });
  });
  audio.addEventListener('loadedmetadata',()=>{$('durTime').textContent=fmt(audio.duration);});
  audio.addEventListener('play',syncPlayIcon);
  audio.addEventListener('pause',syncPlayIcon);
  audio.addEventListener('ended',onEnded);
  audio.addEventListener('error', () => {
    const s = (cur >= 0 && cur < songs.length) ? songs[cur] : null;
    if (s && s.source === 'netease') toast('音频加载失败，可能受版权限制或链接过期');
  });

  let rzTimer;
  window.addEventListener('resize',()=>{
    clearTimeout(rzTimer);
    rzTimer=setTimeout(()=>{
      if(lyricIdx>=0)scrollToLine(lyricIdx,currentGlobalOffset);
      else centerFirst(currentGlobalOffset);
    },150);
  });

  document.addEventListener('keydown',e=>{
    if(e.target.tagName==='INPUT')return;
    if(e.key==='Escape'){
      if(importMask.classList.contains('on')){closeModal();return;}
      if($('loginMask').classList.contains('on')){$('loginMask').classList.remove('on');stopQrPolling();return;}
      if($('queueMask').classList.contains('on')){$('queueMask').classList.remove('on');return;}
      if(playerView.classList.contains('on')){
        if (prevView === 'detail') setView('detail');
        else setView('lib');
        return;
      }
      if(detailView.classList.contains('on')){setView('lib');return;}
      return;
    }
    if(importMask.classList.contains('on')||$('queueMask').classList.contains('on')||$('loginMask').classList.contains('on'))return;
    if(e.code==='Space'){e.preventDefault();togglePlay();}
    else if(e.code==='ArrowRight'&&playerView.classList.contains('on')){e.preventDefault();step(1);}
    else if(e.code==='ArrowLeft'&&playerView.classList.contains('on')){e.preventDefault();step(-1);}
  });

  /* ============================================================
     初始化
     ============================================================ */
  audio.volume=0.8;
  syncMode();
  syncVolIcon();
  syncPlayIcon();
  updateFsIcon();
  renderGrid();
  updateNowPlaying();
  switchTab(0);
  
  $('searchBtn').addEventListener('click', doSearch);
  $('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); doSearch(); }
  });

  // 初始加载推荐歌单
  loadRecommendPlaylists();
});