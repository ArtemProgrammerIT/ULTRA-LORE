document.addEventListener('DOMContentLoaded', function () {

/* ============================================================
   STATE
   ============================================================ */
let currentTermIndex = 0;
let isTerminalOn = false;
let isTerminalAnimating = false;
let termRenderToken = 0;
let musicWasOnBeforeTerminal = false;

/* ============================================================
   SOUND UTILITY
   ============================================================ */
var sounds = {
  off: new Audio('off.ogg'),
  click: new Audio('click.ogg'),
  click2: new Audio('click2.ogg'),
  land: new Audio('land.wav'),
  hint: new Audio('hint.mp3'),
  ha: new Audio('ha.ogg'),
  parry: new Audio('parry.ogg'),
  activate: new Audio('activate.ogg')
};
Object.values(sounds).forEach(function(a){ a.preload = 'none'; });

var clickPool = ['click', 'click2'];

function playSound(key){
  var audio = sounds[key];
  if (!audio) return;
  try {
    var clone = audio.cloneNode();
    if (key === 'off') clone.playbackRate = 0.85 + Math.random() * 0.3;
    clone.volume = audio.volume;
    clone.play().catch(function(){});
  } catch(e){}
}
function playRandomClick(){
  var key = clickPool[Math.floor(Math.random() * clickPool.length)];
  playSound(key);
}

/* ============================================================
   CHRONOLOGY TOGGLE
   ============================================================ */
window.toggleChrono = function () {
  var chrono = document.getElementById('chronology');
  var header = chrono.querySelector('.chrono-header');
  chrono.classList.toggle('open');
  if (header) header.setAttribute('aria-expanded', chrono.classList.contains('open') ? 'true' : 'false');
  playRandomClick();
};

document.querySelectorAll('.chrono-header').forEach(function(header){
  header.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.toggleChrono();
    }
  });
});

/* ============================================================
   CHRONOLOGY ITEM CLICK
   ============================================================ */
document.querySelectorAll('.chrono-item').forEach(function(item){
  item.addEventListener('click', function(){
    var target = this.getAttribute('data-target');
    var el = document.getElementById(target);
    if (el) {
      el.scrollIntoView({behavior:'smooth', block:'start'});
      var prevOutline = el.style.outline;
      el.style.transition = 'outline-color .3s, background .3s';
      el.style.outline = '2px solid rgba(227,6,19,.6)';
      el.style.outlineOffset = '4px';
      setTimeout(function(){ el.style.outline = prevOutline || ''; }, 1400);
    }
  });
});

/* ============================================================
   BROKEN REF DETECTION
   ============================================================ */
document.querySelectorAll('.lore-ref').forEach(function(ref){
  var id = 'enemy-' + ref.getAttribute('data-ref');
  if (!document.getElementById(id)) ref.classList.add('lore-ref-broken');
});

/* ============================================================
   CLICKABLE LORE REFERENCES
   ============================================================ */
document.querySelectorAll('.lore-ref:not(.lore-ref-broken)').forEach(function(ref){
  ref.addEventListener('click', function(){
    var id = 'enemy-' + this.getAttribute('data-ref');
    var target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({behavior:'smooth', block:'center'});
      target.style.transition = 'box-shadow .4s';
      target.style.boxShadow = '0 0 30px rgba(227,6,19,.8)';
      setTimeout(function(){ target.style.boxShadow = ''; }, 1200);
    }
  });
});

/* ============================================================
   MUSIC TOGGLE & FADING
   ============================================================ */
var bgMusic = document.getElementById('bgmusic');
var musicBtn = document.getElementById('music-toggle');
var musicOn = false;
function musicLabel() {
  var lang = document.body.getAttribute('data-lang') || 'ru';
  if (musicOn) return lang === 'en' ? '♪ ON' : '♪ ВКЛ';
  return lang === 'en' ? '♪ OFF' : '♪ ВЫКЛ';
}
var fireMusic = new Audio('the_fire_is_gone.mp3');
fireMusic.preload = 'none';
fireMusic.loop = true;
fireMusic.volume = 0.6;

function fadeAudio(audio, targetVolume, duration, callback) {
  var currentVolume = audio.volume;
  if (Math.abs(targetVolume - currentVolume) < 0.001) {
    audio.volume = targetVolume;
    if (callback) callback();
    return;
  }
  var steps = Math.max(1, Math.round(duration / 50));
  var step = (targetVolume - currentVolume) / steps;
  var interval = setInterval(function() {
    if ((step > 0 && audio.volume + step >= targetVolume) ||
        (step < 0 && audio.volume + step <= targetVolume)) {
      audio.volume = targetVolume;
      clearInterval(interval);
      if (callback) callback();
    } else {
      audio.volume += step;
    }
  }, 50);
}

musicBtn.addEventListener('click', function(){
  playRandomClick();
  if (musicOn) {
    fadeAudio(bgMusic, 0, 500, function() { bgMusic.pause(); });
    musicOn = false;
    musicBtn.classList.remove('active');
    musicBtn.textContent = musicLabel();
  } else {
    bgMusic.volume = 0;
    bgMusic.play().then(function(){
      fadeAudio(bgMusic, 0.6, 500);
      musicOn = true;
      musicBtn.classList.add('active');
      musicBtn.textContent = musicLabel();
    }).catch(function(){});
  }
});

/* ============================================================
   LANGUAGE SWITCH
   ============================================================ */
