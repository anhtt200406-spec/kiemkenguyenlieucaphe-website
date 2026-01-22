/**
 * THẾ ANH GROUP - ENTERPRISE MANAGEMENT SYSTEM
 * Architect: Thế Anh (Refactored)
 * Tech Stack: Vanilla JS (SPA Pattern)
 */

// ==========================================
// 1. STORE & DATA SERVICE (Mô phỏng Backend)
// ==========================================
const DataService = {
  keys: {
    EMPLOYEES: 'tag_employees',
    SHIFTS: 'tag_shifts',
    RECIPES: 'cafe_recipes_v1', // Giữ key cũ để không mất dữ liệu cũ của bạn
    COUNTS: 'cafe_counts_v1'
  },

  // Helpers
  get(key, defaultVal) {
    try { return JSON.parse(localStorage.getItem(key)) || defaultVal; } 
    catch { return defaultVal; }
  },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); },

  // --- HR API ---
  getEmployees() { 
    return this.get(this.keys.EMPLOYEES, [
      { id: 1, name: 'Thế Anh', role: 'Manager', status: 'Active' },
      { id: 2, name: 'Nhân viên A', role: 'Barista', status: 'Active' }
    ]); 
  },
  addEmployee(emp) {
    const list = this.getEmployees();
    emp.id = Date.now();
    list.push(emp);
    this.set(this.keys.EMPLOYEES, list);
  },
  deleteEmployee(id) {
    const list = this.getEmployees().filter(e => e.id !== id);
    this.set(this.keys.EMPLOYEES, list);
  },

  // --- RECIPE API (Wrapper logic cũ) ---
  getRecipes() { return this.get(this.keys.RECIPES, []); },
  saveRecipes(list) { this.set(this.keys.RECIPES, list); },
  getCounts() { return this.get(this.keys.COUNTS, {}); },
  saveCounts(counts) { this.set(this.keys.COUNTS, counts); }
};

