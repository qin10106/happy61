var audio = null;
var started = false;

// 全局缓存配置数据
var cachedConfig = null;

// 加载配置文件的函数
var loadConfig = function() {
    if (cachedConfig) {
        return Promise.resolve(cachedConfig);
    }
    return fetch('config.json')
        .then(function(response) { return response.json(); })
        .then(function(data) {
            cachedConfig = data;
            return data;
        });
};

// ========== 点击启动：音乐 + 动画 ==========
function startAll() {
    if (started) return;
    started = true;

    if (audio) {
        audio.play().catch(function() {});
    }

    var hint = document.querySelector('.hint');
    if (hint) {
        hint.style.opacity = '0';
        setTimeout(function() { hint.style.display = 'none'; }, 500);
    }

    setTimeout(function() {
        animationTimeline();
    }, 500);
}

// 继续按钮：桌面端自动跳过，手机端显示按钮等待点击
function showContinueBtn(callback) {
    // 桌面端（宽度 > 768px）：自动继续，不显示按钮
    if (window.innerWidth > 768) {
        if (callback) callback();
        return;
    }

    // 手机端：显示按钮等待点击
    var btn = document.getElementById('continueBtn');
    btn.classList.add('visible');

    function onClick() {
        btn.classList.remove('visible');
        setTimeout(function() {
            btn.removeEventListener('click', onClick);
            btn.removeEventListener('touchstart', onClick);
            if (callback) callback();
        }, 350);
    }

    btn.addEventListener('click', onClick);
    btn.addEventListener('touchstart', onClick);
}

// DOMContentLoaded 事件处理
document.addEventListener('DOMContentLoaded', function() {
    audio = new Audio('music/bgMusic.m4a');
    audio.preload = 'metadata';
    audio.volume = 0.6;
    audio.loop = true;

    // 音频加载出错时打印日志
    audio.addEventListener('error', function() {
        console.log('音乐加载失败，请检查网络');
    }, { once: true });

    var savedTime = sessionStorage.getItem('musicTime');
    var wasPlaying = sessionStorage.getItem('musicPlaying');

    if (wasPlaying === 'true' && savedTime !== null) {
        var resumeTime = parseFloat(savedTime);
        audio.addEventListener('loadedmetadata', function() {
            audio.currentTime = resumeTime;
            audio.play();
            started = true;
            var hint = document.querySelector('.hint');
            if (hint) {
                hint.style.opacity = '0';
                setTimeout(function() { hint.style.display = 'none'; }, 500);
            }
            setTimeout(function() {
                animationTimeline();
            }, 500);
        });
    }

    sessionStorage.removeItem('musicTime');
    sessionStorage.removeItem('musicVolume');
    sessionStorage.removeItem('musicPlaying');

    // 音量控制
    var volumeBtn    = document.getElementById('volumeBtn');
    var volumeSlider = document.getElementById('volumeSlider');
    var lastVolume   = 60;

    volumeSlider.addEventListener('input', function() {
        var v = parseInt(volumeSlider.value) / 100;
        if (audio) audio.volume = v;
        lastVolume = v * 100;
        updateVolumeIcon(v);
    });

    volumeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (audio && audio.volume > 0.01) {
            lastVolume = audio.volume * 100;
            audio.volume = 0;
            volumeSlider.value = 0;
            volumeBtn.textContent = '🔇';
        } else {
            var v = lastVolume > 0 ? lastVolume : 60;
            if (audio) audio.volume = v / 100;
            volumeSlider.value = v;
            updateVolumeIcon(v / 100);
        }
    });

    function updateVolumeIcon(v) {
        if (v < 0.01) volumeBtn.textContent = '🔇';
        else if (v < 0.4) volumeBtn.textContent = '🔈';
        else if (v < 0.7) volumeBtn.textContent = '🔉';
        else volumeBtn.textContent = '🔊';
    }

    // 预初始化心形 + 照片网格
    initHeartAndPhotos();

    document.addEventListener('click', startAll, { once: true });
    document.addEventListener('touchstart', startAll, { once: true });
});

