// ============================================
// Bank Management System - Frontend Application
// Core JavaScript for all pages
// ============================================

// ---- API Base URL ----
const API_BASE = 'http://localhost:5000/api';

// ============================================
// Utility Functions
// ============================================

// ---- Token Management ----
function getToken() {
    return localStorage.getItem('bankms_token');
}

function setToken(token) {
    localStorage.setItem('bankms_token', token);
}

function removeToken() {
    localStorage.removeItem('bankms_token');
}

// ---- User Data Management ----
function getUser() {
    try {
        const user = localStorage.getItem('bankms_user');
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

function setUser(user) {
    localStorage.setItem('bankms_user', JSON.stringify(user));
}

function removeUser() {
    localStorage.removeItem('bankms_user');
}

// ---- Format Currency ----
function formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    return '₹' + num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ---- Format Date ----
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatDateTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ---- API Request Helper ----
async function apiRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    // Add auth token if available
    const token = getToken();
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add body for POST/PUT requests
    if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();

        // Handle authentication errors
        // Skip auto-redirect for auth endpoints (login/register) —
        // those return 401 for invalid credentials, not expired sessions
        const isAuthEndpoint = endpoint.startsWith('/auth/');
        if (response.status === 401 && !isAuthEndpoint) {
            removeToken();
            removeUser();
            showToast('Session expired. Please login again.', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            return null;
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        showToast('Network error. Please check your connection.', 'error');
        return null;
    }
}

// ============================================
// Toast Notification System
// ============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    // Icon based on type
    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.classList.add('toast-removing'); setTimeout(() => this.parentElement.remove(), 300);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
    `;

    container.appendChild(toast);

    // Auto remove after 4 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('toast-removing');
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// ============================================
// Toggle Password Visibility
// ============================================
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" x2="23" y1="1" y2="23"/></svg>';
    } else {
        input.type = 'password';
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
    }
}

// ============================================
// Sidebar Toggle (Mobile)
// ============================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
}

// ============================================
// Authentication Handlers
// ============================================

// ---- User Login ----
async function handleLogin(event) {
    event.preventDefault();
    const btn = document.getElementById('loginBtn');
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showToast('Please fill in all fields.', 'warning');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Signing in...';

    const data = await apiRequest('/auth/login', 'POST', { email, password });

    if (data && data.success) {
        setToken(data.token);
        setUser(data.user);
        showToast('Login successful! Redirecting...', 'success');
        setTimeout(() => {
            if (data.user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        }, 1000);
    } else {
        showToast(data?.message || 'Login failed. Please try again.', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Sign In';
    }
}

// ---- Admin Login ----
async function handleAdminLogin(event) {
    event.preventDefault();
    const btn = document.getElementById('adminLoginBtn');
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;

    if (!email || !password) {
        showToast('Please fill in all fields.', 'warning');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Authenticating...';

    const data = await apiRequest('/auth/login', 'POST', { email, password });

    if (data && data.success) {
        if (data.user.role !== 'admin') {
            showToast('Access denied. Admin account required.', 'error');
            btn.disabled = false;
            btn.innerHTML = 'Access Admin Panel';
            return;
        }
        setToken(data.token);
        setUser(data.user);
        showToast('Admin login successful!', 'success');
        setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
        }, 1000);
    } else {
        showToast(data?.message || 'Login failed. Please try again.', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Access Admin Panel';
    }
}

// ---- User Registration ----
async function handleRegister(event) {
    event.preventDefault();
    const btn = document.getElementById('registerBtn');
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const phone = document.getElementById('regPhone')?.value.trim() || '';
    const address = document.getElementById('regAddress')?.value.trim() || '';
    const dateOfBirth = document.getElementById('regDob')?.value || '';
    const gender = document.getElementById('regGender')?.value || '';
    const fatherName = document.getElementById('regFatherName')?.value.trim() || '';
    const aadharNumber = document.getElementById('regAadhar')?.value.trim() || '';
    const panNumber = document.getElementById('regPan')?.value.trim().toUpperCase() || '';
    const nationality = document.getElementById('regNationality')?.value.trim() || 'Indian';
    const occupation = document.getElementById('regOccupation')?.value.trim() || '';
    const accountType = document.getElementById('regAccountType')?.value || 'savings';

    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showToast('Please fill in all required fields.', 'warning');
        return;
    }

    if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
    }

    if (password.length < 4) {
        showToast('Password must be at least 4 characters.', 'warning');
        return;
    }

    // Aadhar validation (if provided)
    if (aadharNumber && !/^[0-9]{12}$/.test(aadharNumber)) {
        showToast('Aadhar number must be exactly 12 digits.', 'warning');
        return;
    }

    // PAN validation (if provided)
    if (panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
        showToast('PAN number format should be ABCDE1234F.', 'warning');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Creating Account...';

    const data = await apiRequest('/auth/register', 'POST', {
        name, email, password, phone, address,
        dateOfBirth, gender, fatherName, aadharNumber, panNumber,
        nationality, occupation, accountType
    });

    if (data && data.success) {
        setToken(data.token);
        setUser(data.user);
        showToast('Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    } else {
        showToast(data?.message || 'Registration failed. Please try again.', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Create Account';
    }
}

// ---- Logout ----
function handleLogout() {
    removeToken();
    removeUser();
    showToast('Logged out successfully.', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 800);
}

// ============================================
// User Dashboard Functions
// ============================================

let currentTransactionPage = 1;
let currentTransactionFilter = '';

// ---- Initialize Dashboard ----
async function initDashboard() {
    const user = getUser();
    if (!user) return;

    // Set user info in sidebar
    const avatarEl = document.getElementById('userAvatar');
    const nameEl = document.getElementById('sidebarUserName');
    const accountEl = document.getElementById('sidebarAccountNo');

    if (avatarEl) avatarEl.textContent = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    if (nameEl) nameEl.textContent = user.name || 'User';
    if (accountEl) accountEl.textContent = `A/C: ${user.accountNumber || '------'}`;

    // Load dashboard data
    await loadDashboardData();
}

// ---- Load Dashboard Data ----
async function loadDashboardData() {
    const data = await apiRequest('/user/dashboard');

    if (data && data.success) {
        const { user, summary, recentTransactions } = data;

        // Update stored user data
        const currentUser = getUser();
        currentUser.balance = parseFloat(user.balance);
        setUser(currentUser);

        // Update balance displays
        updateBalanceDisplays(parseFloat(user.balance), user.account_number);

        // Update stats
        const totalDeposits = document.getElementById('totalDeposits');
        const totalWithdrawals = document.getElementById('totalWithdrawals');
        const totalTransfersOut = document.getElementById('totalTransfersOut');
        const totalTransfersIn = document.getElementById('totalTransfersIn');

        if (totalDeposits) totalDeposits.textContent = formatCurrency(summary.total_deposits);
        if (totalWithdrawals) totalWithdrawals.textContent = formatCurrency(summary.total_withdrawals);
        if (totalTransfersOut) totalTransfersOut.textContent = formatCurrency(summary.total_transfers_out);
        if (totalTransfersIn) totalTransfersIn.textContent = formatCurrency(summary.total_transfers_in);

        // Populate recent transactions
        populateRecentTransactions(recentTransactions);
    }
}

// ---- Update Balance Displays Across All Views ----
function updateBalanceDisplays(balance, accountNumber) {
    const elements = {
        'dashBalance': formatCurrency(balance),
        'dashAccountNo': accountNumber,
        'depositCurrentBalance': formatCurrency(balance),
        'withdrawCurrentBalance': formatCurrency(balance),
        'transferCurrentBalance': formatCurrency(balance)
    };

    for (const [id, value] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }
}

// ---- Populate Recent Transactions Table ----
function populateRecentTransactions(transactions) {
    const tbody = document.getElementById('recentTransactionsBody');
    if (!tbody) return;

    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-secondary);">No transactions yet. Start by making a deposit!</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(t => `
        <tr>
            <td><span class="badge badge-${t.type}">${formatType(t.type)}</span></td>
            <td style="font-weight:600; color:${t.type === 'deposit' || t.type === 'transfer_in' ? 'var(--success)' : 'var(--danger)'}">
                ${t.type === 'deposit' || t.type === 'transfer_in' ? '+' : '-'}${formatCurrency(t.amount)}
            </td>
            <td>${formatCurrency(t.balance_after)}</td>
            <td>${t.description || '-'}</td>
            <td style="color:var(--text-secondary); font-size:0.85rem;">${formatDate(t.created_at)}</td>
        </tr>
    `).join('');
}

// ---- Format Transaction Type ----
function formatType(type) {
    const types = {
        'deposit': 'Deposit',
        'withdrawal': 'Withdrawal',
        'transfer_in': 'Received',
        'transfer_out': 'Sent'
    };
    return types[type] || type;
}

// ============================================
// Section Navigation
// ============================================
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section-view').forEach(s => s.classList.remove('active'));
    // Show target section
    const target = document.getElementById(`section-${sectionName}`);
    if (target) target.classList.add('active');

    // Update nav items
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.getElementById(`nav-${sectionName}`);
    if (navItem) navItem.classList.add('active');

    // Update page title
    const titles = {
        'dashboard': ['Dashboard', 'Welcome back! Here\'s your account overview.'],
        'deposit': ['Deposit Money', 'Add funds to your account'],
        'withdraw': ['Withdraw Money', 'Withdraw from your balance'],
        'transfer': ['Transfer Money', 'Send money to another account'],
        'transactions': ['Transaction History', 'Complete record of all transactions'],
        'change-password': ['Change Password', 'Update your account password'],
        'profile': ['My Profile', 'View and update your account information']
    };

    const [title, subtitle] = titles[sectionName] || ['Dashboard', ''];
    const titleEl = document.getElementById('pageTitle');
    const subtitleEl = document.getElementById('pageSubtitle');
    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;

    // Load data for specific sections
    if (sectionName === 'transactions') {
        loadTransactions(1);
    } else if (sectionName === 'dashboard') {
        loadDashboardData();
    } else if (sectionName === 'profile') {
        loadProfileData();
    }

    // Close sidebar on mobile
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
}

// ============================================
// Banking Operations
// ============================================

// ---- Deposit ----
async function handleDeposit(event) {
    event.preventDefault();
    const btn = document.getElementById('depositBtn');
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const description = document.getElementById('depositDescription').value.trim();

    if (!amount || amount < 1) {
        showToast('Please enter a valid amount.', 'warning');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Processing...';

    const data = await apiRequest('/user/deposit', 'POST', { amount, description });

    if (data && data.success) {
        showToast(data.message, 'success');
        updateBalanceDisplays(data.newBalance, getUser().accountNumber);

        // Update stored user
        const user = getUser();
        user.balance = data.newBalance;
        setUser(user);

        // Reset form
        document.getElementById('depositForm').reset();
    } else {
        showToast(data?.message || 'Deposit failed.', 'error');
    }

    btn.disabled = false;
    btn.innerHTML = 'Deposit Money';
}

// ---- Withdraw ----
async function handleWithdraw(event) {
    event.preventDefault();
    const btn = document.getElementById('withdrawBtn');
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const description = document.getElementById('withdrawDescription').value.trim();

    if (!amount || amount < 1) {
        showToast('Please enter a valid amount.', 'warning');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Processing...';

    const data = await apiRequest('/user/withdraw', 'POST', { amount, description });

    if (data && data.success) {
        showToast(data.message, 'success');
        updateBalanceDisplays(data.newBalance, getUser().accountNumber);

        const user = getUser();
        user.balance = data.newBalance;
        setUser(user);

        document.getElementById('withdrawForm').reset();
    } else {
        showToast(data?.message || 'Withdrawal failed.', 'error');
    }

    btn.disabled = false;
    btn.innerHTML = 'Withdraw Money';
}

// ---- Transfer ----
async function handleTransfer(event) {
    event.preventDefault();
    const btn = document.getElementById('transferBtn');
    const accountNumber = document.getElementById('transferAccount').value.trim();
    const amount = parseFloat(document.getElementById('transferAmount').value);
    const description = document.getElementById('transferDescription').value.trim();

    if (!accountNumber || accountNumber.length !== 10) {
        showToast('Please enter a valid 10-digit account number.', 'warning');
        return;
    }

    if (!amount || amount < 1) {
        showToast('Please enter a valid amount.', 'warning');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Transferring...';

    const data = await apiRequest('/user/transfer', 'POST', { accountNumber, amount, description });

    if (data && data.success) {
        showToast(data.message, 'success');
        updateBalanceDisplays(data.newBalance, getUser().accountNumber);

        const user = getUser();
        user.balance = data.newBalance;
        setUser(user);

        document.getElementById('transferForm').reset();
    } else {
        showToast(data?.message || 'Transfer failed.', 'error');
    }

    btn.disabled = false;
    btn.innerHTML = 'Transfer Money';
}

// ---- Change Password ----
async function handleChangePassword(event) {
    event.preventDefault();
    const btn = document.getElementById('changePasswordBtn');
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        showToast('Please fill in all fields.', 'warning');
        return;
    }

    if (newPassword !== confirmNewPassword) {
        showToast('New passwords do not match.', 'error');
        return;
    }

    if (newPassword.length < 4) {
        showToast('New password must be at least 4 characters.', 'warning');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Updating...';

    const data = await apiRequest('/user/change-password', 'PUT', { currentPassword, newPassword });

    if (data && data.success) {
        showToast(data.message, 'success');
        document.getElementById('changePasswordForm').reset();
    } else {
        showToast(data?.message || 'Password change failed.', 'error');
    }

    btn.disabled = false;
    btn.innerHTML = 'Update Password';
}

// ============================================
// Transaction History with Pagination
// ============================================

async function loadTransactions(page = 1, type = '') {
    currentTransactionPage = page;
    currentTransactionFilter = type;

    let endpoint = `/user/transactions?page=${page}&limit=10`;
    if (type) endpoint += `&type=${type}`;

    const data = await apiRequest(endpoint);
    const tbody = document.getElementById('transactionsBody');

    if (data && data.success) {
        if (data.transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--text-secondary);">No transactions found.</td></tr>';
        } else {
            tbody.innerHTML = data.transactions.map((t, index) => `
                <tr>
                    <td style="color:var(--text-secondary);">#${((page - 1) * 10) + index + 1}</td>
                    <td><span class="badge badge-${t.type}">${formatType(t.type)}</span></td>
                    <td style="font-weight:600; color:${t.type === 'deposit' || t.type === 'transfer_in' ? 'var(--success)' : 'var(--danger)'}">
                        ${t.type === 'deposit' || t.type === 'transfer_in' ? '+' : '-'}${formatCurrency(t.amount)}
                    </td>
                    <td>${formatCurrency(t.balance_after)}</td>
                    <td>${t.description || '-'}</td>
                    <td style="font-size:0.85rem; color:var(--text-secondary);">${t.related_account || '-'}</td>
                    <td style="font-size:0.85rem; color:var(--text-secondary);">${formatDateTime(t.created_at)}</td>
                </tr>
            `).join('');
        }

        // Render pagination
        renderPagination('transactionsPagination', data.pagination, (p) => loadTransactions(p, currentTransactionFilter));
    } else {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px; color:var(--danger);">Error loading transactions.</td></tr>';
    }
}

function filterTransactions(type, btn) {
    // Update active tab
    document.querySelectorAll('#transactionFilters .filter-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');

    // Load filtered data
    loadTransactions(1, type === 'all' ? '' : type);
}

// ============================================
// Pagination Renderer
// ============================================
function renderPagination(containerId, pagination, onPageClick) {
    const container = document.getElementById(containerId);
    if (!container || !pagination) return;

    const { currentPage, totalPages } = pagination;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    html += `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="(${onPageClick.toString()})(${currentPage - 1})">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
    </button>`;

    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
        html += `<button class="pagination-btn" onclick="(${onPageClick.toString()})(1)">1</button>`;
        if (startPage > 2) html += `<span style="padding: 0 4px; color: var(--gray-400);">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="(${onPageClick.toString()})(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span style="padding: 0 4px; color: var(--gray-400);">...</span>`;
        html += `<button class="pagination-btn" onclick="(${onPageClick.toString()})(${totalPages})">${totalPages}</button>`;
    }

    // Next button
    html += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="(${onPageClick.toString()})(${currentPage + 1})">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
    </button>`;

    container.innerHTML = html;
}

// ============================================
// Admin Dashboard Functions
// ============================================

let adminUsersPage = 1;
let adminTransactionsPage = 1;
let adminUserSearchTerm = '';

// ---- Initialize Admin Dashboard ----
async function initAdminDashboard() {
    const user = getUser();
    if (!user) return;

    const adminName = document.getElementById('adminName');
    if (adminName) adminName.textContent = user.name || 'Admin';

    await loadAdminDashboardData();
}

// ---- Load Admin Dashboard Data ----
async function loadAdminDashboardData() {
    const data = await apiRequest('/admin/dashboard');

    if (data && data.success) {
        const { analytics, recentTransactions, recentUsers } = data;

        // Update stats
        setText('adminTotalUsers', analytics.totalUsers);
        setText('adminActiveUsers', analytics.activeUsers);
        setText('adminBlockedUsers', analytics.blockedUsers);
        setText('adminTotalBalance', formatCurrency(analytics.totalBalance));
        setText('adminTotalTransactions', analytics.totalTransactions);
        setText('adminTodayTransactions', analytics.todayTransactions?.count || 0);

        // Populate recent users
        populateAdminRecentUsers(recentUsers);

        // Populate recent transactions
        populateAdminRecentTransactions(recentTransactions);
    }
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// ---- Populate Admin Recent Users ----
function populateAdminRecentUsers(users) {
    const tbody = document.getElementById('adminRecentUsersBody');
    if (!tbody) return;

    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-secondary);">No users found.</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(u => `
        <tr>
            <td style="font-weight:600;">${u.name}</td>
            <td>${u.email}</td>
            <td style="font-family:monospace; font-size:0.85rem;">${u.account_number}</td>
            <td style="font-weight:600;">${formatCurrency(u.balance)}</td>
            <td><span class="badge ${u.is_blocked ? 'badge-blocked' : 'badge-active'}">${u.is_blocked ? 'Blocked' : 'Active'}</span></td>
            <td style="color:var(--text-secondary); font-size:0.85rem;">${formatDate(u.created_at)}</td>
        </tr>
    `).join('');
}

// ---- Populate Admin Recent Transactions ----
function populateAdminRecentTransactions(transactions) {
    const tbody = document.getElementById('adminRecentTransactionsBody');
    if (!tbody) return;

    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-secondary);">No transactions found.</td></tr>';
        return;
    }

    tbody.innerHTML = transactions.map(t => `
        <tr>
            <td style="font-weight:600;">${t.user_name || 'Unknown'}</td>
            <td><span class="badge badge-${t.type}">${formatType(t.type)}</span></td>
            <td style="font-weight:600; color:${t.type === 'deposit' || t.type === 'transfer_in' ? 'var(--success)' : 'var(--danger)'}">
                ${t.type === 'deposit' || t.type === 'transfer_in' ? '+' : '-'}${formatCurrency(t.amount)}
            </td>
            <td>${formatCurrency(t.balance_after)}</td>
            <td>${t.description || '-'}</td>
            <td style="color:var(--text-secondary); font-size:0.85rem;">${formatDateTime(t.created_at)}</td>
        </tr>
    `).join('');
}

// ---- Admin Section Navigation ----
function showAdminSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section-view').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`section-${sectionName}`);
    if (target) target.classList.add('active');

    // Update nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.getElementById(`nav-${sectionName}`);
    if (navItem) navItem.classList.add('active');

    // Update title
    const titles = {
        'dashboard': ['Admin Dashboard', 'System overview and analytics'],
        'users': ['All Users', 'Manage all registered user accounts'],
        'transactions': ['All Transactions', 'Complete transaction history']
    };

    const [title, subtitle] = titles[sectionName] || ['Admin Dashboard', ''];
    setText('adminPageTitle', title);
    setText('adminPageSubtitle', subtitle);

    // Load data
    if (sectionName === 'users') loadAdminUsers(1);
    else if (sectionName === 'transactions') loadAdminTransactions(1);
    else if (sectionName === 'dashboard') loadAdminDashboardData();

    // Close mobile sidebar
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
}

// ---- Load Admin Users ----
async function loadAdminUsers(page = 1) {
    adminUsersPage = page;
    let endpoint = `/admin/users?page=${page}&limit=15`;
    if (adminUserSearchTerm) endpoint += `&search=${encodeURIComponent(adminUserSearchTerm)}`;

    const data = await apiRequest(endpoint);
    const tbody = document.getElementById('adminAllUsersBody');

    if (data && data.success) {
        if (data.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:40px; color:var(--text-secondary);">No users found.</td></tr>';
        } else {
            tbody.innerHTML = data.users.map(u => `
                <tr>
                    <td style="color:var(--text-secondary);">#${u.id}</td>
                    <td style="font-weight:600;">${u.name}</td>
                    <td>${u.email}</td>
                    <td style="color:var(--text-secondary);">${u.phone || '-'}</td>
                    <td style="font-family:monospace; font-size:0.85rem;">${u.account_number}</td>
                    <td><span class="badge badge-${u.account_type || 'savings'}" style="text-transform:capitalize;">${u.account_type || 'savings'}</span></td>
                    <td style="font-weight:600;">${formatCurrency(u.balance)}</td>
                    <td><span class="badge ${u.is_blocked ? 'badge-blocked' : 'badge-active'}">${u.is_blocked ? 'Blocked' : 'Active'}</span></td>
                    <td style="color:var(--text-secondary); font-size:0.85rem;">${formatDate(u.created_at)}</td>
                    <td>
                        ${u.is_blocked
                    ? `<button class="btn btn-success btn-sm" onclick="toggleUserBlock(${u.id}, 'unblock')">Unblock</button>`
                    : `<button class="btn btn-danger btn-sm" onclick="toggleUserBlock(${u.id}, 'block')">Block</button>`
                }
                        <button class="btn btn-sm" style="background:#c62828;color:#fff;margin-left:4px;" onclick="deleteUser(${u.id}, '${u.name.replace(/'/g, "\\'")}')">×</button>
                    </td>
                </tr>
            `).join('');
        }

        renderPagination('adminUsersPagination', data.pagination, loadAdminUsers);
    }
}

// ---- Search Admin Users ----
let searchTimeout;
function debounceSearch(fn, value) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        adminUserSearchTerm = value;
        fn(1);
    }, 400);
}

function searchAdminUsers(page) {
    loadAdminUsers(page);
}

// ---- Block/Unblock User ----
async function toggleUserBlock(userId, action) {
    const confirmMsg = action === 'block'
        ? 'Are you sure you want to block this user? They will not be able to login.'
        : 'Are you sure you want to unblock this user?';

    if (!confirm(confirmMsg)) return;

    const data = await apiRequest(`/admin/users/${userId}/${action}`, 'PUT');

    if (data && data.success) {
        showToast(data.message, 'success');
        loadAdminUsers(adminUsersPage);
        loadAdminDashboardData();
    } else {
        showToast(data?.message || `Failed to ${action} user.`, 'error');
    }
}

// ---- Load Admin Transactions ----
async function loadAdminTransactions(page = 1) {
    adminTransactionsPage = page;
    const data = await apiRequest(`/admin/transactions?page=${page}&limit=15`);
    const tbody = document.getElementById('adminAllTransactionsBody');

    if (data && data.success) {
        if (data.transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:40px; color:var(--text-secondary);">No transactions found.</td></tr>';
        } else {
            tbody.innerHTML = data.transactions.map(t => `
                <tr>
                    <td style="color:var(--text-secondary);">#${t.id}</td>
                    <td style="font-weight:600;">${t.user_name || 'Unknown'}</td>
                    <td style="font-family:monospace; font-size:0.85rem;">${t.account_number || '-'}</td>
                    <td><span class="badge badge-${t.type}">${formatType(t.type)}</span></td>
                    <td style="font-weight:600; color:${t.type === 'deposit' || t.type === 'transfer_in' ? 'var(--success)' : 'var(--danger)'}">
                        ${t.type === 'deposit' || t.type === 'transfer_in' ? '+' : '-'}${formatCurrency(t.amount)}
                    </td>
                    <td>${formatCurrency(t.balance_after)}</td>
                    <td>${t.description || '-'}</td>
                    <td style="color:var(--text-secondary); font-size:0.85rem;">${formatDateTime(t.created_at)}</td>
                </tr>
            `).join('');
        }

        renderPagination('adminTransactionsPagination', data.pagination, loadAdminTransactions);
    }
}

// ============================================
// Delete User
// ============================================
async function deleteUser(userId, name) {
    if (!confirm(`Are you sure you want to DELETE user "${name}"? This will remove all their data permanently.`)) return;

    const data = await apiRequest(`/admin/users/${userId}`, 'DELETE');

    if (data && data.success) {
        showToast(data.message, 'success');
        loadAdminUsers(adminUsersPage);
        loadAdminDashboardData();
    } else {
        showToast(data?.message || 'Failed to delete user.', 'error');
    }
}

// ============================================
// ============================================
// User Profile Functions
// ============================================
async function loadProfileData() {
    const data = await apiRequest('/user/profile');
    if (data && data.success) {
        const u = data.user;
        const el = id => document.getElementById(id);
        if (el('profileAccountNo')) el('profileAccountNo').textContent = u.account_number;
        if (el('profileAccountType')) el('profileAccountType').textContent = u.account_type || 'savings';
        if (el('profileEmail')) el('profileEmail').textContent = u.email;
        if (el('profileCreatedAt')) el('profileCreatedAt').textContent = formatDate(u.created_at);
        if (el('profileDob')) el('profileDob').textContent = u.date_of_birth ? formatDate(u.date_of_birth) : '---';
        if (el('profileGender')) el('profileGender').textContent = u.gender || '---';
        if (el('profileFatherName')) el('profileFatherName').textContent = u.father_name || '---';
        if (el('profileAadhar')) el('profileAadhar').textContent = u.aadhar_number || '---';
        if (el('profilePan')) el('profilePan').textContent = u.pan_number || '---';
        if (el('profileNationality')) el('profileNationality').textContent = u.nationality || '---';
        if (el('profileOccupation')) el('profileOccupation').textContent = u.occupation || '---';
        if (el('profileName')) el('profileName').value = u.name || '';
        if (el('profilePhone')) el('profilePhone').value = u.phone || '';
        if (el('profileAddress')) el('profileAddress').value = u.address || '';
    }
}

async function handleProfileUpdate(event) {
    event.preventDefault();
    const btn = document.getElementById('profileBtn');
    const name = document.getElementById('profileName').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    const address = document.getElementById('profileAddress').value.trim();

    if (!name) {
        showToast('Name is required.', 'warning');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Updating...';

    const data = await apiRequest('/user/profile', 'PUT', { name, phone, address });

    if (data && data.success) {
        showToast(data.message, 'success');
        // Update local user data
        const user = getUser();
        if (user) {
            user.name = data.user.name;
            setUser(user);
            const sidebarName = document.getElementById('sidebarUserName');
            if (sidebarName) sidebarName.textContent = user.name;
            const avatar = document.getElementById('userAvatar');
            if (avatar) avatar.textContent = user.name.charAt(0).toUpperCase();
        }
    } else {
        showToast(data?.message || 'Failed to update profile.', 'error');
    }

    btn.disabled = false;
    btn.innerHTML = 'Update Profile';
}
