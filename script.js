*{
  margin:0;padding:0;box-sizing:border-box;
  -webkit-user-drag: none !important; 
  user-select: none !important; 
  -webkit-user-select: none !important;
}
:root{
  --bg:#050505; --panel:#141418; --panel2:#1d1d23; 
  --line:rgba(255,255,255,.07); --text:#ffffff;
  --muted:#a3a3ad;
  --accent:#ffffff;
  --bg-blur: 50px;
  --bg-dark: 0.25;
  --current-bg: none;
  
  --lyric-size: clamp(20px, 2.5vw, 32px);
  --lyric-spacing: 1.5;
  --lyric-scale: 1.05;
}
html, body{
  height:100%;
  width:100%;
  overflow:hidden;
  overscroll-behavior: none; 
  background:var(--bg);
  color:var(--text);
  font:15px/1.5 system-ui,-apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;
  -webkit-font-smoothing:antialiased;
}
svg{display:block} button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
.ic{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}

.app{position:fixed;inset:0;overflow:hidden;z-index:1;}

/* ============================================================
   背景层与遮罩层
   ============================================================ */
.bg-layer {
  position: absolute; inset: -100px; z-index: 0;
  background-image: var(--current-bg);
  background-position: center; background-size: cover;
  filter: blur(var(--bg-blur)) saturate(1.4);
  opacity: 0.6;
  transition: background-image 0.4s ease, filter 0.3s, opacity 0.3s;
  pointer-events: none;
}
.bg-overlay {
  position: absolute; inset: 0; z-index: 1;
  background: rgba(5,5,5, var(--bg-dark));
  transition: background 0.3s;
  pointer-events: none;
}

audio { display: none !important; width: 0 !important; height: 0 !important; }

/* 视图切换 */
.view{position:absolute;inset:0;display:flex;flex-direction:column;opacity:0;pointer-events:none;transition:opacity .32s ease,transform .38s cubic-bezier(.22,.61,.36,1); z-index:2;}
#libView{transform:scale(.985);overflow:hidden;padding:0;display:block;}
#libView.on{opacity:1;pointer-events:auto;transform:none}
#playerView{transform:translateY(20px);z-index:20;overflow:hidden;background:transparent}
#playerView.on{opacity:1;pointer-events:auto;transform:none}

/* ============================================================
   顶部导航栏 (主页浮动穿透 + 30%渐变 + 模糊)
   ============================================================ */
.navbar {
  position: absolute; /* 主页导航栏浮动，让内容可以从下方穿过 */
  top: 0; left: 0; width: 100%; 
  height: 80px;
  z-index: 100; 
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 40px;
  background: transparent;
  border-bottom: none;
}
/* 黑色渐变遮罩：从上到下 30% 到 0 */
.navbar::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%);
  pointer-events: none;
}
/* 毛玻璃模糊层：专门处理下方滚动内容的模糊 */
.navbar::after {
  content: '';
  position: absolute;
  inset: -10px 0 0 0;
  z-index: -2;
  background: rgba(0, 0, 0, 0.01); /* 极淡底色强制触发合成层 */
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, black 30%, transparent 100%);
  pointer-events: none;
}

.nav-left { display: flex; align-items: center; gap: 12px; z-index: 2; pointer-events: auto; }
.brand-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; box-shadow: 0 2px 10px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); }
.brand-info { display: flex; flex-direction: column; }
.brand-name { font-size: 18px; font-weight: 750; letter-spacing: -0.01em; color: var(--accent); transition: color 0.3s; }
.brand-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }

/* 中心 Tab */
.nav-center {
  position: absolute; left: 50%; transform: translateX(-50%);
  display: flex; background: rgba(255,255,255,0.06); padding: 6px; border-radius: 100px;
  border: 1px solid rgba(255,255,255,0.08); box-shadow: inset 0 1px 2px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.2);
  z-index: 1; pointer-events: auto;
}
.nav-indicator {
  position: absolute; top: 6px; bottom: 6px; left: 0; background: var(--accent); border-radius: 100px;
  transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), width 0.35s cubic-bezier(0.22,1,0.36,1); z-index: 0;
}
.nav-tab {
  padding: 10px 32px; border-radius: 100px; font-size: 14px; font-weight: 600; color: var(--muted);
  transition: color 0.3s; position: relative; z-index: 1; background: transparent; cursor: pointer;
}
.nav-tab:hover { color: #fff; }
.nav-tab.active { color: #000; }

.nav-right { display: flex; gap: 12px; align-items: center; z-index: 2; pointer-events: auto; }

/* ============================================================
   详情页导航栏专用样式 (离顶部 30px + 显示标题)
   ============================================================ */
.detail-nav {
  position: sticky; /* 详情页内部滚动时吸顶 */
  top: 0;
  padding-top: 30px; /* 距离顶部 30px */
  height: 110px; /* 80px 基础高度 + 30px */
}
.detail-nav-title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin-left: 8px;
  max-width: 400px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0;
  transform: translateX(-10px);
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}
#detailView.on .detail-nav-title {
  opacity: 1;
  transform: translateX(0);
  transition-delay: 0.15s;
}