// 将数据插入页面
var fetchData = function() {
    loadConfig().then(function(data) {
        Object.keys(data).forEach(function(key) {
            if (data[key] !== '') {
                if (key === 'imagePath') {
                    document
                        .querySelector('[data-node-name*="' + key + '"]')
                        .setAttribute('src', data[key]);
                } else if (key !== 'expressUrl' && key !== 'date') {
                    var el = document.querySelector('[data-node-name*="' + key + '"]');
                    if (el) {
                        el.innerText = data[key];
                    }
                }
            }
        });
    });
};

// ============================================================
//  借鉴 love5：星形飞入系统
// ============================================================

// 六一祝福短语
// 💖 爱心祝福短语
var heartBlessings = [
    '平安顺遂','学业有成','前程似锦','繁花似锦',
    '笑容明媚','灿烂如花','烦恼尽消','所求皆得',
    '如愿以偿','所行皆顺','坦途无阻','岁岁平安',
    '年年喜乐','未来可期','光芒万丈','温柔以待',
    '内心坚定','从容不迫','赤诚热爱','初心不改',
    '日子温柔','自带光芒','无畏风雨','勇敢前行',
    '良人相伴','知己相随','纯粹本心','不忘初心',
    '惊喜不断','好运连连','努力有报','不负韶华',
    '活成自己','自在随心','被爱包围','温暖相伴','万事胜意'
];

// 12个飞入方向
var directions = [
    {dx:'0vw',dy:'-80vh'},{dx:'0vw',dy:'80vh'},
    {dx:'-80vw',dy:'0vh'},{dx:'80vw',dy:'0vh'},
    {dx:'-70vw',dy:'-70vh'},{dx:'70vw',dy:'-70vh'},
    {dx:'-70vw',dy:'70vh'},{dx:'70vw',dy:'70vh'},
    {dx:'0vw',dy:'-60vh'},{dx:'0vw',dy:'60vh'},
    {dx:'-60vw',dy:'0vh'},{dx:'60vw',dy:'0vh'}
];

// 柔和暖色渐变
var heartBlessColorSets = [
    ['#ff9a9e','#fad390'],['#f093fb','#f5576c'],
    ['#ff758c','#ffb7b2'],['#a18cd1','#fbc2eb'],
    ['#fa709a','#fee140'],['#f6d365','#fda085'],
    ['#ff6b81','#ffcc80'],['#a29bfe','#fd79a8'],
    ['#e3bae8','#ff9a9e'],['#fdcb6e','#f8a5c2']
];

var starStage, starLockedCount, starTotal, starOnComplete;

function rand(min, max) { return Math.random() * (max - min) + min; }

// 爱心尺寸：占屏幕短边的 30%
function heartFormSize() {
    var minDim = Math.min(window.innerWidth, window.innerHeight);
    return Math.round(minDim * 0.30);
}

function centerYOffset() {
    var portrait = window.innerHeight > window.innerWidth;
    var minDim = Math.min(window.innerWidth, window.innerHeight);
    return portrait ? -minDim * 0.02 : minDim * 0.01;
}

// 💖 爱心轮廓坐标（复用爱心参数方程）
function heartFormXY(t) {
    var s = heartFormSize() / 16;
    var hx = 16 * Math.pow(Math.sin(t), 3);
    var hy = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);

    // Y 偏移 0.7 使爱心视觉居中
    var x = s * hx;
    var y = -s * (hy + 0.7);

    return { x: x + 'px', y: (y + centerYOffset()) + 'px' };
}

// 随机渐变背景
function randomStarStyle() {
    var pair = heartBlessColorSets[Math.floor(Math.random() * heartBlessColorSets.length)];
    return 'linear-gradient(135deg,' + pair[0] + ',' + pair[1] + ')';
}

