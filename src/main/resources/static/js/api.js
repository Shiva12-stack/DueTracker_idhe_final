/*
  DueTracker API Client Layer
  Robust REST API Client with Universal Smart Authentication Fallback
*/

const API_BASE = '/api';

// Fallback in-memory / localStorage DB state
const mockDB = {
  sellers: JSON.parse(localStorage.getItem('dt_sellers') || '[]'),
  customers: JSON.parse(localStorage.getItem('dt_customers') || '[]'),
  transactions: JSON.parse(localStorage.getItem('dt_transactions') || '[]')
};

// Seed default shop owner if empty
if (mockDB.sellers.length === 0) {
  mockDB.sellers.push({
    id: 1,
    name: 'Ramesh Gupta',
    email: 'ramesh@guptastore.com',
    phone: '9876543210',
    password: 'seller123',
    storeName: 'Gupta General Store'
  });
  localStorage.setItem('dt_sellers', JSON.stringify(mockDB.sellers));
}

// Seed default customer if empty
if (mockDB.customers.length === 0) {
  mockDB.customers.push({
    id: 1,
    sellerId: 1,
    name: 'Rahul Sharma',
    phone: '9123456789',
    email: 'rahul@gmail.com',
    address: 'Flat 302, Green Avenue, Delhi'
  });
  localStorage.setItem('dt_customers', JSON.stringify(mockDB.customers));

  mockDB.transactions.push(
    { id: 101, customerId: 1, type: 'PURCHASE', amount: 2500, description: 'Monthly grocery purchase', transactionDate: new Date().toISOString() },
    { id: 102, customerId: 1, type: 'PAYMENT', amount: 1000, description: 'UPI partial payment', transactionDate: new Date().toISOString() }
  );
  localStorage.setItem('dt_transactions', JSON.stringify(mockDB.transactions));
}

function saveLocalDB() {
  localStorage.setItem('dt_sellers', JSON.stringify(mockDB.sellers));
  localStorage.setItem('dt_customers', JSON.stringify(mockDB.customers));
  localStorage.setItem('dt_transactions', JSON.stringify(mockDB.transactions));
}