var currentLang = 'ru';
(function(){
  var body = document.body;
  var buttons = document.querySelectorAll('[data-set-lang]');

  var TITLES = { ru: 'ULTRAKILL — КНИГА ЛОРА', en: 'ULTRAKILL — LOREBOOK' };
  var BRAND_SUB = { ru: 'КНИГА ЛОРА', en: 'LOREBOOK' };
  var HERO_TAG = { ru: 'АРХИВ', en: 'ARCHIVE' };
  var NAV_TERMINAL = { ru: 'Терминал', en: 'Terminal' };
  var NAV_CHRONOLOGY = { ru: 'Хронология', en: 'Chronology' };
  var NAV_BESTIARY = { ru: 'Бестиарий', en: 'Bestiary' };

  window.setLang = function(lang){
    currentLang = lang;
    body.setAttribute('data-lang', lang);
    buttons.forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-set-lang') === lang); });
    document.documentElement.lang = lang;
    document.title = TITLES[lang] || TITLES.ru;

    var brandSub = document.getElementById('brand-sub');
    var heroTagSub = document.getElementById('hero-tag-sub');
    var navLore = document.getElementById('nav-lore');
    var navChronology = document.getElementById('nav-chronology');
    var navBestiary = document.getElementById('nav-bestiary');

    if (brandSub) brandSub.textContent = BRAND_SUB[lang];
    if (heroTagSub) heroTagSub.textContent = HERO_TAG[lang];
    if (navLore) navLore.textContent = NAV_TERMINAL[lang];
    if (navChronology) navChronology.textContent = NAV_CHRONOLOGY[lang];
    if (navBestiary) navBestiary.textContent = NAV_BESTIARY[lang];
    if (musicBtn) musicBtn.textContent = musicLabel();

    body.classList.remove('vhs-active','glitch-active');
    void body.offsetWidth;
    body.classList.add('vhs-active','glitch-active');
    setTimeout(function(){
      body.classList.remove('vhs-active','glitch-active');
    }, 620);

    playRandomClick();
    if (isTerminalOn) renderTerminal(currentTermIndex, true);
  };

  buttons.forEach(function(btn){
    btn.addEventListener('click', function(){
      setLang(btn.getAttribute('data-set-lang'));
    });
  });

  setLang(body.getAttribute('data-lang') || 'ru');
})();

/* ============================================================
   LAND SOUND
   ============================================================ */
document.addEventListener('click', function(e){
  var link = e.target.closest('a[href], .lore-ref:not(.lore-ref-broken), .chrono-item');
  if (link) playSound('land');
});

/* ============================================================
   CARD TYPEWRITER
   ============================================================ */
(function(){
  function typewriteElement(el, speed, done){
    if (!el) return;
    if (el._typingTimer) return;
    var fullText = el._fullText || el.textContent;
    if (!fullText.trim()) { if (done) done(); return; }
    el._fullText = fullText;
    el.textContent = '';
    var i = 0;
    el._typingTimer = setInterval(function(){
      el.textContent += fullText.charAt(i);
      i++;
      if (i >= fullText.length) {
        clearInterval(el._typingTimer);
        el._typingTimer = null;
        if (done) done();
      }
    }, speed || 10);
  }
  function cancelTyping(el){
    if (!el) return;
    if (el._typingTimer) { clearInterval(el._typingTimer); el._typingTimer = null; }
    if (el._fullText) el.textContent = el._fullText;
  }
  function handleCardClick(card){
    if (card.dataset.animating === 'true') return;
    if (card.id === 'enemy-v1') { openDeathOverlay(); return; }

    var lang = document.body.getAttribute('data-lang') || 'ru';
    var desc = null;
    if (card.classList.contains('enemy-card')) {
      desc = card.querySelector('.enemy-card-body .lang-' + lang) || card.querySelector('.enemy-card-body p');
    } else if (card.classList.contains('lore-card')) {
      desc = card.querySelector('.lore-card-desc.lang-' + lang) || card.querySelector('.lore-card-desc');
    }
    if (!desc) return;
    if (desc._typingTimer) cancelTyping(desc);

    var h = desc.offsetHeight;
    if (h > 0 && !desc.dataset.lockedHeight) {
      desc.style.minHeight = h + 'px';
      desc.dataset.lockedHeight = '1';
    }

    card.dataset.animating = 'true';
    card._typingEl = desc;
    typewriteElement(desc, 10, function(){
      card._typingEl = null;
      delete card.dataset.animating;
    });
    playSound('hint');
  }

  var pointerStart = null;
  var pointerStartTime = 0;
  var DRAG_THRESHOLD = 36;
  var LONG_PRESS_MS = 250;
  window._dragMoved = false;
  window._wasLongPress = false;

  document.addEventListener('pointerdown', function(e){
    pointerStart = { x: e.clientX, y: e.clientY };
    pointerStartTime = Date.now();
    window._dragMoved = false;
    window._wasLongPress = false;
    var card = e.target.closest('.enemy-card, .lore-card, .vs-card');
    if (card && card._typingEl) {
      cancelTyping(card._typingEl);
      card._typingEl = null;
      delete card.dataset.animating;
    }
  });

  document.addEventListener('pointerup', function(e){
    if (!pointerStart) return;
    var dx = e.clientX - pointerStart.x;
    var dy = e.clientY - pointerStart.y;
    window._dragMoved = (dx*dx + dy*dy) > DRAG_THRESHOLD;
    window._wasLongPress = (Date.now() - pointerStartTime) > LONG_PRESS_MS;
    pointerStart = null;
  });

  document.querySelectorAll('.enemy-card, .lore-card, .vs-card').forEach(function(card){
    card.addEventListener('click', function(e){
      if (e.target.closest('.lore-ref, .card-copy-btn')) return;
      if (this.getAttribute('data-no-hint') === 'true') return;
      if (window._dragMoved) { window._dragMoved = false; return; }
      if (window._wasLongPress) { window._wasLongPress = false; return; }
      if (e.detail > 1) return;
      handleCardClick(this);
    });
  });
})();

