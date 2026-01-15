
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
  // ユーザー向けの大カテゴリ（初心者が迷わない順）
  return [
    { key: "dev", label: "アプリ・システムを作りたい" },
    { key: "work", label: "仕事を効率化したい" },
    { key: "learn", label: "学習・理解を深めたい" },
    { key: "write", label: "文章・コンテンツを作りたい" },
    { key: "idea", label: "アイデア・企画を整理したい" },
    { key: "trouble", label: "トラブル・問題を解決したい" }
  ];
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
    b.textContent = t.label;
    b.addEventListener("click", () => {
      activeExampleTab = t.key;
      renderExampleTabs();
      renderExampleTabs();
  renderExampleButtons();
      initFormatButtons();
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

function autoPreview() {
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
    formatEl.addEventListener("input", () => setActive(""));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();


if (outputContent) outputContent.addEventListener("input", () => { try{autoPreview();}catch(e){} });
