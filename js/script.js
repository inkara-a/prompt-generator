
  // v6.3: 人気テンプレ適用時の自動入力“パッ”演出（軽量・短時間）
  function flashFill_v63(nodes){
    try{
      if(!nodes || !nodes.length) return;
      nodes.forEach(n=>{ try{ n && n.classList && n.classList.remove("flashFill"); }catch(e){} });
      requestAnimationFrame(()=>{
        nodes.forEach(n=>{
          if(!n || !n.classList) return;
          n.classList.add("flashFill");
          setTimeout(()=>{ try{ n.classList.remove("flashFill"); }catch(e){} }, 950);
        });
      });
    }catch(e){}
  }

const BUILD_ID = "v20260116am-format-placeholder-fixed";
let data = null;
const el = (id) => document.getElementById(id);

// Safe debounce helper (v5.8 refactor): avoids heavy work on every keystroke
function debounce(fn, wait = 300) {
  let t = null;
  return function debounced(...args) {
    try { if (t) clearTimeout(t); } catch (e) {}
    t = setTimeout(() => {
      try { fn.apply(this, args); } catch (e) {}
    }, wait);
  };
}
// Smooth scroll helper (offset-aware)
function smoothScrollTo(elm, offsetPx = -12) {
  if (!elm || !elm.getBoundingClientRect) return;
  const top = elm.getBoundingClientRect().top + window.scrollY + offsetPx;
  window.scrollTo({ top, behavior: "smooth" });
}



// v5.7.23: 初期は生成エリアを空欄にする（ユーザーが何か操作したら自動生成開始）
let userInteracted_v5723 = false;
const markInteracted_v5723 = () => { userInteracted_v5723 = true; };
const resetInteracted_v5723 = () => { userInteracted_v5723 = false; };

const category = el("category");
const purpose = el("purpose");
const preset = el("preset");

const role = el("role");
const goal = el("goal");
const context = el("context");
const constraints = el("constraints");
const format = el("format");
const outputContent = el("outputContent");
const request = el("request");

const result = el("result");

const smart = el("smart");
const mdOpt = el("md");
const stepOpt = el("step");
const askOpt = el("ask");

const varName = el("varName");
const varHint = el("varHint");
const addVarBtn = el("addVar");
const insertVarBtn = el("insertVar");
const clearVarsBtn = el("clearVars");
const varListEl = el("varList");

let lastFocusedField = null;

const VARS_KEY = "pg_vars_v1";

let examples = [];

// Fetch helper with fallbacks.
// GitHub Pages / subdir deploy / local preview server など、置き場所が変わっても壊れにくくする。
async function fetchJsonWithFallback(paths) {
  let lastErr = null;
  for (const p of paths) {
    try {
      const url = new URL(p, window.location.href).toString();
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status} for ${url}`);
        continue;
      }
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("fetch failed");
}


let activeExampleTab = "dev";

function getTabLabels() {
  // 人気テンプレのタブ（短い単語＋アイコン）
  // ※内部キー（dev/work/learn/write/idea/trouble）はそのまま
  return [
    { key: "dev", label: "開発", long: "アプリ・システムを作りたい" },
    { key: "work", label: "仕事", long: "仕事を効率化したい" },
    { key: "learn", label: "学習", long: "学習・理解を深めたい" },
    { key: "write", label: "文章", long: "文章・コンテンツを作りたい" },
    { key: "idea", label: "企画", long: "アイデア・企画を整理したい" },
    { key: "trouble", label: "解決", long: "トラブル・問題を解決したい" }
  ];
}

function tabIconSvg(key) {
  // Lucide風のシンプルSVG（外部ライブラリ不要）
  const common = 'viewBox="0 0 24 24" aria-hidden="true" focusable="false"';
  const stroke = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const icons = {
    dev: `<svg ${common}><path ${stroke} d="M10 13a5 5 0 0 1 0-6l2-2a5 5 0 0 1 7 7l-1 1"/><path ${stroke} d="M14 11a5 5 0 0 1 0 6l-2 2a5 5 0 0 1-7-7l1-1"/></svg>`,
    work: `<svg ${common}><path ${stroke} d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1"/><rect ${stroke} x="3" y="6" width="18" height="14" rx="2"/><path ${stroke} d="M3 12h18"/></svg>`,
    learn: `<svg ${common}><path ${stroke} d="M4 19a2 2 0 0 1 2-2h14"/><path ${stroke} d="M6 17V5a2 2 0 0 1 2-2h12v16H6z"/></svg>`,
    write: `<svg ${common}><path ${stroke} d="M12 20h9"/><path ${stroke} d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>`,
    idea: `<svg ${common}><path ${stroke} d="M9 18h6"/><path ${stroke} d="M10 22h4"/><path ${stroke} d="M12 2a7 7 0 0 0-4 12c.6.5 1 1.2 1 2v1h6v-1c0-.8.4-1.5 1-2a7 7 0 0 0-4-12z"/></svg>`,
    trouble: `<svg ${common}><path ${stroke} d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5z"/><path ${stroke} d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-1.4 3.4h-1a1.7 1.7 0 0 0-1.6 1.1l-.1.2a2 2 0 0 1-3.6 0l-.1-.2A1.7 1.7 0 0 0 9.4 20.4h-1A2 2 0 0 1 7 17l.1-.1a1.7 1.7 0 0 0 .3-1.9l-.1-.2a2 2 0 0 1 1.8-2.9h.2a1.7 1.7 0 0 0 1.6-1.1l.1-.2a2 2 0 0 1 3.6 0l.1.2a1.7 1.7 0 0 0 1.6 1.1h.2a2 2 0 0 1 1.8 2.9z"/></svg>`,
  };
  return icons[key] || "";
}