/* ============================================================
   Tab 滑动容器与内容区 (全屏穿模)
   ============================================================ */
.tab-viewport { 
  position: absolute; top: 0; left: 0;
  overflow: hidden; width: 100%; height: 100%; 
}
.tab-slider { display: flex; width: 300%; height: 100%; transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1); }
.tab-content {
  width: 33.3333%; flex-shrink: 0; overflow-y: auto; 
  padding: 112px 40px 110px; /* 顶部留白 112px，防止被浮动导航栏遮挡 */
  position: relative;
}
.tab-content > * { max-width: 1600px; margin-left: auto; margin-right: auto; }
.tab-content::-webkit-scrollbar { width: 6px; display: block; }
.tab-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }

/* ============================================================
   搜索栏
   ============================================================ */
.search-bar {
  display: flex; gap: 12px; margin-bottom: 20px;
  position: relative; z-index: 5; width: 100%;
}
.search-bar input {
  flex: 1; padding: 14px 20px; border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  color: #fff; font-size: 14px; outline: none;
  transition: border-color 0.25s, background 0.25s;
}
.search-bar input::placeholder { color: rgba(255,255,255,0.35); }
.search-bar input:focus { border-color: var(--accent); background: rgba(255,255,255,0.09); }
.search-bar button {
  padding: 14px 32px; border-radius: 16px; border: none;
  background: var(--accent); color: #000; font-weight: 650; font-size: 14px;
  white-space: nowrap; transition: transform 0.2s, filter 0.2s;
}
.search-bar button:hover { filter: brightness(0.92); transform: translateY(-1px); }
.search-bar button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.search-tabs {
  display: flex; gap: 12px; margin-bottom: 28px;
  position: relative; z-index: 5;
}
.search-tab {
  padding: 8px 20px; border-radius: 24px;
  background: rgba(255,255,255,0.06); color: var(--muted);
  font-size: 13px; font-weight: 500; cursor: pointer;
  transition: all 0.2s; border: 1px solid rgba(255,255,255,0.08);
}
.search-tab:hover { background: rgba(255,255,255,0.12); color: #fff; }
.search-tab.active { background: var(--accent); color: #000; border-color: transparent; }

.search-error {
  display: none; margin: 0 auto 16px; width: 100%;
  background: rgba(255,107,107,0.12); border: 1px solid rgba(255,107,107,0.3);
  color: #ff8f8f; padding: 12px 16px; border-radius: 12px; font-size: 13px;
  position: relative; z-index: 5; word-break: break-all;
}
.search-error.show { display: block; }

/* ============================================================
   音乐库页面网格
   ============================================================ */
.grid-list{
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); 
  gap: 24px;
  position: relative; z-index: 2; 
  width: 100%;
  margin: 0 auto;
}
@media (min-width: 1400px) {
  .grid-list { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 28px; }
}

.card{
  position:relative; aspect-ratio: 1 / 1; border-radius: 16px; cursor: pointer;
  background: var(--panel2); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.4);
  transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s;
  overflow: hidden;
}
.card::before {
  content: ''; position: absolute; inset: -4px; background: var(--current-bg); background-size: cover;
  border-radius: 20px; filter: blur(16px); opacity: 0.3; z-index: -1; transition: opacity 0.3s, transform 0.3s;
}
.card:hover::before { opacity: 0.8; transform: scale(1.02); }
.card:hover{ transform: translateY(-6px); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.2), 0 16px 40px rgba(0,0,0,0.6); }
.card:active{ transform: scale(0.96) translateY(0); }
.card.on{ box-shadow: inset 0 0 0 2px var(--accent), 0 8px 24px rgba(0,0,0,0.4); }

.card-cover{
  position: absolute; inset: 0; z-index: 1; border-radius: 16px; background: center/cover no-repeat; overflow: hidden;
}

.card-gradient {
  position: absolute; inset: 0; z-index: 2; border-radius: 16px;
  background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 35%, transparent 70%); 
  pointer-events: none;
}