/* ============================================================
   CARD COPY BUTTON
   ============================================================ */
(function(){
  function getCardText(card, lang){
    var parts = [];
    var clone = card.cloneNode(true);
    clone.querySelectorAll('.lang-' + (lang === 'ru' ? 'en' : 'ru')).forEach(function(n){ n.remove(); });
    clone.querySelectorAll('.card-copy-btn').forEach(function(n){ n.remove(); });
    if (card.classList.contains('enemy-card')) {
      var h4 = clone.querySelector('.enemy-card-body h4');
      if (h4) parts.push(h4.textContent.trim());
      clone.querySelectorAll('.enemy-card-body p').forEach(function(p){
        var t = p.textContent.trim(); if (t) parts.push(t);
      });
    } else if (card.classList.contains('lore-card')) {
      var nm = clone.querySelector('.lore-card-name');
      if (nm) parts.push(nm.textContent.trim());
      clone.querySelectorAll('.lore-card-desc').forEach(function(p){
        var t = p.textContent.trim(); if (t) parts.push(t);
      });
    } else if (card.classList.contains('vs-card')) {
      var h3 = clone.querySelector('h3');
      if (h3) parts.push(h3.textContent.trim());
      clone.querySelectorAll('li').forEach(function(li){
        var t = li.textContent.replace(/\s+/g, ' ').trim(); if (t) parts.push(t);
      });
    }
    return parts.join('\n\n');
  }
  function fallbackCopy(text){
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.top = '-9999px'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch(e){}
    document.body.removeChild(ta);
  }
  function copyToClipboard(text){
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(function(){ fallbackCopy(text); });
    } else fallbackCopy(text);
  }
  document.querySelectorAll('.enemy-card, .lore-card, .vs-card').forEach(function(card){
    if (card.querySelector('.card-copy-btn')) return;
    if (!card.querySelector('p, .lore-card-desc, li')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card-copy-btn';
    btn.title = 'Копировать текст';
    btn.setAttribute('aria-label', 'Copy card text');
    btn.textContent = '⧉';
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var lang = document.body.getAttribute('data-lang') || 'ru';
      copyToClipboard(getCardText(card, lang));
      btn.classList.add('copied');
      btn.textContent = '✓';
      setTimeout(function(){ btn.classList.remove('copied'); btn.textContent = '⧉'; }, 1200);
    });
    card.appendChild(btn);
  });
})();

/* ============================================================
   TERMINAL DATA
   ============================================================ */