// 创建一个爱心祝福元素
function createStarMsg(i, total) {
    var el = document.createElement('div');
    el.className = 'star-msg';

    // 随机方向起点
    var d = directions[Math.floor(Math.random() * directions.length)];
    el.style.setProperty('--dx', d.dx);
    el.style.setProperty('--dy', d.dy);
    el.style.setProperty('--rot', rand(-45, 45) + 'deg');

    // 飞行时长和延迟
    var dur = rand(2.5, 3.6);
    el.style.setProperty('--dur', dur + 's');
    el.style.setProperty('--delay', (i * 0.08 + rand(0, 0.35)) + 's');

    // 渐变背景
    el.style.setProperty('--bg', randomStarStyle());

    // 💖 爱心轮廓目标位置
    var t = (i / total) * Math.PI * 2;
    var pos = heartFormXY(t);
    el.style.setProperty('--star-x', pos.x);
    el.style.setProperty('--star-y', pos.y);
    el.style.setProperty('--star-rot', rand(-12, 12) + 'deg');

    // 文字
    el.textContent = heartBlessings[Math.floor(Math.random() * heartBlessings.length)];

    // 飞行结束 → 锁定
    el.addEventListener('animationend', function() {
        el.classList.add('locked', 'pulse');
        el.style.willChange = 'auto';

        // 随机破碎方向
        var spread = rand(450, 800);
        var ang = rand(0, Math.PI * 2);
        el.style.setProperty('--bx', Math.cos(ang) * spread + 'px');
        el.style.setProperty('--by', Math.sin(ang) * spread + 'px');

        starLockedCount++;
        if (starLockedCount === starTotal) {
            onAllStarLocked();
        }
    }, { once: true });

    starStage.appendChild(el);
}

// 全部锁定 → 等 2.5s → 破碎
function onAllStarLocked() {
    setTimeout(function() {
        finalStarBurst();
    }, 2500);
}

// 破碎爆炸
function finalStarBurst() {
    var msgs = starStage.querySelectorAll('.star-msg.locked');
    msgs.forEach(function(el) {
        el.classList.remove('pulse');
        var jitter = rand(0, 200);
        setTimeout(function() { el.classList.add('burst'); }, jitter);
        el.addEventListener('animationend', function() {
            el.remove();
        }, { once: true });
    });

    // 全部破碎后回调
    var totalBurst = msgs.length;
    var bursted = 0;
    msgs.forEach(function(el) {
        el.addEventListener('animationend', function() {
            bursted++;
            if (bursted >= totalBurst) {
                setTimeout(function() {
                    starStage.innerHTML = '';
                    if (starOnComplete) starOnComplete();
                }, 200);
            }
        }, { once: true });
    });
}

// 启动爱心祝福飞入
function playStarFormation(onComplete) {
    starStage = document.getElementById('starStage');
    if (!starStage) return;
    starStage.innerHTML = '';
    starOnComplete = onComplete || null;

    var minDim = Math.min(window.innerWidth, window.innerHeight);
    starTotal = minDim <= 420 ? 110 : minDim <= 720 ? 150 : 180;
    starLockedCount = 0;

    for (var i = 0; i < starTotal; i++) {
        createStarMsg(i, starTotal);
    }
}

// ============================================================
//  借鉴 love1：心形文字 → 爆炸 → 宝丽来散落照片
// ============================================================

// 三层爱心关键词
var heartLayer1 = [
    '👍','GREAT','⭐','BEST','🌟','NICE',
    '💯','SUPER','✨','WOW','🎀','COOL',
    '💫','SWEET','💝','GOOD','💖','LUCKY',
    '🌸','AWESOME','Sparkle','Radiant','Brave'
];

var heartLayer2 = [
    '棒','真棒','优秀','厉害','出色','完美',
    '聪明','可爱','暖心','了不起','乖巧',
    '阳光','好','强','赞','妙','暖心'
];

var heartLayer3 = [
    '善良','细心','努力','漂亮','坚强','温柔','真诚','乐观','勇敢',
    '温暖','聪慧','独立','纯粹','有灵气','有韧性','有爱心','有担当','闪闪发光',
    'Kind','Attentive','Hardworking','Lovely','Beautiful',
    'Resilient','Gentle','Sincere','Optimistic','Warm',
    'Intelligent','Independent','Pure','Spirited',
    'Tenacious','Compassionate','Sunny'
];

var photoPaths = [
    'photoly/p1.jpg','photoly/p2.jpg','photoly/p3.jpg',
    'photoly/p4.jpg','photoly/p5.jpg','photoly/p6.jpg',
    'photoly/p7.jpg','photoly/p8.jpg','photoly/p9.jpg'
];

// ============================================================
//  幻灯片数据与逻辑
// ============================================================

