// =============================================================
// WealthyAI - Core Logic and AI Advisor Engine (Vanilla JS)
// =============================================================

// 1. Data Structure and Constants
const CATEGORY_MAP = {
    // Expenses
    food: { name: 'อาหาร/เครื่องดื่ม', color: '#f43f5e', icon: 'utensils' },
    transport: { name: 'การเดินทาง', color: '#3b82f6', icon: 'car' },
    utilities: { name: 'บิลค่าไฟ/น้ำ/เน็ต', color: '#eab308', icon: 'tv' },
    shopping: { name: 'ช้อปปิ้ง', color: '#ec4899', icon: 'shopping-bag' },
    entertainment: { name: 'ความบันเทิง', color: '#a855f7', icon: 'gamepad-2' },
    health: { name: 'สุขภาพ/ยา', color: '#14b8a6', icon: 'heart-pulse' },
    investment_exp: { name: 'เงินออม/ลงทุน', color: '#06b6d4', icon: 'piggy-bank' },
    other_exp: { name: 'รายจ่ายอื่นๆ', color: '#64748b', icon: 'more-horizontal' },
    
    // Income
    salary: { name: 'เงินเดือน', color: '#10b981', icon: 'briefcase' },
    investment_inc: { name: 'ปันผล/ลงทุน', color: '#84cc16', icon: 'trending-up' },
    business: { name: 'ธุรกิจ/ขายของ', color: '#f97316', icon: 'store' },
    allowance: { name: 'เงินให้/ของขวัญ', color: '#06b6d4', icon: 'gift' },
    other_inc: { name: 'รายรับอื่นๆ', color: '#0ea5e9', icon: 'banknote' }
};

// State Variables
let transactions = [];
let lending = []; // V2 Lending state
let categoryChartInstance = null;
let yearlyChartInstance = null;
let currentCurrency = 'JPY'; // Default currency
let startingCash = 0;
let startingBank = 0;
let googleSheetUrl = 'https://script.google.com/macros/s/AKfycbw0MRGV_KuM272iKjlabLDHw_pLMe2nk3mQz1diNKHM2xB6KKyT_Df-k41rzfjmSzeb/exec'; // Google Sheets Web App URL
let syncStatus = 'offline'; // 'online' | 'syncing' | 'offline'
let tempTransactionImage = null; // Temporary image holder for Transaction form
let tempLendingImage = null; // Temporary image holder for Lending form

// Mock Data for Initial Load (Using Year 2026 based on Current Metadata)
const MOCK_TRANSACTIONS = [
    // May 2026
    { id: 'mock-1', type: 'income', amount: 35000, category: 'salary', date: '2026-05-01', description: 'เงินเดือนพฤษภาคม' },
    { id: 'mock-2', type: 'expense', amount: 4800, category: 'utilities', date: '2026-05-02', description: 'ค่าห้องและอินเทอร์เน็ต' },
    { id: 'mock-3', type: 'expense', amount: 2500, category: 'food', date: '2026-05-05', description: 'อาหารรายสัปดาห์' },
    { id: 'mock-4', type: 'expense', amount: 800, category: 'transport', date: '2026-05-08', description: 'เติมน้ำมันรถ' },
    { id: 'mock-5', type: 'expense', amount: 4500, category: 'shopping', date: '2026-05-12', description: 'ซื้อเสื้อผ้าใหม่' },
    { id: 'mock-6', type: 'income', amount: 5000, category: 'business', date: '2026-05-15', description: 'ขายเสื้อผ้ามือสอง' },
    { id: 'mock-7', type: 'expense', amount: 1500, category: 'entertainment', date: '2026-05-20', description: 'ดูคอนเสิร์ตและปาร์ตี้' },
    { id: 'mock-8', type: 'expense', amount: 7000, category: 'investment_exp', date: '2026-05-25', description: 'ซื้อกองทุนรวมประหยัดภาษี' },
    { id: 'mock-9', type: 'expense', amount: 600, category: 'health', date: '2026-05-28', description: 'ค่าวิตามินบำรุง' },
    
    // June 2026 (Current Month)
    { id: 'mock-10', type: 'income', amount: 35000, category: 'salary', date: '2026-06-01', description: 'เงินเดือนมิถุนายน' },
    { id: 'mock-11', type: 'expense', amount: 5200, category: 'utilities', date: '2026-06-02', description: 'ค่าน้ำไฟและค่าอินเทอร์เน็ต' },
    { id: 'mock-12', type: 'expense', amount: 3200, category: 'food', date: '2026-06-04', description: 'ซื้อของสดเข้าตู้เย็น' },
    { id: 'mock-13', type: 'expense', amount: 1200, category: 'transport', date: '2026-06-05', description: 'ค่าเดินทางรถไฟฟ้า MRT' },
    { id: 'mock-14', type: 'expense', amount: 2200, category: 'shopping', date: '2026-06-07', description: 'รองเท้าวิ่งคู่ใหม่' },
    { id: 'mock-15', type: 'income', amount: 6500, category: 'business', date: '2026-06-10', description: 'รับฟรีแลนซ์ออกแบบเว็บไซต์' },
    { id: 'mock-16', type: 'expense', amount: 800, category: 'entertainment', date: '2026-06-12', description: 'บุฟเฟ่ต์ชาบูกับเพื่อน' }
];

// 2. Initial Setup and DOM Loading
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Check Local Storage
    loadData();
    
    // Setup currency selector state
    initCurrency();
    
    // Set default dates to current date
    const todayStr = getTodayDateString();
    document.getElementById('quick-date').value = todayStr;
    document.getElementById('full-date').value = todayStr;
    
    // Set default month in analytics
    const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
    document.getElementById('analytics-month').value = currentMonthStr;

    // Set default dates for lending inputs
    const lendingDateEl = document.getElementById('lending-date');
    if (lendingDateEl) {
        lendingDateEl.value = todayStr;
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        document.getElementById('lending-due-date').value = `${year}-${month}-${day}`;
    }

    // Set up event listeners
    setupNavigation();
    setupForms();
    setupFilters();
    setupAnalyticsSelectors();
    setupDataActions();
    setupAIChat();
    setupSettingsModal();
    setupLending();        // V2 Lending Listeners
    setupImageUpload();    // V2 Image OCR & Upload
    setupImageViewer();    // V2 Image Lightbox Viewer
    
    // Initial UI Render
    updateUI();

    // Try automatic sync from Google Sheets on startup if URL exists
    if (googleSheetUrl) {
        pullFromGoogleSheet();
    } else {
        updateSyncStatus('offline');
    }
});

// Helper: Get today's local date string YYYY-MM-DD
function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Currency Switcher Helper Functions
function initCurrency() {
    const selector = document.getElementById('currency-selector');
    const storedCurrency = localStorage.getItem('wealthy_ai_currency') || 'JPY';
    currentCurrency = storedCurrency;
    selector.value = storedCurrency;

    selector.addEventListener('change', (e) => {
        currentCurrency = e.target.value;
        localStorage.setItem('wealthy_ai_currency', currentCurrency);
        saveData();
        updateUI();
        showToast(`เปลี่ยนสกุลเงินเป็น ${currentCurrency === 'JPY' ? 'เยน (¥)' : 'บาท (฿)'} สำเร็จแล้วค่ะ!`);
        if (googleSheetUrl) {
            pushToGoogleSheet('saveAll', { transactions, lending, startingCash, startingBank });
        }
    });
}

function formatCurrency(amount) {
    if (currentCurrency === 'JPY') {
        return '¥' + Math.round(amount).toLocaleString('ja-JP');
    } else {
        return '฿' + amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

function setupSettingsModal() {
    const modal = document.getElementById('settings-modal');
    const openBtn = document.getElementById('open-settings-btn');
    const closeBtn = document.getElementById('close-settings-btn');
    const form = document.getElementById('starting-balance-form');
    const startCashInput = document.getElementById('start-cash');
    const startBankInput = document.getElementById('start-bank');

    // Google Sheets elements
    const sheetUrlInput = document.getElementById('sheet-url');
    const saveUrlBtn = document.getElementById('save-sheet-url-btn');
    const disconnectBtn = document.getElementById('disconnect-sheet-btn');
    const syncActionsGroup = document.getElementById('sync-actions-group');
    const pullBtn = document.getElementById('pull-sheet-btn');
    const pushBtn = document.getElementById('push-sheet-btn');

    // Update sync UI state inside modal
    function updateModalSyncUI() {
        if (googleSheetUrl) {
            sheetUrlInput.value = googleSheetUrl;
            sheetUrlInput.disabled = true;
            saveUrlBtn.classList.add('hide');
            disconnectBtn.classList.remove('hide');
            syncActionsGroup.classList.remove('hide');
        } else {
            sheetUrlInput.value = '';
            sheetUrlInput.disabled = false;
            saveUrlBtn.classList.remove('hide');
            disconnectBtn.classList.add('hide');
            syncActionsGroup.classList.add('hide');
        }
    }

    openBtn.addEventListener('click', () => {
        startCashInput.value = startingCash;
        startBankInput.value = startingBank;
        updateModalSyncUI();
        modal.classList.remove('hide');
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hide');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hide');
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        startingCash = parseFloat(startCashInput.value) || 0;
        startingBank = parseFloat(startBankInput.value) || 0;
        
        saveData();
        updateUI();
        
        // Auto push starting balance if sync configured
        if (googleSheetUrl) {
            pushToGoogleSheet('saveAll', { transactions, lending, startingCash, startingBank });
        }
        
        modal.classList.add('hide');
        showToast('บันทึกเงินเริ่มต้นเรียบร้อยแล้วค่ะ!');
    });

    // Google Sheets action listeners
    saveUrlBtn.addEventListener('click', () => {
        const urlValue = sheetUrlInput.value.trim();
        if (!urlValue) {
            showToast('กรุณากรอก URL', 'error');
            return;
        }
        if (!urlValue.startsWith('https://script.google.com/')) {
            showToast('รูปแบบ URL ไม่ถูกต้อง (ต้องขึ้นต้นด้วย https://script.google.com/)', 'error');
            return;
        }

        googleSheetUrl = urlValue;
        saveData();
        updateModalSyncUI();
        showToast('เชื่อมต่อ URL และกำลังดึงข้อมูล...');
        pullFromGoogleSheet(true);
    });

    disconnectBtn.addEventListener('click', () => {
        if (confirm('คุณต้องการยกเลิกการเชื่อมต่อกับ Google Sheets ใช่หรือไม่? (ข้อมูลในคอมพิวเตอร์จะไม่ถูกลบ)')) {
            googleSheetUrl = '';
            saveData();
            updateModalSyncUI();
            updateSyncStatus('offline');
            showToast('ยกเลิกการเชื่อมต่อ Google Sheets แล้วค่ะ', 'error');
        }
    });

    pullBtn.addEventListener('click', () => {
        pullFromGoogleSheet(true);
    });

    pushBtn.addEventListener('click', () => {
        pushToGoogleSheet('saveAll', { transactions, lending, startingCash, startingBank }, true);
    });
}

// 3. Navigation Controls (SPA)
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.app-view');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            
            // Toggle Nav Active State
            navItems.forEach(btn => btn.classList.remove('active'));
            item.classList.add('active');

            // Switch Views
            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === `view-${target}`) {
                    view.classList.add('active');
                }
            });

            // Update Header Title Text
            switch (target) {
                case 'dashboard':
                    pageTitle.textContent = 'แดชบอร์ดภาพรวม';
                    pageSubtitle.textContent = 'ยินดีต้อนรับกลับมา! นี่คือสรุปทางการเงินของคุณ';
                    break;
                case 'transactions':
                    pageTitle.textContent = 'รายการเดินบัญชี';
                    pageSubtitle.textContent = 'บันทึกรายรับรายจ่าย และจัดการข้อมูลประวัติทั้งหมดของคุณ';
                    break;
                case 'analytics':
                    pageTitle.textContent = 'การวิเคราะห์เชิงลึก';
                    pageSubtitle.textContent = 'วิเคราะห์สถิติ สัดส่วนการออม และพฤติกรรมการจ่ายเงินเป็นรายเดือน/รายปี';
                    break;
                case 'lending':
                    pageTitle.textContent = 'ระบบบันทึกคนยืมเงิน';
                    pageSubtitle.textContent = 'จดบันทึกประวัติการยืมเงินของผู้ยืม และอัปโหลดภาพสัญญาหลักฐานการยืมเงิน';
                    break;
                case 'ai-advisor':
                    pageTitle.textContent = 'ผู้ช่วย AI น้องถุงเงิน';
                    pageSubtitle.textContent = 'รับรายงานวิเคราะห์ความปลอดภัยทางการเงิน และแชทคุยหาไอเดียลดค่าใช้จ่าย';
                    break;
            }

            // Trigger animations or chart redraws when changing views
            if (target === 'dashboard' || target === 'analytics') {
                renderCharts();
            }
            if (target === 'ai-advisor') {
                renderAIAdvisorView();
            }
            if (target === 'lending') {
                renderLendingView();
            }
        });
    });

    // Dashboard navigation links
    document.getElementById('view-all-trans-btn').addEventListener('click', () => {
        document.querySelector('[data-target="transactions"]').click();
    });
    
    document.getElementById('go-to-ai-btn').addEventListener('click', () => {
        document.querySelector('[data-target="ai-advisor"]').click();
    });
}