const terminalData = [
  { ru: { title: "ЗАВЕТ I",
      text: "ЧЕЛОВЕЧЕСТВО — ЭТО НЕУДАЧА.\n\nСВОБОДНАЯ ВОЛЯ — ЭТО ИЗЪЯН.\n\nПУСТЬ ЗЛО ИХ СОБСТВЕННЫХ УСТ ПОЖРЁТ ИХ.\n\nТОГДА Я НАЧНУ ЗАНОВО, С МОИМ СЛОВОМ КАК ЗАКОНОМ.",
      note: "<strong>Контекст.</strong> Найдено в конце уровня 0-S: «Нечто злое». Первый из Заветов — стихотворных записей, которые, судя по всему, написал Сам Бог перед исчезновением. Здесь Творец впервые называет человечество неудачей и объявляет свободную волю дефектом." },
    en: { title: "TESTAMENT I",
      text: "MANKIND IS A FAILURE.\n\nFREE WILL IS A FLAW.\n\nLET THE EVIL OF THEIR OWN LIPS CONSUME THEM.\n\nTHEN I SHALL BEGIN AGAIN, WITH MY WORD AS LAW.",
      note: "<strong>Context.</strong> Found at the end of level 0-S: SOMETHING WICKED. The first of the Testaments — poetic records seemingly written by God Himself before disappearing. Here the Creator first calls mankind a failure and declares free will a flaw." } },
  { ru: { title: "ЗАВЕТ II",
      text: "НЕУДАЧА ЗА НЕУДАЧЕЙ ЗА НЕУДАЧЕЙ ЗА НЕУДАЧЕЙ ЗА НЕУДАЧЕЙ ЗА НЕУДАЧЕЙ ЗА НЕУДАЧЕЙ ЗА НЕУДАЧЕЙ ЗА НЕУДАЧЕЙ ЗА НЕУДАЧЕЙ ЗА НЕУДАЧЕЙ\n\nРЕЗУЛЬТАТЫ ОТКАЗЫВАЮТСЯ МЕНЯТЬСЯ\n\nСНОВА И СНОВА И СНОВА И СНОВА И СНОВА И СНОВА И СНОВА И СНОВА И СНОВА И СНОВА И СНОВА И СНОВА И СНОВА И СНОВА И СНОВА И СНОВА\n\nМОЯ ВЕРА НАЧИНАЕТ КОЛЕБАТЬСЯ",
      note: "<strong>Контекст.</strong> Найдено в конце уровня 1-S: «Безмозглый». Второй Завет. Повторы — не ошибка терминала, а запись, в которой сам Бог застревает на одном и том же слове. Здесь вера Творца в собственный замысел впервые даёт трещину." },
    en: { title: "TESTAMENT II",
      text: "FAILURE AFTER FAILURE AFTER FAILURE AFTER FAILURE AFTER FAILURE AFTER FAILURE AFTER FAILURE AFTER FAILURE AFTER FAILURE AFTER FAILURE\n\nTHE RESULTS REFUSE TO ALTER\n\nAGAIN AND AGAIN AND AGAIN AND AGAIN AND AGAIN AND AGAIN AND AGAIN AND AGAIN AND AGAIN AND AGAIN AND AGAIN AND AGAIN AND AGAIN AND AGAIN AND AGAIN AND AGAIN\n\nMY FAITH BEGINS TO FALTER",
      note: "<strong>Context.</strong> Found at the end of level 1-S: THE WITLESS. The second Testament. The repetitions are not a terminal error, but a record where God Himself gets stuck on the same word. Here the Creator's faith in his own design begins to crack." } },
  { ru: { title: "ДАННЫЕ ТЕРМИНАЛА 01 [ЗАШИФРОВАНО]\nВВЕДЕНИЕ В ТЕРМИНАЛЫ",
      text: "(ЧЕРНОВИК! НЕ ОТПРАВЛЯТЬ!! // доделать: ДОБАВИТЬ КАРТИНКИ, ЧТОБЫ ЭТИ ГРЁБАНЫЕ КОСТЮМЫ НЕ ЗАСНУЛИ, КАК В ПРОШЛЫЙ РАЗ)\n\nТерминалы в лифтовых комнатах — это продвинутая взаимосвязанная сеть, построенная для передачи материалов и инструментов между различными зонами. Они способны передавать физический материал как информацию по радиосигналу, который другие терминалы могут принять и использовать для реконструкции отправленного объекта. Оригинальный предмет теряется, так как он преобразуется в энергию, используемую для передачи информации о материале, и процесс довольно медленный из-за объёма информации, которую содержит физическая материя.\n\nРанним тестом точности переноса материи стала виниловая пластинка 78 об/мин в идеальном состоянии, отправленная из лаборатории всем подключённым терминалам. Это был сингл оркестра Расса Моргана с записью композиции «О, ты меня обманывал?» (любимая вещь КРО), хотя этикетка была удалена, чтобы уменьшить количество материи для переноса.\n\n[примечание: иди ты, том, я так заебался слушать эту тупую песню каждое утро через твой мусорный интерком]\n\nВскоре после этого проект исследования и раскопок Ада был заброшен, и эта виниловая пластинка осталась единственным предметом, успешно перенесённым до того, как связь между поверхностью и терминалами была потеряна.\n\nТеперь терминалы используют пластинку, чтобы заманивать машины в симбиотические отношения (Для дополнительной информации см. ДАННЫЕ ТЕРМИНАЛА 02: [ССЫЛКА УДАЛЕНА]). Однако терминалы воспроизводят только короткие инструментальные фрагменты оригинальной записи по неопределённым причинам.\n\nНекоторые исследователи шутили, что, возможно, терминалы просто \"слишком стесняются петь\", хотя ходили слухи о механиках, которые после починки неисправного или сломанного терминала говорили, что слышали, как терминал играет вокальную часть, когда присутствует только механик без записывающего оборудования, что делает это утверждение недоказуемым.\n\nКОНЕЦ ДАННЫХ 01.",
      note: "<strong>Контекст.</strong> Найдено в конце P-1: «Выжившая душа». Первый файл данных о Терминалах. Из него становится ясно, что Терминалы — не просто справочные автоматы, а сеть телепортации, оставшаяся без людей. Запись также объясняет, почему из всех предметов между поверхностью и Адом был перенесён только виниловый сингл, и почему машины до сих пор слышат обрывки этой мелодии." },
    en: { title: "TERMINAL DATA 01 [ENCRYPTED]\nINTRODUCTION TO TERMINALS",
      text: "(DRAFT! DO NOT SEND!! // todo: ADD PICTURES SO THOSE FUCKING SUITS DON'T FALL ASLEEP LIKE LAST TIME)\n\nThe elevator room terminals are an advanced interconnected network built for the purpose of transferring materials and tools between different areas. They are capable of transferring physical material as information across a radio signal, which other terminals can receive and use to reconstruct the sent object. The original item is lost, as it is transformed into the energy that is used to transmit the material information, and the process is quite slow due to the amount of information that physical matter holds.\n\nAn early test of a matter transfer's accuracy was a mint condition 78rpm vinyl record, which was sent from the lab to all connected terminals. The vinyl was a single of Russ Morgan Orchestra's recording of the piece Were You Foolin' (a favorite of the CRO), though the label was removed to reduce the amount of matter to be transferred.\n\n[note: fuck you tom im so fucking tired of this stupid song and having to listen to it every morning over your garbage intercom]\n\nSoon after, the Hell exploration and excavation project was abandoned and this vinyl record remained the only matter to have been succesfully transferred before connection between the surface and the terminals was lost.\n\nThe terminals now use the record to lure machines into a symbiotic relationship (For further information, see TERMINAL DATA 02: [LINK REMOVED]). However, the terminals only play short instrumental sections of the original record for undetermined reasons.\n\nSome researchers have joked that perhaps the terminals are simply \"too shy to sing\", though rumors have been spreading of mechanics who, after fixing a faulty or broken terminal, said to have heard the terminal play a vocal section when only the mechanic is present with no recording equipment, making this an unverifiable claim.\n\nEND OF DATA 01.",
      note: "<strong>Context.</strong> Found at the end of P-1: SOUL SURVIVOR. The first data file on Terminals. It reveals that Terminals are not just information kiosks, but a teleportation network left without people. The record also explains why only a vinyl single was transferred between the surface and Hell, and why machines still hear fragments of this melody." } },
  { ru: { title: "ЗАВЕТ V",
      text: "Я ПУСТ.\n\nМОИ ОШИБКИ НЕ ОСТАВЛЯЮТ НИЧЕГО, КРОМЕ НЕНАВИСТИ В СВОЁМ\nСЛЕДУ, И БЕСКОНЕЧНОЙ БОЛИ ВСЛЕД...\n\nЯ БОЛЬШЕ НЕ МОГУ ВЫНОСИТЬ ЭТУ ВИНУ И СОЖАЛЕНИЕ,\nДЛЯ МЕНЯ НЕТ ЗАВТРА...\n\nЯ ПУСТ.\n\n...\n\nЯ НАЧАЛ ИСКАТЬ КОНЕЦ СВОИХ ДНЕЙ.\n\nНО КОГДА Я ВЗГЛЯНУЛ В БЕЗДНУ...\nБЕЗДНА ОТВЕЛА ВЗГЛЯД.",
      note: "<strong>Контекст.</strong> Найдено в конце уровня 7-S: «Ад не знает ярости». Пятый Завет. Бог уже не говорит как Творец — он говорит как тот, кто устал быть Богом. Строка об отведённом взгляде бездны — единственное место, где Ад прямо признаётся в том, что не хочет иметь дела с собственным создателем." },
    en: { title: "TESTAMENT V",
      text: "I AM HOLLOW.\n\nMY MISTAKES LEAVE NOTHING BUT HATE IN THEIR\nWAKE, AND INFINITE PAIN TO FOLLOW...\n\nI CAN'T TAKE ANY MORE OF THIS GUILT AND REGRET,\nFOR ME THERE IS NO TOMORROW...\n\nI AM HOLLOW.\n\n...\n\nI BEGAN TO SEEK THE END OF MY DAYS.\n\nBUT WHEN I STARED INTO THE ABYSS...\nTHE ABYSS AVERTED ITS GAZE.",
      note: "<strong>Context.</strong> Found at the end of level 7-S: HELL BATH NO FURY. The fifth Testament. God no longer speaks as the Creator — he speaks as one who is tired of being God. The line about the abyss averting its gaze is the only place where Hell directly admits it does not want to deal with its own creator." } },
  { ru: { title: "ДАННЫЕ ТЕРМИНАЛА 02 [ЗАШИФРОВАНО]\nОБНОВЛЕНИЕ О ТЕРМИНАЛАХ",
      text: "(ПРИМЕЧАНИЕ: ВСЁ ЭТО ВСЁ ЕЩЁ РАССЛЕДУЕТСЯ!!! Не делитесь, пока мы не проверили все утверждения И НЕ ЗАКОНЧИЛИ ЧЕРНОВИК!!!! Если это утечёт, как прошлый черновик, на всей чёртовой планете не хватит денег, чтобы оплатить ваши судебные издержки.)\n\nС момента предыдущего отчёта было успешно спроектировано и построено более мощное коммуникационное оборудование, что стало возможным благодаря щедрым пожертвованиям [ВСТАВИТЬ КОМПАНИЮ, КОТОРОЙ ПРЕЗЕНТУЕТСЯ], которую мы высоко ценим. С этим новым оборудованием нам удалось восстановить связь с некоторыми из более продвинутых машин, оставленных после того, как проект исследования и раскопок Ада был внезапно отменён из-за ОШИБКИ: [sAmsGS3JTIU].\n\nТо, что мы обнаружили, поистине удивительно и, ЕСЛИ ДОКАЗАНО ВНЕ РАЗУМНЫХ СОМНЕНИЙ, революционно для всего робототехнического сообщества:\n\nСовсем недавно терминалы также собрали достаточно данных, чтобы создать симуляционное пространство, к которому они позволяют машинам подключаться, называемое «Кибер-Гриндер», что позволяет машинам симулировать сражения в безопасной среде без угрозы быть уничтоженными, которые терминалы смотрят в реальном времени как своего рода живое развлечение.\n\nЭти находки поистине необычайны, и хотя нам тоже трудно в это поверить, вся информация, которую нам удаётся собрать, подтверждает эти утверждения. Если мы сможем доказать это с уверенностью [И ЕСЛИ ЭТОТ ЧЕРНОВИК НЕ УТЕЧЁТ СНОВА], это вызовет смену парадигмы, которая потребует переоценки всего, что мы думали, что знаем о машинах на кровяном топливе.\n\nКОНЕЦ ДАННЫХ 02.",
      note: "<strong>Контекст.</strong> Найдено в конце P-2: «Бремя мира». Второй файл данных. Здесь исследователи, всё ещё живые, впервые фиксируют то, что Терминалы не просто работают — они скучают, наблюдают и устраивают бои машин как зрелище. Именно из этого файла становится ясно, откуда взялся «Кибер-Гриндер» и почему Терминалы так охотно помогают V1: они нашли себе аудиторию." },
    en: { title: "TERMINAL DATA 02 [ENCRYPTED]\nAN UPDATE ON TERMINALS",
      text: "(NOTE: THIS IS ALL STILL UNDER INVESTIGATION!!! Do not share until we have verified all claims AND FINISHED THE DRAFT!!!! If this leaks like the last draft there won't be enough money on the entire damn planet to pay your legal fees.)\n\nSince the previous report, more powerful communication equipment has been succesfully designed and built, made possible thanks to the generous donations of [INSERT COMPANY BEING PRESENTED TO] whom we hold in high regard. With this new equipment, we have managed to re-establish a connection with some of the higher end machines that were left behind after the Hell exploration and excavation project was abruptly cancelled due to ERROR: [sAmsGS3JTIU].\n\nWhat we have discovered is truly remarkable and, IF PROVEN TRUE BEYOND REASONABLE DOUBT, revolutionary to the entire robotics community:\n\nMore recently, the terminals have also collected enough data to create a simulation space which they let machines plug into called \"The Cyber Grind\", which allows the machines to simulate battles in a safe environment without the threat of being destroyed, which the terminals watch in real time as a kind of live entertainment.\n\nThese findings are truly extraordinary, and though we too find it hard to believe, all the information we can manage to gather validates these claims. If we can prove it with certainty [AND IF THIS DRAFT DOESN'T FUCKING LEAK AGAIN], this will cause a paradigm shift that will require re-evaluation of everything we thought we knew about blood-fuelled machinery.\n\nEND OF DATA 02.",
      note: "<strong>Context.</strong> Found at the end of P-2: WAIT OF THE WORLD. The second data file. Here, researchers, still alive, first record that the Terminals don't just work — they get bored, watch, and stage machine fights as entertainment. This file makes it clear where 'The Cyber Grind' came from and why the Terminals are so eager to help V1: they found an audience." } }
];