var slideData = [
    {
        title: '你很温暖',
        body: '看着你一点点把自己打磨得更坚韧，真的特别为你开心。你本来就拥有那么多闪闪发光的品质 —— 善良、细心、努力又可爱，现在又多了一份勇敢的力量。愿你永远被温柔以待，也永远有能力温柔地对待这个世界。'
    },
    {
        title: '你很可爱',
        body: '你这个宝藏女孩真的太美好了！漂亮得让人眼前一亮，细心得让人心里一暖，努力得让人忍不住佩服，善良得让人想一直珍惜。看着你越来越坚强，就像看到小太阳在慢慢积蓄能量，未来一定会光芒万丈的！'
    },
    {
        title: '加油加油',
        body: '我一直都觉得你是个特别棒的女孩。你对生活的认真，对他人的善意，还有现在正在努力培养的坚强，都让我特别欣赏。不用急着变成完美的大人，慢慢来，你已经在成为更好的自己了。'
    },
    {
        title: '保持微笑',
        body: '你笑起来的时候，整个世界都亮了。你的善良和努力，都值得被好好珍藏。愿你永远保持可爱，也永远拥有对抗一切的勇气。'
    }
];

// 随机分配 8 张照片到 4 个画面（每画面 2 张，不重复）
function assignSlidePhotos() {
    var pool = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (var i = pool.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    var sel = pool.slice(0, 8);
    return [
        [sel[0], sel[1]],
        [sel[2], sel[3]],
        [sel[4], sel[5]],
        [sel[6], sel[7]]
    ];
}

// 预创建幻灯片 DOM —— 四列并排
function buildSlidesDOM() {
    var container = document.getElementById('photoSlides');
    if (!container || container.children.length > 0) return;

    var pairs = assignSlidePhotos();

    // 四列容器
    var row = document.createElement('div');
    row.className = 'slide-row';

    for (var s = 0; s < 4; s++) {
        var panel = document.createElement('div');
        panel.className = 'slide-panel';
        panel.setAttribute('data-panel', s);

        // ---- 照片区（上下两张）----
        var photosDiv = document.createElement('div');
        photosDiv.className = 'panel-photos';

        for (var ph = 0; ph < 2; ph++) {
            var polaroid = document.createElement('div');
            polaroid.className = 'panel-polaroid';
            var img = document.createElement('img');
            img.src = photoPaths[pairs[s][ph]];
            img.alt = '照片';
            polaroid.appendChild(img);
            photosDiv.appendChild(polaroid);
        }

        panel.appendChild(photosDiv);

        // ---- 标题 ----
        var title = document.createElement('h3');
        title.className = 'panel-title';
        title.textContent = slideData[s].title;
        panel.appendChild(title);

        // ---- 正文 ----
        var body = document.createElement('p');
        body.className = 'panel-body';
        body.textContent = slideData[s].body;
        panel.appendChild(body);

        row.appendChild(panel);
    }

    container.appendChild(row);
}

// 运行幻灯片 —— 四列同时展示
function runPhotoSlides(onComplete) {
    var container = document.getElementById('photoSlides');
    var row = container.querySelector('.slide-row');
    var panels = row.querySelectorAll('.slide-panel');

    // 设置 polaroid 尺寸
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var isMobile = vw <= 800;
    var imgW = Math.min(vw * (isMobile ? 0.12 : 0.08), vh * 0.12, isMobile ? 150 : 130);
    var allPolaroids = container.querySelectorAll('.panel-polaroid');
    allPolaroids.forEach(function(p) {
        p.style.width = imgW + 'px';
    });

    container.classList.add('show');

    // 四个 panel 依次弹入（间隔 200ms）
    panels.forEach(function(panel, pi) {
        setTimeout(function() {
            panel.classList.add('visible');
        }, pi * 200 + 100);
    });

    // 每个 panel 内部：照片先入 → 标题 → 正文
    panels.forEach(function(panel, pi) {
        var baseDelay = pi * 200 + 100;

        // 两张照片
        var polaroids = panel.querySelectorAll('.panel-polaroid');
        polaroids.forEach(function(p, i) {
            setTimeout(function() { p.classList.add('visible'); }, baseDelay + i * 130);
        });

        // 标题
        var title = panel.querySelector('.panel-title');
        setTimeout(function() { title.classList.add('visible'); }, baseDelay + 350);

        // 正文
        var body = panel.querySelector('.panel-body');
        setTimeout(function() { body.classList.add('visible'); }, baseDelay + 550);
    });

    // 停留 8.5s → 退场
    var totalPanels = panels.length;
    var lastPanelIn = (totalPanels - 1) * 200 + 100 + 720;  // 最后一个 panel 动画完成
    var displayTime = 8500;

    setTimeout(function() {
        // 四列同时淡出
        row.classList.add('fading');
        panels.forEach(function(p) {
            p.classList.remove('visible');
            p.querySelectorAll('.panel-polaroid').forEach(function(pp) { pp.classList.remove('visible'); });
            p.querySelector('.panel-title').classList.remove('visible');
            p.querySelector('.panel-body').classList.remove('visible');
        });

        setTimeout(function() {
            row.classList.remove('fading');
            container.classList.remove('show');
            if (onComplete) onComplete();
        }, 500);
    }, lastPanelIn + displayTime);
}

var heartStage, heartCenterX, heartCenterY, heartSize;
var heartChars = [];
var HEART_POINTS = 120;

function initHeartAndPhotos() {
    heartStage = document.getElementById('heartStage');
    // 预创建宝丽来卡片
    var grid = document.getElementById('photoGrid');
    if (!grid || grid.children.length > 0) return;
    buildSlidesDOM();
    photoPaths.forEach(function(path, i) {
        var cell = document.createElement('div');
        cell.className = 'photo-cell';
        cell.setAttribute('data-index', i);
        var img = document.createElement('img');
        img.src = path;
        img.alt = '照片' + (i + 1);
        cell.appendChild(img);
        grid.appendChild(cell);
    });
}

function heartX(t) { return 16 * Math.pow(Math.sin(t), 3); }
function heartY(t) { return 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t); }