.card-info { 
  position: absolute; bottom: 14px; left: 14px; right: 14px; z-index: 3; pointer-events: none; 
}
.card-title { 
  font-size: 16px; font-weight: 700; color: #fff; 
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
  margin-bottom: 4px; text-shadow: 0 2px 4px rgba(0,0,0,0.8); 
}
.card-artist { 
  font-size: 12px; color: rgba(255,255,255,0.7); 
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
  text-shadow: 0 1px 3px rgba(0,0,0,0.8); 
}
.card-duration { 
  position: absolute; bottom: 14px; right: 14px; z-index: 3; font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.8); text-shadow: 0 1px 4px rgba(0,0,0,0.8); pointer-events: none; 
}

.play-overlay {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.8);
  z-index: 4; width: 52px; height: 52px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.4); box-shadow: inset 0 1px 2px rgba(255,255,255,0.5), 0 4px 16px rgba(0,0,0,0.3);
  color: #fff; display: grid; place-items: center; opacity: 0; transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1); pointer-events: none;
}
.card:hover .play-overlay { opacity: 1; transform: translate(-50%, -50%) scale(1); }

.card-acts { position: absolute; top: 12px; right: 12px; z-index: 5; display: flex; gap: 8px; flex-direction: column; opacity: 0; transform: translateX(10px); transition: 0.2s; }
.card:hover .card-acts { opacity: 1; transform: none; }
.card-acts .icon-btn { 
  width: 32px; height: 32px; background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%);
  color: #fff; border-radius: 10px; border: 1px solid rgba(255,255,255,0.25); box-shadow: inset 0 1px 1px rgba(255,255,255,0.4), 0 2px 8px rgba(0,0,0,0.2);
}
.card-acts .icon-btn:hover { background: rgba(255,255,255,0.3); color: #000; }

.empty{display:none;text-align:center;padding:90px 0;color:var(--muted);position:relative;z-index:2;}
.empty svg{width:46px;height:46px;margin:0 auto 18px;opacity:.35} 
.empty p{font-size:15px;color:var(--text);opacity:.75} 
.empty span{font-size:13px;display:block;margin-top:6px}

/* ============================================================
   详情页 (含高级转场动画)
   ============================================================ */
#detailView {
  background: rgba(10, 10, 12, 0.65);
  backdrop-filter: blur(35px) saturate(180%);
  -webkit-backdrop-filter: blur(35px) saturate(180%);
  overflow-y: auto;
  z-index: 10;
  transform: translateX(100%);
  opacity: 0;
  transition: opacity 0.4s ease, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}
#detailView.on {
  opacity: 1; pointer-events: auto; transform: translateX(0);
}
#detailView::-webkit-scrollbar { width: 6px; display: block; }
#detailView::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }

.detail-content {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px 40px 110px;
}

.detail-header {
  display: flex; gap: 36px; margin-bottom: 40px;
  align-items: flex-end;
  opacity: 0;
  transform: translateY(20px) scale(0.98);
  transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
#detailView.on .detail-header {
  opacity: 1;
  transform: translateY(0) scale(1);
  transition-delay: 0.1s;
}