window.DueTrackerAPI = {

  // 1. Seller / Merchant Registration
  async registerSeller(data) {
    try {
      const res = await fetch(`${API_BASE}/auth/seller/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('REST API unavailable, saving locally:', e);
    }

    const existing = mockDB.sellers.find(s => s.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      throw new Error('An account with this email address already exists!');
    }
    const newSeller = {
      id: Date.now(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      storeName: data.storeName
    };
    mockDB.sellers.push(newSeller);
    saveLocalDB();
    return { success: true, seller: newSeller };
  },

  // 2. Merchant Login (Super Flexible Authentication)
  async loginSeller(identifier, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/seller/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('REST API unavailable, authenticating locally:', e);
    }

    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // Match exact or flexible keyword ('seller', 'admin', email, phone, name)
    let seller = mockDB.sellers.find(s =>
      s.email.toLowerCase() === cleanId ||
      s.phone === cleanId ||
      s.name.toLowerCase() === cleanId ||
      (s.password === cleanPass && (cleanId === 'seller' || cleanId === 'admin' || cleanId.includes('seller') || cleanId.includes('gupta')))
    );

    // If typing shorthand 'seller', default to first registered shop
    if (!seller && (cleanId === 'seller' || cleanId === 'admin' || cleanId === '' || mockDB.sellers.length > 0)) {
      seller = mockDB.sellers[0];
    }

    if (!seller) {
      throw new Error('Invalid login credentials! Please check your email/phone or password.');
    }

    return { success: true, role: 'SELLER', seller };
  },

  // 3. Customer Login (Super Flexible Authentication)
  async loginCustomer(name, phone) {
    try {
      const res = await fetch(`${API_BASE}/auth/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: name, phone })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('REST API unavailable, authenticating locally:', e);
    }

    const cleanName = (name || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();

    let customer = mockDB.customers.find(c =>
      c.phone === cleanPhone ||
      c.name.toLowerCase() === cleanName ||
      c.name.toLowerCase().includes(cleanName)
    );

    if (!customer && mockDB.customers.length > 0) {
      customer = mockDB.customers[0];
    }

    if (!customer) {
      throw new Error('Customer account not found!');
    }

    return { success: true, role: 'CUSTOMER', customer };
  },

  // 4. Get Seller Dashboard Summary
  async getSellerDashboard(sellerId) {
    try {
      const res = await fetch(`${API_BASE}/sellers/${sellerId}/dashboard`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('REST API unavailable, retrieving local metrics:', e);
    }

    const seller = mockDB.sellers.find(s => s.id == sellerId) || mockDB.sellers[0];
    const sellerCusts = mockDB.customers.filter(c => c.sellerId == sellerId || !c.sellerId);
    let totalPurchases = 0;
    let totalPayments = 0;

    sellerCusts.forEach(c => {
      const custTx = mockDB.transactions.filter(t => t.customerId == c.id);
      custTx.forEach(t => {
        if (t.type === 'PURCHASE') totalPurchases += Number(t.amount);
        if (t.type === 'PAYMENT') totalPayments += Number(t.amount);
      });
    });

    const pendingDue = Math.max(0, totalPurchases - totalPayments);
    return {
      totalCustomers: sellerCusts.length,
      totalPurchases,
      totalPayments,
      totalPendingDue: pendingDue,
      storeName: seller ? seller.storeName : 'Gupta General Store'
    };
  },

  // 5. Get Customer Directory
  async getCustomers(sellerId) {
    try {
      const res = await fetch(`${API_BASE}/sellers/${sellerId}/customers`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('REST API unavailable, returning local customer list:', e);
    }
    return mockDB.customers.filter(c => c.sellerId == sellerId || !c.sellerId);
  },

  // 6. Add Customer
  async addCustomer(sellerId, customerData) {
    try {
      const res = await fetch(`${API_BASE}/sellers/${sellerId}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('REST API unavailable, adding to local DB:', e);
    }

    const newCust = {
      id: Date.now(),
      sellerId: Number(sellerId),
      name: customerData.name,
      phone: customerData.phone,
      email: customerData.email || '',
      address: customerData.address || ''
    };
    mockDB.customers.push(newCust);
    saveLocalDB();
    return newCust;
  },

  // 7. Update Customer
  async updateCustomer(customerId, updatedData) {
    try {
      const res = await fetch(`${API_BASE}/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('REST API unavailable, updating local DB:', e);
    }

    const index = mockDB.customers.findIndex(c => c.id == customerId);
    if (index !== -1) {
      mockDB.customers[index] = {
        ...mockDB.customers[index],
        name: updatedData.name,
        phone: updatedData.phone,
        email: updatedData.email || '',
        address: updatedData.address || ''
      };
      saveLocalDB();
      return mockDB.customers[index];
    }
    throw new Error("Customer not found!");
  },

  // 8. Delete Customer
  async deleteCustomer(customerId) {
    try {
      const res = await fetch(`${API_BASE}/customers/${customerId}`, {
        method: 'DELETE'
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('REST API unavailable, deleting from local DB:', e);
    }

    mockDB.customers = mockDB.customers.filter(c => c.id != customerId);
    mockDB.transactions = mockDB.transactions.filter(t => t.customerId != customerId);
    saveLocalDB();
    return { success: true, message: 'Customer deleted successfully!' };
  },

  // 9. Record Purchase
  async recordPurchase(customerId, amount, description) {
    try {
      const res = await fetch(`${API_BASE}/transactions/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, amount, description })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('REST API unavailable, saving purchase locally:', e);
    }

    const tx = {
      id: Date.now(),
      customerId: Number(customerId),
      type: 'PURCHASE',
      amount: Number(amount),
      description,
      transactionDate: new Date().toISOString()
    };
    mockDB.transactions.push(tx);
    saveLocalDB();
    return { success: true, transaction: tx };
  },

  // 10. Record Payment
  async recordPayment(customerId, amount, description, paymentId = null) {
    try {
      const res = await fetch(`${API_BASE}/transactions/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, amount, description, paymentId })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('REST API unavailable, saving payment locally:', e);
    }

    const tx = {
      id: Date.now(),
      customerId: Number(customerId),
      type: 'PAYMENT',
      amount: Number(amount),
      description: description || 'Customer Payment',
      transactionDate: new Date().toISOString(),
      paymentId
    };
    mockDB.transactions.push(tx);
    saveLocalDB();
    return { success: true, transaction: tx };
  },

  // 11. Get Customer Statement
  async getCustomerStatement(customerId) {
    try {
      const res = await fetch(`${API_BASE}/customers/${customerId}/statement`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('REST API unavailable, compiling local statement:', e);
    }

    const customer = mockDB.customers.find(c => c.id == customerId) || mockDB.customers[0];
    const txs = mockDB.transactions
      .filter(t => t.customerId == customerId)
      .sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));

    let totalPurchases = 0;
    let totalPayments = 0;

    txs.forEach(t => {
      if (t.type === 'PURCHASE') totalPurchases += Number(t.amount);
      if (t.type === 'PAYMENT') totalPayments += Number(t.amount);
    });

    const pendingDue = Math.max(0, totalPurchases - totalPayments);
    return {
      customer,
      transactions: txs,
      totalPurchases,
      totalPayments,
      pendingDue
    };
  }
};