// 4. Data Storage Management
function loadData() {
    const stored = localStorage.getItem('wealthy_ai_transactions');
    if (stored) {
        transactions = JSON.parse(stored);
        // Automatically purge mock transactions if the user hasn't added any real ones yet
        const onlyHasMockData = transactions.length > 0 && transactions.every(t => t.id && t.id.startsWith('mock-'));
        if (onlyHasMockData) {
            transactions = [];
            saveData();
        }
    } else {
        transactions = [];
        saveData();
    }

    // Load V2 Lending data
    const storedLending = localStorage.getItem('wealthy_ai_lending');
    lending = storedLending ? JSON.parse(storedLending) : [];

    // Load starting balances
    startingCash = parseFloat(localStorage.getItem('wealthy_ai_starting_cash')) || 0;
    startingBank = parseFloat(localStorage.getItem('wealthy_ai_starting_bank')) || 0;

    // Load sheet URL
    const oldUrls = [
        'https://script.google.com/macros/s/AKfycbxXiu0pzkdcSh8uss93kd71Ov0NPZDlALZaONZpmIorJzgCAboRZWKKvSnY4IhkkM99rA/exec',
        'https://script.google.com/macros/s/AKfycbwqLr_9MspVgQcf9qMLhx6Bb_JB7OxQmpvqcfCTl3ml/exec',
        'https://script.google.com/macros/s/AKfycbyfYYeMNd3DgusGddy813TcTKK0RzdeO-PDiEZ7wGv25mANtQw1oriwXEYYOy0F9S92mw/exec'
    ];
    const newUrl = 'https://script.google.com/macros/s/AKfycbw0MRGV_KuM272iKjlabLDHw_pLMe2nk3mQz1diNKHM2xB6KKyT_Df-k41rzfjmSzeb/exec';
    
    let savedUrl = localStorage.getItem('wealthy_ai_google_sheet_url');
    if (oldUrls.includes(savedUrl) || savedUrl === 'https://script.google.com/macros/s/AKfycbyfYYeMNd3DgusGddy813TcTKK0RzdeO-PDiEZ7wGv25mANtQw1oriwXEYYOy0F9S92mw/exec') {
        savedUrl = newUrl;
        localStorage.setItem('wealthy_ai_google_sheet_url', newUrl);
    }
    
    if (savedUrl !== null) {
        googleSheetUrl = savedUrl;
    } else {
        googleSheetUrl = newUrl;
        localStorage.setItem('wealthy_ai_google_sheet_url', googleSheetUrl);
    }
}

function saveData() {
    localStorage.setItem('wealthy_ai_transactions', JSON.stringify(transactions));
    localStorage.setItem('wealthy_ai_lending', JSON.stringify(lending));
    localStorage.setItem('wealthy_ai_starting_cash', startingCash);
    localStorage.setItem('wealthy_ai_starting_bank', startingBank);
    localStorage.setItem('wealthy_ai_google_sheet_url', googleSheetUrl);
}