.detail-cover-wrap {
  width: 240px; height: 240px; border-radius: 20px;
  overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.6); flex: none;
  background: var(--panel2);
}
.detail-cover { width: 100%; height: 100%; object-fit: cover; }
.detail-info { flex: 1; min-width: 0; padding-bottom: 8px;}
.detail-name { font-size: 46px; font-weight: 800; color: #fff; margin-bottom: 12px; line-height: 1.1; letter-spacing: -0.02em; word-break: break-word; text-shadow: 0 4px 12px rgba(0,0,0,0.5);}
.detail-desc { font-size: 15px; color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 8px;}
.detail-sub { font-size: 14px; color: rgba(255,255,255,0.5); font-weight: 500;}

/* 详情页的卡片错落入场动画 */
@keyframes fadeUpAnim {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
#detailView.on .card {
  animation: fadeUpAnim 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}
#detailView.on .card:nth-child(1) { animation-delay: 0.08s; }
#detailView.on .card:nth-child(2) { animation-delay: 0.11s; }
#detailView.on .card:nth-child(3) { animation-delay: 0.14s; }
#detailView.on .card:nth-child(4) { animation-delay: 0.17s; }
#detailView.on .card:nth-child(5) { animation-delay: 0.20s; }
#detailView.on .card:nth-child(6) { animation-delay: 0.23s; }
#detailView.on .card:nth-child(7) { animation-delay: 0.26s; }
#detailView.on .card:nth-child(8) { animation-delay: 0.29s; }
#detailView.on .card:nth-child(9) { animation-delay: 0.32s; }
#detailView.on .card:nth-child(10) { animation-delay: 0.35s; }
#detailView.on .card:nth-child(n+11) { animation-delay: 0.38s; }


/* ============================================================
   关于页面
   ============================================================ */
#tabAbout { display: flex; align-items: center; justify-content: center; }
.about-content { text-align: center; max-width: 420px; width: 100%; }
.about-avatar { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; margin: 0 auto 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
.about-name { font-size: 28px; font-weight: 750; color: var(--accent); margin-bottom: 12px; letter-spacing: -0.02em; }
.about-desc { font-size: 15px; color: var(--muted); margin-bottom: 32px; line-height: 1.6; }
.about-link { display: inline-block; padding: 12px 24px; border-radius: 12px; text-decoration: none; color: var(--text); transition: all 0.3s; background: rgba(255,255,255,0.06); }
.about-link:hover { background: rgba(255,255,255,0.15); color: var(--accent); }

/* ============================================================
   设置页面
   ============================================================ */
#tabSettings { display: flex; justify-content: center; }
.settings-layout { display: flex; gap: 32px; max-width: 1100px; width: 100%; height: calc(100vh - 200px); min-height: 0; }
.settings-sidebar, .settings-preview {
  background: rgba(20, 20, 25, 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.3);
}
.settings-sidebar { width: 340px; flex: none; display: flex; flex-direction: column; overflow: hidden; }
.sidebar-scroll {
  padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; flex: 1;
  -webkit-overflow-scrolling: touch; overscroll-behavior: contain;
}
.sidebar-scroll::-webkit-scrollbar { width: 4px; }
.sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
.sidebar-scroll::-webkit-scrollbar-track { background: transparent; }

.section-title {
  font-size: 16px; font-weight: 700; color: var(--text); margin-top: 8px; margin-bottom: 4px; letter-spacing: -0.01em;
}
.section-title:first-child { margin-top: 0; }

.setting-group { display: flex; flex-direction: column; gap: 12px; margin-bottom: 4px; }
.setting-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.setting-row label { font-size: 14px; color: var(--text); }
.val-display { font-size: 13px; color: var(--accent); font-variant-numeric: tabular-nums; }

.color-picker { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.color-dot { width: 28px; height: 28px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; transition: transform 0.2s; box-shadow: inset 0 1px 2px rgba(255,255,255,0.5); }
.color-dot:hover { transform: scale(1.1); }
.color-dot.active { border-color: #fff; transform: scale(1.15); box-shadow: 0 0 15px rgba(255,255,255,0.3); }
.extract-btn { width: 28px; height: 28px; border-radius: 50%; cursor: pointer; display: grid; place-items: center; background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: #000; transition: transform 0.2s; border: 2px solid transparent; }
.extract-btn:hover { transform: scale(1.1); }

.bg-mode-group { 
  position: relative; display: flex; 
  background: rgba(255,255,255,0.06); border-radius: 10px; padding: 4px; 
  border: 1px solid rgba(255,255,255,0.08); 
}
.bg-mode-indicator {
  position: absolute; top: 4px; bottom: 4px; left: 4px;
  width: calc(33.333% - 2.66px);
  background: var(--accent); border-radius: 8px;
  transition: transform 0.35s cubic-bezier(0.22,1,0.36,1);
  z-index: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.bg-mode-btn { 
  flex: 1; text-align: center; padding: 8px 0; border-radius: 8px; 
  font-size: 13px; color: var(--muted); cursor: pointer; 
  transition: color 0.3s; position: relative; z-index: 1; 
}
.bg-mode-btn.active { color: #000; font-weight: 600; }

.btn-upload {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 10px; background: rgba(255,255,255,0.1); border: 1px dashed rgba(255,255,255,0.3);
  border-radius: 10px; font-size: 13px; color: var(--text); cursor: pointer; transition: 0.2s; margin-top: 8px;
}
.btn-upload:hover { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.5); }

input[type=range].setting-slider { -webkit-appearance: none; width: 100%; height: 20px; background: transparent; }
input[type=range].setting-slider::-webkit-slider-runnable-track { height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px; }
input[type=range].setting-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #fff; margin-top: -5px; cursor: pointer; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
input[type=range].setting-slider::-moz-range-track { height: 4px; background: rgba(255,255,255,0.15); border-radius: 2px; }
input[type=range].setting-slider::-moz-range-thumb { width: 14px; height: 14px; border: 0; border-radius: 50%; background: #fff; cursor: pointer; }

.switch { position: relative; display: inline-block; width: 40px; height: 22px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider-sw { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.15); transition: .3s; border-radius: 22px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);}
.slider-sw:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.3);}
input:checked + .slider-sw { background-color: var(--accent); }
input:checked + .slider-sw:before { transform: translateX(18px); background-color: #000; }

.settings-preview {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; position: relative;
}
.preview-lyrics {
  position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: flex-start;
  padding-left: 60px; perspective: 1000px; perspective-origin: 0% 50%;
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 25%, #000 75%, transparent 100%);
  mask-image: linear-gradient(180deg, transparent 0%, #000 25%, #000 75%, transparent 100%);
}
.preview-lyric-3d { transform: rotateY(-25deg) rotateX(1deg); transform-origin: left center; transform-style: preserve-3d; transition: transform 0.5s ease; }
body.no-3d .preview-lyric-3d { transform: none; }
.preview-line {
  font-size: var(--lyric-size, 28px); line-height: var(--lyric-spacing, 1.6); font-weight: 500;
  color: rgba(255,255,255,0.2); margin-bottom: 12px; transition: all 0.3s;
}
.preview-line.active {
  color: var(--accent); font-weight: 800; text-shadow: 0 0 30px rgba(255,255,255,0.3);
  transform: scale(var(--lyric-scale, 1.05)); transform-origin: left center;
}

/* ============================================================
   迷你条 & 播放器
   ============================================================ */
.icon-btn{display:grid;place-items:center;width:36px;height:36px;border-radius:9px;color:var(--muted);transition:.18s;flex:none}
.icon-btn:hover{color:var(--accent);background:rgba(255,255,255,.08)} 
.icon-btn svg{width:18px;height:18px} 
.icon-btn.on{color:var(--accent)}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:11px;font-size:14px;font-weight:500;white-space:nowrap;transition:.2s; text-decoration:none; cursor:pointer;}
.btn svg{width:16px;height:16px} 
.btn.primary{background:var(--accent);color:#000}
.btn.primary:hover{filter:brightness(0.9);transform:translateY(-1px)} 
.btn.ghost{background:rgba(255,255,255,.06);color:var(--text)}
.btn.ghost:hover{background:rgba(255,255,255,.1); color:var(--accent)} 
.btn.tiny{padding:6px 12px;font-size:12.5px;border-radius:9px}

.mini{
  position:absolute;left:50%;bottom:24px;transform:translate(-50%, 100px);
  width:calc(100% - 48px);max-width:800px;height:64px;z-index:15;
  display:flex;align-items:center;gap:14px; padding: 10px 20px 10px 10px;
  background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(30px) saturate(180%); -webkit-backdrop-filter: blur(30px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.15); border-radius:20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.4);
  transition:transform .4s cubic-bezier(.22,1,.36,1), opacity .4s; opacity:0;pointer-events:none;
}
.mini.show{transform:translate(-50%, 0);opacity:1;pointer-events:auto}
.mini-cover{ width:44px;height:44px;border-radius:10px;flex:none; background:var(--panel2) center/cover no-repeat;display:grid;place-items:center;color:var(--muted); }
.mini-cover svg{width:18px;height:18px;opacity:.45} .mini-info{flex:1;min-width:0}
.mini-name{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; color:#fff;}
.mini-artist{font-size:12px;color:rgba(255,255,255,0.8);margin-top:2px}
.mini .icon-btn { color: rgba(255,255,255,0.8); }
.mini .icon-btn:hover { color: #fff; background: rgba(255,255,255,0.15); }

#playerView { display: flex; flex-direction: column; }
.p-top { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; padding: 24px 32px 6px; }
.p-body { position: relative; z-index: 2; flex: 1; display: grid; grid-template-columns: 1fr 1fr; min-height: 0; max-width: 1500px; width: 100%; margin: 0 auto; }
.p-left { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 40px; }
.cover-3d { perspective: 1200px; }
.cover-card {
  position: relative; width: clamp(200px, 22vw, 320px); aspect-ratio: 1;
  border-radius: 20px; overflow: hidden; background: linear-gradient(150deg, #222228, #111114);
  transform: rotateY(6deg) rotateX(2deg); transform-style: preserve-3d;
  box-shadow: -20px 30px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,.05);
  transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.8s;
}
.cover-3d:hover .cover-card { transform: rotateY(0deg) rotateX(0deg) translateY(-8px) scale(1.02); box-shadow: -10px 40px 70px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,.1); }
.cover-img { position: absolute; inset: 0; background: center/cover no-repeat; }
.cover-fallback { position: absolute; inset: 0; display: grid; place-items: center; color: rgba(255,255,255,0.05); }
.cover-fallback svg { width: 38%; height: 38%; }
.cover-card::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(120deg, rgba(255,255,255,0.15), transparent 45%); }
.side-meta { text-align: center; margin-top: 28px; width: 100%; padding: 0 10px; }
.side-name { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
.side-artist { font-size: 14px; color: rgba(255,255,255,0.8); margin-top: 6px; }
.side-progress { width: 100%; max-width: 300px; margin-top: 32px; }
.progress { height: 18px; display: flex; align-items: center; cursor: pointer; touch-action: none; }
.bar { height: 4px; width: 100%; background: rgba(255, 255, 255, 0.15); border-radius: 4px; position: relative; transition: height 0.18s; }
.progress:hover .bar { height: 6px; }
.bar-fill { position: absolute; inset: 0 auto 0 0; width: 0; background: var(--accent); border-radius: 4px; }
.bar-dot { position: absolute; top: 50%; left: 0; width: 14px; height: 14px; border-radius: 50%; background: #fff; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5); transform: translate(-50%, -50%) scale(0); transition: transform 0.18s; }
.progress:hover .bar-dot { transform: translate(-50%, -50%) scale(1); }
.times { display: flex; justify-content: space-between; font-size: 12px; color: rgba(255,255,255,0.6); font-variant-numeric: tabular-nums; margin-top: 6px; }

.side-controls { display: flex; align-items: center; justify-content: center; gap: 20px; margin-top: 24px; width: 100%; }
.side-controls .icon-btn { width: 36px; height: 36px; color:rgba(255,255,255,0.7); }
.side-controls .icon-btn:hover { color:var(--accent); background:rgba(255,255,255,0.1); }
.side-controls .icon-btn svg { width: 20px; height: 20px; }
.play-big {
  width: 56px; height: 56px; border-radius: 50%; flex: none;
  background: var(--accent); color: #000; display: grid; place-items: center;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.18s, background-color 0.3s;
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.3); position: relative; overflow: hidden;
}
.play-big:hover { transform: scale(1.08); filter: brightness(0.95); }
.play-big:active { transform: scale(0.96); }
.play-big svg { width: 26px; height: 26px; margin-left: 3px; }

@keyframes icon-pop {
  0% { transform: scale(0.5) rotate(-20deg); opacity: 0; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
.animate-icon { animation: icon-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

.volume-wrapper { position: relative; display: flex; align-items: center; justify-content: center; }
.vol-pop {
  position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%) translateY(10px);
  padding: 10px 16px; border-radius: 16px; background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.4);
  opacity: 0; pointer-events: none; transition: .25s cubic-bezier(.22,1,.36,1); z-index: 50; width: 140px;
}
.vol-pop.on { opacity: 1; pointer-events: auto; transform: translateX(-50%) translateY(0); }
input[type=range].vol-slider { -webkit-appearance: none; width: 100%; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; outline: none; }
input[type=range].vol-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #fff; cursor: pointer; transition: transform 0.1s; box-shadow: 0 2px 6px rgba(0,0,0,0.4); }
input[type=range].vol-slider::-moz-range-thumb { width: 14px; height: 14px; border: none; border-radius: 50%; background: #fff; cursor: pointer; }

.p-right {
  position: relative; padding-left: 40px; overflow: hidden;
  perspective: 1000px; perspective-origin: 0% 50%;
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 25%, #000 75%, transparent 100%);
  mask-image: linear-gradient(180deg, transparent 0%, #000 25%, #000 75%, transparent 100%);
}
body.no-3d .p-right { perspective: none; }
body.no-3d .lyric-3d { transform: none !important; }

.lyric-3d {
  width: 100%; height: 100%; transform: rotateY(-25deg) rotateX(1deg);
  transform-origin: left center; transform-style: preserve-3d; will-change: transform; position: relative; transition: transform 0.5s ease;
}
.lyric-inner { position: relative; padding: 40px 20px 40px 0; transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1); will-change: transform; }
.lyric-line {
  position: relative; font-size: var(--lyric-size, clamp(20px, 2.5vw, 32px)); line-height: var(--lyric-spacing, 1.5); font-weight: 500;
  letter-spacing: 0.5px; color: rgba(255, 255, 255, 0.9); text-align: left; padding: 10px 0 10px 24px; cursor: pointer; transform-origin: left center;
  transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94); white-space: pre-wrap; word-break: break-word; max-width: 90%; will-change: transform, opacity, filter, font-weight;
}
.lyric-line::before {
  content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%) scaleY(0);
  width: 4px; height: 1.2em; border-radius: 4px; background: var(--accent);
  opacity: 0; transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s; transform-origin: center; box-shadow: 0 0 12px var(--accent);
}
.lyric-line:hover { color: rgba(255, 255, 255, 0.6) !important; }
.lyric-line.active {
  color: var(--accent); font-weight: 800; transform: scale(var(--lyric-scale, 1.05)); text-shadow: 0 0 30px rgba(255,255,255,0.3);
}
.lyric-line.active::before { transform: translateY(-50%) scaleY(1); opacity: 1; }
.lyric-empty { text-align: left; color: var(--muted); font-size: 18px; line-height: 2; padding: 70px 0 0 24px; }
.lyric-empty span { font-size: 14px; opacity: 0.65; display: block; margin-top: 4px; }

.breath-anim {
  position: absolute; top: 50%; left: 24px; transform: translateY(-50%) scale(0); opacity: 0;
  display: flex; gap: 12px; pointer-events: none; transition: all 1s cubic-bezier(0.22, 1, 0.36, 1); z-index: 10;
}
.breath-anim.on { transform: translateY(-50%) scale(1); opacity: 1; }
.breath-anim .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 10px var(--accent); animation: breathe 1.4s ease-in-out infinite alternate; }
.breath-anim .dot:nth-child(2) { animation-delay: 0.2s; }
.breath-anim .dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes breathe { 0% { transform: scale(0.6); opacity: 0.2; } 100% { transform: scale(1.2); opacity: 1; } }

.outro-credit { position: absolute; top: 58%; left: 24px; font-size: 14px; letter-spacing: 1px; color: rgba(255, 255, 255, 0.6); opacity: 0; transform: translateY(-50%); transition: opacity 1s cubic-bezier(0.22, 1, 0.36, 1); pointer-events: none; z-index: 11; }
.outro-credit.show { opacity: 1; }

/* 弹窗 & 抽屉 */
.modal-mask{position:fixed;inset:0;z-index:110;background:rgba(0,0,0,.6);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .25s}
.modal-mask.on{opacity:1;pointer-events:auto}
.modal{width:100%;max-width:540px;background:#17171c;border:1px solid var(--line);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.7);transform:translateY(16px) scale(.98);transition:transform .32s cubic-bezier(.22,.61,.36,1);display:flex;flex-direction:column}
.modal-mask.on .modal{transform:none}
.modal-head{display:flex;align-items:center;justify-content:space-between;padding:17px 20px 14px;border-bottom:1px solid var(--line)}
.modal-head h2{font-size:16px;font-weight:600}
.modal-body{padding:16px 20px;display:flex;flex-direction:column;gap:10px;overflow-y:auto;transition:background .2s}
.modal-body.drag{background:rgba(255,255,255,.05)}
.pick-row{display:flex;align-items:center;gap:13px;padding:12px 14px;border-radius:12px;border:1px dashed rgba(255,255,255,.14);background:rgba(255,255,255,.02);transition:.2s}
.pick-row.has{border-style:solid;border-color:rgba(255,255,255,.4);background:rgba(255,255,255,.08)}
.pick-ic{width:38px;height:38px;border-radius:10px;flex:none;display:grid;place-items:center;background:rgba(255,255,255,.05);color:var(--muted);transition:.2s}
.pick-row.has .pick-ic{background:rgba(255,255,255,.2);color:#fff} .pick-ic svg{width:18px;height:18px}
.pick-info{flex:1;min-width:0} .pick-title{font-size:13.5px;font-weight:500}
.pick-desc{font-size:11.5px;color:var(--muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pick-row.has .pick-desc{color:#fff}
.pick-clear{display:none;width:28px;height:28px} .pick-clear svg{width:14px;height:14px} .pick-row.has .pick-clear{display:grid}
.modal-foot{display:flex;align-items:center;gap:10px;padding:14px 20px 18px;border-top:1px solid var(--line)}
.modal-hint{flex:1;font-size:11.5px;color:var(--muted)}
.toast{position:fixed;left:50%;bottom:88px;z-index:200;padding:10px 18px;border-radius:10px;background:rgba(32,32,38,.97);border:1px solid var(--line);font-size:13px;color:var(--text);box-shadow:0 12px 34px rgba(0,0,0,.55);opacity:0;transform:translate(-50%,10px);pointer-events:none;transition:.25s}
.toast.on{opacity:1;transform:translate(-50%,0)}

.queue-mask { position: fixed; inset: 0; z-index: 150; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); opacity: 0; pointer-events: none; transition: opacity 0.25s; }
.queue-mask.on { opacity: 1; pointer-events: auto; }
.queue-drawer { position: absolute; top: 0; right: 0; bottom: 0; width: 420px; background: rgba(20,20,25,0.95); border-left: 1px solid var(--line); transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.22,1,0.36,1); display: flex; flex-direction: column; box-shadow: -10px 0 40px rgba(0,0,0,0.6); }
.queue-mask.on .queue-drawer { transform: none; }
.queue-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--line); }
.queue-head h2 { font-size: 18px; font-weight: 700; color: #fff; }
.queue-list { flex: 1; overflow-y: auto; padding: 12px; }
.queue-item { display: flex; align-items: center; gap: 14px; padding: 12px; border-radius: 12px; cursor: pointer; transition: background 0.2s; }
.queue-item:hover { background: rgba(255,255,255,0.06); }
.queue-item.on { background: rgba(255,255,255,0.12); }
.queue-item-cover { width: 44px; height: 44px; border-radius: 8px; background: var(--panel2); flex: none; overflow: hidden; display: grid; place-items: center; }
.queue-item-cover img { width: 100%; height: 100%; object-fit: cover; }
.queue-item-info { flex: 1; min-width: 0; }
.queue-item-name { font-size: 14px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.queue-item.on .queue-item-name { color: var(--accent); }
.queue-item-artist { font-size: 12px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;}
.queue-item-del { width: 28px; height: 28px; opacity: 0; transition: opacity 0.2s; color: var(--muted); display: grid; place-items: center; border-radius: 6px; }
.queue-item:hover .queue-item-del { opacity: 1; }
.queue-item-del:hover { background: rgba(255,255,255,0.1); color: #ff6b6b; }

/* ============================================================
   响应式适配 (手机/平板)
   ============================================================ */
@media (max-width: 900px) {
  .navbar { padding: 0 20px; height: 72px; }
  .nav-center { position: static; transform: none; margin: 0 auto; }
  .brand-info { display: none; }
  .nav-tab { padding: 8px 16px; font-size: 13px; }
  
  /* 详情页移动端适配 */
  .detail-nav {
    height: 102px; /* 72px 基础高度 + 30px 顶部距离 */
    padding-top: 30px;
  }
  .detail-nav-title {
    font-size: 16px;
    max-width: 180px; /* 手机端限制标题长度 */
  }

  /* 手机端主页留白 72px + 20px */
  .tab-content { padding: 92px 20px 110px; }
  
  .settings-layout { flex-direction: column; height: auto; }
  .settings-sidebar { width: 100%; max-height: 400px; }
  .settings-preview { min-height: 300px; }
  .preview-lyrics { padding-left: 30px; }
  .search-bar { gap: 8px; }
  .search-bar button { padding: 13px 18px; }
  
  .detail-content { padding: 20px; }
  .detail-header { flex-direction: column; align-items: center; text-align: center; gap: 16px; }
  .detail-cover-wrap { width: 180px; height: 180px; }
  .detail-name { font-size: 28px; }
  
  .queue-drawer { width: 100%; max-width: 320px; }
  
  .grid-list { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px; }
  .card-title { font-size: 14px; }
}
@media (max-width: 980px) {
  .p-body { display: flex; flex-direction: column; justify-content: flex-end; }
  .p-left { padding: 0 20px; flex: none; margin-bottom: 20px; }
  .cover-3d, .side-meta { display: none; }
  .side-progress, .side-controls { max-width: 100%; margin-top: 15px; }
  .p-right { flex: 1; padding-left: 20px; perspective: none; margin-bottom: 20px; }
  .lyric-3d { transform: none; }
  .lyric-line { text-align: center; padding-left: 0; }
  .lyric-line::before { display: none; }
  .breath-anim { left: 50%; transform: translate(-50%, -50%) scale(0); }
  .breath-anim.on { transform: translate(-50%, -50%) scale(1); }
  .outro-credit { top: 58%; left: 50%; transform: translate(-50%, 0); text-align: center; }
}
/* ============================================================
   自定义 API 输入框
   ============================================================ */
.setting-input {
  width: 100%; 
  padding: 10px 14px; 
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  color: #fff; 
  font-size: 13px; 
  outline: none;
  transition: border-color 0.25s, background 0.25s;
}
.setting-input:focus { 
  border-color: var(--accent); 
  background: rgba(255,255,255,0.09); 
}
.setting-input::placeholder { 
  color: rgba(255,255,255,0.3); 
}
/* 扫码登录弹窗 */
#qrContainer canvas,
#qrContainer img {
  max-width: 100%;
  max-height: 100%;
}
#qrStatus.success { color: #6bffb2; }
#qrStatus.error { color: #ff6b6b; }