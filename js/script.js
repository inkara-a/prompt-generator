const BUILD_ID = "v20260116al-mint-selected-excard";
let data = null;
const el = (id) => document.getElementById(id);



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

// v5.7.24-testfix: focus reset（ボタン等を押した後に古い入力欄へ挿入されるのを防ぐ）
document.addEventListener('click', (e) => {
  const t = e.target;
  if (!t) return;
  const tag = (t.tagName || '').toLowerCase();
  if (tag !== 'input' && tag !== 'textarea') {
    lastFocusedField = null;
  }
});

const VARS_KEY = "pg_vars_v1";

let examples = [];


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
try{ window.__updateStepChecks && window.__updateStepChecks(); }catch(e){}
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
    let res = await fetch("./data/templates.json", { cache: "no-store" });
    if (!res.ok) {
      res = await fetch("./generator/data/templates.json", { cache: "no-store" });
    }
    data = await res.json();

    // 人気テンプレ（examples.json）
    try {
      let exRes = await fetch("./data/examples.json", { cache: "no-store" });
      if (!exRes.ok) {
        exRes = await fetch("./generator/data/examples.json", { cache: "no-store" });
      }
      examples = await exRes.json();
    } catch (e) {
      console.warn("examples.json の読み込みに失敗しました", e);
      examples = [];
    }
  } catch (e) {
    alert("テンプレートJSONの読み込みに失敗しました。\nNetlifyなどのサーバー上で開いてください。");
    console.error(e);
    return;
  }
  initCategories();
  renderExampleTabs();
  renderExampleButtons();
  autoPreview();
}

function initCategories() {
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
  purpose.innerHTML = "";
  const selected = category.value;
  const purposes = data[selected].purposes;
  for (const p in purposes) {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    purpose.appendChild(opt);
  }
  goal.placeholder = `例：${purpose.value} をやりたい（具体的に）`;
  format.placeholder = `例：用途「${purpose.value}」に合う出力構成（番号付き）`;
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
}

[role, goal, context, constraints, format, request].forEach(x => x && x.addEventListener("input", autoPreview));

function flash(btn) {
  btn.classList.remove("flash");
  void btn.offsetWidth;
  btn.classList.add("flash");
}

async function doCopy() {
// v5.7.24-testfix: 空コピー防止（初回ロードで空欄のままコピーを押してもダミー生成しない）
const roleTxt = (el("role")?.value || "").trim();
const goalTxt = (el("goal")?.value || "").trim();
const reqTxt  = (el("request")?.value || "").trim();
const hasAny = (roleTxt.length + goalTxt.length + reqTxt.length) > 0;
if (!hasAny) {
  // 生成もコピーもしない（安心感のフィードバックだけ出す）
  const st = el("copyState");
  if (st) st.textContent = "まずは内容を入力してからコピーしてね";
  return "";
}

  const text = buildPrompt();
  result.value = text;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    result.focus();
    result.select();
    document.execCommand("copy");
  }
  const st = el("copyState");
  if (st) st.textContent = "コピーしました！→ ChatGPTに貼り付けてOK";
  return text;
}

el("copy") && el("copy").addEventListener("click", async (e) => { await doCopy(); flash(e.currentTarget); });
el("copyBig") && el("copyBig").addEventListener("click", async (e) => { await doCopy(); flash(e.currentTarget); });

el("openChatGPT") && el("openChatGPT").addEventListener("click", async () => {
  await doCopy();
  window.open("https://chat.openai.com/", "_blank");
});

