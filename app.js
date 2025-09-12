/* ========== Cafe Inventory App (vanilla JS) ========== */

// ---- Utilities ----
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const slugify = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g,'-').replace(/(^-+|-+$)/g,'');
const deepClone = obj => JSON.parse(JSON.stringify(obj));

// human readable number (no over-format to keep units clear)
function fmt(n){
  if (Number.isInteger(n)) return String(n);
  // keep up to 2 decimals
  return (Math.round(n*100)/100).toString();
}

// CSV parser (simple, no quotes inside fields)
function parseCSV(text){
  const lines = text.trim().split(/\r?\n/);
  const rows = lines.map(l => l.split(",").map(s => s.trim()));
  // detect header
  let start = 0;
  let hasHeader = false;
  const header = rows[0].map(s => s.toLowerCase());
  if (header.includes("name") && header.includes("ingredient")) { hasHeader = true; start = 1; }
  const data = [];
  for (let i=start; i<rows.length; i++){
    const [name, category, ingredient, unit, qty] = rows[i];
    if (!name || !ingredient) continue;
    data.push({name, category: category||"Other", ingredient, unit: unit||"", qty: Number(qty||0)});
  }
  // convert to recipe array
  const byName = new Map();
  for (const r of data){
    const key = r.name.trim();
    if (!byName.has(key)){
      byName.set(key, { id: slugify(key), name: key, category: r.category||"Other", ingredients: [] });
    }
    byName.get(key).ingredients.push({ name: r.ingredient.trim(), unit: r.unit||"", qty: Number(r.qty||0) });
  }
  return Array.from(byName.values());
}

// ---- State ----
const LS_RECIPES = "cafe_recipes_v1";
const LS_COUNTS  = "cafe_counts_v1";

let recipes = [];
let counts = {}; // {id: number}

// ---- Default Sample Data ----
const defaultRecipes = [
  {
    id: "espresso",
    name: "Espresso",
    category: "Coffee",
    ingredients: [
      { name: "Hạt cà phê", unit: "g", qty: 18 },
      { name: "Nước", unit: "ml", qty: 30 }
    ]
  },
  {
    id: "americano",
    name: "Americano",
    category: "Coffee",
    ingredients: [
      { name: "Espresso", unit: "shot", qty: 1 },
      { name: "Nước", unit: "ml", qty: 120 }
    ]
  },
  {
    id: "latte",
    name: "Latte",
    category: "Coffee",
    ingredients: [
      { name: "Espresso", unit: "shot", qty: 1 },
      { name: "Sữa tươi", unit: "ml", qty: 220 },
      { name: "Đường", unit: "g", qty: 8 }
    ]
  },
  {
    id: "capuccino",
    name: "Cappuccino",
    category: "Coffee",
    ingredients: [
      { name: "Espresso", unit: "shot", qty: 1 },
      { name: "Sữa tươi", unit: "ml", qty: 160 },
      { name: "Bọt sữa", unit: "ml", qty: 40 }
    ]
  },
  {
    id: "tra-dao",
    name: "Trà đào",
    category: "Tea",
    ingredients: [
      { name: "Trà đen", unit: "g", qty: 5 },
      { name: "Đào ngâm", unit: "miếng", qty: 2 },
      { name: "Syrup đào", unit: "ml", qty: 20 },
      { name: "Nước", unit: "ml", qty: 180 }
    ]
  },
  {
    id: "sinh-to-xoai",
    name: "Sinh tố xoài",
    category: "Smoothie",
    ingredients: [
      { name: "Xoài chín", unit: "g", qty: 180 },
      { name: "Sữa đặc", unit: "ml", qty: 25 },
      { name: "Đá viên", unit: "g", qty: 120 }
    ]
  }
];

// ---- Persistence ----
function loadState(){
  try{
    const r = JSON.parse(localStorage.getItem(LS_RECIPES) || "null");
    recipes = Array.isArray(r) && r.length ? r : deepClone(defaultRecipes);
  }catch{ recipes = deepClone(defaultRecipes); }

  try{
    counts = JSON.parse(localStorage.getItem(LS_COUNTS) || "{}") || {};
  }catch{ counts = {}; }
}
function saveState(){
  localStorage.setItem(LS_RECIPES, JSON.stringify(recipes));
  localStorage.setItem(LS_COUNTS, JSON.stringify(counts));
}

// ---- Rendering ----
const menuGrid = $("#menuGrid");
const summaryList = $("#summaryList");
const totalOrdersEl = $("#totalOrders");
const menuCountEl = $("#menuCount");

function renderMenu(filterText=""){
  menuGrid.innerHTML = "";
  const tpl = $("#cardTpl");

  const q = filterText.trim().toLowerCase();
  const list = recipes
    .slice()
    .filter(r => !q || r.name.toLowerCase().includes(q) || (r.category||"").toLowerCase().includes(q))
    .sort((a,b) => a.name.localeCompare(b.name, "vi"));

  for (const r of list){
    const node = tpl.content.firstElementChild.cloneNode(true);
    $(".item-name", node).textContent = r.name;
    $(".item-category", node).textContent = r.category || "Khác";

    const ul = $(".ing-list", node);
    for (const ing of r.ingredients){
      const li = document.createElement("li");
      const left = document.createElement("span");
      const right = document.createElement("span");
      left.textContent = ing.name;
      right.textContent = `${fmt(ing.qty)} ${ing.unit}`.trim();
      li.append(left, right);
      ul.appendChild(li);
    }

    const counter = $(".counter", node);
    counter.textContent = counts[r.id] || 0;

    $(".plus", node).addEventListener("click", () => changeCount(r.id, +1, counter));
    $(".minus", node).addEventListener("click", () => changeCount(r.id, -1, counter));

    menuGrid.appendChild(node);
  }

  // stats
  menuCountEl.textContent = recipes.length;
  updateTotalsDisplay();
}