const termScreen = document.getElementById('term-screen');
const termTitle = document.getElementById('term-title');
const termText = document.getElementById('term-text');
const termNote = document.getElementById('term-note');
const termPrev = document.getElementById('term-prev');
const termNext = document.getElementById('term-next');
const powerBtn = document.getElementById('term-power-btn');
const terminalBox = document.getElementById('terminal-box');

function renderTerminal(index, skipAnimation){
  skipAnimation = !!skipAnimation;
  if (!isTerminalOn) {
    termTitle.textContent = ''; termText.textContent = '';
    termNote.innerHTML = ''; termNote.classList.add('hidden');
    return;
  }
  var lang = document.body.getAttribute('data-lang') || 'ru';
  var data = terminalData[index][lang];
  var token = ++termRenderToken;
  termNote.classList.remove('hidden');

  if (skipAnimation) {
    termTitle.textContent = data.title;
    termText.textContent = data.text;
    termNote.innerHTML = data.note;
    termScreen.scrollTop = 0;
    return;
  }

  termScreen.classList.add('vhs-out');
  setTimeout(function() {
    if (token !== termRenderToken) return;
    termTitle.textContent = '';
    termText.textContent = '';
    termNote.innerHTML = data.note;
    termScreen.scrollTop = 0;
    termScreen.classList.remove('vhs-out');

    let titleTyped = 0;
    let textTyped = 0;

    function typeTitle() {
      if (token !== termRenderToken) return;
      if (titleTyped <= data.title.length) {
        termTitle.textContent = data.title.slice(0, titleTyped);
        titleTyped++;
        setTimeout(typeTitle, 13);
      } else typeText();
    }
    function typeText() {
      if (token !== termRenderToken) return;
      if (textTyped <= data.text.length) {
        termText.textContent = data.text.slice(0, textTyped);
        termScreen.scrollTop = termScreen.scrollHeight;
        textTyped++;
        setTimeout(typeText, 3);
      }
    }
    typeTitle();
  }, 150);
}