function renderExampleTabs() {
  const tabsEl = el("exampleTabs");
  if (!tabsEl) return;
  tabsEl.innerHTML = "";
  const tabs = getTabLabels();
  tabs.forEach(t => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "exTab" + (activeExampleTab === t.key ? " active" : "");
    b.title = t.long || t.label;
    b.setAttribute("aria-label", (t.long || t.label) + " を表示");
    b.innerHTML = `<span class="tabIcon">${tabIconSvg(t.key)}</span><span class="tabLabel">${t.label}</span>`;
    b.addEventListener("click", () => {
      activeExampleTab = t.key;
      renderExampleTabs();
      renderExampleButtons();
      // テンプレ選択で出力形式などが変わるので再初期化
try{ window.__syncStepChecks_v58 && window.__syncStepChecks_v58(); }catch(e){}
    });
    tabsEl.appendChild(b);
  });
}

function filteredExamples() {
    const filtered = examples.filter(ex => ex.category === activeExampleTab);
  return filtered.length ? filtered : examples;
}

const presets = {
  none: { role: "", goal: "", context: "", constraints: "", format: "" },
  sns: {
    role: "SNS運用担当・コピーライター",
    goal: "SNS投稿文を作成する",
    context: "媒体：X/Instagram など（必要なら指定）\nターゲット：\n商品の特徴：",
    constraints: "短く読みやすく\n絵文字は使いすぎない\n炎上しそうな表現は避ける",
    format: "投稿案を3パターン\n各案：本文 / ハッシュタグ / 狙い（1行）"
  },
  email: {
    role: "ビジネス文章のプロ（丁寧で簡潔）",
    goal: "相手に誤解なく伝わるメール文を作る",
    context: "相手：上司/取引先/同僚\n状況：\n期限：",
    constraints: "結論から書く\n丁寧だが長くしない\n依頼事項を明確に",
    format: "件名案 + 本文（そのまま送れる敬語） + 要点（箇条書き）"
  },
  doc: {
    role: "初心者向けマニュアル作成のプロ",
    goal: "迷わない手順書を作る",
    context: "対象者：\n前提環境：\nゴール：",
    constraints: "手順は番号付き\n1ステップ1行動\nつまずきポイントも書く",
    format: "1.対象者 2.前提 3.手順 4.注意点 5.チェックリスト"
  },
  code: {
    role: "実務経験豊富なソフトウェアエンジニア",
    goal: "コードを生成/修正して動く形にする",
    context: "言語/環境：\n現状：\n期待する動作：",
    constraints: "省略しない\n初心者向けに説明も付ける\n実行手順も書く",
    format: "1.方針 2.コード全文 3.使い方 4.注意点"
  },
  plan: {
    role: "要件整理・企画の壁打ち相手",
    goal: "目的と要件を整理してMVPを出す",
    context: "誰のどんな課題：\n現状：\n理想：",
    constraints: "質問を優先\n決めるべき点を明確に\nMVPから始める",
    format: "1.要約 2.確認質問 3.要件（Must/Should/Could） 4.MVP 5.次の作業"
  }
};