function createHeartTexts(texts) {
    if (!heartStage) heartStage = document.getElementById('heartStage');
    heartStage.innerHTML = '';
    heartChars = [];
    heartCenterX = window.innerWidth  / 2;
    heartCenterY = window.innerHeight / 2 - 40;
    heartSize    = Math.min(window.innerWidth, window.innerHeight) * 0.35;

    for (var i = 0; i < HEART_POINTS; i++) {
        var t  = (i / HEART_POINTS) * Math.PI * 2;
        var hx = heartX(t);
        var hy = heartY(t);
        var tx = heartCenterX + hx * (heartSize / 16);
        var ty = heartCenterY - hy * (heartSize / 16);

        var el = document.createElement('span');
        el.className = 'heart-char';
        el.textContent = texts[Math.floor(Math.random() * texts.length)];
        el.style.fontSize = (13 + Math.random() * 5) + 'px';

        tx += (Math.random() - 0.5) * 10;
        ty += (Math.random() - 0.5) * 10;

        var side = Math.floor(Math.random() * 4);
        var sx, sy;
        switch (side) {
            case 0: sx = Math.random() * window.innerWidth;  sy = -50; break;
            case 1: sx = window.innerWidth + 50; sy = Math.random() * window.innerHeight; break;
            case 2: sx = Math.random() * window.innerWidth;  sy = window.innerHeight + 50; break;
            case 3: sx = -50; sy = Math.random() * window.innerHeight; break;
        }
        el.style.left = sx + 'px';
        el.style.top  = sy + 'px';
        heartStage.appendChild(el);
        heartChars.push({ el: el, tx: tx, ty: ty });
    }
}

function animateHeartIn(callback, speed) {
    var stagger = speed || 30;
    var done = 0;
    heartChars.forEach(function(item, idx) {
        setTimeout(function() {
            item.el.style.left = item.tx + 'px';
            item.el.style.top  = item.ty + 'px';
            item.el.style.opacity = '1';
            done++;
            if (done === heartChars.length) setTimeout(callback, 500);
        }, idx * stagger + 250);
    });
}