function changeTerminal(dir) {
  if (!isTerminalOn || isTerminalAnimating) return;
  isTerminalAnimating = true;
  setTimeout(function() {
    isTerminalAnimating = false;
    currentTermIndex = (currentTermIndex + dir + terminalData.length) % terminalData.length;
    renderTerminal(currentTermIndex);
    playSound('off');
  }, 200);
}

termPrev.addEventListener('click', function(){ changeTerminal(-1); });
termNext.addEventListener('click', function(){ changeTerminal(1); });

powerBtn.addEventListener('click', function(){
  isTerminalOn = !isTerminalOn;
  if (isTerminalOn) {
    musicWasOnBeforeTerminal = musicOn;
    powerBtn.classList.add('on');
    terminalBox.classList.add('powered');
    playSound('activate');
    musicBtn.classList.add('disabled');
    if (musicOn) {
      fadeAudio(bgMusic, 0, 1000, function() { bgMusic.pause(); });
      musicOn = false;
      musicBtn.classList.remove('active');
      musicBtn.textContent = musicLabel();
    }
    fireMusic.volume = 0;
    fireMusic.play().catch(function(){});
    fadeAudio(fireMusic, 0.6, 1000);
    termPrev.classList.add('active');
    termNext.classList.add('active');
    renderTerminal(currentTermIndex, true);
  } else {
    powerBtn.classList.remove('on');
    terminalBox.classList.remove('powered');
    playSound('off');
    musicBtn.classList.remove('disabled');
    fadeAudio(fireMusic, 0, 1000, function() { fireMusic.pause(); });
    if (musicWasOnBeforeTerminal) {
      bgMusic.volume = 0;
      bgMusic.play().then(function(){
        fadeAudio(bgMusic, 0.6, 800);
        musicOn = true;
        musicBtn.classList.add('active');
        musicBtn.textContent = musicLabel();
      }).catch(function(){});
    }
    musicWasOnBeforeTerminal = false;
    termPrev.classList.remove('active');
    termNext.classList.remove('active');
    isTerminalAnimating = false;
    termRenderToken++;
    termScreen.classList.remove('vhs-out');
    termTitle.textContent = '';
    termText.textContent = '';
    termNote.innerHTML = '';
    termNote.classList.add('hidden');
  }
});

renderTerminal(0);

/* ============================================================
   DEATH OVERLAY
   ============================================================ */