function loadVars() {
  try {
    const raw = localStorage.getItem(VARS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function saveVars(vars) { localStorage.setItem(VARS_KEY, JSON.stringify(vars)); }

function normalizeVarName(name) {
  return (name || "").trim().replace(/^\{\{\s*|\s*\}\}$/g, "").replace(/\s+/g, "");
}
function tokenOf(name) { return `{{${normalizeVarName(name)}}}`; }

function renderVars() {
  const vars = loadVars();
  if (!varListEl) return;
  varListEl.innerHTML = "";
  vars.forEach((v, idx) => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.title = "クリックで挿入";
    const t = tokenOf(v.name);
    const h = (v.hint||"").trim();
    chip.innerHTML = `<span class="mono">${t}</span> <small>${h}</small> <span class="x" title="削除">×</span>`;
    chip.addEventListener("click", (e) => {
      const isX = e.target && e.target.classList && e.target.classList.contains("x");
      if (isX) {
        const next = loadVars().filter((_, i) => i !== idx);
        saveVars(next);
        renderVars();
        autoPreview();
      try{window.__applyStepChecks && window.__applyStepChecks();}catch(e){}

        return;
      }
      insertTextAtCursor(t);
      autoPreview();
    });
    varListEl.appendChild(chip);
  });
}

function insertTextAtCursor(text) {
  const target = lastFocusedField || document.activeElement;
  if (!target) return;
  const tag = (target.tagName || "").toLowerCase();
  if (tag !== "textarea" && tag !== "input") {
    alert("挿入先の入力欄をクリックしてから、もう一度押してください。");
    return;
  }
  const start = target.selectionStart ?? target.value.length;
  const end = target.selectionEnd ?? target.value.length;
  target.value = target.value.slice(0, start) + text + target.value.slice(end);
  const pos = start + text.length;
  target.focus();
  if (typeof target.setSelectionRange === "function") target.setSelectionRange(pos, pos);
}

function attachFocusTracker(node) {
  if (!node) return;
  node.addEventListener("focus", () => { lastFocusedField = node; });
  node.addEventListener("click", () => { lastFocusedField = node; });
}

async function loadTemplates() {
  try {
    // templates.json
    data = await fetchJsonWithFallback([
      "./data/templates.json",
      "data/templates.json",
      "./generator/data/templates.json",
      "generator/data/templates.json",
      "../data/templates.json",
      "../generator/data/templates.json",
    ]);

    // 人気テンプレ（examples.json）
    try {
      examples = await fetchJsonWithFallback([
        "./data/examples.json",
        "data/examples.json",
        "./generator/data/examples.json",
        "generator/data/examples.json",
        "../data/examples.json",
        "../generator/data/examples.json",
      ]);
    } catch (e) {
examples = [];
    }
  } catch (e) {
    alert("テンプレートJSONの読み込みに失敗しました。\nNetlifyなどのサーバー上で開いてください。");
return;
  }
  initCategories();
  renderExampleTabs();
  renderExampleButtons();
  autoPreview();
  // v5.8: templates loaded -> sync step checks (initial Step1 should reflect default selection)
  try{ window.__syncStepChecks_v58 && window.__syncStepChecks_v58(); }catch(e){}
}


function initCategories() {
  if (!category) return;
  if (!data || typeof data !== "object") {
    // ここに来るのは fetch 失敗時など。UIは壊さず空のままにする。
    category.innerHTML = "";
    return;
  }
  category.innerHTML = "";
  for (const key in data) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = data[key].label;
    category.appendChild(opt);
  }
  initPurposes();
}

function initPurposes() {
  if (!purpose) return;
  if (!data || typeof data !== "object") {
    purpose.innerHTML = "";
    return;
  }
  purpose.innerHTML = "";
  const selected = category.value;
  const purposes = data[selected] && data[selected].purposes ? data[selected].purposes : {};
  for (const p in purposes) {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    purpose.appendChild(opt);
  }
  goal.placeholder = `例：${purpose.value} をやりたい（具体的に）`;
  // 初期プレースホルダーは固定（初心者が迷わないように具体例を表示）
  format.placeholder = "例：1.方針 2.コード全文 3.使い方 4.注意点";
  autoPreview();
}

function setAdvancedFromSmart() {
  if (!mdOpt || !stepOpt || !askOpt) return;
  if (smart && smart.checked) {
    mdOpt.checked = true;
    stepOpt.checked = true;
    askOpt.checked = true;
  }
}
function syncSmartFromAdvanced() {
  if (!smart || !mdOpt || !stepOpt || !askOpt) return;
  smart.checked = (mdOpt.checked && stepOpt.checked && askOpt.checked);
}

function applyPreset(clearRequest=false) {
  const key = preset.value;
  const p = presets[key] || presets.none;

  // 自由（none）なら、入力ガイドを空欄にする（要望どおり）
  if (key === "none") {
    role.value = "";
    goal.value = "";
    context.value = "";
    constraints.value = "";
    format.value = "";
  if (outputContent) outputContent.value = "";
    if (clearRequest) request.value = "";
    autoPreview();
    return;
  }

  // それ以外は、未入力なら入れる（上書きしすぎない）
  if (p.role && !role.value.trim()) role.value = p.role;
  if (p.goal && !goal.value.trim()) goal.value = p.goal;
  if (p.context && !context.value.trim()) context.value = p.context;
  if (p.constraints && !constraints.value.trim()) constraints.value = p.constraints;
  if (p.format && !format.value.trim()) format.value = p.format;
  autoPreview();
}

category.addEventListener("change", initPurposes);
purpose.addEventListener("change", initPurposes);
preset.addEventListener("change", () => applyPreset(false));

if (smart) smart.addEventListener("change", () => { setAdvancedFromSmart(); autoPreview(); });
[mdOpt, stepOpt, askOpt].forEach(ch => ch && ch.addEventListener("change", () => { syncSmartFromAdvanced(); autoPreview(); }));

function section(title, body, useMd) {
  const b = (body || "").trim();
  if (!b) return "";
  return useMd ? `# ${title}\n${b}\n\n` : `${title}\n${b}\n\n`;
}

function buildVarsSection(useMd) {
  const vars = loadVars();
  if (!vars.length) return "";
  const lines = vars.map(v => {
    const t = tokenOf(v.name);
    const h = (v.hint || "").trim();
    return h ? `- ${t}: ${h}` : `- ${t}: （ここに何を入れるか書いてください）`;
  }).join("\n");

  let out = "";
  out += useMd ? `# 穴埋め（あとで入れる項目）\n${lines}\n\n` : `穴埋め（あとで入れる項目）\n${lines}\n\n`;
  out += useMd
    ? `# 穴埋めの使い方\n本文中の {{...}} は、あなたが文脈に合わせて埋めてください。\n分からない場合は、先に質問してください。\n\n`
    : `穴埋めの使い方\n本文中の {{...}} は、あなたが文脈に合わせて埋めてください。分からない場合は、先に質問してください。\n\n`;
  return out;
}

function buildPrompt() {
  const base = data?.[category.value]?.purposes?.[purpose.value] || "";
  const useMd = mdOpt?.checked ?? true;

  let out = "";
  out += section("AIの立場", role.value || "（必要なら書く）", useMd);
  out += section("やりたいこと", goal.value || "（何をしたいか書く）", useMd);
  out += section("状況・素材", context.value, useMd);
  out += section("守ってほしいルール", constraints.value, useMd);
  out += section("ほしい出力の形", format.value, useMd);
  // v5.7.24-testfix: テンプレ固有の出力項目（outputContent）をプロンプトに含める
  out += section("出してほしい内容（テンプレの中身）", (outputContent && outputContent.value) || "", useMd);

  out += buildVarsSection(useMd);
  out += useMd ? `# 用途テンプレ\n${base}\n\n` : `用途テンプレ\n${base}\n\n`;

  out += section("追加のお願い", request.value.trim() || "（ここにお願いを書いてください）", useMd);

  if (stepOpt?.checked ?? true) {
    out += useMd ? `# 指示\nStep-by-stepで考えてください。\n\n` : `指示\nStep-by-stepで考えてください。\n\n`;
  }
  if (askOpt?.checked ?? true) {
    out += useMd
      ? `# 追加で質問してOK\n情報が足りない場合は、回答を作る前に私に質問してください。\n`
      : `追加で質問してOK\n情報が足りない場合は、回答を作る前に私に質問してください。\n`;
  }
  return out.trim();
}

function autoPreview() {
  const r = el('result');
  if (!userInteracted_v5723) {
    if (r) r.value = '';
    return;
  }

  if (!result) return;
  result.value = buildPrompt();


  // v5.8 step check sync
  try{ if (window.__updateStepChecks) window.__syncStepChecks_v58 && window.__syncStepChecks_v58(); }catch(e){}
}

// Debounced preview (v5.8 refactor)
const autoPreviewDebounced = debounce(() => { autoPreview(); }, 300);

function flash(btn) {
  btn.classList.remove("flash");
  void btn.offsetWidth;
  btn.classList.add("flash");
}

async function doCopy() {
  // Copy behavior:
  // - If result already has text, copy it as-is.
  // - If result is empty but the user has entered something, buildPrompt() then copy.
  // - If everything is truly empty, do NOT generate/copy; just show a hint.

  const r = el('result');

  const existing = (r?.value || '').trim();

  const roleTxt = (el('role')?.value || '').trim();
  const goalTxt = (el('goal')?.value || '').trim();
  const reqTxt  = (el('request')?.value || '').trim();
  const ctxTxt  = (el('context')?.value || '').trim();
  const outTxt  = (el('outputContent')?.value || '').trim();
  const formatTxt = (el('format')?.value || '').trim();

  const hasAny = !!(roleTxt || goalTxt || reqTxt || ctxTxt || outTxt || formatTxt);

  // 完全未入力（コピーしても意味がない）
  // -> コピーはしない。呼び出し側が reason を見て「まずは内容を入力してね」を表示する。
  if (!existing && !hasAny) {
    return { ok: false, reason: 'no_input' };
  }

  const text = existing || buildPrompt();
  if (r) r.value = text;

  // iOS/Safariなどで連打されると失敗率が上がるので排他
  if (window.__isCopying_v58) {
    return { ok: false, reason: 'busy' };
  }
  window.__isCopying_v58 = true;

  try {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true };
    } catch (e) {
      // Fallback for environments where Clipboard API is unavailable
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.left = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      try {
        const ok = document.execCommand('copy');
        if (ok) {
          return { ok: true };
        }
      } finally {
        document.body.removeChild(ta);
      }
      return { ok: false, reason: 'copy_failed' };
    }
  } finally {
    window.__isCopying_v58 = false;
  }
}