function explodeHeart(callback) {
    heartChars.forEach(function(item, idx) {
        setTimeout(function() {
            var angle = Math.random() * Math.PI * 2;
            var dist  = 250 + Math.random() * 650;
            item.el.style.transition = 'all 0.55s cubic-bezier(.17,.6,.2,1)';
            item.el.style.left   = (item.tx + Math.cos(angle) * dist) + 'px';
            item.el.style.top    = (item.ty + Math.sin(angle) * dist) + 'px';
            item.el.style.opacity = '0';
            item.el.style.fontSize = '4px';
            item.el.style.transform = 'rotate(' + (Math.random()*360-180) + 'deg)';
        }, idx * 8);
    });
    setTimeout(function() {
        heartStage.innerHTML = '';
        if (callback) callback();
    }, 1000);
}

// 生成 9 个散落位置：中心聚拢 + 自然重叠 + 随机旋转
function generateScatteredPositions(vw, vh, cardW, cardH) {
    var positions = [];

    // 散落区域：屏幕中央 ~75% 范围，制造"桌面聚拢"感
    var areaW = vw * 0.72;
    var areaH = vh * 0.76;
    var padX = (vw - areaW) / 2;
    var padY = (vh - areaH) / 2;

    // 紧凑网格 — 卡片会自然重叠
    var cellW = areaW / 3.8;
    var cellH = areaH / 3.8;

    for (var i = 0; i < 9; i++) {
        var row = Math.floor(i / 3);
        var col = i % 3;

        // 基础位置
        var baseX = padX + col * cellW + cellW * 0.45;
        var baseY = padY + row * cellH + cellH * 0.45;

        // 随机偏移（网格的 60%）
        var jitterX = (Math.random() - 0.5) * cellW * 0.65;
        var jitterY = (Math.random() - 0.5) * cellH * 0.55;

        var x = Math.max(8, Math.min(vw - cardW - 8, baseX + jitterX));
        var y = Math.max(8, Math.min(vh - cardH - 8, baseY + jitterY));

        positions.push({
            x: Math.round(x),
            y: Math.round(y),
            rot: Math.round((Math.random() - 0.5) * 26), // -13° ~ +13°
            z: i                                    // 按序叠压，后面的在上面
        });
    }

    // 随机打乱 z-index 让叠压更自然
    var zPool = [0,1,2,3,4,5,6,7,8];
    for (var j = zPool.length - 1; j > 0; j--) {
        var k = Math.floor(Math.random() * (j + 1));
        var tmp = zPool[j]; zPool[j] = zPool[k]; zPool[k] = tmp;
    }
    for (var n = 0; n < positions.length; n++) {
        positions[n].z = zPool[n];
    }

    return positions;
}

function showPhotoGrid(callback) {
    var grid = document.getElementById('photoGrid');
    var cells = grid.querySelectorAll('.photo-cell');

    var vw = window.innerWidth;
    var vh = window.innerHeight;

    // 卡片尺寸：图片区宽度 ~20vmin，上限 240px，竖屏比例 9:16
    var imgW = Math.min(vw * 0.2, vh * 0.2, 235);
    var imgH = imgW / 0.5625;
    var padSide = 8;
    var padBottom = 34;
    var padTop = 8;
    var totalW = imgW + padSide * 2;
    var totalH = imgH + padTop + padBottom;

    // 生成散落位置
    var positions = generateScatteredPositions(vw, vh, totalW, totalH);

    grid.classList.add('show');

    cells.forEach(function(cell, i) {
        var pos = positions[i];

        cell.style.width = imgW + 'px';
        cell.style.left = pos.x + 'px';
        cell.style.top  = pos.y + 'px';
        cell.style.setProperty('--rot', pos.rot + 'deg');
        cell.style.zIndex = pos.z;
        // 进场前复位
        cell.classList.remove('visible');
        cell.style.opacity = '';
        cell.style.transform = '';

        // 逐个弹入
        setTimeout(function() {
            cell.classList.add('visible');
        }, i * 160 + 60);
    });

    // 停留时长：最后一张弹入后 + 3.2s
    var totalDelay = (cells.length - 1) * 160 + 60 + 720 + 3200;

    setTimeout(function() {
        // 逐个飞走
        cells.forEach(function(cell, i) {
            setTimeout(function() {
                cell.style.opacity = '0';
                cell.style.transform = 'scale(0.75) rotate(' + (positions[i].rot * 1.6) + 'deg) translateY(-25px)';
            }, i * 60);
        });
        // 清理
        setTimeout(function() {
            grid.classList.remove('show');
            cells.forEach(function(c) {
                c.classList.remove('visible');
                c.style.opacity = '';
                c.style.transform = '';
            });
            if (callback) callback();
        }, 750);
    }, totalDelay);
}