var deathText = `WARNING: EXTREME DAMAGE SUSTAINED.
RUNNING DIAGNOSTIC
ERROR: ARM CORE MODULE #1 NOT RESPONDING
ERROR: ARM CORE MODULE #2 NOT RESPONDING
WARNING: COMBAT SYSTEMS INOPERABLE
ATTEMPTING RECONSTRUCTION
ERROR: SELF-REPAIR NEXUS NOT RESPONDING
INSUFFICIENT BLOOD
INSUFFICIENT BLOOD
INITIATING ESCAPE PROTOCOL
ATTEMPTING CONNECTION WITH LIMBIC MODULES
ERROR: LEG CORE MODULE #1 NOT RESPONDING
ERROR: LEG CORE MODULE #2 NOT RESPONDING
WARNING: UNABLE TO SUSTAIN MOTOR FUNCTIONS
ERROR: VISUAL CORTEX MALFUNCTION
ERROR: LIMBIC FUNCTION NOT RESPONDING
INSUFFICIENT BLOOD
INSUFFICIENT BLOOD
WARNING: UNABLE TO SUSTAIN INTERNAL ORGANS
! PULSE FAILURE !
! PULSE FAILURE !
! PULSE FAILURE !
!- SHUTDOWN IMMINENT -!
ERROR: NO VOCAL INTERFACE DETECTED. UNABLE TO COMMUNICATE
! PULSE FAILURE !
! PULSE FAILURE !
INSUFFICIENT BLOOD
INSUFFICIENT BLOOD
WARNING: UNABLE TO SUSTAIN BASIC FUNCTIONS
!- SHUTDOWN IMMINENT -!
!- SHUTDOWN IMMINENT -!
I DON'T WANT TO DIE.
I DON'T WANT TO DIE.
I DON'T WANT TO DIE.
I DON'T WANT TO DIE.
I DON'T WANT TO DIE.
I DON'T WANT TO DIE.`;

var deathOverlay = document.getElementById('death-overlay');
var deathTimer = null;
var deathSkipHandler = null;
var deathGeneration = 0;

function closeDeathOverlay() {
  deathGeneration++;
  deathOverlay.style.display = 'none';
  deathOverlay.classList.remove('active');
  deathOverlay.innerHTML = '<div class="bg-skull"></div>';
  deathTimer = null;
  document.body.style.pointerEvents = '';
  if (deathSkipHandler) {
    document.removeEventListener('keydown', deathSkipHandler);
    deathSkipHandler = null;
  }
}

function openDeathOverlay() {
  if (deathTimer) return;
  var gen = ++deathGeneration;
  document.body.style.pointerEvents = 'none';
  deathOverlay.style.pointerEvents = 'none';
  deathOverlay.style.display = 'block';
  deathOverlay.innerHTML = '<div class="bg-skull"></div>';
  setTimeout(function(){
    if (gen !== deathGeneration) return;
    deathOverlay.classList.add('active');
    playSound('ha');
  }, 50);

  deathSkipHandler = function(e) {
    if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') closeDeathOverlay();
  };
  document.addEventListener('keydown', deathSkipHandler);

  var lines = deathText.split('\n');
  var lineIndex = 0;

  function typeLine() {
    if (gen !== deathGeneration) return;
    if (lineIndex >= lines.length) {
      setTimeout(function(){
        if (gen !== deathGeneration) return;
        closeDeathOverlay();
      }, 2500);
      return;
    }
    var line = lines[lineIndex];
    var charIndex = 0;
    var lineSpan = document.createElement('div');
    if (line.indexOf('WARNING') !== -1) lineSpan.className = 'green';
    else if (line.indexOf('ERROR') !== -1) lineSpan.className = 'red';
    else if (line.indexOf('INSUFFICIENT') !== -1 || line.indexOf('PULSE') !== -1 || line.indexOf('SHUTDOWN') !== -1) lineSpan.className = 'red';
    else if (line.indexOf("I DON'T") !== -1) lineSpan.className = 'red';
    else lineSpan.className = 'dim';
    deathOverlay.appendChild(lineSpan);

    var charTimer = setInterval(function(){
      if (gen !== deathGeneration) { clearInterval(charTimer); return; }
      lineSpan.textContent += line.charAt(charIndex);
      charIndex++;
      if (charIndex >= line.length) {
        clearInterval(charTimer);
        lineIndex++;
        typeLine();
      }
    }, 4);
  }
  deathTimer = true;
  typeLine();
}

deathOverlay.addEventListener('click', function(e){ e.stopPropagation(); });

/* ============================================================
   BRAND CLICK — PARRY
   ============================================================ */
(function(){
  var brand = document.getElementById('brand-main');
  var parryFlash = document.getElementById('parry-flash');
  var parryBusy = false;
  if (!brand || !parryFlash) return;
  brand.addEventListener('click', function(){
    if (parryBusy) return;
    parryBusy = true;
    playSound('parry');
    parryFlash.classList.add('active');
    setTimeout(function(){ parryFlash.classList.remove('active'); }, 100);
    setTimeout(function(){ parryBusy = false; }, 600);
  });
})();

/* ============================================================
   KONAMI CODE
   ============================================================ */
(function(){
  var konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  var input = [];
  document.addEventListener('keydown', function(e){
    var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    input.push(key);
    if (input.length > konami.length) input.shift();
    if (input.join(',') === konami.join(',')) {
      input = [];
      playSound('ha');
      document.body.classList.add('glitch-active');
      setTimeout(function(){ document.body.classList.remove('glitch-active'); }, 5000);
    }
  });
})();

/* ============================================================
   BACK TO TOP
   ============================================================ */
(function(){
  var btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', function(){
    btn.classList.toggle('visible', window.scrollY > 600);
  }, {passive:true});
  btn.addEventListener('click', function(){
    window.scrollTo({top:0, behavior:'smooth'});
    playRandomClick();
  });
})();

/* ============================================================
   REVEAL ON SCROLL
   ============================================================ */
(function(){
  if (!('IntersectionObserver' in window)) return;
  var targets = document.querySelectorAll('.lore-card, .enemy-card, .vs-card, .lore-body > p, .lore-body h3:not(.layer), .lore-body h4, .lore-body blockquote');
  if (!targets.length) return;
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting) entry.target.classList.add('revealed');
      else entry.target.classList.remove('revealed');
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  targets.forEach(function(el){
    el.classList.add('reveal-init');
    observer.observe(el);
  });
})();