function changeCount(id, delta, counterEl){
  const current = counts[id] || 0;
  const next = Math.max(0, current + delta);
  if (next === current) return;
  counts[id] = next;
  if (counterEl){
    counterEl.textContent = next;
    counterEl.classList.remove("bump");
    // force reflow to restart animation
    void counterEl.offsetWidth;
    counterEl.classList.add("bump");
  }
  saveState();
  updateTotalsDisplay(true);
}

function computeTotals(){
  // Map key: name||unit
  const m = new Map();
  for (const r of recipes){
    const c = counts[r.id] || 0;
    if (!c) continue;
    for (const ing of r.ingredients){
      const key = `${ing.name}||${ing.unit||""}`;
      const add = (ing.qty || 0) * c;
      const cur = m.get(key);
      if (!cur){
        m.set(key, { name: ing.name, unit: ing.unit||"", total: add });
      }else{
        cur.total += add;
      }
    }
  }
  const arr = Array.from(m.values()).sort((a,b) => b.total - a.total);
  return arr;
}

function updateTotalsDisplay(withBump=false){
  const totals = computeTotals();
  totalOrdersEl.textContent = Object.values(counts).reduce((a,b)=>a+(b||0),0);

  summaryList.innerHTML = "";
  for (const t of totals){
    const row = document.createElement("div");
    row.className = "summary-item";
    if (withBump) row.classList.add("bump");
    const name = document.createElement("div");
    name.className = "summary-name";
    name.textContent = t.name;
    const qty = document.createElement("div");
    qty.className = "summary-qty";
    qty.textContent = `${fmt(t.total)} ${t.unit}`.trim();
    row.append(name, qty);
    summaryList.appendChild(row);
  }
  if (!totals.length){
    const note = document.createElement("div");
    note.className = "summary-item";
    note.innerHTML = '<div class="summary-name muted">Chưa có nguyên liệu nào (hãy bấm dấu +)</div><div></div>';
    summaryList.appendChild(note);
  }
}

// ---- Import / Export ----
function mergeRecipes(newOnes){
  if (!Array.isArray(newOnes)) return;
  // normalize + merge by id or name
  const byId = new Map(recipes.map(r => [r.id, r]));
  const byName = new Map(recipes.map(r => [r.name.toLowerCase(), r]));

  for (const r of newOnes){
    const name = (r.name||"").trim();
    if (!name || !Array.isArray(r.ingredients) || r.ingredients.length===0) continue;
    const id = r.id ? slugify(r.id) : slugify(name);
    const rec = {
      id,
      name,
      category: (r.category||"Other").trim(),
      ingredients: r.ingredients.map(i => ({
        name: (i.name||"").trim(),
        unit: (i.unit||"").trim(),
        qty: Number(i.qty||0)
      })).filter(i => i.name && i.qty>0)
    };
    const existed = byId.get(id) || byName.get(name.toLowerCase());
    if (existed){
      // replace ingredients & meta (assume latest is correct)
      existed.name = rec.name;
      existed.category = rec.category;
      existed.ingredients = rec.ingredients;
    }else{
      recipes.push(rec);
      byId.set(id, rec);
      byName.set(name.toLowerCase(), rec);
    }
  }
  saveState();
}

function download(filename, text){
  const blob = new Blob([text], {type: "text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function exportTotalsCSV(){
  const totals = computeTotals();
  let csv = "ingredient,unit,total\n";
  for (const t of totals){
    csv += `${t.name},${t.unit},${fmt(t.total)}\n`;
  }
  download("tong-nguyen-lieu.csv", csv);
}

// ---- Drag & drop ----
function setupDropZone(){
  const dz = $("#dropZone");
  const fileInput = $("#fileInput");
  // Show dropzone when dragging files over window
  window.addEventListener("dragenter", (e) => { dz.hidden = false; });
  dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("dragover"); });
  dz.addEventListener("dragleave", () => dz.classList.remove("dragover"));
  dz.addEventListener("drop", (e) => {
    e.preventDefault();
    dz.classList.remove("dragover");
    dz.hidden = true;
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) handleFiles(files);
  });
  // Hide when clicking elsewhere
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") dz.hidden = true; });
  dz.addEventListener("click", () => dz.hidden = true);

  // File input
  fileInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) handleFiles(files);
    fileInput.value = "";
  });
}

async function handleFiles(files){
  const imported = [];
  for (const f of files){
    const text = await f.text();
    const ext = (f.name.split(".").pop()||"").toLowerCase();
    try{
      if (ext === "json"){
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) imported.push(...parsed);
        else if (parsed && Array.isArray(parsed.recipes)) imported.push(...parsed.recipes);
      }else if (ext === "csv"){
        imported.push(...parseCSV(text));
      }
    }catch(err){
      console.error("Import error", err);
      alert("Không thể đọc file: " + f.name);
    }
  }
  if (imported.length){
    mergeRecipes(imported);
    renderMenu($("#searchInput").value);
  }
}

// ---- Init ----
function init(){
  loadState();
  renderMenu();
  $("#searchInput").addEventListener("input", (e)=> renderMenu(e.target.value));
  $("#clearCountsBtn").addEventListener("click", ()=>{
    if (!confirm("Đặt lại toàn bộ số lượng đã bán?")) return;
    counts = {}; saveState(); renderMenu($("#searchInput").value);
  });
  $("#exportTotalsBtn").addEventListener("click", exportTotalsCSV);
  $("#helpBtn").addEventListener("click", ()=> $("#helpDialog").showModal());
  setupDropZone();
}

document.addEventListener("DOMContentLoaded", init);
