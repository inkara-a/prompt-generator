const BUILD_ID="v20260116r-gated-autopreview";



let __userInteracted = false;
let data = null;
const el = (id) => document.getElementById(id);

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
      initFormatButtons();
      updateStepChecks && updateStepChecks();
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

function autoPreview(force=false) {
  if (!result) return;

  // 初期表示は空のまま（“見た目”のデフォルト選択は維持）
  if (!force) {
    if (!__userInteracted) {
      result.value = "";
      return;
    }
    const hasText =
      (role?.value || "").trim() ||
      (goal?.value || "").trim() ||
      (context?.value || "").trim() ||
      (constraints?.value || "").trim() ||
      (request?.value || "").trim();
    const hasTemplate = ((category?.value || "").trim() && (purpose?.value || "").trim());
    if (!hasText && !hasTemplate) {
      result.value = "";
      return;
    }
  }

  result.value = buildPrompt();
}

[role, goal, context, constraints, format, request].forEach(x => x && x.addEventListener("input", () => { __userInteracted = true; autoPreview(); }));

function flash(btn) {
  btn.classList.remove("flash");
  void btn.offsetWidth;
  btn.classList.add("flash");
}

async function doCopy() {
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
  __userInteracted = false;
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
  // プレビュー更新はしない（空のままにする）
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
      const wrap = document.getElementById("formatButtons");
      const formatEl = document.getElementById("format");
      const hasSelected = wrap && (wrap.dataset.selected || "");
      if (wrap && formatEl && !hasSelected && !formatEl.value.trim()) {
        const btn = wrap.querySelector('.formatBtn[data-key="bullets"]');
        if (btn) btn.click();
      }
    } catch(e) {}
}
      // 穴埋め（上級者向け）は自動追加しない

      if (smart) smart.checked = true;
      setAdvancedFromSmart();
      autoPreview();

      role.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    grid.appendChild(card);
  });
}

renderVars();
setAdvancedFromSmart();
loadTemplates();