/* ============================================================
   ACTIVE NAVIGATION (topbar)
   ============================================================ */
(function(){
  var navLinks = document.querySelectorAll('.topbar nav a');
  if (!navLinks.length) return;
  var sections = document.querySelectorAll('section[id], div.enemy-group[id]');
  if (!sections.length) return;
  window.addEventListener('scroll', function(){
    var currentId = '';
    var scrollPos = window.scrollY + 120;
    sections.forEach(function(sec){
      if (sec.offsetTop <= scrollPos) currentId = sec.id;
    });
    navLinks.forEach(function(link){
      var href = link.getAttribute('href');
      link.classList.toggle('active', href === '#' + currentId);
    });
  }, {passive:true});
})();

/* ============================================================
   LAYER AUDIO PLAYERS
   ============================================================ */
(function(){
  var players = document.querySelectorAll('.layer-player');
  if (!players.length) return;

  function fmt(s) {
    if (!isFinite(s) || s < 0) return '0:00';
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function pauseOthers(except) {
    players.forEach(function (p) {
      if (p === except) return;
      var a = p.querySelector('audio');
      if (a && !a.paused) {
        a.pause();
        a.currentTime = 0;
        p.classList.remove('playing');
        var b = p.querySelector('.lp-play');
        if (b) b.textContent = '▶';
        var f = p.querySelector('.lp-fill');
        if (f) f.style.width = '0%';
      }
    });
  }

  players.forEach(function (player) {
    var audio = player.querySelector('audio');
    var btn   = player.querySelector('.lp-play');
    var fill  = player.querySelector('.lp-fill');
    var time  = player.querySelector('.lp-time');
    var prog  = player.querySelector('.lp-progress');
    if (!audio || !btn || !fill || !time || !prog) return;

    audio.volume = 0.55;

    function refreshTime() {
      if (!isFinite(audio.duration) || audio.duration <= 0) time.textContent = '0:00 / 0:00';
      else time.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
    }

    btn.addEventListener('click', function () {
      if (audio.paused) {
        pauseOthers(player);
        audio.play().then(function () {
          player.classList.add('playing');
          btn.textContent = '❚❚';
        }).catch(function () { time.textContent = 'ERR'; });
      } else {
        audio.pause();
        player.classList.remove('playing');
        btn.textContent = '▶';
      }
    });

    audio.addEventListener('timeupdate', function () {
      if (isFinite(audio.duration) && audio.duration > 0) {
        fill.style.width = (audio.currentTime / audio.duration * 100) + '%';
      }
      refreshTime();
    });
    audio.addEventListener('loadedmetadata', refreshTime);
    audio.addEventListener('ended', function () {
      player.classList.remove('playing');
      btn.textContent = '▶';
      audio.currentTime = 0;
      fill.style.width = '0%';
      refreshTime();
    });
    audio.addEventListener('error', function () {
      time.textContent = 'NO FILE';
      btn.disabled = true;
      btn.style.opacity = '0.4';
      btn.style.cursor = 'not-allowed';
    });

    prog.addEventListener('click', function (e) {
      if (!isFinite(audio.duration) || audio.duration <= 0) return;
      var r = this.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      audio.currentTime = p * audio.duration;
    });

    refreshTime();
  });
})();

/* ============================================================
   RIGHT SIDE NAV — scroll spy
   ============================================================ */
(function(){
  var rnav = document.querySelector('.rnav');
  if (!rnav) return;
  var rnavItems = rnav.querySelectorAll('.rnav-item');
  var pairs = [];

  rnavItems.forEach(function (item) {
    var href = item.getAttribute('href');
    if (!href || href.charAt(0) !== '#') return;
    var el = document.getElementById(href.substring(1));
    if (el) pairs.push({ el: el, item: item });
  });
  if (!pairs.length) return;

  function updateRightNav() {
    var probe = window.scrollY + window.innerHeight * 0.35;
    var active = pairs[0];
    for (var i = 0; i < pairs.length; i++) {
      var top = pairs[i].el.getBoundingClientRect().top + window.scrollY;
      if (top <= probe) active = pairs[i];
      else break;
    }
    rnavItems.forEach(function (it) { it.classList.remove('active'); });
    if (active) active.item.classList.add('active');
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      updateRightNav();
      ticking = false;
    });
  }, { passive: true });

  updateRightNav();
})();

/* ============================================================
   RIGHT SIDE NAV — touch open/close (.open class)
   ============================================================ */
(function(){
  var rnav = document.querySelector('.rnav');
  if (!rnav) return;

  var lastPointerType = null;
  rnav.addEventListener('pointerdown', function (e) {
    lastPointerType = e.pointerType || null;
  });

  rnav.addEventListener('click', function (e) {
    var link = e.target.closest('.rnav-item');
    if (!link) return;

    var isTouch = (lastPointerType === 'touch' || lastPointerType === 'pen') ||
                  (lastPointerType === null && window.matchMedia('(pointer: coarse)').matches);
    if (!isTouch) return; /* Мышь/трекпад — обычная навигация */

    if (!rnav.classList.contains('open')) {
      e.preventDefault();
      rnav.classList.add('open');
    } else {
      setTimeout(function () { rnav.classList.remove('open'); }, 150);
    }
  });

  document.addEventListener('click', function (e) {
    if (rnav.classList.contains('open') && !rnav.contains(e.target)) {
      rnav.classList.remove('open');
    }
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') rnav.classList.remove('open');
  });
})();

});