// 5. Data Actions: Export / Import JSON
function setupDataActions() {
    const exportBtn = document.getElementById('export-data-btn');
    const importBtn = document.getElementById('import-data-btn');
    const fileInput = document.getElementById('import-file');

    exportBtn.addEventListener('click', () => {
        if (transactions.length === 0 && lending.length === 0) {
            showToast('ไม่มีข้อมูลสำหรับส่งออก', 'error');
            return;
        }
        const exportObj = {
            version: "2.0.0",
            transactions: transactions,
            lending: lending,
            startingCash: startingCash,
            startingBank: startingBank
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `WealthyAI_Data_${getTodayDateString()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast('ส่งออกข้อมูลสำเร็จแล้ว!');
    });

    importBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const parsed = JSON.parse(e.target.result);
                if (Array.isArray(parsed)) {
                    // V1 compatibility: array of transactions
                    const isValid = parsed.every(item => item.id && item.type && item.amount && item.category && item.date);
                    if (isValid) {
                        transactions = parsed;
                        lending = [];
                        saveData();
                        updateUI();
                        showToast('นำเข้าข้อมูลเรียบร้อยแล้ว!');
                        if (googleSheetUrl) {
                            pushToGoogleSheet('saveAll', { transactions, lending, startingCash, startingBank });
                        }
                    } else {
                        showToast('โครงสร้างไฟล์ข้อมูลไม่ถูกต้อง', 'error');
                    }
                } else if (parsed && typeof parsed === 'object') {
                    // V2 format: object with transactions and lending
                    transactions = parsed.transactions || [];
                    lending = parsed.lending || [];
                    if (parsed.startingCash !== undefined) startingCash = parsed.startingCash;
                    if (parsed.startingBank !== undefined) startingBank = parsed.startingBank;
                    saveData();
                    updateUI();
                    showToast('นำเข้าข้อมูลสำเร็จแล้ว!');
                    if (googleSheetUrl) {
                        pushToGoogleSheet('saveAll', { transactions, lending, startingCash, startingBank });
                    }
                } else {
                    showToast('รูปแบบไฟล์ไม่ใช่ข้อมูลธุรกรรมที่ถูกต้อง', 'error');
                }
            } catch (err) {
                showToast('ไม่สามารถอ่านไฟล์ JSON ได้', 'error');
            }
        };
        reader.readAsText(file);
        // Reset file input value
        fileInput.value = '';
    });

    const clearAllBtn = document.getElementById('clear-all-btn');
    clearAllBtn.addEventListener('click', () => {
        if (transactions.length === 0 && lending.length === 0) {
            showToast('ไม่มีข้อมูลใดๆ ให้ล้างอยู่แล้วค่ะ', 'error');
            return;
        }
        if (confirm('คุณต้องการลบข้อมูลประวัติรายรับรายจ่ายและคนยืมเงินทั้งหมดใช่หรือไม่? (การดำเนินการนี้ไม่สามารถเรียกคืนได้)')) {
            transactions = [];
            lending = [];
            saveData();
            updateUI();
            showToast('ล้างข้อมูลทั้งหมดเรียบร้อยแล้วค่ะ', 'error');
            if (googleSheetUrl) {
                pushToGoogleSheet('saveAll', { transactions, lending, startingCash, startingBank });
            }
        }
    });
}

// 6. UI Update Controllers
function updateUI() {
    // Sync Category Select Options based on type
    populateCategorySelectors();

    // Render tables
    renderRecentTransactionsTable();
    renderAllTransactionsTable();

    // Update Dashboard Cards
    updateDashboardCards();

    // Render charts
    renderCharts();

    // Update Analytics view details
    updateAnalyticsView();

    // Refresh AI advice
    updateAIQuickSummary();

    // Update Lending View & Stats
    updateLendingStats();
    renderLendingView();
}

// Helper: Populate Category Selectors dynamically based on transaction type
function populateCategorySelectors() {
    const quickType = document.getElementById('quick-type');
    const quickCategory = document.getElementById('quick-category');
    const fullCategory = document.getElementById('full-category');
    
    // Type Buttons logic in Transactions Page
    const typeButtons = document.querySelectorAll('.type-btn');
    let currentFullType = 'expense';

    typeButtons.forEach(btn => {
        // Remove listener to prevent duplication
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });

    const newTypeButtons = document.querySelectorAll('.type-btn');
    newTypeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            newTypeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFullType = btn.getAttribute('data-type');
            updateCategoryOptions(currentFullType, fullCategory);
        });
    });

    // Quick add change handler
    quickType.addEventListener('change', () => {
        updateCategoryOptions(quickType.value, quickCategory);
    });

    // Populate initially
    updateCategoryOptions('expense', quickCategory);
    updateCategoryOptions('expense', fullCategory);

    // Filter category setup
    const filterCategory = document.getElementById('filter-category');
    filterCategory.innerHTML = '<option value="all">ทุกหมวดหมู่</option>';
    Object.keys(CATEGORY_MAP).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = CATEGORY_MAP[key].name;
        filterCategory.appendChild(option);
    });
}

function updateCategoryOptions(type, selectEl) {
    selectEl.innerHTML = '';
    Object.keys(CATEGORY_MAP).forEach(key => {
        const cat = CATEGORY_MAP[key];
        const isExpenseCategory = ['food', 'transport', 'utilities', 'shopping', 'entertainment', 'health', 'investment_exp', 'other_exp'].includes(key);
        
        if ((type === 'expense' && isExpenseCategory) || (type === 'income' && !isExpenseCategory)) {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = cat.name;
            selectEl.appendChild(opt);
        }
    });
}

// 7. Form Operations (Add / Delete)
function setupForms() {
    // Quick Add Form Submit
    const quickForm = document.getElementById('quick-add-form');
    quickForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const type = document.getElementById('quick-type').value;
        const category = document.getElementById('quick-category').value;
        const amount = parseFloat(document.getElementById('quick-amount').value);
        const date = document.getElementById('quick-date').value;
        const wallet = document.getElementById('quick-wallet').value;
        const description = CATEGORY_MAP[category].name; // Default description is category name

        addTransaction(type, category, amount, date, description, wallet);
        quickForm.reset();
        document.getElementById('quick-date').value = getTodayDateString();
        showToast('เพิ่มรายการสำเร็จแล้ว! ' + formatCurrency(amount));
    });

    // Full Add Form Submit
    const fullForm = document.getElementById('full-add-form');
    fullForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const activeTypeBtn = document.querySelector('.type-btn.active');
        const type = activeTypeBtn ? activeTypeBtn.getAttribute('data-type') : 'expense';
        const category = document.getElementById('full-category').value;
        const amount = parseFloat(document.getElementById('full-amount').value);
        const date = document.getElementById('full-date').value;
        const wallet = document.getElementById('full-wallet').value;
        const description = document.getElementById('full-desc').value.trim() || CATEGORY_MAP[category].name;

        addTransaction(type, category, amount, date, description, wallet, tempTransactionImage);
        fullForm.reset();
        
        // Reset type to expense
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.type-btn.expense').classList.add('active');
        populateCategorySelectors();
        
        document.getElementById('full-date').value = getTodayDateString();
        showToast('บันทึกสำเร็จเรียบร้อย! ' + formatCurrency(amount));
    });
}

function addTransaction(type, category, amount, date, description, wallet = 'bank', imageUrl = null) {
    const newTx = {
        id: 'tx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        type,
        amount,
        category,
        date,
        description,
        wallet,
        imageUrl: imageUrl
    };
    transactions.push(newTx);
    
    // Reset temp image and preview UI
    tempTransactionImage = null;
    const previewContainer = document.getElementById('full-image-preview-container');
    const uploadZone = document.getElementById('full-upload-zone');
    if (previewContainer) {
        previewContainer.classList.add('hide');
        uploadZone.classList.remove('hide');
        document.getElementById('full-image-preview').src = '';
        document.getElementById('full-image-input').value = '';
    }

    // Sort transactions by date descending
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    saveData();
    updateUI();

    // Auto push to Google Sheets
    if (googleSheetUrl) {
        pushToGoogleSheet('saveAll', { transactions, lending, startingCash, startingBank });
    }
}

function deleteTransaction(id) {
    if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        updateUI();
        showToast('ลบรายการสำเร็จแล้ว', 'error');

        // Auto push to Google Sheets
        if (googleSheetUrl) {
            pushToGoogleSheet('saveAll', { transactions, lending, startingCash, startingBank });
        }
    }
}

// 8. Filters for Full Transactions View
function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const filterType = document.getElementById('filter-type');
    const filterCategory = document.getElementById('filter-category');

    const handleFilter = () => {
        renderAllTransactionsTable();
    };

    searchInput.addEventListener('input', handleFilter);
    filterType.addEventListener('change', handleFilter);
    filterCategory.addEventListener('change', handleFilter);
}

// 9. Dashboard Card Values Computation
function updateDashboardCards() {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11
    const currentYear = today.getFullYear();

    let cashIncome = 0;
    let cashExpense = 0;
    let bankIncome = 0;
    let bankExpense = 0;

    let monthIncome = 0;
    let monthExpense = 0;
    
    let prevMonthIncome = 0;
    let prevMonthExpense = 0;

    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonthVal = prevMonthDate.getMonth();
    const prevMonthYear = prevMonthDate.getFullYear();

    transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        const txMonth = txDate.getMonth();
        const txYear = txDate.getFullYear();
        const txWallet = tx.wallet || 'bank';

        // Split by wallet
        if (tx.type === 'income') {
            if (txWallet === 'cash') cashIncome += tx.amount;
            else bankIncome += tx.amount;
        } else {
            if (txWallet === 'cash') cashExpense += tx.amount;
            else bankExpense += tx.amount;
        }

        // Current Month Stats
        if (txMonth === currentMonth && txYear === currentYear) {
            if (tx.type === 'income') {
                monthIncome += tx.amount;
            } else {
                monthExpense += tx.amount;
            }
        }

        // Previous Month Stats
        if (txMonth === prevMonthVal && txYear === prevMonthYear) {
            if (tx.type === 'income') {
                prevMonthIncome += tx.amount;
            } else {
                prevMonthExpense += tx.amount;
            }
        }
    });

    // Subtract active (unreturned) loans from balances
    let activeLentCash = 0;
    let activeLentBank = 0;
    
    lending.forEach(lend => {
        if (lend.status === 'lent') {
            if (lend.wallet === 'cash') {
                activeLentCash += lend.amount;
            } else {
                activeLentBank += lend.amount;
            }
        }
    });

    const currentCash = startingCash + cashIncome - cashExpense - activeLentCash;
    const currentBank = startingBank + bankIncome - bankExpense - activeLentBank;
    const totalBalance = currentCash + currentBank;

    // Populate elements
    document.getElementById('total-balance').textContent = formatCurrency(totalBalance);
    document.getElementById('cash-balance').textContent = formatCurrency(currentCash);
    document.getElementById('bank-balance').textContent = formatCurrency(currentBank);
    
    document.getElementById('month-income').textContent = formatCurrency(monthIncome);
    document.getElementById('month-expense').textContent = formatCurrency(monthExpense);

    // MoM comparison percentages
    const incomeChangeEl = document.getElementById('income-change');
    const expenseChangeEl = document.getElementById('expense-change');

    if (prevMonthIncome > 0) {
        const incDiffPercent = Math.round(((monthIncome - prevMonthIncome) / prevMonthIncome) * 100);
        if (incDiffPercent >= 0) {
            incomeChangeEl.className = 'sub-text text-success';
            incomeChangeEl.innerHTML = `<i data-lucide="arrow-up-right"></i> +${incDiffPercent}% เทียบกับเดือนก่อน`;
        } else {
            incomeChangeEl.className = 'sub-text text-danger';
            incomeChangeEl.innerHTML = `<i data-lucide="arrow-down-left"></i> ${incDiffPercent}% เทียบกับเดือนก่อน`;
        }
    } else {
        incomeChangeEl.className = 'sub-text';
        incomeChangeEl.innerHTML = `ไม่มีข้อมูลเดือนที่แล้ว`;
    }

    if (prevMonthExpense > 0) {
        const expDiffPercent = Math.round(((monthExpense - prevMonthExpense) / prevMonthExpense) * 100);
        if (expDiffPercent >= 0) {
            // Expenses going up is marked red/danger in text
            expenseChangeEl.className = 'sub-text text-danger';
            expenseChangeEl.innerHTML = `<i data-lucide="arrow-up-right"></i> +${expDiffPercent}% เทียบกับเดือนก่อน`;
        } else {
            // Expenses going down is marked green/success in text
            expenseChangeEl.className = 'sub-text text-success';
            expenseChangeEl.innerHTML = `<i data-lucide="arrow-down-left"></i> ${expDiffPercent}% เทียบกับเดือนก่อน`;
        }
    } else {
        expenseChangeEl.className = 'sub-text';
        expenseChangeEl.innerHTML = `ไม่มีข้อมูลเดือนที่แล้ว`;
    }

    // Refresh icons
    lucide.createIcons();
}

// 10. Table Renders
function renderRecentTransactionsTable() {
    const tbody = document.getElementById('recent-transactions-tbody');
    const emptyState = document.getElementById('recent-empty-state');
    tbody.innerHTML = '';

    const recentLimit = transactions.slice(0, 5); // Pick first 5 sorted

    if (recentLimit.length === 0) {
        emptyState.classList.remove('hide');
        return;
    } else {
        emptyState.classList.add('hide');
    }

    recentLimit.forEach(tx => {
        const row = createTransactionRow(tx);
        tbody.appendChild(row);
    });

    lucide.createIcons();
}

function renderAllTransactionsTable() {
    const tbody = document.getElementById('all-transactions-tbody');
    const emptyState = document.getElementById('full-empty-state');
    tbody.innerHTML = '';

    // Get filter inputs
    const query = document.getElementById('search-input').value.toLowerCase().trim();
    const type = document.getElementById('filter-type').value;
    const category = document.getElementById('filter-category').value;

    const filtered = transactions.filter(tx => {
        const matchSearch = tx.description.toLowerCase().includes(query) || (CATEGORY_MAP[tx.category]?.name || '').toLowerCase().includes(query);
        const matchType = type === 'all' || tx.type === type;
        const matchCategory = category === 'all' || tx.category === category;
        return matchSearch && matchType && matchCategory;
    });

    if (filtered.length === 0) {
        emptyState.classList.remove('hide');
        return;
    } else {
        emptyState.classList.add('hide');
    }

    filtered.forEach(tx => {
        const row = createTransactionRow(tx);
        tbody.appendChild(row);
    });

    lucide.createIcons();
}

function createTransactionRow(tx) {
    const tr = document.createElement('tr');
    
    const catDetails = CATEGORY_MAP[tx.category] || { name: tx.category, color: '#94a3b8' };
    const typeBadge = tx.type === 'income' 
        ? `<span class="badge badge-income"><i data-lucide="trending-up" style="width:12px;height:12px"></i> รายรับ</span>`
        : `<span class="badge badge-expense"><i data-lucide="trending-down" style="width:12px;height:12px"></i> รายจ่าย</span>`;

    const amountFormatted = tx.type === 'income'
        ? `+${formatCurrency(tx.amount)}`
        : `-${formatCurrency(tx.amount)}`;

    const amountClass = tx.type === 'income' ? 'text-success' : 'text-danger';

    // Format date beautifully
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    const dateFormatted = new Date(tx.date).toLocaleDateString('th-TH', options);

    const walletText = tx.wallet === 'cash' ? '💵 เงินสด' : '🏦 บัญชี';

    const imageBtnHtml = tx.imageUrl 
        ? `<button class="btn-view-image-row" data-url="${tx.imageUrl}" style="background:transparent;border:none;color:#a78bfa;cursor:pointer;margin-right:8px;padding:4px;vertical-align:middle;" title="ดูรูปสลิป"><i data-lucide="image" style="width:16px;height:16px"></i></button>`
        : '';

    tr.innerHTML = `
        <td style="font-family: var(--font-eng);">${dateFormatted}</td>
        <td>${typeBadge}</td>
        <td>${walletText}</td>
        <td>
            <div class="title-with-icon" style="gap:0.4rem">
                <span class="cat-dot" style="background:${catDetails.color};width:8px;height:8px;display:inline-block;border-radius:50%"></span>
                <span>${catDetails.name}</span>
            </div>
        </td>
        <td class="text-muted" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${tx.description || '-'}</td>
        <td class="${amountClass} text-right" style="font-weight: 600; font-family: var(--font-eng);">${amountFormatted}</td>
        <td class="text-center">
            ${imageBtnHtml}
            <button class="btn-delete" data-id="${tx.id}"><i data-lucide="trash-2" style="width:16px;height:16px"></i></button>
        </td>
    `;

    // Event listener for view image button
    if (tx.imageUrl) {
        tr.querySelector('.btn-view-image-row').addEventListener('click', () => {
            openImageViewer(tx.imageUrl);
        });
    }

    // Event listener for delete button
    tr.querySelector('.btn-delete').addEventListener('click', () => {
        deleteTransaction(tx.id);
    });

    return tr;
}

// 11. Charts Engine (Chart.js wrapper)
function renderCharts() {
    // Current Active View Check
    const isDashboardActive = document.getElementById('view-dashboard').classList.contains('active');
    const isAnalyticsActive = document.getElementById('view-analytics').classList.contains('active');
    
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    if (isDashboardActive) {
        renderDashboardCategoryChart(currentMonth, currentYear);
    }
    
    if (isAnalyticsActive) {
        const viewMode = document.querySelector('.segment-btn.active').getAttribute('data-mode');
        if (viewMode === 'yearly') {
            const yearVal = parseInt(document.getElementById('analytics-year').value) || currentYear;
            renderYearlyChart(yearVal);
        }
    }
}

function renderDashboardCategoryChart(month, year) {
    const canvas = document.getElementById('categoryChart');
    const emptyState = document.getElementById('category-chart-empty');
    if (!canvas) return;

    // Filter expenses of the selected month
    const monthlyExpenses = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return tx.type === 'expense' && txDate.getMonth() === month && txDate.getFullYear() === year;
    });

    if (monthlyExpenses.length === 0) {
        if (categoryChartInstance) {
            categoryChartInstance.destroy();
            categoryChartInstance = null;
        }
        emptyState.classList.remove('hide');
        canvas.style.display = 'none';
        return;
    }

    emptyState.classList.add('hide');
    canvas.style.display = 'block';

    // Group expenses by category
    const grouped = {};
    monthlyExpenses.forEach(tx => {
        grouped[tx.category] = (grouped[tx.category] || 0) + tx.amount;
    });

    const labels = Object.keys(grouped).map(catKey => CATEGORY_MAP[catKey]?.name || catKey);
    const data = Object.values(grouped);
    const colors = Object.keys(grouped).map(catKey => CATEGORY_MAP[catKey]?.color || '#cbd5e1');

    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    // Custom plugin to show text inside Doughnut
    const centerTextPlugin = {
        id: 'centerText',
        afterDraw(chart) {
            const { ctx, chartArea: { top, bottom, left, right, width, height } } = chart;
            ctx.save();
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 15px Kanit';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('สัดส่วนรายจ่าย', left + width / 2, top + height / 2 - 10);
            ctx.font = '12px Kanit';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('(เฉพาะเดือนนี้)', left + width / 2, top + height / 2 + 12);
            ctx.restore();
        }
    };

    categoryChartInstance = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.06)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Kanit', size: 12 },
                        padding: 15
                    }
                },
                tooltip: {
                    titleFont: { family: 'Kanit' },
                    bodyFont: { family: 'Inter' },
                    callbacks: {
                        label: function(context) {
                            let val = context.raw || 0;
                            return ` ฿${val.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
                        }
                    }
                }
            },
            cutout: '70%'
        },
        plugins: [centerTextPlugin]
    });
}