el("openChatGPT") && el("openChatGPT").addEventListener("click", async () => {
  await doCopy();
  window.open("https://chat.openai.com/", "_blank");
});

// 一括クリア（人気テンプレ確認後にすぐ自分用を書ける）

  // v5.8 safe refactor: clearAll の初期化処理を1関数に集約（移動＋重複削除のみ）
  function resetPopularTemplate_v58(){
    // 人気テンプレ（タブ/カード）を初期状態へ
    try{
      activeExampleTab = "dev";
      if (category) category.value = "dev";
      // 初期状態の用途（見た目のデフォルト）へ戻す
      try{ if (typeof initPurposes === "function") initPurposes(); }catch(e){}
      if (purpose) purpose.value = "画面UI作成";
      if (preset) preset.value = "none";
      renderExampleTabs();
      renderExampleButtons();
    }catch(e){}
  }

  function resetToInitialState_v58(){
    resetInteracted_v5723();

    // 出力欄クリア
    if (result) result.value = "";
    const r = el('result'); if (r) r.value = "";

    // テキスト入力を全部空に
    role.value = "";
    goal.value = "";
    context.value = "";
    constraints.value = "";
    format.value = "";

    // 一括クリア後は「出力の書き方（見た目）」をデフォルト（箇条書き）へ戻す
    try{ window.__resetFormatTouched && window.__resetFormatTouched(); }catch(e){}
    try{ window.__setBulletsSelected && window.__setBulletsSelected({ forceText: true, setText: true, dispatch: false }); }catch(e){}

    if (outputContent) outputContent.value = "";
    request.value = "";

    // 型は「そのまま（自由に書く）」へ
    if (preset) preset.value = "none";

    resetPopularTemplate_v58();

    // 穴埋め一覧は残す（必要なら「一覧クリア」を使用）
    renderVars();

    // プレビュー更新
    autoPreview();

    // 先頭の入力にフォーカス
    try{ role.focus({ preventScroll: true }); }catch(e){ try{ role.focus(); }catch(_e){} }

    // After clear, sync step checks
    try{
      if (window.__syncStepChecks_v58) window.__syncStepChecks_v58();
      else if (typeof updateStepChecks === 'function') updateStepChecks();
    }catch(e){}
  }