// v7.7.1 出力形式：アイコンボタンで「出力の希望」を自動入力（初心者向け）
function initFormatButtons() {
  const wrap = el("formatButtons");
  if (!wrap) return;

  const presets = {
    bullets: "出力は箇条書きで、見出し→箇条書きで読みやすくしてください。",
    mail: "出力はメール形式で、件名→本文の順に、そのまま送れる丁寧な敬語で作ってください。",
    table: "出力は「比較表」で、項目ごとに見やすく整理してください。",
    steps: "出力は手順（ステップ）形式で、1→2→3…の番号付きで書いてください。"
  };

  const setActive = (key) => {
    wrap.querySelectorAll(".formatBtn").forEach(b => b.classList.toggle("active", (b.dataset.key || "") === (key || "")));
    wrap.dataset.selected = key || "";
  };

  wrap.querySelectorAll(".formatBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.key || "";
      if (format) {
        format.value = presets[key] || "";
        autoPreview();
      }
      setActive(key);
    });
  });

  if (format) {
    format.addEventListener("input", () => setActive(""));
  }
}



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
    const step2ok = isFilled(role && role.value) || isFilled(goal && goal.value) || isFilled(request && request.value);

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
  // expose for other auto-fill actions
  window.__updateStepChecks = updateStepChecks;

  function bind(){
    ["category","purpose","role","goal","context","constraints","format","outputContent","request"].forEach(id=>{
      const el = document.getElementById(id);
      on(el,"input",updateStepChecks);
      on(el,"change",updateStepChecks);
    });
    // 例テンプレクリック等でも更新されるので少し遅延して再判定
    setTimeout(updateStepChecks, 200);
    setTimeout(updateStepChecks, 800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
  setSelectPlaceholder(el.category, "カテゴリを選択");
  setSelectPlaceholder(el.purpose, "用途を選択"); bind(); updateStepChecks(); });
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

  function setBulletsSelected({forceText=false} = {}){
    const wrap = document.getElementById("formatButtons");
    const formatEl = document.getElementById("format");
    if (!wrap || !formatEl) return;

    // activeだけは必ず付ける（見た目の未選択を解消）
    wrap.querySelectorAll(".formatBtn").forEach(btn => {
      btn.classList.toggle("active", (btn.getAttribute("data-key")||"") === "bullets");
    });
    wrap.dataset.selected = "bullets";

    // テキストは「空のときだけ」入れる（ユーザー入力は壊さない）
    if (!formatTouched && (forceText || !formatEl.value.trim())){
      const bulletsText = "出力は箇条書きで、見出し→箇条書きで読みやすくしてください。";
      formatEl.value = bulletsText;
      formatEl.dispatchEvent(new Event("input", { bubbles: true }));
      formatEl.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function bind(){
    const formatEl = document.getElementById("format");
    if (formatEl){
      formatEl.addEventListener("input", markTouched);
      formatEl.addEventListener("focus", markTouched);
    }

    // 例ボタンは構造が変わりやすいので、document全体でクリック委譲
    document.addEventListener("click", (e) => {
      const t = e.target;
      const exampleBtn = t && t.closest ? t.closest(".exCard, .exampleBtn, [data-example-id], .templateBtn, .popularTemplate") : null;
      if (!exampleBtn) return;

      // 既存処理（テンプレ適用）が先に走ることがあるので少し遅らせて反映
      setTimeout(() => setBulletsSelected({forceText:false}), 0);
      setTimeout(() => setBulletsSelected({forceText:false}), 80);
    });

    // 初回ロード直後にも「未選択」感を消す（任意）
    setTimeout(() => setBulletsSelected({forceText:false}), 400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();


/* v8.3.2 テンプレ適用後にStepチェックも更新（自動入力で緑にならない問題対策） */
(function stepChecksAfterTemplatePick(){
  function trigger(){
    try{window.__updateStepChecks && window.__updateStepChecks();}catch(e){}
  }
  document.addEventListener("click", (e) => {
    const btn = e.target && e.target.closest ? e.target.closest(".exCard, .exampleBtn, [data-example-id], .templateBtn, .popularTemplate") : null;
    if (!btn) return;
    setTimeout(trigger, 0);
    setTimeout(trigger, 120);
    setTimeout(trigger, 400);
  });
})();


/* v8.3.3 Step2の✓が緑にならない問題を確実に解消（テンプレ自動入力を考慮）
   - Step2は「AIの立場/やりたいこと/状況・素材/守ってほしいルール/追加のお願い」のどれかが埋まればOK
   - 人気テンプレクリック後に入力イベント＋再判定を強制
*/
(function stepCheckHardFix_v833(){
  function $(id){ return document.getElementById(id); }
  function filled(v){ return (v || "").toString().trim().length > 0; }

  function compute(){
    const cat = $("category"), purpose = $("purpose");
    const role = $("role"), goal = $("goal"), context = $("context"), constraints = $("constraints"), request = $("request");
    const format = $("format"), outputContent = $("outputContent");
    const result = $("result");

    const step1ok = !!(cat && cat.value && cat.value !== "none") && !!(purpose && purpose.value && purpose.value !== "none");
    const step2ok = filled(role && role.value) || filled(goal && goal.value) || filled(context && context.value) || filled(constraints && constraints.value) || filled(request && request.value);
    const step3ok = filled(format && format.value) || filled(outputContent && outputContent.value);
    const step4ok = filled(result && result.value);

    return {1:step1ok,2:step2ok,3:step3ok,4:step4ok};
  }

  function apply(){
    const map = compute();
    document.querySelectorAll(".stepCheck").forEach(el => {
      const n = Number(el.getAttribute("data-step")||"0");
      el.classList.toggle("on", !!map[n]);
    });
  }

  function fireInput(el){
    if (!el) return;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function afterTemplatePick(){
    // 自動入力はイベントが出ないことがあるので、主要フィールドに入力イベントを強制
    ["role","goal","context","constraints","request","format","outputContent"].forEach(id => fireInput($(id)));
    // 判定も複数回（反映タイミング差を吸収）
    setTimeout(apply, 0);
    setTimeout(apply, 120);
    setTimeout(apply, 400);
  }

  function bind(){
    ["category","purpose","role","goal","context","constraints","request","format","outputContent","result"].forEach(id => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("input", apply);
      el.addEventListener("change", apply);
    });

    // 人気テンプレ/例ボタン類のクリックを拾う
    document.addEventListener("click", (e) => {
      const btn = e.target && e.target.closest ? e.target.closest(".exCard, .exampleBtn, [data-example-id], .templateBtn, .popularTemplate") : null;
      if (!btn) return;
      afterTemplatePick();
    });

    // 初回
    setTimeout(apply, 200);
    // expose
    window.__applyStepChecks = apply;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
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


// v5.6 COPY_HANDLER: unified copy buttons feedback (non-breaking)
(function(){
  const res = document.getElementById('result');
  function doCopy(btn){
    if(!res) return;
    const txt = res.value || res.textContent || '';
    if(!txt.trim()) return;
    const ok = () => setCopyFeedback(btn, 'コピーしました！ ✅');
    const ng = () => setCopyFeedback(btn, 'コピー失敗…');
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(txt).then(ok).catch(()=>{
        try{
          const ta = document.createElement('textarea');
          ta.value = txt;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          ok();
        }catch(e){ ng(); }
      });
    }else{
      try{
        const ta = document.createElement('textarea');
        ta.value = txt;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        ok();
      }catch(e){ ng(); }
    }
  }
  const btn1 = document.getElementById('copy');
  const btn2 = document.getElementById('copyBig');
  if(btn1){
    btn1.addEventListener('click', ()=> doCopy(btn1), {capture:true});
  }
  if(btn2){
    btn2.addEventListener('click', ()=> doCopy(btn2), {capture:true});
  }
})();
function setSelectPlaceholder(selectEl, label){
  if(!selectEl) return;
  // 先頭にプレースホルダーが無ければ追加
  const first = selectEl.options?.[0];
  if(!first || first.value !== ""){
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = label;
    opt.disabled = true;
    opt.selected = true;
    selectEl.insertBefore(opt, selectEl.firstChild);
  }
  // 必ずプレースホルダーを初期選択にする（初期生成を防ぐ）
  selectEl.value = "";
}

function isMeaningfulInput(){
  const role = (el.role?.value || "").trim();
  const goal = (el.goal?.value || "").trim();
  const ctx = (el.context?.value || "").trim();
  const cons = (el.constraints?.value || "").trim();
  const req = (el.request?.value || "").trim();
  const cat = (el.category?.value || "").trim();
  const pur = (el.purpose?.value || "").trim();
  // テンプレ選択（カテゴリ/用途）か、ユーザー入力が1つでもあれば“意味がある”
  return !!(cat || pur || role || goal || ctx || cons || req);
}



// v5.7.8 INTERACTION_GATE: user interaction required before generating
(function(){
  function mark(){
    __userInteracted = true;
    // update immediately when user starts interacting
    try{ updateResult(); }catch(e){}
  }
  const ids = ["category","purpose","preset","role","goal","context","constraints","outputContent","request","smart","md","step","ask","varName","varHint"];
  ids.forEach(id=>{
    const elx = document.getElementById(id);
    if(!elx) return;
    elx.addEventListener("change", mark);
    elx.addEventListener("input", mark);
  });
  // 人気テンプレ（カード）クリックでも反映
  const grid = document.getElementById("exampleGrid");
  if(grid){
    grid.addEventListener("click", (e)=>{
      const t = e.target.closest(".exCard, .exBtn, button, a, .exItem");
      if(t) mark();
    }, true);
  }
  // 出力形式ボタン（見た目）クリック
  const fb = document.getElementById("formatButtons");
  if(fb){
    fb.addEventListener("click", (e)=>{
      const b = e.target.closest(".formatBtn");
      if(b) mark();
    }, true);
  }
  // 一括クリア系：interactedを戻して結果を空にする（箇条書きの選択状態は維持）
  function reset(){
    __userInteracted = false;
    const r = document.getElementById("result");
    if(r) r.value = "";
  }
  const c1 = document.getElementById("clearAll");
  const c2 = document.getElementById("clearAllWide");
  if(c1) c1.addEventListener("click", reset, true);
  if(c2) c2.addEventListener("click", reset, true);
})();


// v5.7.9 INTERACTION_HOOKS: 選択/クリックでも“操作した”扱い
(function(){
  const mark = () => { __userInteracted = true; autoPreview(); };

  category && category.addEventListener("change", mark);
  purpose && purpose.addEventListener("change", mark);
  preset && preset.addEventListener("change", mark);
  smart && smart.addEventListener("change", mark);
  mdOpt && mdOpt.addEventListener("change", mark);
  stepOpt && stepOpt.addEventListener("change", mark);
  askOpt && askOpt.addEventListener("change", mark);

  const fb = document.getElementById("formatButtons");
  if(fb){
    fb.addEventListener("click", (e)=>{
      const b = e.target.closest(".formatBtn");
      if(b) mark();
    }, true);
  }

  const exGrid = document.getElementById("exampleGrid");
  if(exGrid){
    exGrid.addEventListener("click", (e)=>{
      const c = e.target.closest(".exCard, .exBtn, button, a, .exItem");
      if(c) mark();
    }, true);
  }
})();



/* =========================
   v5.7.10 HARD_OVERRIDE
   - 初期表示と一括クリア後は result を空欄固定
   - 見た目（箇条書き初期選択）は維持
   - ユーザーが何か操作したら自動生成を開始
   ========================= */
(function(){
  const state = window.__PG_STATE__ = window.__PG_STATE__ || { interacted:false };

  function hasMeaning(){
    const get = (id) => (document.getElementById(id)?.value || "").trim();
    const hasText = !!(get("role") || get("goal") || get("context") || get("constraints") || get("request"));
    const hasTemplate = !!((document.getElementById("category")?.value || "").trim() && (document.getElementById("purpose")?.value || "").trim());
    return hasText || hasTemplate;
  }

  function forceEmpty(){
    const r = document.getElementById("result");
    if(r) r.value = "";
  }

  // 初期は必ず空にする（既存コードが先に埋めても上書き）
  document.addEventListener("DOMContentLoaded", ()=>{
    state.interacted = false;
    forceEmpty();
    // 既存の初期プレビューの後にも空にする（確実化）
    setTimeout(forceEmpty, 0);
    setTimeout(forceEmpty, 30);
    setTimeout(forceEmpty, 120);
    setTimeout(forceEmpty, 300);
    requestAnimationFrame(forceEmpty);
    requestAnimationFrame(()=>requestAnimationFrame(forceEmpty));
  });

  // autoPreview を必ず上書き
  const origAutoPreview = window.autoPreview || (typeof autoPreview === "function" ? autoPreview : null);
  function gatedAutoPreview(force=false){
    const r = document.getElementById("result");
    if(!r) return;
    if(!force){
      if(!state.interacted || !hasMeaning()){
        r.value = "";
        return;
      }
    }
    // buildPrompt が存在するなら使う（既存実装に依存）
    try{
      if(typeof buildPrompt === "function"){
        r.value = buildPrompt();
      }else if(origAutoPreview){
        origAutoPreview(true);
      }
    }catch(e){
      // 失敗時は空
      r.value = "";
    }
  }
  window.autoPreview = gatedAutoPreview;
  try{ autoPreview = gatedAutoPreview; }catch(e){}

  // 操作フック：何か触れたら interacted=true
  const mark = () => { state.interacted = true; window.autoPreview(false); };
  const ids = ["category","purpose","preset","role","goal","context","constraints","format","outputContent","request","smart","md","step","ask"];
  ids.forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener("input", mark, true);
    el.addEventListener("change", mark, true);
  });
  const fb = document.getElementById("formatButtons");
  if(fb) fb.addEventListener("click", (e)=>{ if(e.target.closest(".formatBtn")) mark(); }, true);
  const exGrid = document.getElementById("exampleGrid");
  if(exGrid) exGrid.addEventListener("click", (e)=>{ if(e.target.closest(".exCard, .exBtn, .exItem, button, a")) mark(); }, true);

  // 一括クリア：interacted=false に戻して結果を空に（既存クリア後に確実に空にする）
  function onClear(){
    state.interacted = false;
    setTimeout(forceEmpty, 0);
    setTimeout(forceEmpty, 30);
  }
  const c1 = document.getElementById("clearAll");
  const c2 = document.getElementById("clearAllWide");
  if(c1) c1.addEventListener("click", onClear, true);
  if(c2) c2.addEventListener("click", onClear, true);
})();



// v5.7.11 INIT_HOOKS: リロード直後に後から埋められるのを確実に空にする
(function(){
  function forceEmpty(){
    const r = document.getElementById("result");
    if(r) r.value = "";
  }
  function resetState(){
    if(window.__PG_STATE__) window.__PG_STATE__.interacted = false;
    forceEmpty();
    setTimeout(forceEmpty, 0);
    setTimeout(forceEmpty, 50);
    setTimeout(forceEmpty, 150);
    setTimeout(forceEmpty, 350);
    requestAnimationFrame(forceEmpty);
    requestAnimationFrame(()=>requestAnimationFrame(forceEmpty));
  }
  window.addEventListener("load", resetState);
  window.addEventListener("pageshow", resetState); // bfcache含む
})();



// v5.7.12 CLEAR_GUARD: 初期ロードで後から埋められても一定時間は空欄を維持
(function(){
  function getR(){ return document.getElementById("result"); }
  function forceEmpty(){
    const r = getR();
    if(r) r.value = "";
  }
  function startGuard(){
    let ticks = 0;
    const maxTicks = 120; // 120 * 50ms = 6s
    const timer = setInterval(()=>{
      ticks++;
      const st = window.__PG_STATE__ || null;
      const interacted = st && typeof st.interacted === "boolean" ? st.interacted : false;
      if(interacted){
        clearInterval(timer);
        return;
      }
      forceEmpty();
      if(ticks >= maxTicks){
        clearInterval(timer);
      }
    }, 50);
  }
  window.addEventListener("load", ()=>{ forceEmpty(); startGuard(); });
  window.addEventListener("pageshow", ()=>{ forceEmpty(); startGuard(); });
})();



// v5.7.13 VALUE_SETTER_GUARD: interacted=false の間は result.value への書き込み自体を無効化
(function(){
  const state = window.__PG_STATE__ = window.__PG_STATE__ || { interacted:false };

  function installGuard(){
    const ta = document.getElementById("result");
    if(!ta) return;

    // placeholderを明示（空のとき“生成されてる感”を減らす）
    if(!ta.getAttribute("placeholder")){
      ta.setAttribute("placeholder", "ここに生成されたプロンプトが表示されます");
    }

    const proto = Object.getPrototypeOf(ta);
    const desc = Object.getOwnPropertyDescriptor(proto, "value");
    if(!desc || !desc.set || ta.__valueGuardInstalled) return;
    ta.__valueGuardInstalled = true;

    let internal = "";
    // まず確実に空にする
    try{ desc.set.call(ta, ""); }catch(e){}
    internal = "";

    Object.defineProperty(ta, "value", {
      configurable: true,
      enumerable: true,
      get(){
        try{ return desc.get.call(ta); }catch(e){ return internal; }
      },
      set(v){
        // 未操作状態は“書き込み拒否”して常に空
        if(!state.interacted){
          internal = "";
          try{ desc.set.call(ta, ""); }catch(e){}
          return;
        }
        internal = v;
        try{ desc.set.call(ta, v); }catch(e){}
      }
    });

    // interactedになったらオリジナルへ戻す（以後は通常動作）
    function maybeRestore(){
      if(!state.interacted) return;
      try{
        Object.defineProperty(ta, "value", desc);
      }catch(e){}
    }

    // 主要操作で interacted を立てる（既存フックがあってもOK）
    const mark = ()=>{ state.interacted = true; maybeRestore(); };

    ["category","purpose","preset","role","goal","context","constraints","format","outputContent","request","smart","md","step","ask"].forEach(id=>{
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener("input", mark, true);
      el.addEventListener("change", mark, true);
    });
    const fb = document.getElementById("formatButtons");
    if(fb) fb.addEventListener("click", (e)=>{ if(e.target.closest(".formatBtn")) mark(); }, true);
    const exGrid = document.getElementById("exampleGrid");
    if(exGrid) exGrid.addEventListener("click", (e)=>{ if(e.target.closest(".exCard, .exBtn, .exItem, button, a")) mark(); }, true);

    // クリアで未操作に戻してガード再有効化
    function onClear(){
      state.interacted = false;
      // 再インストール（valueが戻ってた場合に備える）
      try{ desc.set.call(ta, ""); }catch(e){}
      internal = "";
      // ガードのsetterは残っているので、そのまま空を維持
    }
    const c1 = document.getElementById("clearAll");
    const c2 = document.getElementById("clearAllWide");
    if(c1) c1.addEventListener("click", onClear, true);
    if(c2) c2.addEventListener("click", onClear, true);

    // 念のため：load後にも空を強制（setterで弾く）
    setTimeout(()=>{ try{ ta.value=""; }catch(e){} }, 0);
    setTimeout(()=>{ try{ ta.value=""; }catch(e){} }, 50);
    setTimeout(()=>{ try{ ta.value=""; }catch(e){} }, 200);
  }

  window.addEventListener("DOMContentLoaded", installGuard);
  window.addEventListener("pageshow", installGuard);
})();



// v5.7.14 INTERACT_LOCK: localStorage復元などが interacted=true にしても無視（ユーザー操作だけで解除）
(function(){
  // interacted を“ロック”する
  const raw = window.__PG_STATE__ || {};
  let _interacted = false;
  window.__PG_ALLOW_INTERACTED = false;

  Object.defineProperty(raw, "interacted", {
    configurable: true,
    enumerable: true,
    get(){ return _interacted; },
    set(v){
      // 許可が無い限り true を受け付けない（初期/復元で勝手にtrueにならない）
      if(v === true && !window.__PG_ALLOW_INTERACTED) return;
      _interacted = !!v;
    }
  });

  window.__PG_STATE__ = raw;

  function resultEl(){ return document.getElementById("result"); }
  function forceEmpty(){
    const r = resultEl();
    if(r) r.value = "";
  }

  // 初期は確実に空にする（復元が走っても value setter guard と合わせて空に戻る）
  function resetInitial(){
    window.__PG_ALLOW_INTERACTED = false;
    raw.interacted = false;
    forceEmpty();
    setTimeout(forceEmpty, 0);
    setTimeout(forceEmpty, 80);
    setTimeout(forceEmpty, 200);
  }
  window.addEventListener("DOMContentLoaded", resetInitial);
  window.addEventListener("load", resetInitial);
  window.addEventListener("pageshow", resetInitial);

  // ユーザーが触れたら解除
  function unlock(){
    window.__PG_ALLOW_INTERACTED = true;
    raw.interacted = true;
  }
  const ids = ["category","purpose","preset","role","goal","context","constraints","format","outputContent","request","smart","md","step","ask"];
  ids.forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener("input", unlock, true);
    el.addEventListener("change", unlock, true);
  });
  const fb = document.getElementById("formatButtons");
  if(fb) fb.addEventListener("click", (e)=>{ if(e.target.closest(".formatBtn")) unlock(); }, true);
  const exGrid = document.getElementById("exampleGrid");
  if(exGrid) exGrid.addEventListener("click", (e)=>{ if(e.target.closest(".exCard, .exBtn, .exItem, button, a")) unlock(); }, true);

  // 一括クリアで再ロック
  function relock(){
    window.__PG_ALLOW_INTERACTED = false;
    raw.interacted = false;
    forceEmpty();
    setTimeout(forceEmpty, 0);
    setTimeout(forceEmpty, 80);
  }
  const c1 = document.getElementById("clearAll");
  const c2 = document.getElementById("clearAllWide");
  if(c1) c1.addEventListener("click", relock, true);
  if(c2) c2.addEventListener("click", relock, true);
})();