function renderYearlyChart(year) {
    const canvas = document.getElementById('yearlyChart');
    const emptyState = document.getElementById('yearly-chart-empty');
    if (!canvas) return;

    // Prepopulate 12 months with 0
    const incomeData = Array(12).fill(0);
    const expenseData = Array(12).fill(0);

    let hasData = false;

    transactions.forEach(tx => {
        const txDate = new Date(tx.date);
        if (txDate.getFullYear() === year) {
            hasData = true;
            const m = txDate.getMonth(); // 0-11
            if (tx.type === 'income') {
                incomeData[m] += tx.amount;
            } else {
                expenseData[m] += tx.amount;
            }
        }
    });

    if (!hasData) {
        if (yearlyChartInstance) {
            yearlyChartInstance.destroy();
            yearlyChartInstance = null;
        }
        emptyState.classList.remove('hide');
        canvas.style.display = 'none';
        return;
    }

    emptyState.classList.add('hide');
    canvas.style.display = 'block';

    const monthLabels = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

    if (yearlyChartInstance) {
        yearlyChartInstance.destroy();
    }

    yearlyChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [
                {
                    label: 'รายรับ',
                    data: incomeData,
                    backgroundColor: 'rgba(16, 185, 129, 0.85)',
                    borderRadius: 5,
                    borderWidth: 0
                },
                {
                    label: 'รายจ่าย',
                    data: expenseData,
                    backgroundColor: 'rgba(244, 63, 94, 0.85)',
                    borderRadius: 5,
                    borderWidth: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { family: 'Kanit' } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: { color: '#94a3b8', font: { family: 'Inter' } }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        font: { family: 'Kanit' }
                    }
                },
                tooltip: {
                    titleFont: { family: 'Kanit' },
                    bodyFont: { family: 'Inter' },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            let val = context.raw || 0;
                            return ` ${label}: ฿${val.toLocaleString('th-TH', { maximumFractionDigits: 0 })}`;
                        }
                    }
                }
            }
        }
    });
}

// 12. Analytics (Monthly & Yearly) Logic
function setupAnalyticsSelectors() {
    const viewModeButtons = document.querySelectorAll('.segment-btn');
    const monthlySection = document.getElementById('monthly-report-section');
    const yearlySection = document.getElementById('yearly-report-section');
    const monthGroup = document.getElementById('month-select-group');
    const yearGroup = document.getElementById('year-select-group');
    
    // Segmented Button selection
    viewModeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            viewModeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const mode = btn.getAttribute('data-mode');
            if (mode === 'monthly') {
                monthlySection.classList.remove('hide');
                yearlySection.classList.add('hide');
                monthGroup.classList.remove('hide');
                yearGroup.classList.add('hide');
            } else {
                monthlySection.classList.add('hide');
                yearlySection.classList.remove('hide');
                monthGroup.classList.add('hide');
                yearGroup.classList.remove('hide');
                
                // Populate Year Select Options dynamically based on available transaction years
                populateYearSelectOptions();
            }
            updateAnalyticsView();
            renderCharts();
        });
    });

    // Inputs change triggers
    document.getElementById('analytics-month').addEventListener('change', () => {
        updateAnalyticsView();
    });
    
    document.getElementById('analytics-year').addEventListener('change', () => {
        updateAnalyticsView();
        renderCharts();
    });
}

function populateYearSelectOptions() {
    const yearSelect = document.getElementById('analytics-year');
    yearSelect.innerHTML = '';
    
    const years = new Set();
    transactions.forEach(t => {
        const y = new Date(t.date).getFullYear();
        if (!isNaN(y)) years.add(y);
    });

    // Add current year if empty
    if (years.size === 0) {
        years.add(new Date().getFullYear());
    }

    // Sort descending
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    sortedYears.forEach(y => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = `${y} (พ.ศ. ${y + 543})`;
        yearSelect.appendChild(opt);
    });
}

function updateAnalyticsView() {
    const viewMode = document.querySelector('.segment-btn.active').getAttribute('data-mode');
    
    if (viewMode === 'monthly') {
        const monthInput = document.getElementById('analytics-month').value; // YYYY-MM
        if (!monthInput) return;
        
        const [year, monthZeroIndexed] = monthInput.split('-').map(num => parseInt(num));
        const monthIndex = monthZeroIndexed - 1; // Convert 1-12 to 0-11
        
        // Month Names in Thai
        const monthThaiNames = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
            'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        
        document.getElementById('monthly-report-title').textContent = `สรุปผลยอดเงิน ประจำเดือน ${monthThaiNames[monthIndex]} ${year + 543}`;

        // Compute Monthly calculations
        let income = 0;
        let expense = 0;
        const categoryTotals = {};

        transactions.forEach(tx => {
            const txDate = new Date(tx.date);
            if (txDate.getFullYear() === year && txDate.getMonth() === monthIndex) {
                if (tx.type === 'income') {
                    income += tx.amount;
                } else {
                    expense += tx.amount;
                    categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
                }
            }
        });

        const savings = income - expense;
        const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

        // Populate card UI
        document.getElementById('anal-month-income').textContent = formatCurrency(income);
        document.getElementById('anal-month-expense').textContent = formatCurrency(expense);
        
        const savingsEl = document.getElementById('anal-month-savings');
        savingsEl.textContent = formatCurrency(savings);
        if (savings >= 0) {
            savingsEl.className = 'value text-success';
        } else {
            savingsEl.className = 'value text-danger';
        }

        document.getElementById('anal-month-savings-rate').textContent = (savingsRate > 0 ? savingsRate : 0) + '%';
        
        // Target savings rate UI (30% benchmark)
        const progressPercent = Math.min(100, Math.max(0, Math.round((savingsRate / 30) * 100)));
        document.getElementById('savings-progress-percent').textContent = `${savingsRate > 0 ? savingsRate : 0}% / 30%`;
        document.getElementById('savings-progress-bar').style.width = `${progressPercent}%`;

        // Render detailed Category Progress list on Analytics page
        const catListContainer = document.getElementById('monthly-category-list');
        const catEmptyState = document.getElementById('monthly-cat-empty');
        catListContainer.innerHTML = '';

        const expCategoryKeys = Object.keys(categoryTotals);
        if (expCategoryKeys.length === 0) {
            catEmptyState.classList.remove('hide');
        } else {
            catEmptyState.classList.add('hide');
            
            // Sort categories by cost descending
            const sortedCats = expCategoryKeys.sort((a, b) => categoryTotals[b] - categoryTotals[a]);
            
            sortedCats.forEach(catKey => {
                const totalAmt = categoryTotals[catKey];
                const percent = expense > 0 ? Math.round((totalAmt / expense) * 100) : 0;
                const catInfo = CATEGORY_MAP[catKey] || { name: catKey, color: '#94a3b8' };

                const item = document.createElement('div');
                item.className = 'category-progress-item';
                item.innerHTML = `
                    <div class="cat-progress-details">
                        <div class="cat-name-box">
                            <span class="cat-dot" style="background:${catInfo.color}"></span>
                            <span>${catInfo.name}</span>
                        </div>
                        <div class="cat-val-group">
                            <span class="cat-percentage">${percent}%</span>
                            <span class="cat-amount">${formatCurrency(totalAmt)}</span>
                        </div>
                    </div>
                    <div class="cat-progress-bar-bg">
                        <div class="cat-progress-bar-fill" style="width:${percent}%; background:${catInfo.color}"></div>
                    </div>
                `;
                catListContainer.appendChild(item);
            });
        }

    } else {
        // Yearly values computation
        const yearVal = parseInt(document.getElementById('analytics-year').value);
        if (isNaN(yearVal)) return;

        document.getElementById('yearly-report-title-text').textContent = `รายงานผลเปรียบเทียบรายรับ-รายจ่าย ประจำปี พ.ศ. ${yearVal + 543}`;

        let yearlyIncome = 0;
        let yearlyExpense = 0;
        const activeMonths = new Set();

        transactions.forEach(t => {
            const d = new Date(t.date);
            if (d.getFullYear() === yearVal) {
                activeMonths.add(d.getMonth());
                if (t.type === 'income') {
                    yearlyIncome += t.amount;
                } else {
                    yearlyExpense += t.amount;
                }
            }
        });

        const yearlySavings = yearlyIncome - yearlyExpense;
        const dividerMonths = activeMonths.size > 0 ? activeMonths.size : 1;
        const avgMonthlyExpense = yearlyExpense / dividerMonths;

        // Populate yearly indicators
        document.getElementById('anal-year-income').textContent = formatCurrency(yearlyIncome);
        document.getElementById('anal-year-expense').textContent = formatCurrency(yearlyExpense);
        
        const ySavingsEl = document.getElementById('anal-year-savings');
        ySavingsEl.textContent = formatCurrency(yearlySavings);
        if (yearlySavings >= 0) {
            ySavingsEl.className = 'value text-success';
        } else {
            ySavingsEl.className = 'value text-danger';
        }

        document.getElementById('anal-year-avg-expense').textContent = formatCurrency(avgMonthlyExpense);
    }
}

