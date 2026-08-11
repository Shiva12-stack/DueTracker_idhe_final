window.App = {
  session: null,

  $: id => document.getElementById(id),

  init() {
    this.updateThemeLabels();
    const s = sessionStorage.getItem("dt_active_session");

    if (s) {
      try {
        this.session = JSON.parse(s);
        if (this.session.role === "SELLER") return this.enterSellerPortal();
        if (this.session.role === "CUSTOMER") return this.enterCustomerPortal();
      } catch {
        sessionStorage.removeItem("dt_active_session");
      }
    }
    this.showView("view-landing");
  },

  showView(id) {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    this.$(id)?.classList.add("active");

    const seller = id === "view-seller-portal";
    this.$("sidebar").classList.toggle("hidden", !seller);
    this.$("main").classList.toggle("no-sidebar", !seller);
  },

  goHome() {
    this.logout();
  },

  logout() {
    this.session = null;
    sessionStorage.removeItem("dt_active_session");
    this.showView("view-landing");
  },

  sellerMode(mode) {
    this.$("seller-login-card").style.display = mode === "login" ? "" : "none";
    this.$("seller-register-card").style.display = mode === "register" ? "" : "none";
  },

  togglePw(id, btn) {
    const x = this.$(id);
    if (!x) return;
    x.type = x.type === "password" ? "text" : "password";
    if (btn) btn.textContent = x.type === "password" ? "Show" : "Hide";
  },

  toggleTheme() {
    const dark = document.documentElement.dataset.theme === "dark";
    localStorage.setItem("dt_theme", dark ? "light" : "dark");
    this.updateThemeLabels();
  },

  updateThemeLabels() {
    const theme = localStorage.getItem("dt_theme") || "dark";
    document.documentElement.dataset.theme = theme;

    const text = theme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode";
    ["theme-label", "s-theme-label"].forEach(id => {
      const x = this.$(id);
      if (x) x.textContent = text;
    });

    const badge = this.$("theme-badge");
    if (badge) badge.textContent = "ON";
  },

  showAlert(id, msg, type = "err") {
    const x = this.$(id);
    if (!x) return;

    x.innerHTML = `<div class="alert alert-${type}">${this.escapeHtml(msg)}</div>`;
    setTimeout(() => x.innerHTML = "", 5000);
  },

  async sellerRegister(e) {
    e.preventDefault();

    const name = this.$("sr-name").value.trim();
    const storeName = this.$("sr-store").value.trim();
    const email = this.$("sr-email").value.trim();
    const phone = this.$("sr-phone").value.trim();
    const password = this.$("sr-pass").value.trim();

    if (password.length < 6)
      return this.showAlert("sr-alert", "Password must be at least 6 characters.");

    try {
      await DueTrackerAPI.registerSeller({
        name, storeName, email, phone, password
      });

      this.showAlert(
          "sr-alert",
          "Shop registered successfully! You can now sign in.",
          "ok"
      );

      setTimeout(() => {
        this.$("sl-email").value = email;
        this.sellerMode("login");
      }, 1200);

    } catch (e) {
      console.error(e);
      this.showAlert("sr-alert", e.message || "Registration failed.");
    }
  },

  async sellerLogin(e) {
    e.preventDefault();

    const id = this.$("sl-email").value.trim();
    const password = this.$("sl-pass").value.trim();

    try {
      const r = await DueTrackerAPI.loginSeller(id, password);

      this.session = { role: "SELLER", data: r.seller };
      this.saveSession();
      await this.enterSellerPortal();

    } catch (e) {
      console.error(e);
      this.showAlert("sl-alert", e.message || "Login failed.");
    }
  },

  async customerLogin(e) {
    e.preventDefault();

    const name = this.$("cl-name").value.trim();
    const phone = this.$("cl-phone").value.trim();

    try {
      const r = await DueTrackerAPI.loginCustomer(name, phone);

      this.session = { role: "CUSTOMER", data: r.customer };
      this.saveSession();
      await this.enterCustomerPortal();

    } catch (e) {
      console.error(e);
      this.showAlert("cl-alert", e.message || "Customer login failed.");
    }
  },

  saveSession() {
    sessionStorage.setItem(
        "dt_active_session",
        JSON.stringify(this.session)
    );
  },

  async enterSellerPortal() {
    if (!this.session || this.session.role !== "SELLER") return;

    const s = this.session.data;

    this.$("store-chip").textContent = s.storeName || "My Shop";
    this.$("s-name").value = s.name || "";
    this.$("s-email").value = s.email || "";
    this.$("s-phone").value = s.phone || "";
    this.$("s-store").value = s.storeName || "";

    this.showView("view-seller-portal");
    await this.tab("dashboard");
  },

  async tab(name) {
    document.querySelectorAll(".tab-content")
        .forEach(x => x.classList.remove("active"));

    document.querySelectorAll(".sb-link")
        .forEach(x => x.classList.remove("active"));

    this.$(`tab-${name}`)?.classList.add("active");
    document.querySelector(`[data-tab="${name}"]`)?.classList.add("active");

    this.$("page-title").textContent =
        { dashboard: "Dashboard", customers: "Customers",
          transactions: "Transactions", settings: "Settings" }[name] || "DueTracker";

    if (name === "dashboard") await this.refreshDash();
    if (name === "customers") await this.renderCustTable();
    if (name === "transactions") await this.renderTxnTable();
    if (name === "settings") this.loadSettings();
  },

  async refreshDash() {
    if (!this.session || this.session.role !== "SELLER") return;

    try {
      const sid = this.session.data.id;
      const s = await DueTrackerAPI.getSellerDashboard(sid);
      const customers = await DueTrackerAPI.getCustomers(sid);

      this.$("m-customers").textContent = s.totalCustomers || 0;
      this.$("m-purchases").textContent = this.fmt(s.totalPurchases);
      this.$("m-payments").textContent = this.fmt(s.totalPayments);
      this.$("m-dues").textContent = this.fmt(s.totalPendingDue);

      if (s.storeName) {
        this.session.data.storeName = s.storeName;
        this.$("store-chip").textContent = s.storeName;
        this.saveSession();
      }

      const tbody = this.$("dash-table");
      tbody.innerHTML = "";

      if (!customers.length) {
        tbody.innerHTML = this.emptyRow(
            7, "👥", "No customers yet",
            'Click "Add Customer" to get started'
        );
        return;
      }

      for (let i = 0; i < customers.length; i++) {
        const c = customers[i];
        const st = await DueTrackerAPI.getCustomerStatement(c.id);

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td class="fw">${this.esc(c.name)}</td>
          <td>${this.esc(c.phone)}</td>
          <td>${this.fmt(st.totalPurchases)}</td>
          <td class="green">${this.fmt(st.totalPayments)}</td>
          <td class="balance ${Number(st.pendingDue) > 0 ? "red" : "green"}">
            ${this.fmt(st.pendingDue)}
          </td>
          <td>
            <div class="action-wrap">
              <button class="btn btn-primary btn-sm"
                onclick="App.openPurchase('${c.id}')">+ Purchase</button>
              <button class="btn btn-success btn-sm"
                onclick="App.openPayment('${c.id}')">+ Payment</button>
              <button class="btn btn-info btn-sm"
                onclick="App.openRemind('${c.id}')">🔔 Remind</button>
              <button class="btn btn-warning btn-sm"
                onclick="App.openEdit('${c.id}')">✏️ Edit</button>
              <button class="btn btn-danger btn-sm"
                onclick="App.deleteCust('${c.id}')">🗑️</button>
            </div>
          </td>`;
        tbody.appendChild(tr);
      }

    } catch (e) {
      console.error(e);
      alert("Unable to load dashboard: " + e.message);
    }
  },

  async renderCustTable() {
    if (!this.session) return;

    try {
      const customers = await DueTrackerAPI.getCustomers(this.session.data.id);
      const tbody = this.$("cust-table");
      tbody.innerHTML = "";

      if (!customers.length) {
        tbody.innerHTML = this.emptyRow(7, "👥", "No customers yet");
        return;
      }

      for (let i = 0; i < customers.length; i++) {
        const c = customers[i];
        const st = await DueTrackerAPI.getCustomerStatement(c.id);

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${i + 1}</td>
          <td class="fw">${this.esc(c.name)}</td>
          <td>${this.esc(c.phone)}</td>
          <td>${this.esc(c.email || "—")}</td>
          <td>${this.esc(c.address || "—")}</td>
          <td class="balance ${Number(st.pendingDue) > 0 ? "red" : "green"}">
            ${this.fmt(st.pendingDue)}
          </td>
          <td>
            <div class="action-wrap">
              <button class="btn btn-info btn-sm"
                onclick="App.openRemind('${c.id}')">🔔</button>
              <button class="btn btn-warning btn-sm"
                onclick="App.openEdit('${c.id}')">✏️</button>
              <button class="btn btn-danger btn-sm"
                onclick="App.deleteCust('${c.id}')">🗑️</button>
            </div>
          </td>`;
        tbody.appendChild(tr);
      }

    } catch (e) {
      console.error("Customer table error:", e);
    }
  },

  async renderTxnTable() {
    if (!this.session) return;

    try {
      const customers =
          await DueTrackerAPI.getCustomers(this.session.data.id);

      const all = [];

      for (const c of customers) {
        const s = await DueTrackerAPI.getCustomerStatement(c.id);

        s.transactions.forEach(t =>
            all.push({ ...t, customerName: c.name })
        );
      }

      all.sort((a, b) =>
          new Date(b.transactionDate) - new Date(a.transactionDate)
      );

      const tbody = this.$("txn-table");
      tbody.innerHTML = "";

      if (!all.length) {
        tbody.innerHTML = this.emptyRow(5, "💳", "No transactions yet");
        return;
      }

      all.forEach(t => {
        const purchase = t.type === "PURCHASE";
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td class="muted">${this.fmtDate(t.transactionDate)}</td>
          <td class="fw">${this.esc(t.customerName)}</td>
          <td>
            <span class="badge ${purchase ? "badge-purchase" : "badge-payment"}">
              ${purchase ? "🛒 Purchase" : "💵 Payment"}
            </span>
          </td>
          <td class="${purchase ? "red" : "green"} fw">
            ${this.fmt(t.amount)}
          </td>
          <td>${this.esc(t.description || "—")}</td>`;
        tbody.appendChild(tr);
      });

    } catch (e) {
      console.error("Transaction table error:", e);
    }
  },

  async addCustomer(e) {
    e.preventDefault();
    if (!this.session) return;

    const data = {
      name: this.$("ac-name").value.trim(),
      phone: this.$("ac-phone").value.trim(),
      email: this.$("ac-email").value.trim(),
      address: this.$("ac-addr").value.trim()
    };

    try {
      await DueTrackerAPI.addCustomer(this.session.data.id, data);

      this.closeModal("modal-add-cust");
      e.target.reset();

      alert("✅ Customer saved successfully!");

      await this.refreshDash();
      await this.renderCustTable();

    } catch (e) {
      console.error(e);
      alert("❌ Customer was not saved: " + e.message);
    }
  },

  openModal(id) {
    if (id === "modal-purchase")
      this.loadCustomerSelect("pur-cust");

    if (id === "modal-payment")
      this.loadCustomerSelect("pay-cust");

    this.$(id)?.classList.add("open");
  },

  closeModal(id) {
    this.$(id)?.classList.remove("open");
  },

  async loadCustomerSelect(id) {
    if (!this.session) return;

    try {
      const customers =
          await DueTrackerAPI.getCustomers(this.session.data.id);

      const select = this.$(id);
      select.innerHTML = "";

      if (!customers.length) {
        select.innerHTML =
            `<option value="">No customers - add one first</option>`;
        return;
      }

      customers.forEach(c => {
        const o = document.createElement("option");
        o.value = c.id;
        o.textContent = `${c.name} (${c.phone})`;
        select.appendChild(o);
      });

    } catch (e) {
      console.error("Customer select error:", e);
    }
  },

  async addPurchase(e) {
    e.preventDefault();

    const id = this.$("pur-cust").value;
    const amount = this.$("pur-amt").value;
    const desc = this.$("pur-desc").value.trim();

    if (!id || !amount) return;

    try {
      await DueTrackerAPI.recordPurchase(id, amount, desc);

      this.closeModal("modal-purchase");
      e.target.reset();

      alert("✅ Purchase saved to Aiven database!");

      await this.refreshDash();
      await this.renderTxnTable();

    } catch (e) {
      alert("❌ Purchase was not saved: " + e.message);
    }
  },

  async addPayment(e) {
    e.preventDefault();

    const id = this.$("pay-cust").value;
    const amount = this.$("pay-amt").value;
    const desc = this.$("pay-desc").value.trim();

    if (!id || !amount) return;

    try {
      await DueTrackerAPI.recordPayment(id, amount, desc);

      this.closeModal("modal-payment");
      e.target.reset();

      alert("✅ Payment saved to Aiven database!");

      await this.refreshDash();
      await this.renderTxnTable();

    } catch (e) {
      alert("❌ Payment was not saved: " + e.message);
    }
  },

  async openEdit(id) {
    try {
      const customers =
          await DueTrackerAPI.getCustomers(this.session.data.id);

      const c = customers.find(x => String(x.id) === String(id));

      if (!c) return alert("Customer not found.");

      this.$("ec-id").value = c.id;
      this.$("ec-name").value = c.name;
      this.$("ec-phone").value = c.phone;
      this.$("ec-email").value = c.email || "";
      this.$("ec-addr").value = c.address || "";

      this.openModal("modal-edit-cust");

    } catch (e) {
      alert("Unable to load customer: " + e.message);
    }
  },

  async updateCustomer(e) {
    e.preventDefault();

    const id = this.$("ec-id").value;

    const data = {
      name: this.$("ec-name").value.trim(),
      phone: this.$("ec-phone").value.trim(),
      email: this.$("ec-email").value.trim(),
      address: this.$("ec-addr").value.trim()
    };

    try {
      await DueTrackerAPI.updateCustomer(id, data);

      this.closeModal("modal-edit-cust");
      alert("✅ Customer updated successfully!");

      await this.refreshDash();
      await this.renderCustTable();

    } catch (e) {
      alert("❌ Update failed: " + e.message);
    }
  },

  async deleteCust(id) {
    if (!confirm(
        "Delete this customer? All their transaction history will also be deleted."
    )) return;

    try {
      await DueTrackerAPI.deleteCustomer(id);

      alert("✅ Customer deleted successfully!");

      await this.refreshDash();
      await this.renderCustTable();

    } catch (e) {
      alert("❌ Delete failed: " + e.message);
    }
  },

  async openPurchase(id) {
    await this.loadCustomerSelect("pur-cust");
    this.$("pur-cust").value = id;
    this.$("pur-amt").value = "";
    this.$("pur-desc").value = "";
    this.openModal("modal-purchase");
  },

  async openPayment(id) {
    await this.loadCustomerSelect("pay-cust");
    this.$("pay-cust").value = id;
    this.$("pay-amt").value = "";
    this.$("pay-desc").value = "";
    this.openModal("modal-payment");
  },

  async openRemind(id) {
    try {
      const s = await DueTrackerAPI.getCustomerStatement(id);
      const c = s.customer;
      const store = this.session.data.storeName || "Your Shop";

      const msg =
          `📢 Payment Reminder

Dear ${c.name},

This is a gentle reminder from *${store}*.

Your current outstanding due is:
💰 *₹${this.formatNumber(s.pendingDue)}*

Kindly clear this at your earliest convenience.

Thank you for your business! 🙏`;

      this.$("remind-preview").innerHTML =
          this.esc(msg).replace(/\n/g, "<br>")
              .replace(/\*(.*?)\*/g, "<strong>$1</strong>");

      let phone = c.phone.replace(/\D/g, "");
      if (phone.length === 10) phone = "91" + phone;

      const url =
          `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

      this.$("remind-wa-btn").onclick =
          () => window.open(url, "_blank");

      this.$("remind-copy-btn").onclick =
          async () => {
            await navigator.clipboard.writeText(msg);
            alert("Reminder copied!");
          };

      this.openModal("modal-remind");

    } catch (e) {
      alert("Unable to create reminder: " + e.message);
    }
  },

  async enterCustomerPortal() {
    if (!this.session || this.session.role !== "CUSTOMER") return;

    this.showView("view-customer-dashboard");
    await this.refreshCustomerPortal(this.session.data.id);
  },

  async refreshCustomerPortal(id) {
    try {
      const d = await DueTrackerAPI.getCustomerStatement(id);
      const c = d.customer;

      this.$("cp-name").textContent = c.name;
      this.$("cp-phone").textContent = c.phone;
      this.$("cp-purchases").textContent = this.fmt(d.totalPurchases);
      this.$("cp-payments").textContent = this.fmt(d.totalPayments);
      this.$("cp-due").textContent = this.fmt(d.pendingDue);

      const pay = this.$("cp-pay-area");

      pay.innerHTML = Number(d.pendingDue) > 0
          ? `<button class="btn btn-primary btn-lg"
             onclick="App.payOnline(${Number(d.pendingDue)})">
             💳 Pay Due — ${this.fmt(d.pendingDue)}
           </button>`
          : `<span class="store-chip"
             style="background:rgba(16,185,129,.15);
                    color:var(--green);
                    border-color:var(--green)">
             ✅ All Dues Cleared
           </span>`;

      const tbody = this.$("cp-txn-table");
      tbody.innerHTML = "";

      if (!d.transactions.length) {
        tbody.innerHTML = this.emptyRow(4, "📋", "No transactions yet");
        return;
      }

      d.transactions.forEach(t => {
        const purchase = t.type === "PURCHASE";
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${this.fmtDate(t.transactionDate)}</td>
          <td>
            <span class="badge ${purchase ? "badge-purchase" : "badge-payment"}">
              ${purchase ? "🛒 Purchase" : "💵 Payment"}
            </span>
          </td>
          <td class="${purchase ? "red" : "green"} fw">
            ${this.fmt(t.amount)}
          </td>
          <td>${this.esc(t.description || "—")}</td>`;

        tbody.appendChild(tr);
      });

    } catch (e) {
      console.error(e);
      alert("Unable to load customer data: " + e.message);
    }
  },

  payOnline(amount) {
    if (
        window.DueTrackerRazorpay &&
        typeof DueTrackerRazorpay.processPayment === "function"
    ) {
      DueTrackerRazorpay.processPayment(
          amount,
          this.session.data,
          async result => {
            try {
              await DueTrackerAPI.recordPayment(
                  this.session.data.id,
                  result.amount,
                  "Online Razorpay Payment",
                  result.paymentId
              );

              alert("✅ Payment successful and saved!");
              await this.refreshCustomerPortal(this.session.data.id);

            } catch (e) {
              alert(
                  "Payment succeeded but database save failed: " +
                  e.message
              );
            }
          }
      );
    } else {
      alert("Razorpay handler is not loaded.");
    }
  },

  loadSettings() {
    if (!this.session) return;

    const s = this.session.data;

    this.$("s-store").value = s.storeName || "";
    this.$("s-name").value = s.name || "";
    this.$("s-email").value = s.email || "";
    this.$("s-phone").value = s.phone || "";
  },

  async saveSettings(e) {
    e.preventDefault();

    alert(
        "Seller settings update requires a backend update endpoint."
    );
  },

  fmt(n) {
    return "₹" + Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },

  formatNumber(n) {
    return Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },

  fmtDate(v) {
    if (!v) return "—";

    const d = new Date(v);

    return d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }) + " " +
        d.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit"
        });
  },

  esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c]));
  },

  emptyRow(colspan, icon, title, text = "") {
    return `
      <tr>
        <td colspan="${colspan}">
          <div class="empty">
            <div class="empty-icon">${icon}</div>
            <h4>${title}</h4>
            ${text ? `<p>${text}</p>` : ""}
          </div>
        </td>
      </tr>`;
  }
};

document.addEventListener("DOMContentLoaded", () => App.init());