// ==========================================
// 2. VIEW COMPONENTS (Render UI HTML)
// ==========================================
const Views = {
  // --- A. Corporate Landing Page ---
  home: () => `
    <section class="hero">
      <h2>Nâng tầm trải nghiệm Cà phê Việt</h2>
      <p>Hệ thống quản lý vận hành chuẩn chỉ </p>
      <div style="display:flex; gap:10px; justify-content:center;">
        <button class="btn btn-primary" onclick="Router.navigate('recipe')">Quản lý Kho</button>
        <button class="btn btn-ghost" onclick="Router.navigate('hr')">Cổng nhân sự</button>
      </div>
    </section>
    
    <div class="grid-3" style="margin-top: 40px;">
      <div class="card">
        <h3>Tầm nhìn</h3>
        <p class="muted">Trở thành chuỗi F&B hàng đầu.</p>
      </div>
      <div class="card">
        <h3>Sứ mệnh</h3>
        <p class="muted">Mỗi ly cà phê là một tác phẩm nghệ thuật.</p>
      </div>
      <div class="card">
        <h3> Giá trị cốt lõi</h3>
        <p class="muted">Trung thực - Kỷ luật - Sáng tạo. </p>
      </div>
    </div>
  `,

  // --- B. HR Management Module ---
  hr: () => {
    const employees = DataService.getEmployees();
    const rows = employees.map(e => `
      <tr>
        <td><strong>${e.name}</strong></td>
        <td>${e.role}</td>
        <td><span class="status-badge ${e.status === 'Active' ? 'status-active' : 'status-off'}">${e.status}</span></td>
        <td><button class="btn-danger" style="padding:4px 8px; font-size:12px" onclick="App.handleDeleteEmp(${e.id})">Xóa</button></td>
      </tr>
    `).join('');

    return `
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <h2>Quản lý nhân sự</h2>
          <button class="btn btn-primary" onclick="App.toggleAddEmpForm()">+ Thêm nhân sự</button>
        </div>

        <div id="addEmpForm" class="card" style="background:#f9fafb; display:none; margin-bottom:20px;">
          <div class="grid-2">
            <input id="inpName" placeholder="Họ và tên">
            <select id="inpRole">
              <option value="Barista">Barista</option>
              <option value="Cashier">Thu ngân</option>
              <option value="Manager">Quản lý</option>
            </select>
          </div>
          <div style="margin-top:10px; text-align:right;">
             <button class="btn btn-primary" onclick="App.handleAddEmp()">Lưu</button>
          </div>
        </div>

        <div class="table-wrapper">
          <table>
            <thead><tr><th>Họ tên</th><th>Vai trò</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  },

  // --- C. Shift Management (UI Demo) ---
  shift: () => `
    <div class="card">
      <h2>Lịch làm việc tuần 4/2026</h2>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr><th>Ca / Thứ</th><th>Thứ 2</th><th>Thứ 3</th><th>Thứ 4</th><th>Thứ 5</th><th>Thứ 6</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Sáng (6:00 - 14:00)</strong></td>
              <td>Thế Anh</td><td>NV A</td><td>Thế Anh</td><td>NV A</td><td>NV B</td>
            </tr>
            <tr>
              <td><strong>Chiều (14:00 - 22:00)</strong></td>
              <td>NV B</td><td>Thế Anh</td><td>NV B</td><td>Thế Anh</td><td>Thế Anh</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="muted" style="margin-top:10px;">* Tính năng chấm công tự động đang phát triển.</p>
    </div>
  `,

  // --- D. Recipe Module (Legacy Code Integration) ---
  recipe: () => `
    <div class="recipe-layout">
      <section class="card">
         <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
            <input type="text" id="recipeSearch" placeholder="Tìm món..." oninput="RecipeModule.renderGrid(this.value)">
            <label class="btn btn-ghost">
               + Nhập File JSON/CSV <input type="file" hidden onchange="RecipeModule.handleImport(this)">
            </label>
         </div>
         <div id="menuGrid" class="menu-grid"></div>
      </section>
      
      <aside class="card">
        <h3>Nguyên liệu tiêu thụ</h3>
        <div id="summaryList"></div>
        <div style="margin-top:20px;">
           <button class="btn btn-danger" style="width:100%" onclick="RecipeModule.reset()">Đặt lại kho</button>
        </div>
      </aside>
    </div>
  `
};

// ==========================================
// 3. LOGIC MODULES (Controllers)
// ==========================================

// --- Recipe Logic (Refactored from your old code) ---
const RecipeModule = {
  recipes: [],
  counts: {},

  init() {
    this.recipes = DataService.getRecipes();
    this.counts = DataService.getCounts();
    // Load default if empty
    if (!this.recipes.length) {
       // (Giả lập data mẫu của bạn để demo chạy luôn)
       this.recipes = [
         {id: 'cf1', name: 'Bạc Xỉu', category: 'Coffee', ingredients: [{name:'Sữa đặc', unit:'ml', qty:30}, {name:'Sữa tươi', unit:'ml', qty:100}]},
         {id: 'cf2', name: 'Đen Đá', category: 'Coffee', ingredients: [{name:'Cafe', unit:'g', qty:20}, {name:'Đường', unit:'ml', qty:10}]}
       ];
    }
    this.renderGrid();
    this.renderSummary();
  },

  renderGrid(filterText = '') {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;
    
    const q = filterText.toLowerCase();
    const list = this.recipes.filter(r => r.name.toLowerCase().includes(q));
    
    grid.innerHTML = list.map(r => `
      <div class="recipe-card">
        <h4>${r.name}</h4>
        <small class="muted">${r.category}</small>
        <div class="recipe-actions">
           <button class="btn btn-ghost" onclick="RecipeModule.updateCount('${r.id}', -1)">-</button>
           <strong style="font-size:1.2rem; width:30px; text-align:center;">${this.counts[r.id] || 0}</strong>
           <button class="btn btn-ghost" onclick="RecipeModule.updateCount('${r.id}', 1)">+</button>
        </div>
      </div>
    `).join('');
  },

  updateCount(id, delta) {
    const cur = this.counts[id] || 0;
    const next = Math.max(0, cur + delta);
    this.counts[id] = next;
    DataService.saveCounts(this.counts);
    this.renderGrid(document.getElementById('recipeSearch')?.value);
    this.renderSummary();
  },

  renderSummary() {
    const summaryEl = document.getElementById('summaryList');
    if (!summaryEl) return;

    // Logic tính tổng (giữ nguyên logic của bạn)
    const totalMap = new Map();
    this.recipes.forEach(r => {
      const c = this.counts[r.id] || 0;
      if (c > 0) {
        r.ingredients.forEach(ing => {
          const key = `${ing.name} (${ing.unit})`;
          const val = (ing.qty || 0) * c;
          totalMap.set(key, (totalMap.get(key) || 0) + val);
        });
      }
    });

    const items = Array.from(totalMap.entries()).sort((a,b) => b[1] - a[1]);
    summaryEl.innerHTML = items.length 
      ? `<ul>${items.map(([k, v]) => `<li style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px dashed #eee"><span>${k}</span> <strong>${v}</strong></li>`).join('')}</ul>`
      : '<p class="muted">Chưa có order nào.</p>';
  },

  reset() {
    if(confirm('Xóa hết dữ liệu bán hàng?')) {
      this.counts = {};
      DataService.saveCounts({});
      this.init();
    }
  },
  
  handleImport(input) {
      // Logic import file giữ nguyên (Placeholder)
      alert("Tính năng import đang được migrate. Vui lòng dùng data mẫu trước.");
  }
};

// ==========================================
// 4. CORE APP & ROUTER
// ==========================================
const Router = {
  routes: ['home', 'hr', 'shift', 'recipe'],
  
  init() {
    window.addEventListener('hashchange', () => this.load());
    this.load();
  },

  load() {
    let hash = window.location.hash.replace('#', '');
    if (!this.routes.includes(hash)) hash = 'home';
    
    // Update Active Link
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.target === hash);
    });

    // Render View
    const appRoot = document.getElementById('app-root');
    appRoot.innerHTML = Views[hash]();

    // Post-Render Logic (Lifecycle Hooks)
    if (hash === 'recipe') RecipeModule.init();
  },

  navigate(page) {
    window.location.hash = page;
  }
};

const App = {
  init() {
    Router.init();
  },

  // HR Actions (Global handlers)
  toggleAddEmpForm() {
    const el = document.getElementById('addEmpForm');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  },
  
  handleAddEmp() {
    const name = document.getElementById('inpName').value;
    const role = document.getElementById('inpRole').value;
    if(name) {
      DataService.addEmployee({ name, role, status: 'Active' });
      Router.load(); // Re-render
    }
  },
  
  handleDeleteEmp(id) {
    if(confirm('Xóa nhân viên này?')) {
      DataService.deleteEmployee(id);
      Router.load();
    }
  }
};

// Start App
document.addEventListener('DOMContentLoaded', App.init);
