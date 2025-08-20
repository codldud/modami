// ---------- 페이지 전환(공통로직) ----------
// 방문 스택 (백버튼용)
const navStack = ['page-main'];

function showPage(pageId, { push = true } = {}) {
  document.querySelectorAll('.page').forEach(p => {
    p.classList.toggle('visible', p.id === pageId);
  });

  // 헤더
  const isMain = (pageId === 'page-main');
  document.getElementById('header-home')?.classList.toggle('visible', isMain);
  document.getElementById('header-step')?.classList.toggle('visible', !isMain);

  // ★ emotion bio 페이지일 때만 body 배경 ON
  document.body.classList.toggle('bio-bg', pageId === 'page-emotion-bio');

  if (push && navStack[navStack.length - 1] !== pageId) navStack.push(pageId);

  // 뒤로가기 버튼 관리 (data-back 권장)
  document.querySelectorAll('[data-back]').forEach(btn => {
    btn.toggleAttribute('disabled', navStack.length <= 1);
  });
}

function back() {
  if (navStack.length <= 1) return;
  navStack.pop();
  const prev = navStack[navStack.length - 1];
  showPage(prev, { push: false });
}

//  페이지 전환
document.getElementById('btn-start')?.addEventListener('click', () => {
  showPage('page-step01');
});
document.getElementById('step01-btn-next')?.addEventListener('click', () => {
  showPage('page-step02');
});
document.getElementById('step02-btn-next')?.addEventListener('click', () => {
  showPage('page-step03');
});
document.getElementById('step03-btn-next')?.addEventListener('click', () => {
  showPage('page-step04');
});
document.getElementById('step04-btn-next')?.addEventListener('click', () => {
  showPage('page-emotion-bio');
});
document.getElementById('emotion-marker-childhood')?.addEventListener('click', () => {
  showPage('page-emotion-episode');
});
document.getElementById('btn-back')?.addEventListener('click', back);


// ---------- Step02: 문체 텍스트 ----------
const COPY = {
  emotional: "나는 아주 어린시절 어머니와 함께 시장을 갔었다.",
  plain:     "유년 시절, 어머니와 함께 시장에 갔다.",
  kind:      "어릴 적, 엄마 손을 잡고 시장 길을 걸었다.",
  cheerful:  "아주 어릴 때 어머니와 시장에 간 기억이 있다."
};

// ---------- Step03: 폰트 스타일 ----------
const FONT_MAP = {
  gothic:   "'KimjungchulGothic'",
  myungjo:  "'KimjungchulMyungjo'",
  script:   "'KimjungchulScript'"
};

// [ADD] ---------- LocalStorage 유틸 & 스키마 ----------
const LS_KEY = 'modami_story_v1';
const DEFAULT_STATE = {
  meta:  { title: '', birthYear: '' },
  style: { tone: 'emotional', font: 'gothic' }
};

function loadState() {
  try { return { ...DEFAULT_STATE, ...(JSON.parse(localStorage.getItem(LS_KEY)) || {}) }; }
  catch { return { ...DEFAULT_STATE }; }
}
function saveState(state) {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}
function updateState(path, value) {
  const state = loadState();
  const seg = path.split('.');
  let cur = state;
  for (let i = 0; i < seg.length - 1; i++) cur = cur[seg[i]];
  cur[seg[seg.length - 1]] = value;
  saveState(state);
  return state;
}
function debounce(fn, ms=200){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }

// [ADD] ---------- step01 입력 바인딩(제목/출생년도) ----------
function bindStep01Inputs(){
  // id가 있으면 우선, 없으면 기존 클래스 fallback
  const titleEl = document.getElementById('input-story-title') || document.querySelector('#page-step01 .story-title input');
  const yearEl  = document.getElementById('input-birth-year')  || document.querySelector('#page-step01 .birth-year input');

  const s = loadState();
  if (titleEl) titleEl.value = s.meta.title || '';
  if (yearEl)  yearEl.value  = s.meta.birthYear || '';

  if (titleEl) titleEl.addEventListener('input', debounce(e=>{
    updateState('meta.title', e.target.value.trim());
  }));

  if (yearEl) {
    yearEl.addEventListener('input', debounce(e=>{
      const v = e.target.value.replace(/\D/g,'').slice(0,4);
      e.target.value = v;
      updateState('meta.birthYear', v);
    }));
    yearEl.addEventListener('blur', ()=>{
      const v = yearEl.value.replace(/\D/g,'').slice(0,4);
      if (v && (+v < 1900 || +v > 2100)) {
        alert('출생년도는 1900–2100 사이로 입력해 주세요.');
      }
      yearEl.value = v;
      updateState('meta.birthYear', v);
    });
  }
}

// [MOD] ---------- 칩 토글: 초기 선택키 지원 ----------
function bindChipToggle(groupEl, onChange, initialKey) {
  const chips = Array.from(groupEl.querySelectorAll('.chip'));
  const setActive = (chip) => {
    chips.forEach(c => c.classList.toggle('is-active', c === chip));
    onChange?.(chip.dataset.key, chip);
  };
  // 초기 상태: initialKey > .is-active > 첫 칩
  let init = chips.find(c => c.dataset.key === initialKey)
           || groupEl.querySelector('.chip.is-active')
           || chips[0];
  if (init) setActive(init);

  groupEl.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (chip && groupEl.contains(chip)) setActive(chip);
  });
}

// [MOD] ---------- DOMContentLoaded: step01/02/03 저장·복원 ----------
document.addEventListener('DOMContentLoaded', () => {
  // step01: 제목/출생년도
  bindStep01Inputs();

  const state = loadState();

  // Step02: 문체 칩 → 저장 & 프리뷰 텍스트 변경
  const styleGroup = document.getElementById('writing-style');
  if (styleGroup) {
    const target = document.querySelector(styleGroup.dataset.target);
    bindChipToggle(styleGroup, (key) => {
      updateState('style.tone', key);          // [ADD] 저장
      if (target) target.textContent = COPY[key] || '';
    }, state.style.tone);                       // [ADD] 복원 키
  }

  // Step03: 폰트 칩 → 저장 & 프리뷰 폰트 변경 (문구는 그대로 유지)
  const fontGroup = document.getElementById('font-style');
  if (fontGroup) {
    const target = document.querySelector(fontGroup.dataset.target);
    bindChipToggle(fontGroup, (key) => {
      updateState('style.font', key);          // [ADD] 저장
      if (target) target.style.fontFamily = FONT_MAP[key] || '';
    }, state.style.font);                       // [ADD] 복원 키
  }
});