el("clearAll") && el("clearAll").addEventListener("click", () => {
    resetToInitialState_v58();
    try{ const ex = document.querySelector(".examples"); if(ex) smoothScrollTo(ex, -16); }catch(e){}

  });

addVarBtn && addVarBtn.addEventListener("click", () => {
  const name = normalizeVarName(varName.value);
  if (!name) return alert("穴埋め名を入力してください（例：タイトル）");
  const vars = loadVars();
  if (vars.some(v => normalizeVarName(v.name) === name)) return alert("同じ穴埋め名が既にあります。");
  vars.push({ name, hint: (varHint.value||"").trim() });
  saveVars(vars);
  varName.value = "";
  varHint.value = "";
  renderVars();
  autoPreview();
});

insertVarBtn && insertVarBtn.addEventListener("click", () => {
  const name = normalizeVarName(varName.value);
  if (!name) return alert("挿入したい穴埋め名を入力するか、一覧のチップをクリックしてください。");
  insertTextAtCursor(tokenOf(name));
  autoPreview();
});

clearVarsBtn && clearVarsBtn.addEventListener("click", () => {
  if (!confirm("穴埋め一覧をクリアしますか？")) return;
  saveVars([]);
  renderVars();
  autoPreview();
});

[role, goal, context, constraints, format, request, varName, varHint].forEach(attachFocusTracker);

function setSelection(cat, pur) {
  if (!data || !data[cat]) return;
  category.value = cat;
  initPurposes();
  const purposes = data[cat].purposes;
  if (purposes && purposes[pur]) purpose.value = pur;
  autoPreview();
  try{ window.__syncStepChecks_v58 && window.__syncStepChecks_v58(); }catch(e){}
}

function setVarsFromExample(vars) {
  if (!Array.isArray(vars)) return;
  const current = loadVars();
  const set = new Set(current.map(v => normalizeVarName(v.name)));
  vars.forEach(v => {
    const n = normalizeVarName(v.name);
    if (!n || set.has(n)) return;
    current.push({ name: n, hint: (v.hint||"").trim() });
    set.add(n);
  });
  saveVars(current);
  renderVars();
}

function renderExampleButtons() {
  const grid = el("exampleGrid");
  if (!grid) return;
  grid.innerHTML = "";
  filteredExamples().forEach(ex => {
    const card = document.createElement("div");
    card.className = "exCard";
    card.innerHTML = `<h3>${ex.title}</h3><p>${ex.desc}</p>`;
    card.addEventListener("click", () => {
      /* v5.7.24-stable: テンプレ選択を操作として扱い、選択状態/チェック/プレビューを即時反映 */
      try{ markInteracted_v5723 && markInteracted_v5723(); }catch(e){}
      try{ document.querySelectorAll(".exCard.selected").forEach(n=>n.classList.remove("selected")); card.classList.add("selected"); }catch(e){}
      setSelection(ex.category, ex.purpose);
      preset.value = ex.preset || "none";
      applyPreset(true);

      if (ex.fill) {
        role.value = ex.fill.aiPosition || "";
        goal.value = ex.fill.goal || "";
        context.value = ex.fill.context || "";
        constraints.value = ex.fill.rules || "";
        if (outputContent) outputContent.value = (ex.fill.output || "");
      
    // 人気テンプレを最初に選んだときは「出力の書き方」をデフォルトで箇条書きにする（不自然さ防止）
    try {
      if (window.__setBulletsSelected) {
        window.__setBulletsSelected({ forceText: false, setText: true, dispatch: true });
      }
    } catch(e) {}
}
      // 穴埋め（上級者向け）は自動追加しない

      if (smart) smart.checked = true;
      setAdvancedFromSmart();
      autoPreview();
      // 自動入力された欄を一瞬だけハイライト
      try{ flashFill_v63([category, purpose, role, goal, context, constraints, outputContent, request, format].filter(Boolean)); }catch(e){}
      try{ window.__syncStepChecks_v58 && window.__syncStepChecks_v58(); }catch(e){}

    // Scroll to STEP1 (template selector) after example selection
    try{
      const presetEl = document.getElementById("preset");
      const step1El = document.querySelector(".step1Wide") || document.querySelector("#step1");
      const target = step1El || presetEl;
      if(target){
        // run twice (immediate + delayed) to survive layout changes after DOM updates
        requestAnimationFrame(() => smoothScrollTo(target, -24));
        setTimeout(() => smoothScrollTo(target, -24), 180);
      }
    }catch(e){}

    });
    grid.appendChild(card);
  });
}

renderVars();
setAdvancedFromSmart();
loadTemplates();