// 一括クリア（人気テンプレ確認後にすぐ自分用を書ける）
el("clearAll") && el("clearAll").addEventListener("click", () => {
    resetInteracted_v5723();
    const r = el('result'); if (r) r.value = '';
  // テキスト入力を全部空に
  role.value = "";
  goal.value = "";
  context.value = "";
  constraints.value = "";
  format.value = "";
  if (outputContent) outputContent.value = "";
  request.value = "";

  // 型は「そのまま（自由に書く）」へ
  if (preset) preset.value = "none";

  // 出力欄もクリア
  if (result) result.value = "";
  const st = el("copyState");
  if (st) st.textContent = "← ここを押すだけ";
  // 穴埋め一覧は残す（必要なら「一覧クリア」を使用）
  renderVars();

  // プレビュー更新
  autoPreview();

  // 先頭の入力にフォーカス
  role.focus();
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
  try{ window.__updateStepChecks && window.__updateStepChecks(); }catch(e){}
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
      try{ window.__updateStepChecks && window.__updateStepChecks(); }catch(e){}

      role.scrollIntoView({ behavior: "smooth", block: "center" });
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


if (outputContent) outputContent.addEventListener("input", () => { try{autoPreview();}catch(e){} });


/* v8.2 - Stepチェック演出（入力が入ったら小さな✓） */
(function attachStepChecks(){
  function on(el, ev, fn){ if(el) el.addEventListener(ev, fn); }
  function isFilled(v){ return (v || "").toString().trim().length > 0; }

  function updateStepChecks(){
    // Step1: カテゴリ & 用途が選ばれていれば
    const cat = document.getElementById("category");
    const purpose = document.getElementById("purpose");
    const step1ok = (cat && cat.value && cat.value !== "none") && (purpose && purpose.value && purpose.value !== "none");

    // Step2: AIの立場 or やりたいこと が入っていれば
    const role = document.getElementById("role");
    const goal = document.getElementById("goal");
    const request = document.getElementById("request");
        const contextEl = document.getElementById("context");
    const constraintsEl = document.getElementById("constraints");
    const outputEl = document.getElementById("outputContent");
    const formatEl = document.getElementById("format");
    const step2ok = isFilled(role && role.value)
      || isFilled(goal && goal.value)
      || isFilled(contextEl && contextEl.value)
      || isFilled(constraintsEl && constraintsEl.value)
      || isFilled(outputEl && outputEl.value)
      || isFilled(formatEl && formatEl.value)
      || isFilled(request && request.value);

    // Step3: 出力の書き方 or 出してほしい内容 のどちらかが入っていれば
    const format = document.getElementById("format");
    const outputContent = document.getElementById("outputContent");
    const step3ok = isFilled(format && format.value) || isFilled(outputContent && outputContent.value);

    // Step4: 結果が1文字でも出ていれば
    const result = document.getElementById("result");
    const step4ok = isFilled(result && result.value);

    const map = {1:step1ok,2:step2ok,3:step3ok,4:step4ok};
    document.querySelectorAll(".stepCheck").forEach(b => {
      const n = Number(b.getAttribute("data-step")||"0");
      b.classList.toggle("on", !!map[n]);
    });
  }

  // v5.7.24-testfix: 外部から再判定できるように公開
  try{ window.__updateStepChecks = updateStepChecks; }catch(e){}
  // expose for other auto-fill actions
  window.__updateStepChecks = updateStepChecks;

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
    document.addEventListener("DOMContentLoaded", () => { bind(); updateStepChecks(); });
  } else {
    bind(); updateStepChecks();
  }
})();


/* v8.3.1 人気テンプレ選択時：出力形式を必ず「箇条書き」選択にする（未選択の不自然さ防止） */
(function defaultBulletsOnExamplePick(){
  // format欄をユーザーが手で編集したかどうか（上書き防止用）
  let formatTouched = false;

  function markTouched(){
    formatTouched = true;
  }

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
    setTimeout(() => setBulletsSelected({forceText:false, setText:false, dispatch:false}), 400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();




// v5.6: copy feedback (1-2s)
function setCopyFeedback(btn, text){
  if(!btn) return;
  const prev = btn.dataset.prevText || btn.textContent;
  btn.dataset.prevText = prev;
  btn.textContent = text;
  btn.classList.add('isCopied');
  setTimeout(()=>{
    btn.textContent = prev;
    btn.classList.remove('isCopied');
  }, 1400);
}




// v5.7.23: 操作した瞬間から自動生成を開始
[
  "role","goal","context","constraints","request",
  "category","purpose","preset","format","outputContent"
].forEach((id) => {
  const node = el(id);
  if (!node) return;
  node.addEventListener("input", () => { markInteracted_v5723(); autoPreview(); }, { passive: true });
  node.addEventListener("change", () => { markInteracted_v5723(); autoPreview(); }, { passive: true });
});

// data-bind-copy-v5724: single source of truth for copy buttons
(function bindCopyButtons(){
  const c = el("copy");
  const b = el("copyBig");
  const handler = async (ev)=>{ ev && ev.preventDefault && ev.preventDefault(); const msg = await doCopy();
    // optional: setCopyFeedback if available
    try{ if(msg && ev && ev.currentTarget) setCopyFeedback(ev.currentTarget, msg + ' ✅'); }catch(e){}
  };
  if(c) c.addEventListener('click', handler);
  if(b) b.addEventListener('click', handler);
})();

// clearLastFocusOnDocClick_v5724
document.addEventListener('click', (e)=>{
  const t = e.target;
  if(!t) return;
  const tag = (t.tagName||'').toLowerCase();
  if(tag==='input' || tag==='textarea') return;
  lastFocusedField = null;
});