// 单层爱心：创建 → 飞入 → 停留 → 爆炸 → 回调
function runOneHeartLayer(texts, speed, stayMs, onDone) {
    createHeartTexts(texts);
    animateHeartIn(function() {
        setTimeout(function() {
            explodeHeart(function() {
                if (onDone) onDone();
            });
        }, stayMs);
    }, speed);
}

// 串联：三层爱心 → 宝丽来散落 → 幻灯片 → 星形
function runPhotoHeartThenStar(onAllDone) {
    // 第一层：emoji + 英文 → 快速活泼
    runOneHeartLayer(heartLayer1, 16, 1000, function() {
        // 第二层：短中文 → 中速扎实
        runOneHeartLayer(heartLayer2, 20, 1200, function() {
            // 第三层：品质词 → 慢速深情
            runOneHeartLayer(heartLayer3, 26, 1800, function() {
                // ① 9 张宝丽来散落
                showPhotoGrid(function() {
                    // ② 4 列幻灯片 → P2 暂停 → ③ 祝福爱心
                    runPhotoSlides(function() {
                        showContinueBtn(function() {
                            playStarFormation(onAllDone);
                        });
                    });
                });
            });
        });
    });
}

// ============================================================
//  动画时间轴
// ============================================================
var animationTimeline = function() {
    var textBoxChars = document.getElementsByClassName('hbd-chatbox')[0];
    var hbd = document.getElementsByClassName('wish-hbd')[0];

    textBoxChars.innerHTML = '<span>' + textBoxChars.innerHTML
        .split('')
        .join('</span><span>') + '</span>';

    hbd.innerHTML = '<span>' + hbd.innerHTML
        .split('')
        .join('</span><span>') + '</span>';

    var ideaIn = {
        opacity: 0, y: -20, rotationX: 5, skewX: '15deg'
    };
    var ideaOut = {
        opacity: 0, y: 20, rotationY: 5, skewX: '-15deg'
    };

    var tl = new TimelineMax();

    tl.to('.container', 0.1, { visibility: 'visible' })

        // ---- 第1段：打招呼 ----
        .from('.one', 0.7, { opacity: 0, y: 10 })
        .from('.two', 0.4, { opacity: 0, y: 10 })
        .to('.one', 0.7, { opacity: 0, y: 10 }, '+=2.5')
        .to('.two', 0.7, { opacity: 0, y: 10 }, '-=1')

        // ---- 第2段：点题 ----
        .from('.three', 0.7, { opacity: 0, y: 10 })
        .to('.three', 0.7, { opacity: 0, y: 10 }, '+=2')

        // ---- 第3段：聊天气泡 ----
        .from('.four', 0.7, { scale: 0.2, opacity: 0 })
        .from('.fake-btn', 0.3, { scale: 0.2, opacity: 0 })
        .staggerTo('.hbd-chatbox span', 0.5, { visibility: 'visible' }, 0.05)
        .to('.fake-btn', 0.1, { backgroundColor: '#ff9a9e' })
        .to('.four', 0.5, { scale: 0.2, opacity: 0, y: -150 }, '+=0.7')

        // ---- 第4段：层层铺垫 ----
        .from('.idea-1', 0.7, ideaIn)
        .to('.idea-1', 0.7, ideaOut, '+=1.5')
        .from('.idea-2', 0.7, ideaIn)
        .to('.idea-2', 0.7, ideaOut, '+=1.5')
        .from('.idea-3', 0.7, ideaIn)
        .to('.idea-3 strong', 0.5, { scale: 1.2, x: 10, backgroundColor: '#ff6b81', color: '#fff' })
        .to('.idea-3', 0.7, ideaOut, '+=1.5')
        .from('.idea-4', 0.7, ideaIn)
        .to('.idea-4', 0.7, ideaOut, '+=1.5')
        .from('.idea-5', 0.7, { rotationX: 15, rotationZ: -10, skewY: '-5deg', y: 50, z: 10, opacity: 0 }, '+=0.5')
        .to('.idea-5 .smiley', 0.7, { rotation: 90, x: 8 }, '+=0.4')
        .to('.idea-5', 0.7, { scale: 0.2, opacity: 0 }, '+=2')
        .staggerFrom('.idea-6 span', 0.8, { scale: 3, opacity: 0, rotation: 15, ease: Expo.easeOut }, 0.2)
        .staggerTo('.idea-6 span', 0.8, { scale: 3, opacity: 0, rotation: -15, ease: Expo.easeOut }, 0.2, '+=1')

        // 「你具有很多过人的品质」退场后 → P1 暂停
        .call(function() {
            tl.pause();
            showContinueBtn(function() {
                runPhotoHeartThenStar(function() {
                    // P3: 祝福爱心完成 → 暂停 → 继续后进入 Stage 5
                    showContinueBtn(function() {
                        tl.resume();
                    });
                });
            });
        }, null, null, '+=0.3')

        // ---- 第5段：照片 + 祝福（星形炸开后出现）----
        .staggerFromTo('.baloons img', 2.5,
            { opacity: 0.9, y: 1400 },
            { opacity: 1, y: -1000 }, 0.2)
        .from('.lydia-dp', 0.5, { scale: 3.5, opacity: 0, x: 25, y: -25, rotationZ: -45 }, '-=2')
        .staggerFrom('.wish-hbd span', 0.7, {
            opacity: 0, y: -50, rotation: 150, skewX: '30deg',
            ease: Elastic.easeOut.config(1, 0.5)
        }, 0.1)
        .staggerFromTo('.wish-hbd span', 0.7,
            { scale: 1.4, rotationY: 150 },
            { scale: 1, rotationY: 0, color: '#ff6b81', ease: Expo.easeOut },
            0.1, 'party')
        .from('.wish h5', 0.5, { opacity: 0, y: 10, skewX: '-15deg' }, 'party')

        // ---- 第6段：圆形粒子 ----
        .staggerTo('.eight svg', 1.5, {
            visibility: 'visible', opacity: 0, scale: 80,
            repeat: 3, repeatDelay: 1.4
        }, 0.3)
        .to('.six', 0.5, { opacity: 0, y: 30, zIndex: '-1' })

        // ---- 第7段：结尾 ----
        .staggerFrom('.nine p', 1, ideaIn, 1.2)
        .to('.last-smile', 0.5, { rotation: 90 }, '+=1');

    // 重播（防抖：1.5s 内不可重复触发）
    var replayLocked = false;
    var replyBtn = document.getElementById('replay');
    replyBtn.addEventListener('click', function() {
        if (replayLocked) return;
        replayLocked = true;
        setTimeout(function() { replayLocked = false; }, 1500);

        starStage.innerHTML = '';
        if (heartStage) heartStage.innerHTML = '';
        // 清理宝丽来散落
        var grid = document.getElementById('photoGrid');
        if (grid) {
            grid.classList.remove('show');
            grid.querySelectorAll('.photo-cell').forEach(function(c) {
                c.classList.remove('visible');
                c.style.opacity = '';
                c.style.transform = '';
            });
        }
        // 清理幻灯片
        var slides = document.getElementById('photoSlides');
        if (slides) {
            slides.classList.remove('show');
            var row = slides.querySelector('.slide-row');
            if (row) {
                row.classList.remove('fading');
                row.querySelectorAll('.slide-panel').forEach(function(p) {
                    p.classList.remove('visible');
                });
                row.querySelectorAll('.panel-polaroid').forEach(function(pp) {
                    pp.classList.remove('visible');
                });
                row.querySelectorAll('.panel-title').forEach(function(t) {
                    t.classList.remove('visible');
                });
                row.querySelectorAll('.panel-body').forEach(function(b) {
                    b.classList.remove('visible');
                });
            }
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(function() { tl.restart(); }, 500);
    });
};

// 预加载数据
fetchData();