// v7.7.3 出力形式ボタン：確実に動くようにクリック委譲で実装（スコープ依存なし）
(function attachFormatButtonsDelegation(){
  function run(){
    const wrap = document.getElementById("formatButtons");
    if (!wrap) return;
    const formatEl = document.getElementById("format");
    if (!formatEl) return;

    const presets = {
      bullets: "出力は箇条書きで、見出し→箇条書きで読みやすくしてください。",
      mail: "出力はメール形式で、件名→本文の順に、そのまま送れる丁寧な敬語で作ってください。",
      table: "出力は「比較表」で、項目ごとに見やすく整理してください。",
      steps: "出力は手順（ステップ）形式で、1→2→3…の番号付きで書いてください。"
    };

    function setActive(key){
      wrap.querySelectorAll(".formatBtn").forEach(btn => {
        btn.classList.toggle("active", (btn.getAttribute("data-key")||"") === (key||""));
      });
      wrap.dataset.selected = key || "";
    }

    wrap.addEventListener("click", (e) => {
      const btn = e.target && e.target.closest ? e.target.closest(".formatBtn") : null;
      if (!btn || !wrap.contains(btn)) return;
      const key = btn.getAttribute("data-key") || "";
      formatEl.value = presets[key] || "";
      // 既存のリアルタイム生成に確実に反映させる
      formatEl.dispatchEvent(new Event("input", { bubbles: true }));
      formatEl.dispatchEvent(new Event("change", { bubbles: true }));
      setActive(key);
    });

    // 手入力したら選択状態を解除
    formatEl.addEventListener("input", () => {
      const sel = wrap.dataset.selected || "";
      // ユーザーが書き換えたら選択解除（ただしプリセット文のままなら維持）
      if (!sel) return;
      if ((presets[sel] || "") === (formatEl.value || "")) return;
      setActive("");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();


/* v8.2 - Stepチェック演出（入力が入ったら小さな✓） */
(function attachStepChecks(){
  function on(el, ev, fn){ if(el) el.addEventListener(ev, fn); }
  function isFilled(v){ return (v || "").toString().trim().length > 0; }

  function updateStepChecks(){
    // Step1: カテゴリ & 用途が選択済みなら（初期状態でも達成扱い）
    const cat = document.getElementById("category");
    const purpose = document.getElementById("purpose");
    const step1ok = (cat && cat.value && cat.value !== "none") && (purpose && purpose.value && purpose.value !== "none");

    // 初期/一括クリア直後（未操作）では Step2/Step3 を未完了扱いにする
    const interacted = (typeof userInteracted_v5723 !== "undefined") ? !!userInteracted_v5723 : true;

    // Step2: お願い内容がどれか1つでも埋まっていれば（format/outputContent も含む）
    const role = document.getElementById("role");
    const goal = document.getElementById("goal");
    const request = document.getElementById("request");
    const contextEl = document.getElementById("context");
    const constraintsEl = document.getElementById("constraints");
    const formatEl = document.getElementById("format");
    const outputContent = document.getElementById("outputContent");

    const step2raw = isFilled(role && role.value)
      || isFilled(goal && goal.value)
      || isFilled(contextEl && contextEl.value)
      || isFilled(constraintsEl && constraintsEl.value)
      || isFilled(request && request.value)
      || isFilled(formatEl && formatEl.value)
      || isFilled(outputContent && outputContent.value);

    const step2ok = interacted ? step2raw : false;

    // Step3: 結果（コピー対象）が1文字でも出ていれば
    const result = document.getElementById("result");
    const step3raw = isFilled(result && result.value);
    const step3ok = interacted ? step3raw : false;

    const map = {1:step1ok,2:step2ok,3:step3ok};
    document.querySelectorAll(".stepCheck").forEach(b => {
      const n = Number(b.getAttribute("data-step")||"0");
      b.classList.toggle("on", !!map[n]);
    });
  }

  // v5.7.24-testfix: 外部から再判定できるように公開
  try{ window.__updateStepChecks = updateStepChecks; }catch(e){}

  // v5.8: STEPチェック同期の単一入口
  function syncStepChecks_v58(){
    try{ if (window.__updateStepChecks) window.__updateStepChecks(); }catch(e){}
  }
  window.__syncStepChecks_v58 = syncStepChecks_v58;
  // expose for other auto-fill actions

  function bind(){
    ["category","purpose","role","goal","context","constraints","format","outputContent","request"].forEach(id=>{
      const el = document.getElementById(id);
      on(el,"input",updateStepChecks);
      on(el,"change",updateStepChecks);
    });
    // 例テンプレクリック等でも更新されるので少し遅延して再判定
    setTimeout(updateStepChecks, 0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { bind(); syncStepChecks_v58(); });
  } else {
    bind(); syncStepChecks_v58();
  }
})();


/* v8.3.1 人気テンプレ選択時：出力形式を必ず「箇条書き」選択にする（未選択の不自然さ防止） */
(function defaultBulletsOnExamplePick(){
  // format欄をユーザーが手で編集したかどうか（上書き防止用）
  let formatTouched = false;

  function markTouched(){
    formatTouched = true;
  }

  function resetFormatTouched(){
    formatTouched = false;
  }

  try{ window.__resetFormatTouched = resetFormatTouched; }catch(e){}

  // Select "bullets" format visually.
  // - setText: write guidance into #format or not
  // - dispatch: dispatch input/change events (triggers live preview)
  function setBulletsSelected({forceText=false, setText=true, dispatch=true} = {}){
    const wrap = document.getElementById("formatButtons");
    const formatEl = document.getElementById("format");
    if (!wrap || !formatEl) return;

    // activeだけは必ず付ける（見た目の未選択を解消）
    wrap.querySelectorAll(".formatBtn").forEach(btn => {
      btn.classList.toggle("active", (btn.getAttribute("data-key")||"") === "bullets");
    });
    wrap.dataset.selected = "bullets";

    // テキストは「空のときだけ」入れる（ユーザー入力は壊さない）
    if (setText && !formatTouched && (forceText || !formatEl.value.trim())){
      const bulletsText = "出力は箇条書きで、見出し→箇条書きで読みやすくしてください。";
      formatEl.value = bulletsText;
      if (dispatch){
        formatEl.dispatchEvent(new Event("input", { bubbles: true }));
        formatEl.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

  try{ window.__setBulletsSelected = setBulletsSelected; }catch(e){}

  function bind(){
    const formatEl = document.getElementById("format");
    if (formatEl){
      formatEl.addEventListener("input", markTouched);
      formatEl.addEventListener("focus", markTouched);
    }

    // 例ボタンは構造が変わりやすいので、document全体でクリック委譲
    
    // 初回ロード直後にも「未選択」感を消す（任意）
    // ただし初回は "自動生成" を発火させないため、テキスト挿入＆dispatchはしない
    setTimeout(() => setBulletsSelected({forceText:false, setText:true, dispatch:false}), 400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();




// v5.6: copy feedback (1-2s)
function setCopyFeedback(btn, text, ok = true){
  if(!btn) return;
  // clear previous timer if any
  const tid = btn.dataset.fbTimer ? Number(btn.dataset.fbTimer) : 0;
  if(tid) { try{ clearTimeout(tid); }catch(e){} }

  const prev = btn.dataset.prevText || btn.textContent;
  btn.dataset.prevText = prev;
  btn.textContent = text;
  btn.classList.toggle('isCopied', !!ok);
  btn.classList.toggle('isWarn', !ok);

  const t = setTimeout(()=>{
    btn.textContent = prev;
    btn.classList.remove('isCopied');
    btn.classList.remove('isWarn');
    btn.dataset.fbTimer = '';
  }, 1400);
  btn.dataset.fbTimer = String(t);
}




// v5.7.23: 操作した瞬間から自動生成を開始
// data-bind-preview-v58: single binding for preview (delegation is not needed; direct bind once)
(function bindPreview_v58(){
  if (window.__previewBind_v58) return;
  window.__previewBind_v58 = true;

["role","goal","context","constraints","request",
  "category","purpose","preset","format","outputContent"].forEach((id) => {
  const node = el(id);
  if (!node) return;
  node.addEventListener("input", () => { markInteracted_v5723(); autoPreviewDebounced(); }, { passive: true });
  node.addEventListener("change", () => { markInteracted_v5723(); autoPreviewDebounced(); }, { passive: true });
});

})();

// data-bind-copy-v58: single source of truth (delegation)
(function bindCopyButtons_v58(){
  if(window.__copyBind_v58) return;
  window.__copyBind_v58 = true;

  document.addEventListener('click', async (ev)=>{
    const t = ev && ev.target ? ev.target : null;
    const btn = t && t.closest ? t.closest('#copy, #copyBig') : null;
    if(!btn) return;

    try{ ev.preventDefault(); }catch(e){}

    let res = null;
    try{ res = await doCopy(); }catch(e){ res = { ok:false, reason:'copy_failed', error:e }; }

    // ボタン内テキストを1.4秒だけ差し替える（下のメッセージは出さない）
    try{
      if(res && res.ok){
        setCopyFeedback(btn, "コピーしました ✅");
      } else if(res && (res.reason === 'no_input' || res.reason === 'empty')){
        setCopyFeedback(btn, "まずは内容を入力してね");
      } else if(res && res.reason === 'busy'){
        setCopyFeedback(btn, "処理中…");
      } else {
        setCopyFeedback(btn, "コピーできませんでした");
      }
    }catch(e){}
  }, true);
})();

// clearLastFocusOnDocClick_v5724
document.addEventListener('click', (e)=>{
  const t = e.target;
  if(!t) return;
  if(t.closest && t.closest("input, textarea")) return;
  lastFocusedField = null;
});


/* v7.8: page top button (image) */
(function(){
  const btn = document.getElementById('pageTopBtn') || document.querySelector('.pageTopBtn');
  if(!btn) return;
  let ticking = false;
  const onScroll = () => {
    if(ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      btn.classList.toggle('isShow', y > 300);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();


/* v7.11: page top fallback anchor (always clickable even if JS fails) */
(function(){
  const btn = document.getElementById('pageTopBtn');
  if(!btn) return;
  btn.addEventListener('click', (e) => {
    // If it's an anchor, prevent default jump and do smooth scroll.
    if(btn.tagName && btn.tagName.toLowerCase() === 'a'){
      e.preventDefault();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();












/* v7.26: Header menu + FAQ modal (user-triggered; AdSense-safe) */
(function(){
  const modal = document.getElementById('faqModal');
  const menu = document.getElementById('menuAcc');
  const faqOpen = document.getElementById('menuFaqOpen');
  if(!modal || !menu || !faqOpen) return;

  const closeBtn = modal.querySelector('.chapinavi-modal__close');

  const setModalOpen = (isOpen) => {
    if(isOpen){
      modal.hidden = false;
      if(closeBtn) closeBtn.focus();
      return;
    }
    modal.hidden = true;
    faqOpen.focus();
  };

  faqOpen.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    menu.open = false;
    setModalOpen(true);
  });

  document.addEventListener('click', (e) => {
    const t = e.target;
    if(!t) return;

    if(!modal.hidden){
      const close = t.closest('[data-modal-close="true"]');
      if(close){
        e.preventDefault();
        setModalOpen(false);
        return;
      }
    }

    if(menu.open){
      const insideMenu = t.closest('#menuAcc');
      if(!insideMenu){
        menu.open = false;
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){
      if(!modal.hidden){
        e.preventDefault();
        setModalOpen(false);
        return;
      }
      if(menu.open){
        menu.open = false;
      }
    }
  });
})();








/* v7.31: FAQ modal open (ultra-robust, user-triggered) */
(function(){
  const ensureModal = () => {
    let modal = document.getElementById('faqModal');
    if(modal) return modal;

    const wrap = document.createElement('div');
    wrap.innerHTML = `<div class="chapinavi-modal" id="faqModal" role="dialog" aria-modal="true" aria-labelledby="faqModalTitle" hidden>  <div class="chapinavi-modal__overlay" data-modal-close="true"></div>  <div class="chapinavi-modal__panel" role="document">    <button type="button" class="chapinavi-modal__close" aria-label="閉じる" data-modal-close="true">×</button>    <h2 class="chapinavi-modal__title" id="faqModalTitle">よくある質問 / FAQ</h2>
<div class="chapinavi-modal__body">
  <div class="chapinavi-faqBlock">
    <div class="chapinavi-faqQ">Q1. 生成されたプロンプトは、どこで使えますか？</div>
    <div class="chapinavi-faqA">A. ChatGPT、Claude、Gemini、Copilotなど主要な生成AIすべてで使えます。<br>コピーして、そのまま各AIのチャット欄に貼り付けて実行してください。</div>
  </div>

  <div class="chapinavi-faqBlock">
    <div class="chapinavi-faqQ">Q2. 入力した内容や個人情報は安全ですか？</div>
    <div class="chapinavi-faqA">A. 本ツールはサーバーに送信せず、すべてブラウザ内で処理されます。<br>入力内容が開発者や第三者に収集されることはありません。</div>
  </div>

  <div class="chapinavi-faqBlock">
    <div class="chapinavi-faqQ">Q3. うまく出力されない場合はどうすればいいですか？</div>
    <div class="chapinavi-faqA">A. 条件を詰め込みすぎると精度が下がることがあります。<br>まずは必須条件だけに絞り、AI側で微調整すると改善しやすくなります。</div>
  </div>
</div>`;
    modal = wrap.firstElementChild;
    if(modal) document.body.appendChild(modal);
    return modal;
  };

  const openModal = () => {
    const modal = ensureModal();
    if(!modal) return;

    modal.hidden = false;

    const menu = document.getElementById('menuAcc');
    if(menu && menu.open) menu.open = false;

    const closeBtn = modal.querySelector('.chapinavi-modal__close');
    if(closeBtn) closeBtn.focus();
  };

  const closeModal = () => {
    const modal = document.getElementById('faqModal');
    if(!modal) return;

    modal.hidden = true;

    const faqBtn = document.getElementById('menuFaqOpen');
    if(faqBtn) faqBtn.focus();
  };

  const bindFaqBtn = () => {
    const faqBtn = document.getElementById('menuFaqOpen');
    if(!faqBtn) return false;
    if(faqBtn.dataset.boundFaq === '1') return true;

    faqBtn.dataset.boundFaq = '1';
    faqBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openModal();
    });
    return true;
  };

  const init = () => {
    bindFaqBtn();
    ensureModal();
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }

  // Close handling (delegated)
  document.addEventListener('click', (e) => {
    const t = e.target;
    if(!t) return;

    const modal = document.getElementById('faqModal');
    if(!modal || modal.hidden) return;

    const close = t.closest('[data-modal-close="true"]');
    if(close){
      e.preventDefault();
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('faqModal');
    if(e.key === 'Escape' && modal && !modal.hidden){
      e.preventDefault();
      closeModal();
    }
  });

  // Safety: re-bind if header/menu is re-rendered
  const obs = new MutationObserver(() => {
    bindFaqBtn();
  });
  obs.observe(document.documentElement, { childList:true, subtree:true });
})();

// v7.48: PAGE TOP align to container right edge (left edge = container right), with viewport clamp.
// - Wide: left edge aligns to container right edge.
// - Narrow: if it would go off-screen, fall back to right:18px.
// Performance: rAF-throttle + single listeners + defensive guards.
(function(){
  const KEY = '__chap_pageTopAlign_v7_48__';
  if (window[KEY]) return;
  window[KEY] = true;

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  let rafId = 0;
  const schedule = () => {
    if (rafId) return;
    rafId = window.requestAnimationFrame(() => {
      rafId = 0;
      apply();
    });
  };

  function apply(){
    const btn = document.querySelector('.pageTopBtn');
    if (!btn) return;

    // Prefer the main container used for layout alignment
    const container = document.querySelector('.container');
    if (!container) return;

    const cRect = container.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();

    // Desired: btn's left edge == container right edge (viewport coords)
    const desiredLeft = cRect.right;

    // If desired position would push the button off-screen (hidden), fall back to right anchored.
    // Keep a small safety margin similar to existing right spacing.
    const margin = 18;
    const wouldOverflow = (desiredLeft + bRect.width) > (window.innerWidth - margin);

    if (wouldOverflow){
      btn.style.left = 'auto';
      btn.style.right = margin + 'px';
    } else {
      // Clamp left to be at least margin and at most (viewport - width - margin)
      const left = clamp(desiredLeft, margin, window.innerWidth - bRect.width - margin);
      btn.style.left = left + 'px';
      btn.style.right = 'auto';
    }
  }

  // Run after DOM is ready and after images load (totop.png width can affect bRect)
  const onReady = () => { schedule(); };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady, { once: true });
  } else {
    onReady();
  }
  window.addEventListener('load', schedule, { once: true });

  // Resize/scroll can affect container rect in some layouts; keep it light with rAF.
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true });

  // Re-apply when menu opens/closes etc. (generic click, no heavy work; rAF coalesces).
  document.addEventListener('click', (e) => { schedule(); }, { passive: true });
})();