// 13. Smart AI Heuristics Engine
function updateAIQuickSummary() {
    const aiWidgetText = document.getElementById('ai-quick-insight');
    if (!aiWidgetText) return;

    if (transactions.length === 0) {
        aiWidgetText.textContent = 'ยินดีต้อนรับค่ะ! เพิ่มข้อมูลรายรับหรือรายจ่ายตัวแรก เพื่อเปิดให้ระบบ AI คอยให้คำแนะนำของคุณได้ทันทีนะคะ';
        return;
    }

    // Analyze current month data
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let inc = 0;
    let exp = 0;
    const catExpenses = {};

    transactions.forEach(t => {
        const d = new Date(t.date);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            if (t.type === 'income') {
                inc += t.amount;
            } else {
                exp += t.amount;
                catExpenses[t.category] = (catExpenses[t.category] || 0) + t.amount;
            }
        }
    });

    if (inc === 0 && exp === 0) {
        aiWidgetText.textContent = 'ไม่พบธุรกรรมในเดือนนี้เลยค่ะ เพื่อความแม่นยำ ลองเพิ่มข้อมูลเงินเดือน หรือค่าข้าววันนี้หน่อยนะคะ';
        return;
    }

    // Analytics heuristics
    let insightText = '';
    const savings = inc - exp;
    const rate = inc > 0 ? (savings / inc) * 100 : 0;

    // Pick top expense category
    let topCat = '';
    let topVal = 0;
    Object.keys(catExpenses).forEach(k => {
        if (catExpenses[k] > topVal) {
            topVal = catExpenses[k];
            topCat = k;
        }
    });

    if (savings < 0) {
        insightText = `เดือนนี้รายจ่ายล้นแล้วค่ะ! ติดลบอยู่ ${formatCurrency(Math.abs(savings))} แนะระงับซื้อหมวด ${CATEGORY_MAP[topCat]?.name || ''} ก่อนอันดับแรกนะคะ`;
    } else if (rate < 10) {
        insightText = `ออมเงินได้ค่อนข้างบางเบา (แค่ ${Math.round(rate)}%) ค่าใช้จ่ายส่วนใหญ่หมดไปกับ ${CATEGORY_MAP[topCat]?.name || 'ทั่วไป'} พยายามใช้กฎออมเงินก่อนใช้ 20% นะคะ`;
    } else if (rate >= 30) {
        insightText = `ยอดเยี่ยมมากค่ะ! คุณออมเงินสูงถึง ${Math.round(rate)}% ทะลุเป้าหมายมาตรฐานแล้ว แนะนำแบ่งบางส่วนไปเริ่มลงทุนในกองทุนดัชนี หรือหุ้นปันผลค่ะ`;
    } else {
        insightText = `การเงินอยู่ในระดับสมดุลดีค่ะ มีเงินเก็บออมสะสมแล้ว ${Math.round(rate)}% สำหรับหมวดที่ใช้มากสุดคือ ${CATEGORY_MAP[topCat]?.name || 'ทั่วไป'} (${formatCurrency(topVal)})`;
    }

    aiWidgetText.textContent = insightText;
}

