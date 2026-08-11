/*
  DueTracker Core Application Logic Engine
  Supports Centered Screen Positioning, Shop Owner Portal, Edit/Delete Customer & Remind Dues
*/

window.DueTrackerApp = {

  currentUser: null,
  activeTab: 'dashboard',
  currentTheme: localStorage.getItem('dt_theme') || 'dark',

  init() {
    console.log("DueTracker initialized.");
    this.applyTheme(this.currentTheme);

    const savedSession = sessionStorage.getItem('dt_active_session');
    if (savedSession) {
      try {
        this.currentUser = JSON.parse(savedSession);
        if (this.currentUser.role === 'SELLER') {
          this.loadSellerPortal();
          return;
        } else if (this.currentUser.role === 'CUSTOMER') {
          this.loadCustomerDashboard(this.currentUser.data.id);
          return;
        }
      } catch (e) {
        console.error("Session restore error:", e);
      }
    }

    this.navigateLanding();
  },

  togglePassword(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (btnEl) btnEl.innerText = 'Hide';
    } else {
      input.type = 'password';
      if (btnEl) btnEl.innerText = 'Show';
    }
  },

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('dt_theme', this.currentTheme);
    this.applyTheme(this.currentTheme);
  },

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const textEl = document.getElementById('theme-toggle-text');
    const badgeEl = document.getElementById('theme-badge');
    const settingsLabel = document.getElementById('settings-theme-label');

    if (theme === 'light') {
      if (textEl) textEl.innerText = '☀️ Light Mode';
      if (badgeEl) badgeEl.innerText = 'Light';
      if (settingsLabel) settingsLabel.innerText = 'Switch to Dark Mode 🌙';
    } else {
      if (textEl) textEl.innerText = '🌙 Dark Mode';
      if (badgeEl) badgeEl.innerText = 'Dark';
      if (settingsLabel) settingsLabel.innerText = 'Switch to Light Mode ☀️';
    }
  },

  showView(viewId) {
    document.querySelectorAll('.view-portal').forEach(el => el.classList.remove('active'));

    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');

    const sidebar = document.getElementById('app-sidebar');
    const layout = document.getElementById('app-layout');
    const topHeader = document.getElementById('top-header');

    const isAuthPage = (
        viewId === 'view-landing' ||
        viewId === 'view-seller-auth' ||
        viewId === 'view-customer-auth'
    );

    if (isAuthPage || !this.currentUser) {
      sidebar.classList.add('hidden');
      layout.classList.add('no-sidebar');
      if (topHeader) topHeader.style.display = 'none';
    } else {
      sidebar.classList.remove('hidden');
      layout.classList.remove('no-sidebar');
      if (topHeader) topHeader.style.display = 'flex';
    }

    this.updateTopHeader();
  },

  navigateLanding() {
    this.currentUser = null;
    sessionStorage.removeItem('dt_active_session');
    this.showView('view-landing');
  },

  showSellerAuth(mode = 'login') {
    this.showView('view-seller-auth');
    this.toggleSellerAuthMode(mode);
  },

  toggleSellerAuthMode(mode) {
    const loginBox = document.getElementById('seller-login-box');
    const regBox = document.getElementById('seller-register-box');
    if (mode === 'register') {
      loginBox.style.display = 'none';
      regBox.style.display = 'block';
    } else {
      loginBox.style.display = 'block';
      regBox.style.display = 'none';
    }
  },

  showCustomerAuth() {
    this.showView('view-customer-auth');
  },

  updateTopHeader() {
    const headerBadges = document.getElementById('top-header-badges');
    const titleEl = document.getElementById('page-title-text');

    if (!this.currentUser) {
      if (titleEl) titleEl.innerText = 'DueTracker Portal';
      if (headerBadges) headerBadges.innerHTML = '';
      return;
    }

    if (this.currentUser.role === 'SELLER') {
      const storeName = this.currentUser.data.storeName || 'My Store';
      if (titleEl) titleEl.innerText = this.getTabTitle(this.activeTab);
      if (headerBadges) {
        headerBadges.innerHTML = `
          <div class="store-badge">🏪 ${this.escapeHtml(storeName)}</div>
          <span class="role-badge">Shop Owner</span>
        `;
      }
    } else if (this.currentUser.role === 'CUSTOMER') {
      if (titleEl) titleEl.innerText = 'Customer Portal Dashboard';
      if (headerBadges) {
        headerBadges.innerHTML = `
          <span class="role-badge" style="background: rgba(0, 180, 216, 0.15); color: #00b4d8;">Customer</span>
        `;
      }
    }
  },

  getTabTitle(tab) {
    switch(tab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'customers': return 'Customer Directory';
      case 'transactions': return 'Transaction Logs';
      case 'settings': return 'Store Settings';
      default: return 'Dashboard';
    }
  },

  logout() {
    this.currentUser = null;
    sessionStorage.removeItem('dt_active_session');
    this.navigateLanding();
  },

  /* CUSTOMER LOGOUT */
  customerLogout() {
    if (this.currentUser && this.currentUser.role === 'CUSTOMER') {
      this.logout();
    }
  },

  switchTab(tabId) {
    this.activeTab = tabId;

    document.querySelectorAll('.menu-link').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`nav-item-${tabId}`);
    if (activeBtn) activeBtn.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    const activeContent = document.getElementById(`tab-${tabId}`);
    if (activeContent) activeContent.classList.add('active');

    this.updateTopHeader();

    if (this.currentUser && this.currentUser.role === 'SELLER') {
      if (tabId === 'dashboard') this.refreshSellerDashboard();
      if (tabId === 'customers') this.loadCustomersTab();
      if (tabId === 'transactions') this.loadTransactionsTab();
      if (tabId === 'settings') this.loadSettingsTab();
    }
  },

  // -------------------------------------------------------------
  // AUTH HANDLERS
  // -------------------------------------------------------------
  async handleSellerRegister(e) {
    e.preventDefault();
    const alertEl = document.getElementById('seller-register-alert');
    alertEl.innerHTML = '';

    const data = {
      name: document.getElementById('reg-name').value.trim(),
      storeName: document.getElementById('reg-store').value.trim(),
      email: document.getElementById('reg-email').value.trim(),
      phone: document.getElementById('reg-phone').value.trim(),
      password: document.getElementById('reg-pass').value.trim()
    };

    try {
      await DueTrackerAPI.registerSeller(data);
      alertEl.innerHTML = `<div class="alert alert-success">Shop registered! Redirecting to sign in...</div>`;
      setTimeout(() => {
        document.getElementById('seller-login-email').value = data.email;
        this.toggleSellerAuthMode('login');
      }, 1000);
    } catch (err) {
      alertEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  },

  async handleSellerLogin(e) {
    e.preventDefault();
    const alertEl = document.getElementById('seller-login-alert');
    alertEl.innerHTML = '';

    const identifier = document.getElementById('seller-login-email').value.trim();
    const password = document.getElementById('seller-login-pass').value.trim();

    try {
      const res = await DueTrackerAPI.loginSeller(identifier, password);
      this.currentUser = { role: 'SELLER', data: res.seller };
      sessionStorage.setItem('dt_active_session', JSON.stringify(this.currentUser));
      this.loadSellerPortal();
    } catch (err) {
      alertEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  },

  async handleCustomerLogin(e) {
    e.preventDefault();
    const alertEl = document.getElementById('customer-login-alert');
    alertEl.innerHTML = '';

    const name = document.getElementById('cust-login-name').value.trim();
    const phone = document.getElementById('cust-login-phone').value.trim();

    try {
      const res = await DueTrackerAPI.loginCustomer(name, phone);
      this.currentUser = { role: 'CUSTOMER', data: res.customer };
      sessionStorage.setItem('dt_active_session', JSON.stringify(this.currentUser));
      this.loadCustomerDashboard(res.customer.id);
    } catch (err) {
      alertEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  },

  // -------------------------------------------------------------
  // SHOP OWNER PORTAL & DASHBOARD METRICS
  // -------------------------------------------------------------
  loadSellerPortal() {
    this.showView('view-seller-portal');
    this.switchTab('dashboard');
  },

  async refreshSellerPortal() {
    await this.refreshSellerDashboard();
  },

  async refreshSellerDashboard() {
    if (!this.currentUser || this.currentUser.role !== 'SELLER') return;
    const sellerId = this.currentUser.data.id;

    try {
      const summary = await DueTrackerAPI.getSellerDashboard(sellerId);
      document.getElementById('stat-total-customers').innerText = summary.totalCustomers;
      document.getElementById('stat-total-purchases').innerText = '₹' + this.formatCurrency(summary.totalPurchases);
      document.getElementById('stat-total-payments').innerText = '₹' + this.formatCurrency(summary.totalPayments);
      document.getElementById('stat-total-due').innerText = '₹' + this.formatCurrency(summary.totalPendingDue);

      if (summary.storeName) {
        this.currentUser.data.storeName = summary.storeName;
        this.updateTopHeader();
      }

      const customers = await DueTrackerAPI.getCustomers(sellerId);
      const tbody = document.getElementById('seller-dash-customer-table');
      tbody.innerHTML = '';

      if (customers.length === 0) {
        tbody.innerHTML = `
          <tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            No customers added yet. Click <strong>+ Add Customer</strong> to start!
          </td></tr>
        `;
        return;
      }

      for (const cust of customers) {
        const statement = await DueTrackerAPI.getCustomerStatement(cust.id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>#${cust.id}</td>
          <td><strong>${this.escapeHtml(cust.name)}</strong></td>
          <td>${this.escapeHtml(cust.phone)}</td>
          <td style="color: #a855f7; font-weight: 600;">₹${this.formatCurrency(statement.totalPurchases)}</td>
          <td style="color: #10b981; font-weight: 600;">₹${this.formatCurrency(statement.totalPayments)}</td>
          <td style="color: #f43f5e; font-weight: 700;">₹${this.formatCurrency(statement.pendingDue)}</td>
          <td>
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
              <button class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;" onclick="DueTrackerApp.openPurchaseModal(${cust.id})">+ Pur</button>
              <button class="btn btn-success" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;" onclick="DueTrackerApp.openPaymentModal(${cust.id})">+ Pay</button>
              ${statement.pendingDue > 0 ? `<button class="btn btn-warning" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;" onclick="DueTrackerApp.openReminderModal(${cust.id})">🔔 Remind</button>` : ''}
              <button class="btn btn-info" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;" onclick="DueTrackerApp.openEditCustomerModal(${cust.id})">✏️ Edit</button>
              <button class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;" onclick="DueTrackerApp.confirmDeleteCustomer(${cust.id}, '${this.escapeHtml(cust.name)}')">🗑️</button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    }
  },

  async loadCustomersTab() {
    if (!this.currentUser || this.currentUser.role !== 'SELLER') return;
    const sellerId = this.currentUser.data.id;

    try {
      const customers = await DueTrackerAPI.getCustomers(sellerId);
      const tbody = document.getElementById('seller-customers-full-table');
      tbody.innerHTML = '';

      if (customers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No customers added yet.</td></tr>`;
        return;
      }

      for (const cust of customers) {
        const statement = await DueTrackerAPI.getCustomerStatement(cust.id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>#${cust.id}</td>
          <td><strong>${this.escapeHtml(cust.name)}</strong></td>
          <td>${this.escapeHtml(cust.phone)}</td>
          <td>${this.escapeHtml(cust.email || '-')}</td>
          <td>${this.escapeHtml(cust.address || '-')}</td>
          <td style="color: #f43f5e; font-weight: 700;">₹${this.formatCurrency(statement.pendingDue)}</td>
          <td>
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
              <button class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;" onclick="DueTrackerApp.openPurchaseModal(${cust.id})">+ Pur</button>
              <button class="btn btn-success" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;" onclick="DueTrackerApp.openPaymentModal(${cust.id})">+ Pay</button>
              ${statement.pendingDue > 0 ? `<button class="btn btn-warning" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;" onclick="DueTrackerApp.openReminderModal(${cust.id})">🔔 Remind</button>` : ''}
              <button class="btn btn-info" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;" onclick="DueTrackerApp.openEditCustomerModal(${cust.id})">✏️ Edit</button>
              <button class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;" onclick="DueTrackerApp.confirmDeleteCustomer(${cust.id}, '${this.escapeHtml(cust.name)}')">🗑️</button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      }
    } catch (err) {
      console.error("Customers tab error:", err);
    }
  },

  async loadTransactionsTab() {
    if (!this.currentUser || this.currentUser.role !== 'SELLER') return;
    const sellerId = this.currentUser.data.id;

    try {
      const customers = await DueTrackerAPI.getCustomers(sellerId);
      const tbody = document.getElementById('seller-all-transactions-table');
      tbody.innerHTML = '';

      let allTxs = [];
      for (const cust of customers) {
        const stmt = await DueTrackerAPI.getCustomerStatement(cust.id);
        stmt.transactions.forEach(t => {
          allTxs.push({ ...t, customerName: cust.name });
        });
      }

      allTxs.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));

      if (allTxs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No transaction logs recorded.</td></tr>`;
        return;
      }

      allTxs.forEach(t => {
        const isPurchase = t.type === 'PURCHASE';
        const dateStr = new Date(t.transactionDate).toLocaleString();
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="color: var(--text-muted); font-size: 0.85rem;">${dateStr}</td>
          <td><strong>${this.escapeHtml(t.customerName)}</strong></td>
          <td><span class="type-badge ${isPurchase ? 'type-purchase' : 'type-payment'}">${isPurchase ? '🛒 PURCHASE' : '💵 PAYMENT'}</span></td>
          <td style="font-weight: 700; color: ${isPurchase ? '#f43f5e' : '#10b981'};">${isPurchase ? '+' : '-'} ₹${this.formatCurrency(t.amount)}</td>
          <td>${this.escapeHtml(t.description || '-')}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error("Transactions error:", err);
    }
  },

  loadSettingsTab() {
    if (!this.currentUser) return;
    const s = this.currentUser.data;
    document.getElementById('settings-store-name').value = s.storeName || '';
    document.getElementById('settings-phone').value = s.phone || '';
    document.getElementById('settings-email').value = s.email || '';
  },

  handleSaveSettings(e) {
    e.preventDefault();
    const newStoreName = document.getElementById('settings-store-name').value.trim();
    if (newStoreName && this.currentUser) {
      this.currentUser.data.storeName = newStoreName;
      sessionStorage.setItem('dt_active_session', JSON.stringify(this.currentUser));
      this.updateTopHeader();
      alert("Store settings saved successfully!");
    }
  },

  // -------------------------------------------------------------
  // EDIT & DELETE CUSTOMER FUNCTIONALITY
  // -------------------------------------------------------------
  async openEditCustomerModal(customerId) {
    this.closeModals();
    if (!this.currentUser) return;
    const sellerId = this.currentUser.data.id;
    const customers = await DueTrackerAPI.getCustomers(sellerId);
    const cust = customers.find(c => c.id == customerId);
    if (!cust) return alert("Customer not found!");

    document.getElementById('m-edit-cust-id').value = cust.id;
    document.getElementById('m-edit-cust-name').value = cust.name;
    document.getElementById('m-edit-cust-phone').value = cust.phone;
    document.getElementById('m-edit-cust-email').value = cust.email || '';
    document.getElementById('m-edit-cust-address').value = cust.address || '';
    document.getElementById('modal-edit-customer').classList.add('open');
  },

  async handleSaveEditCustomer(e) {
    e.preventDefault();
    const customerId = document.getElementById('m-edit-cust-id').value;
    const updatedData = {
      name: document.getElementById('m-edit-cust-name').value.trim(),
      phone: document.getElementById('m-edit-cust-phone').value.trim(),
      email: document.getElementById('m-edit-cust-email').value.trim(),
      address: document.getElementById('m-edit-cust-address').value.trim()
    };

    try {
      await DueTrackerAPI.updateCustomer(customerId, updatedData);
      this.closeModals();
      this.switchTab(this.activeTab);
    } catch (err) {
      alert("Error updating customer: " + err.message);
    }
  },

  async confirmDeleteCustomer(customerId, customerName) {
    if (confirm(`Are you sure you want to delete customer "${customerName}"? All transaction history for this customer will also be deleted.`)) {
      try {
        await DueTrackerAPI.deleteCustomer(customerId);
        this.switchTab(this.activeTab);
      } catch (err) {
        alert("Error deleting customer: " + err.message);
      }
    }
  },

  // -------------------------------------------------------------
  // PAYMENT DUE REMINDER FUNCTIONALITY ("Remind Dues")
  // -------------------------------------------------------------
  async openReminderModal(customerId) {
    this.closeModals();
    const statement = await DueTrackerAPI.getCustomerStatement(customerId);
    const cust = statement.customer;
    const storeName = (this.currentUser && this.currentUser.data.storeName) || 'Our Shop';
    const dueAmount = this.formatCurrency(statement.pendingDue);

    const message = `Hello ${cust.name}, this is a payment reminder from *${storeName}*. Your current pending credit due is *₹${dueAmount}*. Kindly make the payment online or visit our shop. Thank you!`;

    const previewBox = document.getElementById('reminder-preview-box');
    previewBox.innerHTML = `
      <div style="font-weight: 700; color: #f59e0b; margin-bottom: 0.5rem;">Reminder Message Preview:</div>
      <p style="white-space: pre-wrap; font-style: italic; color: var(--text-main);">${this.escapeHtml(message)}</p>
      <div style="margin-top: 0.75rem; font-size: 0.85rem; color: var(--text-muted);">
        Recipient Phone: <strong>${cust.phone}</strong>
      </div>
    `;

    const waBtn = document.getElementById('btn-wa-reminder');
    waBtn.onclick = () => {
      const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
      const waPhone = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;
      const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
    };

    const copyBtn = document.getElementById('btn-copy-reminder');
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(message);
      alert("Reminder message copied to clipboard!");
    };

    document.getElementById('modal-send-reminder').classList.add('open');
  },

  // -------------------------------------------------------------
  // CUSTOMER DASHBOARD
  // -------------------------------------------------------------
  async loadCustomerDashboard(customerId) {
    this.showView('view-customer-dashboard');
    await this.refreshCustomerDashboard(customerId);
  },

  async refreshCustomerDashboard(customerId) {
    try {
      const data = await DueTrackerAPI.getCustomerStatement(customerId);
      const cust = data.customer;

      document.getElementById('cust-profile-name').innerText = cust.name;
      document.getElementById('cust-profile-id').innerText = `#${cust.id}`;
      document.getElementById('cust-profile-phone').innerText = cust.phone;

      const payContainer = document.getElementById('cust-pay-container');
      if (data.pendingDue > 0) {
        payContainer.innerHTML = `
          <button class="btn btn-pay" onclick="DueTrackerApp.triggerCustomerOnlinePayment(${cust.id}, ${data.pendingDue})">
            💳 PAY NOW (₹${this.formatCurrency(data.pendingDue)})
          </button>
        `;
      } else {
        payContainer.innerHTML = `
          <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; padding: 0.75rem 1.5rem; border-radius: 50px; font-weight: 700;">
            ✓ All Dues Paid!
          </div>
        `;
      }

      const tbody = document.getElementById('cust-statement-table-body');
      tbody.innerHTML = '';

      if (data.transactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">No statement logs found.</td></tr>`;
        return;
      }

      data.transactions.forEach(t => {
        const isPurchase = t.type === 'PURCHASE';
        const dateStr = new Date(t.transactionDate).toLocaleString();
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="color: var(--text-muted); font-size: 0.85rem;">${dateStr}</td>
          <td><span class="type-badge ${isPurchase ? 'type-purchase' : 'type-payment'}">${isPurchase ? '🛒 PURCHASE' : '💵 PAYMENT'}</span></td>
          <td style="font-weight: 700; color: ${isPurchase ? '#f43f5e' : '#10b981'};">${isPurchase ? '+' : '-'} ₹${this.formatCurrency(t.amount)}</td>
          <td>${this.escapeHtml(t.description || '-')}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error("Customer dashboard error:", err);
    }
  },

  triggerCustomerOnlinePayment(customerId, amount) {
    if (!this.currentUser) return;
    DueTrackerRazorpay.processPayment(amount, this.currentUser.data, async (res) => {
      try {
        await DueTrackerAPI.recordPayment(customerId, res.amount, 'Online Razorpay Payment', res.paymentId);
        alert(`Payment of ₹${res.amount} successful! Ref: ${res.paymentId}`);
        await this.refreshCustomerDashboard(customerId);
      } catch (err) {
        alert("Error saving payment: " + err.message);
      }
    });
  },

  // -------------------------------------------------------------
  // MODALS
  // -------------------------------------------------------------
  closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
  },

  openAddCustomerModal() {
    this.closeModals();
    document.getElementById('m-cust-name').value = '';
    document.getElementById('m-cust-phone').value = '';
    document.getElementById('m-cust-email').value = '';
    document.getElementById('m-cust-address').value = '';
    document.getElementById('modal-add-customer').classList.add('open');
  },

  async handleSaveCustomer(e) {
    e.preventDefault();
    if (!this.currentUser) return;
    const data = {
      name: document.getElementById('m-cust-name').value.trim(),
      phone: document.getElementById('m-cust-phone').value.trim(),
      email: document.getElementById('m-cust-email').value.trim(),
      address: document.getElementById('m-cust-address').value.trim()
    };
    try {
      await DueTrackerAPI.addCustomer(this.currentUser.data.id, data);
      this.closeModals();
      this.switchTab(this.activeTab);
    } catch (err) {
      alert("Error: " + err.message);
    }
  },

  async openPurchaseModal(preselectCustId = null) {
    this.closeModals();
    if (!this.currentUser) return;
    const customers = await DueTrackerAPI.getCustomers(this.currentUser.data.id);
    const select = document.getElementById('m-pur-customer');
    select.innerHTML = customers.map(c => `<option value="${c.id}">${this.escapeHtml(c.name)} (${c.phone})</option>`).join('');
    if (preselectCustId) select.value = preselectCustId;

    document.getElementById('m-pur-amount').value = '';
    document.getElementById('m-pur-desc').value = '';
    document.getElementById('modal-record-purchase').classList.add('open');
  },

  async handleSavePurchase(e) {
    e.preventDefault();
    const custId = document.getElementById('m-pur-customer').value;
    const amount = document.getElementById('m-pur-amount').value;
    const desc = document.getElementById('m-pur-desc').value.trim();
    try {
      await DueTrackerAPI.recordPurchase(custId, amount, desc);
      this.closeModals();
      this.switchTab(this.activeTab);
    } catch (err) {
      alert("Error: " + err.message);
    }
  },

  async openPaymentModal(preselectCustId = null) {
    this.closeModals();
    if (!this.currentUser) return;
    const customers = await DueTrackerAPI.getCustomers(this.currentUser.data.id);
    const select = document.getElementById('m-pay-customer');
    select.innerHTML = customers.map(c => `<option value="${c.id}">${this.escapeHtml(c.name)} (${c.phone})</option>`).join('');
    if (preselectCustId) select.value = preselectCustId;

    document.getElementById('m-pay-amount').value = '';
    document.getElementById('m-pay-desc').value = '';
    document.getElementById('modal-record-payment').classList.add('open');
  },

  async handleSavePayment(e) {
    e.preventDefault();
    const custId = document.getElementById('m-pay-customer').value;
    const amount = document.getElementById('m-pay-amount').value;
    const desc = document.getElementById('m-pay-desc').value.trim();
    try {
      await DueTrackerAPI.recordPayment(custId, amount, desc);
      this.closeModals();
      this.switchTab(this.activeTab);
    } catch (err) {
      alert("Error: " + err.message);
    }
  },

  formatCurrency(val) {
    return Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  DueTrackerApp.init();
});