function renderAIAdvisorView() {
    const list = document.getElementById('ai-insights-list');
    list.innerHTML = '';

    if (transactions.length === 0) {
        list.innerHTML = `
            <div class="glass-card insight-card info">
                <div class="insight-icon-container"><i data-lucide="info"></i></div>
                <div class="insight-text-box">
                    <h5>ยังไม่มีประวัติวิเคราะห์</h5>
                    <p>ป้อนข้อมูลทำธุรกรรมของคุณในหน้า 'บันทึกรายการ' ก่อน เพื่อที่ AI น้องถุงเงิน จะได้วิเคราะห์พฤติกรรมได้อย่างครบถ้วนค่ะ</p>
                </div>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    // Computations
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let inc = 0;
    let exp = 0;
    const catTotals = {};

    transactions.forEach(t => {
        const d = new Date(t.date);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            if (t.type === 'income') {
                inc += t.amount;
            } else {
                exp += t.amount;
                catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
            }
        }
    });

    const savings = inc - exp;
    const savingRate = inc > 0 ? (savings / inc) * 100 : 0;

    // Build Insights
    const insights = [];

    // INSIGHT 1: General Health
    if (savings < 0) {
        insights.push({
            type: 'warning',
            icon: 'alert-triangle',
            title: 'สัญญาณอันตราย: เงินติดลบ',
            desc: `เดือนนี้รายจ่ายสูงกว่ารายรับอยู่ ${formatCurrency(Math.abs(savings))} ซึ่งอาจทำให้ต้องดึงเงินเย็นออกมาใช้ หากทำได้ควรระงับรายจ่ายไม่จำเป็นเพื่อรักษาสภาพคล่องโดยด่วน`
        });
    } else if (savingRate >= 30) {
        insights.push({
            type: 'success',
            icon: 'check-circle-2',
            title: 'พฤติกรรมยอดเยี่ยม: อัตราออมเงินสูง',
            desc: `อัตราเงินออมสะสมเดือนนี้อยู่ที่ ${Math.round(savingRate)}% สูงกว่าเกณฑ์ทั่วไป คุณบริหารเงินได้ดีมาก แนะนำแบ่งเงินออมส่วนเกินเป็นเงินฉุกเฉิน 6 เท่าของค่าใช้จ่ายรายเดือน`
        });
    } else {
        insights.push({
            type: 'info',
            icon: 'activity',
            title: 'การเงินสุขภาพปานกลาง',
            desc: `คุณเก็บออมได้ ${Math.round(savingRate)}% ในเดือนนี้ พยายามลดค่าช้อปปิ้งหรือหมวดบันเทิงอีกนิดเพื่อให้ถึงเป้า 20-30% ตามสูตรมาตรฐานสากลค่ะ`
        });
    }

    // INSIGHT 2: Top Expense Category Check
    let topCatKey = '';
    let topCatVal = 0;
    Object.keys(catTotals).forEach(k => {
        if (catTotals[k] > topCatVal) {
            topCatVal = catTotals[k];
            topCatKey = k;
        }
    });

    if (topCatVal > 0) {
        const percentOfExp = exp > 0 ? Math.round((topCatVal / exp) * 100) : 0;
        const catName = CATEGORY_MAP[topCatKey]?.name || topCatKey;

        if ((topCatKey === 'shopping' || topCatKey === 'entertainment') && percentOfExp > 25) {
            insights.push({
                type: 'warning',
                icon: 'shopping-cart',
                title: `ใช้จ่ายกับหมวดฟุ่มเฟือยสูงเกินไป`,
                desc: `ยอดใช้เงินหมวด ${catName} คิดเป็นสัดส่วนถึง ${percentOfExp}% ของรายจ่ายทั้งหมด (${formatCurrency(topCatVal)}) ควรลดการซื้อตามอารมณ์ชั่ววูบลงบ้าง`
            });
        } else {
            insights.push({
                type: 'info',
                icon: 'pie-chart',
                title: `สัดส่วนการจ่ายหนักสุด`,
                desc: `คุณจ่ายเงินหนักที่สุดกับหมวด ${catName} เป็นมูลค่ารวม ${formatCurrency(topCatVal)} (${percentOfExp}% ของรายจ่ายทั้งหมด)`
            });
        }
    }

    // INSIGHT 3: Saving / Investment check
    const investAmt = catTotals['investment_exp'] || 0;
    if (investAmt > 0) {
        insights.push({
            type: 'success',
            icon: 'trending-up',
            title: 'การวางรากฐานอนาคต',
            desc: `เดือนนี้คุณได้นำเงินเข้าลงทุน/เงินออมระยะยาวแล้ว ${formatCurrency(investAmt)} เพื่อสร้างเกราะความมั่งคั่ง ดำเนินการออมอัตโนมัติเช่นนี้ต่อเนื่องทุกเดือนนะคะ!`
        });
    } else {
        insights.push({
            type: 'info',
            icon: 'shield-alert',
            title: 'คำแนะนำ: เพิ่มพอร์ตการออม',
            desc: `ยังไม่พบรายการเก็บออมเงินลงทุนในเดือนนี้เลย ลองแบ่งโอนฝากประจำแบบปลอดภาษี หรือลงทุนในกองทุนตลาดเงินแบบตัดยอดอัตโนมัติ 10% ดูสิคะ`
        });
    }

    // Render cards
    insights.forEach(ins => {
        const card = document.createElement('div');
        card.className = `glass-card insight-card ${ins.type}`;
        card.innerHTML = `
            <div class="insight-icon-container"><i data-lucide="${ins.icon}"></i></div>
            <div class="insight-text-box">
                <h5>${ins.title}</h5>
                <p>${ins.desc}</p>
            </div>
        `;
        list.appendChild(card);
    });

    lucide.createIcons();
}

// 14. Interactive AI Chat Interface
function setupAIChat() {
    const chatForm = document.getElementById('chat-input-form');
    const chatInput = document.getElementById('chat-input');
    const quickQueries = document.querySelectorAll('.quick-query-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const queryText = chatInput.value.trim();
        if (!queryText) return;

        processChatQuery(queryText);
        chatInput.value = '';
    });

    quickQueries.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-query');
            let text = '';
            switch (type) {
                case 'summary': text = 'วิเคราะห์ภาพรวมการเงินของฉันในเดือนนี้'; break;
                case 'waste': text = 'ฉันกำลังหมดเงินไปกับหมวดอะไรเยอะที่สุด? มีจุดสิ้นเปลืองไหม'; break;
                case 'tips': text = 'ขอเคล็ดลับและวิธีเพิ่มยอดออมเงินเก็บสะสมหน่อย'; break;
                case 'budget': text = 'สัดส่วนทางการเงินของฉันเทียบกับเป้าหมายสูตร 50/30/20 เป็นอย่างไร'; break;
            }
            processChatQuery(text);
        });
    });

    clearChatBtn.addEventListener('click', () => {
        const messagesArea = document.getElementById('chat-messages');
        messagesArea.innerHTML = `
            <div class="message ai-msg">
                <div class="msg-avatar">🤖</div>
                <div class="msg-content">
                    <p>ล้างหน้าแชทเรียบร้อยแล้วค่ะ! มีหัวข้อการเงินอื่นใดที่ต้องการวิเคราะห์เพิ่มเติมอีกไหมคะ?</p>
                </div>
            </div>
        `;
    });
}

function processChatQuery(text) {
    appendChatMessage('user', text);
    
    // Show bot typing simulation
    const chatArea = document.getElementById('chat-messages');
    const typingMsg = document.createElement('div');
    typingMsg.className = 'message ai-msg typing-msg';
    typingMsg.innerHTML = `
        <div class="msg-avatar">🤖</div>
        <div class="msg-content">
            <p style="color:var(--text-muted)">กำลังคิดประมวลผลการเงิน...</p>
        </div>
    `;
    chatArea.appendChild(typingMsg);
    chatArea.scrollTop = chatArea.scrollHeight;

    // Generate response with brief delay to feel realistic
    setTimeout(() => {
        typingMsg.remove();
        const responseHTML = getAIAdvisorResponse(text);
        appendChatMessage('ai', responseHTML);
    }, 800);
}

function appendChatMessage(sender, htmlContent) {
    const chatArea = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = sender === 'user' ? 'message user-msg' : 'message ai-msg';
    
    const avatar = sender === 'user' ? '👤' : '🤖';
    msg.innerHTML = `
        <div class="msg-avatar">${avatar}</div>
        <div class="msg-content">
            ${htmlContent.startsWith('<') ? htmlContent : `<p>${htmlContent}</p>`}
        </div>
    `;
    
    chatArea.appendChild(msg);
    chatArea.scrollTop = chatArea.scrollHeight;
}

// AI Dialogue Logic based on User Transaction Statistics
function getAIAdvisorResponse(query) {
    const textNorm = query.toLowerCase();

    // Calculate current stats for the dialogue
    const today = new Date();
    const curMonth = today.getMonth();
    const curYear = today.getFullYear();
    
    let monthInc = 0;
    let monthExp = 0;
    const categoryTotals = {};

    transactions.forEach(t => {
        const d = new Date(t.date);
        if (d.getMonth() === curMonth && d.getFullYear() === curYear) {
            if (t.type === 'income') {
                monthInc += t.amount;
            } else {
                monthExp += t.amount;
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
            }
        }
    });

    const netSavings = monthInc - monthExp;
    const savingRate = monthInc > 0 ? Math.round((netSavings / monthInc) * 100) : 0;

    // Pick top category
    let topCat = 'ไม่มีข้อมูล';
    let topAmt = 0;
    Object.keys(categoryTotals).forEach(k => {
        if (categoryTotals[k] > topAmt) {
            topAmt = categoryTotals[k];
            topCat = CATEGORY_MAP[k]?.name || k;
        }
    });

    // Match Keywords and construct responses
    if (textNorm.includes('ภาพรวม') || textNorm.includes('summary')) {
        if (transactions.length === 0) {
            return `ภาพรวมตอนนี้ยังว่างเปล่าค่ะ แนะนำให้เริ่มกดปุ่ม 'บันทึกรายการ' ด้านล่างเพื่อส่งข้อมูลให้ถุงเงินวิเคราะห์นะคะ`;
        }
        return `
            <strong>สรุปวิเคราะห์การเงินเดือนนี้:</strong><br>
            • ยอดรายรับสะสม: ${formatCurrency(monthInc)}<br>
            • ยอดรายจ่ายสะสม: ${formatCurrency(monthExp)}<br>
            • เงินเก็บออมสุทธิ: <span class="${netSavings >= 0 ? 'text-success' : 'text-danger'}">${formatCurrency(netSavings)}</span> (สัดส่วน ${savingRate}%)<br>
            • หมวดที่จ่ายหนักที่สุด: <strong>${topCat}</strong> (${formatCurrency(topAmt)})<br><br>
            <em>คำแนะนำ:</em> ${netSavings < 0 
                ? 'เดือนนี้ใช้เงินเกินตัวแล้วนะคะ ควรจัดสรรการกินอยู่อย่างประหยัด และงดกดสั่งสินค้าในแอปช้อปปิ้งออนไลน์ช่วงสัปดาห์นี้ค่ะ' 
                : 'ทำได้ยอดเยี่ยมแล้วค่ะ! เงินเก็บออมแนะนำจัดสรรเข้า บัญชีฝากประจำ หรือแบ่งไปลงทุนบางส่วนเพื่อสู้เงินเฟ้อนะคะ'}
        `;
    }

    if (textNorm.includes('สิ้นเปลือง') || textNorm.includes('waste') || textNorm.includes('จ่ายเยอะ')) {
        if (topAmt === 0) {
            return `ยังไม่พบข้อมูลรายจ่ายสำหรับวิเคราะห์จุดสิ้นเปลืองในระบบเลยค่ะ`;
        }
        return `
            จากการคำนวณ รายจ่ายสะสมที่มากที่สุดในขณะนี้คือหมวด <strong>"${topCat}"</strong> อยู่ที่ ${formatCurrency(topAmt)} คิดเป็น ${monthExp > 0 ? Math.round((topAmt / monthExp) * 100) : 0}% ของค่าใช้จ่ายทั้งหมดในเดือนนี้ค่ะ<br><br>
            💡 <u>เทคนิคลดค่าใช้จ่ายหมวดนี้:</u><br>
            • ${topCat.includes('อาหาร') ? 'ลดการทานอาหารนอกบ้านหรือกดสั่ง Delivery เปลี่ยนเป็นพกข้าวกล่องไปทานที่ทำงานสัปดาห์ละ 2 วัน' : ''}
            • ${topCat.includes('ช้อปปิ้ง') ? 'ใช้กฎชะลอการซื้อ 48 ชั่วโมง! ก่อนกดสั่งของที่อยากได้ ให้ใส่ตะกร้าไว้แล้วกลับมาดูอีกสองวัน จะช่วยลดอารมณ์อยากลงได้เยอะเลยค่ะ' : ''}
            • ${topCat.includes('บันเทิง') ? 'ปรับงบประมาณบันเทิงให้เป็นรายสัปดาห์ หากงบสัปดาห์นี้หมดแล้ว ให้เปลี่ยนกิจกรรมเป็นหาความรู้ฟรีหรืออ่านหนังสืออยู่บ้านแทนนะคะ' : ''}
            • ${topCat.includes('การเดินทาง') ? 'ลองเปลี่ยนมาใช้บริการรถสาธารณะ หรือแชร์รถคันเดียวกันไปทำงานเพื่อลดค่าเติมน้ำมัน' : 'พยายามตั้งงบประมาณกำกับไว้ และตัดยอดเงินเก็บก่อนใช้ทุกครั้งนะคะ'}
        `;
    }

    if (textNorm.includes('เคล็ดลับ') || textNorm.includes('tips') || textNorm.includes('เงินเก็บ') || textNorm.includes('ออม')) {
        return `
            <strong>💡 เคล็ดลับเพิ่มเงินเก็บฉบับ AI น้องถุงเงิน:</strong><br><br>
            1. <strong>สูตร "จ่ายให้ตัวเองก่อน" (Pay Yourself First):</strong> ทันทีที่เงินเดือนออก ให้โอนเงิน 10-20% แยกไปบัญชีเงินเก็บที่เข้าถึงยากทันที ห้ามเก็บเงินที่เหลือจากการใช้จ่าย เพราะมันมักจะไม่เหลือค่ะ<br>
            2. <strong>ทริก "โอนเงินท้าทายตนเอง" (Savings Challenge):</strong> ตั้งเป้าออมเหรียญ หรือเก็บตามปฏิทิน เช่น เก็บวันละ 50 บาท ทุกวันสิ้นเดือนจะมีเงินงอกเงยเพิ่มเติมสะสมถึง 1,500 บาทต่อเดือนเลยนะคะ<br>
            3. <strong>หลีกเลี่ยงกับดักไลฟ์สไตล์ (Lifestyle Inflation):</strong> เมื่อมีรายได้เพิ่ม อย่าเพิ่งอัปเกรดมือถือ เสื้อผ้า หรือของใช้อื่นทันที ให้คงค่าครองชีพเดิมไว้ แล้วนำเงินส่วนต่างไปเพิ่มเงินเก็บแทนค่ะ
        `;
    }

    if (textNorm.includes('50/30/20') || textNorm.includes('budget') || textNorm.includes('สัดส่วน')) {
        if (monthInc === 0) {
            return `กรุณากรอกรายรับในเดือนนี้เพื่อให้ระบบสามารถคำนวณแบ่งสัดส่วน 50/30/20 ได้ค่ะ`;
        }

        // 50% Needs (Food, Transport, Utilities, Health, Other_exp as fallback)
        const needs = (categoryTotals['food'] || 0) + (categoryTotals['transport'] || 0) + (categoryTotals['utilities'] || 0) + (categoryTotals['health'] || 0);
        // 30% Wants (Shopping, Entertainment, Other_exp)
        const wants = (categoryTotals['shopping'] || 0) + (categoryTotals['entertainment'] || 0) + (categoryTotals['other_exp'] || 0);
        // 20% Savings (Investment_exp)
        const savingsActual = (categoryTotals['investment_exp'] || 0) + (monthInc - monthExp > 0 ? (monthInc - monthExp - (categoryTotals['investment_exp'] || 0)) : 0);

        const needsPct = Math.round((needs / monthInc) * 100);
        const wantsPct = Math.round((wants / monthInc) * 100);
        const savingsPct = Math.round((savingsActual / monthInc) * 100);

        return `
            <strong>📊 ผลการวัดสัดส่วนการเงิน 50/30/20 ของคุณ:</strong><br><br>
            • <strong>สิ่งจำเป็น (Needs - เป้าหมาย 50%):</strong> คุณใช้ไป ${needsPct}% (${formatCurrency(needs)})<br>
            • <strong>สิ่งต้องการ (Wants - เป้าหมาย 30%):</strong> คุณใช้ไป ${wantsPct}% (${formatCurrency(wants)})<br>
            • <strong>เงินออม/หนี้สิน (Savings - เป้าหมาย 20%):</strong> คุณทำได้ ${savingsPct}% (${formatCurrency(savingsActual)})<br><br>
            <u>บทวิเคราะห์จาก AI:</u><br>
            ${needsPct > 55 ? '⚠️ ค่าใช้จ่ายจำเป็นค่อนข้างตึงตัวเกิน 50% แล้ว ลองประหยัดค่าน้ำค่าไฟ หรือลดค่าอาหารนอกบ้านหรูลงมาดูนะคะ' : '✅ หมวดสิ่งจำเป็นมีการควบคุมได้อย่างยอดเยี่ยม ไม่เกิน 50%'}<br>
            ${wantsPct > 35 ? '⚠️ ของฟุ่มเฟือยและช้อปปิ้งสูงเกิน 30% แนะนำให้เริ่มควบคุมงบช้อปปิ้งอย่างเคร่งครัดค่ะ' : '✅ ควบคุมอารมณ์ความต้องการในของฟุ่มเฟือยได้อยู่ในมาตรฐานค่ะ'}
        `;
    }

    if (textNorm.includes('ลงทุน') || textNorm.includes('หุ้น') || textNorm.includes('กองทุน')) {
        return `
            💰 <strong>คำแนะนำเบื้องต้นสำหรับการเริ่มลงทุน:</strong><br><br>
            1. <strong>สร้างเงินสำรองฉุกเฉินก่อน:</strong> ควรมีเงินเก็บนอนนิ่งๆ ในบัญชีออมทรัพย์ดอกเบี้ยสูง (เช่น Kept/Dime) ประมาณ 3-6 เท่าของค่าใช้จ่ายรายเดือน ห้ามนำเงินฉุกเฉินนี้ไปลงทุนเสี่ยงเด็ดขาดนะคะ<br>
            2. <strong>ผู้เริ่มต้นความเสี่ยงต่ำ:</strong> แนะนำเริ่มจากกองทุนรวมตลาดเงิน หรือกองทุนตราสารหนี้ หรือ สลากออมทรัพย์ ซึ่งมีความผันผวนต่ำมากและได้ดอกเบี้ยดีกว่าฝากทั่วไป<br>
            3. <strong>สร้างเงินออมเติบโตยาวๆ:</strong> แนะนำ DCA (Dollar Cost Averaging) ในกองทุนรวมดัชนี (เช่น ดัชนีหุ้นไทย SET50 หรือดัชนีสหรัฐฯ S&P500) เดือนละเท่าๆ กัน เพื่อสร้างเงินเก็บวัยเกษียณโดยไม่ต้องเฝ้าหน้าจอตลอดเวลาค่ะ
        `;
    }

    // Default Fallback matching simple greetings or general queries
    return `
        ได้รับข้อความแล้วค่ะ! ขออภัยเนื่องจากฉันเป็นระบบประมวลผลการเงินอัจฉริยะแบบฝังตัว (Local AI) บนบราวเซอร์ จึงเข้าใจคีย์เวิร์ดเฉพาะทางได้เป็นหลักค่ะ<br><br>
        <strong>คุณสามารถพิมพ์ถามคำถามเหล่านี้ได้เลย:</strong><br>
        • "ภาพรวมรายรับรายจ่าย"<br>
        • "ใช้จ่ายหมดไปกับอะไรเยอะที่สุด"<br>
        • "ขอเคล็ดลับออมเงินหน่อย"<br>
        • "วิเคราะห์สัดส่วน 50/30/20"<br>
        • "มีคำแนะนำด้านการลงทุนไหม"
    `;
}

// 15. Toast Notifications
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');

    toastMessage.textContent = message;
    
    // Toggle Toast Styling Class
    if (type === 'error') {
        toast.classList.add('toast-error');
        toastIcon.setAttribute('data-lucide', 'alert-circle');
    } else {
        toast.classList.remove('toast-error');
        toastIcon.setAttribute('data-lucide', 'check-circle');
    }

    lucide.createIcons();

    // Show toast
    toast.classList.remove('hide');

    // Auto-hide after 3.5 seconds
    setTimeout(() => {
        toast.classList.add('hide');
    }, 3500);
}

// =============================================================
// 16. Google Sheets Sync API Core
// =============================================================
function updateSyncStatus(status) {
    const badge = document.getElementById('sync-status-badge');
    if (!badge) return;

    badge.className = 'sync-status';
    const text = badge.querySelector('.status-text');
    
    syncStatus = status;

    if (status === 'online') {
        badge.classList.add('online');
        text.textContent = 'เชื่อมต่อแล้ว';
        badge.setAttribute('title', 'เชื่อมต่อกับ Google Sheets แล้ว');
    } else if (status === 'syncing') {
        badge.classList.add('syncing');
        text.textContent = 'กำลังซิงก์...';
        badge.setAttribute('title', 'กำลังซิงก์ข้อมูลกับ Google Sheets...');
    } else {
        badge.classList.add('offline');
        text.textContent = 'ออฟไลน์';
        badge.setAttribute('title', 'ไม่ได้เชื่อมต่อ Google Sheets หรือออฟไลน์อยู่');
    }
}

async function pullFromGoogleSheet(isManual = false) {
    if (!googleSheetUrl) {
        updateSyncStatus('offline');
        return;
    }

    updateSyncStatus('syncing');

    try {
        const url = `${googleSheetUrl}?action=getAll&_t=${Date.now()}`;
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result && result.success) {
            // Update state variables and normalize transaction keys to lowercase
            const rawTransactions = result.transactions || [];
            transactions = rawTransactions.map(tx => {
                const normalized = {};
                Object.keys(tx).forEach(key => {
                    normalized[key.toLowerCase()] = tx[key];
                });
                if (normalized.amount) normalized.amount = parseFloat(normalized.amount) || 0;
                return normalized;
            });

            // Normalize lending keys to lowercase
            const rawLending = result.lending || [];
            lending = rawLending.map(l => {
                const normalized = {};
                Object.keys(l).forEach(key => {
                    normalized[key.toLowerCase()] = l[key];
                });
                if (normalized.amount) normalized.amount = parseFloat(normalized.amount) || 0;
                return normalized;
            });

            startingCash = parseFloat(result.startingCash) || 0;
            startingBank = parseFloat(result.startingBank) || 0;
            
            if (result.currentCurrency) {
                currentCurrency = result.currentCurrency;
                const selector = document.getElementById('currency-selector');
                if (selector) selector.value = currentCurrency;
                localStorage.setItem('wealthy_ai_currency', currentCurrency);
            }

            // Sort descending
            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            saveData();
            updateUI();
            updateSyncStatus('online');

            if (isManual) {
                showToast('ดึงข้อมูลจาก Google Sheets สำเร็จแล้วค่ะ!');
            }
        } else {
            throw new Error(result.message || 'Unknown error from server');
        }
    } catch (error) {
        console.error('Error pulling from Google Sheet:', error);
        updateSyncStatus('offline');
        if (isManual) {
            showToast('ไม่สามารถดึงข้อมูลได้ กรุณาตรวจสอบ URL หรืออินเทอร์เน็ต', 'error');
        }
    }
}

async function pushToGoogleSheet(action, payload, isManual = false) {
    if (!googleSheetUrl) {
        updateSyncStatus('offline');
        return;
    }

    updateSyncStatus('syncing');

    try {
        const bodyData = {
            action: action,
            transactions: payload.transactions,
            lending: payload.lending || lending, // V2
            startingCash: payload.startingCash,
            startingBank: payload.startingBank,
            currentCurrency: payload.currentCurrency || currentCurrency
        };

        const response = await fetch(googleSheetUrl, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(bodyData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result && result.success) {
            updateSyncStatus('online');
            if (isManual) {
                showToast('ส่งข้อมูลไป Google Sheets สำเร็จแล้วค่ะ!');
            }
        } else {
            throw new Error(result.message || 'Unknown error from server');
        }
    } catch (error) {
        console.error('Error pushing to Google Sheet:', error);
        updateSyncStatus('offline');
        if (isManual) {
            showToast('ไม่สามารถส่งข้อมูลได้ กรุณาตรวจสอบ URL หรืออินเทอร์เน็ต', 'error');
        }
    }
}

// =============================================================
// V2 Lending Tracker Logic & Helpers
// =============================================================

function setupLending() {
    const form = document.getElementById('lending-add-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const borrower = document.getElementById('lending-borrower').value.trim();
        const amount = parseFloat(document.getElementById('lending-amount').value);
        const wallet = document.getElementById('lending-wallet').value;
        const lentDate = document.getElementById('lending-date').value;
        const dueDate = document.getElementById('lending-due-date').value;
        const note = document.getElementById('lending-desc').value.trim();
        
        addLendingRecord(borrower, amount, wallet, lentDate, dueDate, note, tempLendingImage);
        
        form.reset();
        
        // Reset defaults
        const todayStr = getTodayDateString();
        document.getElementById('lending-date').value = todayStr;
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        document.getElementById('lending-due-date').value = `${year}-${month}-${day}`;
        
        showToast(`บันทึกการยืมเงินของ ${borrower} สำเร็จแล้ว!`);
    });

    const searchInput = document.getElementById('lending-search-input');
    const statusFilter = document.getElementById('lending-filter-status');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => renderLendingView());
        statusFilter.addEventListener('change', () => renderLendingView());
    }
}

function addLendingRecord(borrower, amount, wallet, lentDate, dueDate, note, imageUrl = null) {
    const newLend = {
        id: 'lend-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        borrower,
        amount,
        wallet,
        lentDate,
        dueDate,
        note,
        status: 'lent', // 'lent' or 'returned'
        returnedDate: null,
        imageUrl: imageUrl
    };

    lending.push(newLend);
    // Sort by lent date descending
    lending.sort((a, b) => new Date(b.lentDate) - new Date(a.lentDate));

    // Reset temp image and preview UI
    tempLendingImage = null;
    const previewContainer = document.getElementById('lending-image-preview-container');
    const uploadZone = document.getElementById('lending-upload-zone');
    if (previewContainer) {
        previewContainer.classList.add('hide');
        uploadZone.classList.remove('hide');
        document.getElementById('lending-image-preview').src = '';
        document.getElementById('lending-image-input').value = '';
    }

    saveData();
    updateUI();

    if (googleSheetUrl) {
        pushToGoogleSheet('saveAll', { transactions, lending, startingCash, startingBank });
    }
}

function toggleLendingStatus(id) {
    const record = lending.find(l => l.id === id);
    if (!record) return;

    if (record.status === 'lent') {
        record.status = 'returned';
        record.returnedDate = getTodayDateString();
        showToast(`คืนเงินจาก ${record.borrower} เรียบร้อยแล้ว!`);
    } else {
        record.status = 'lent';
        record.returnedDate = null;
        showToast(`เปลี่ยนสถานะเป็นค้างชำระของ ${record.borrower} แล้ว`);
    }

    saveData();
    updateUI();

    if (googleSheetUrl) {
        pushToGoogleSheet('saveAll', { transactions, lending, startingCash, startingBank });
    }
}

function deleteLendingRecord(id) {
    const record = lending.find(l => l.id === id);
    if (!record) return;

    if (confirm(`คุณต้องการลบรายการยืมเงินของ ${record.borrower} ใช่หรือไม่?`)) {
        lending = lending.filter(l => l.id !== id);
        saveData();
        updateUI();
        showToast('ลบประวัติการยืมเงินแล้ว', 'error');

        if (googleSheetUrl) {
            pushToGoogleSheet('saveAll', { transactions, lending, startingCash, startingBank });
        }
    }
}

function updateLendingStats() {
    let totalLent = 0;
    let totalRepaid = 0;
    let activeLoansCount = 0;
    let repaidLoansCount = 0;

    lending.forEach(l => {
        if (l.status === 'lent') {
            totalLent += l.amount;
            activeLoansCount++;
        } else {
            totalRepaid += l.amount;
            repaidLoansCount++;
        }
    });

    const totalLoans = totalLent + totalRepaid;
    const repaymentRate = totalLoans > 0 ? Math.round((totalRepaid / totalLoans) * 100) : 0;

    const totalLentEl = document.getElementById('lending-total-lent');
    if (totalLentEl) {
        totalLentEl.textContent = formatCurrency(totalLent);
        document.getElementById('lending-active-count').textContent = `รอกระตุ้นการคืนเงิน ${activeLoansCount} รายการ`;
        
        document.getElementById('lending-total-repaid').textContent = formatCurrency(totalRepaid);
        document.getElementById('lending-repaid-count').textContent = `ชำระคืนเสร็จสิ้น ${repaidLoansCount} รายการ`;
        
        document.getElementById('lending-repayment-rate').textContent = `${repaymentRate}%`;
        document.getElementById('lending-repayment-progress').style.width = `${repaymentRate}%`;
    }
}

function renderLendingView() {
    const list = document.getElementById('lending-list');
    const emptyState = document.getElementById('lending-empty-state');
    if (!list) return;

    list.innerHTML = '';

    const queryInput = document.getElementById('lending-search-input');
    const query = queryInput ? queryInput.value.toLowerCase().trim() : '';
    const statusSelect = document.getElementById('lending-filter-status');
    const status = statusSelect ? statusSelect.value : 'all';

    const filtered = lending.filter(l => {
        const matchSearch = l.borrower.toLowerCase().includes(query) || (l.note || '').toLowerCase().includes(query);
        const matchStatus = status === 'all' || l.status === status;
        return matchSearch && matchStatus;
    });

    if (filtered.length === 0) {
        emptyState.classList.remove('hide');
        return;
    } else {
        emptyState.classList.add('hide');
    }

    filtered.forEach(l => {
        const card = document.createElement('div');
        const isReturned = l.status === 'returned';
        card.className = `lending-card ${isReturned ? 'is-returned' : ''}`;

        const badgeHtml = isReturned 
            ? `<span class="lending-status-badge returned"><i data-lucide="check-circle-2" style="width:12px;height:12px"></i> คืนเงินแล้ว</span>`
            : `<span class="lending-status-badge lent"><i data-lucide="clock" style="width:12px;height:12px"></i> ยังไม่คืน</span>`;

        const actionBtnHtml = isReturned
            ? `<button class="btn-pay" style="background:rgba(255,255,255,0.05);color:var(--text-secondary);border:1px solid var(--card-border);" onclick="toggleLendingStatus('${l.id}')"><i data-lucide="rotate-ccw" style="width:12px;height:12px"></i> แก้เป็นยังไม่คืน</button>`
            : `<button class="btn-pay" onclick="toggleLendingStatus('${l.id}')"><i data-lucide="check-circle" style="width:12px;height:12px"></i> ได้รับเงินคืนแล้ว</button>`;

        const imageBtnHtml = l.imageUrl
            ? `<button class="btn-view-image" onclick="openImageViewer('${l.imageUrl}')" title="ดูเอกสาร/สลิป"><i data-lucide="image" style="width:12px;height:12px"></i></button>`
            : '';

        const walletText = l.wallet === 'cash' ? '💵 เงินสด' : '🏦 บัญชี';

        // Format dates
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        const lentDateFmt = new Date(l.lentDate).toLocaleDateString('th-TH', options);
        const dueDateFmt = new Date(l.dueDate).toLocaleDateString('th-TH', options);

        card.innerHTML = `
            <div class="lending-card-header">
                <div class="lending-borrower-info">
                    <h4>${l.borrower}</h4>
                    <span>ยืมเงินวันที่: ${lentDateFmt}</span>
                </div>
                <div class="lending-amount-display">
                    <div class="amount">${formatCurrency(l.amount)}</div>
                    <span class="wallet-badge">${walletText}</span>
                </div>
            </div>
            <div class="lending-card-details">
                <div class="lending-detail-item">
                    <i data-lucide="calendar-range" style="width:12px;height:12px"></i>
                    <span>กำหนดคืน: ${dueDateFmt}</span>
                </div>
                <div class="lending-detail-item">
                    <i data-lucide="scroll" style="width:12px;height:12px"></i>
                    <span>บันทึก: ${l.note || '-'}</span>
                </div>
            </div>
            <div class="lending-card-footer">
                ${badgeHtml}
                <div class="lending-card-actions">
                    ${imageBtnHtml}
                    ${actionBtnHtml}
                    <button class="btn-delete-lend" onclick="deleteLendingRecord('${l.id}')"><i data-lucide="trash-2" style="width:12px;height:12px"></i></button>
                </div>
            </div>
        `;
        list.appendChild(card);
    });

    lucide.createIcons();
}

// Global functions for inline HTML event onclicks
window.toggleLendingStatus = toggleLendingStatus;
window.deleteLendingRecord = deleteLendingRecord;

// =============================================================
// Image Viewer Modal Lightbox
// =============================================================
function setupImageViewer() {
    const modal = document.getElementById('image-viewer-modal');
    const closeBtn = document.getElementById('close-image-viewer-btn');
    if (!modal) return;

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hide');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hide');
        }
    });
}

function openImageViewer(url) {
    const modal = document.getElementById('image-viewer-modal');
    const img = document.getElementById('viewer-modal-img');
    if (!modal || !img) return;

    img.src = url;
    modal.classList.remove('hide');
}

window.openImageViewer = openImageViewer;

// =============================================================
// Canvas Compression & Image OCR Engine (Tesseract.js)
// =============================================================
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const maxDimension = 800; // max width/height to keep size small
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxDimension) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                }
            } else {
                if (height > maxDimension) {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG with 0.7 quality
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            callback(compressedBase64);
        };
    };
}

function setupImageUpload() {
    setupSpecificImageUpload('full-upload-zone', 'full-image-input', 'full-image-preview-container', 'full-image-preview', 'full-remove-image-btn', 'full-ocr-status', 'transaction');
    setupSpecificImageUpload('lending-upload-zone', 'lending-image-input', 'lending-image-preview-container', 'lending-image-preview', 'lending-remove-image-btn', 'lending-ocr-status', 'lending');
}

function setupSpecificImageUpload(zoneId, inputId, previewContainerId, previewImgId, removeBtnId, statusId, source) {
    const uploadZone = document.getElementById(zoneId);
    const fileInput = document.getElementById(inputId);
    const previewContainer = document.getElementById(previewContainerId);
    const previewImg = document.getElementById(previewImgId);
    const removeBtn = document.getElementById(removeBtnId);
    const statusIndicator = document.getElementById(statusId);

    if (!uploadZone) return;

    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        handleImageFile(file, uploadZone, previewContainer, previewImg, statusIndicator, source);
    });

    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.value = '';
        previewContainer.classList.add('hide');
        uploadZone.classList.remove('hide');
        previewImg.src = '';
        if (source === 'transaction') {
            tempTransactionImage = null;
        } else {
            tempLendingImage = null;
        }
        showToast('ลบรูปภาพแนบแล้ว', 'info');
    });

    // Drag and Drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--color-primary)';
        uploadZone.style.background = 'rgba(139, 92, 246, 0.05)';
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.style.borderColor = 'rgba(139, 92, 246, 0.25)';
        uploadZone.style.background = 'rgba(255, 255, 255, 0.01)';
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'rgba(139, 92, 246, 0.25)';
        uploadZone.style.background = 'rgba(255, 255, 255, 0.01)';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageFile(file, uploadZone, previewContainer, previewImg, statusIndicator, source);
        } else {
            showToast('กรุณาอัปโหลดรูปภาพเท่านั้น', 'error');
        }
    });
}

function handleImageFile(file, uploadZone, previewContainer, previewImg, statusIndicator, source) {
    showToast('กำลังบีบอัดรูปภาพ...');
    compressImage(file, (compressedBase64) => {
        // Show local compressed preview instantly
        previewImg.src = compressedBase64;
        uploadZone.classList.add('hide');
        previewContainer.classList.remove('hide');

        // Set temp holder to base64 initially as a fallback
        if (source === 'transaction') {
            tempTransactionImage = compressedBase64;
        } else {
            tempLendingImage = compressedBase64;
        }

        // Perform AI OCR scan
        performOCR(compressedBase64, source, statusIndicator);

        // Upload to cloud (Drive) if Sheets configured
        if (googleSheetUrl) {
            uploadImageToDrive(compressedBase64, source);
        } else {
            showToast('บันทึกรูปภาพชั่วคราวในบราวเซอร์ (แนะนำให้เชื่อมต่อตาราง Sheets เพื่อจัดเก็บถาวร)', 'info');
        }
    });
}

async function performOCR(base64Data, source, statusIndicator) {
    if (!statusIndicator) return;
    statusIndicator.classList.remove('hide');

    try {
        const { data: { text } } = await Tesseract.recognize(
            base64Data,
            'tha+eng',
            { logger: m => console.log('Tesseract:', m.status, Math.round(m.progress * 100) + '%') }
        );

        console.log('OCR Text Result:', text);
        const parsed = parseSlipText(text);

        if (parsed.amount) {
            if (source === 'transaction') {
                document.getElementById('full-amount').value = parsed.amount;
                showToast(`สแกนสลิปสำเร็จ! พบยอดเงิน ${formatCurrency(parsed.amount)}`);
            } else {
                document.getElementById('lending-amount').value = parsed.amount;
                showToast(`สแกนสลิปสำเร็จ! พบยอดเงินยืม ${formatCurrency(parsed.amount)}`);
            }
        }

        if (parsed.date) {
            if (source === 'transaction') {
                document.getElementById('full-date').value = parsed.date;
            } else {
                document.getElementById('lending-date').value = parsed.date;
            }
        }
    } catch (error) {
        console.error('OCR Error:', error);
        showToast('ไม่สามารถสแกนข้อความได้ แต่บันทึกรูปภาพเรียบร้อยแล้วค่ะ', 'info');
    } finally {
        statusIndicator.classList.add('hide');
    }
}

function parseSlipText(text) {
    let amount = null;
    let date = null;

    // Clean up text
    const cleanText = text.replace(/\s+/g, ' ');

    // 1. Amount Extraction
    const amountRegexes = [
        /(?:จำนวนเงิน|ยอดเงิน|โอนเงิน|โอนเข้า|amount|amt|total)\s*[:\-\s]*\s*([0-9,]+\.[0-9]{2}|[0-9,]+)/i,
        /([0-9,]+\.[0-9]{2}|[0-9,]+)\s*(?:บาท|thb|฿)/i,
        /([0-9,]+\.[0-9]{2})/
    ];

    for (const regex of amountRegexes) {
        const match = cleanText.match(regex);
        if (match && match[1]) {
            const val = parseFloat(match[1].replace(/,/g, ''));
            if (!isNaN(val) && val > 0) {
                amount = val;
                break;
            }
        }
    }

    // 2. Date Extraction
    const dateRegexes = [
        /(\d{4})[-/](\d{2})[-/](\d{2})/,
        /(\d{2})[-/](\d{2})[-/](\d{4})/,
        /(\d{1,2})\s*(?:ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.|มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม)\s*(\d{2,4})/
    ];

    for (const regex of dateRegexes) {
        const match = cleanText.match(regex);
        if (match) {
            // ISO YYYY-MM-DD
            if (match[1].length === 4 && regex === dateRegexes[0]) {
                date = `${match[1]}-${match[2]}-${match[3]}`;
                break;
            }
            // DD/MM/YYYY or DD-MM-YYYY
            if (match[3] && match[3].length === 4 && regex === dateRegexes[1]) {
                let year = parseInt(match[3]);
                if (year > 2400) year -= 543;
                date = `${year}-${match[2]}-${match[1]}`;
                break;
            }
            // Thai text month
            if (match[1] && match[2]) {
                const day = String(match[1]).padStart(2, '0');
                let year = parseInt(match[2]);
                if (year < 100) year += 2500; // 69 -> 2569
                if (year > 2400) year -= 543; // BE to AD
                
                const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.', 
                                    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
                let monthIdx = -1;
                for (let i = 0; i < thaiMonths.length; i++) {
                    if (cleanText.includes(thaiMonths[i])) {
                        monthIdx = i % 12;
                        break;
                    }
                }
                if (monthIdx !== -1) {
                    const monthStr = String(monthIdx + 1).padStart(2, '0');
                    date = `${year}-${monthStr}-${day}`;
                    break;
                }
            }
        }
    }

    if (!date) {
        date = getTodayDateString();
    }

    return { amount, date };
}

async function uploadImageToDrive(base64Data, source) {
    if (!googleSheetUrl) return;

    try {
        const bodyData = {
            action: 'uploadImage',
            base64: base64Data
        };

        const response = await fetch(googleSheetUrl, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(bodyData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        if (result && result.success && result.url) {
            if (source === 'transaction') {
                tempTransactionImage = result.url;
            } else {
                tempLendingImage = result.url;
            }
            showToast('อัปโหลดรูปภาพขึ้น Google Drive สำเร็จแล้ว!');
        } else {
            throw new Error(result.message || 'Drive upload returned success=false');
        }
    } catch (error) {
        console.error('Drive upload error:', error);
        showToast('ไม่สามารถเซฟขึ้น Google Drive ได้ จะบันทึกไว้ในเครื่องแทน', 'error');
    }
}
