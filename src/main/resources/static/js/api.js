/*
  DueTracker API Client Layer
  Backend-first API client
  All create/update/delete/payment operations are stored through Spring Boot
  and therefore in the Aiven MySQL database.
*/

const API_BASE = 'https://duetracker.onrender.com/api';

// Keep local data only for existing frontend fallback/read compatibility.
// Database-changing operations NEVER save to this local DB.
const mockDB = {
  sellers: JSON.parse(localStorage.getItem('dt_sellers') || '[]'),
  customers: JSON.parse(localStorage.getItem('dt_customers') || '[]'),
  transactions: JSON.parse(localStorage.getItem('dt_transactions') || '[]')
};

// Existing demo data for frontend compatibility only.
// This does NOT write anything to Aiven.
if (mockDB.sellers.length === 0) {
  mockDB.sellers.push({
    id: 1,
    name: 'Ramesh Gupta',
    email: 'ramesh@guptastore.com',
    phone: '9876543210',
    password: 'seller123',
    storeName: 'Gupta General Store'
  });

  localStorage.setItem(
      'dt_sellers',
      JSON.stringify(mockDB.sellers)
  );
}

if (mockDB.customers.length === 0) {
  mockDB.customers.push({
    id: 1,
    sellerId: 1,
    name: 'Rahul Sharma',
    phone: '9123456789',
    email: 'rahul@gmail.com',
    address: 'Flat 302, Green Avenue, Delhi'
  });

  localStorage.setItem(
      'dt_customers',
      JSON.stringify(mockDB.customers)
  );
}


// =====================================================
// API
// =====================================================

window.DueTrackerAPI = {

  // ===================================================
  // 1. SELLER REGISTRATION
  // ===================================================

  async registerSeller(data) {

    const res = await fetch(
        `${API_BASE}/auth/seller/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
    );

    const text = await res.text();

    let result;

    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { message: text };
    }

    if (!res.ok) {
      throw new Error(
          result.message ||
          result.error ||
          'Seller registration failed'
      );
    }

    // IMPORTANT:
    // Do NOT save seller to mockDB/localStorage.
    // Backend has already saved it to Aiven.
    return result;
  },


  // ===================================================
  // 2. SELLER LOGIN
  // ===================================================

  async loginSeller(identifier, password) {

    const res = await fetch(
        `${API_BASE}/auth/seller/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            identifier,
            password
          })
        }
    );

    const text = await res.text();

    let result;

    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { message: text };
    }

    if (!res.ok) {
      throw new Error(
          result.message ||
          result.error ||
          'Invalid seller login credentials'
      );
    }

    return result;
  },


  // ===================================================
  // 3. CUSTOMER LOGIN
  // ===================================================

  async loginCustomer(name, phone) {

    const res = await fetch(
        `${API_BASE}/auth/customer/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            identifier: name,
            phone
          })
        }
    );

    const text = await res.text();

    let result;

    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { message: text };
    }

    if (!res.ok) {
      throw new Error(
          result.message ||
          result.error ||
          'Customer account not found'
      );
    }

    return result;
  },


  // ===================================================
  // 4. SELLER DASHBOARD
  // ===================================================

  async getSellerDashboard(sellerId) {

    const res = await fetch(
        `${API_BASE}/sellers/${sellerId}/dashboard`
    );

    const text = await res.text();

    let result;

    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = {};
    }

    if (!res.ok) {
      throw new Error(
          result.message ||
          result.error ||
          'Unable to load seller dashboard'
      );
    }

    return result;
  },


  // ===================================================
  // 5. GET CUSTOMERS
  // ===================================================

  async getCustomers(sellerId) {

    const res = await fetch(
        `${API_BASE}/sellers/${sellerId}/customers`
    );

    const text = await res.text();

    let result;

    try {
      result = text ? JSON.parse(text) : [];
    } catch {
      result = [];
    }

    if (!res.ok) {
      throw new Error(
          result.message ||
          result.error ||
          'Unable to load customers'
      );
    }

    return result;
  },


  // ===================================================
  // 6. ADD CUSTOMER
  // ===================================================

  async addCustomer(sellerId, customerData) {

    const res = await fetch(
        `${API_BASE}/sellers/${sellerId}/customers`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(customerData)
        }
    );

    const text = await res.text();

    let result;

    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { message: text };
    }

    if (!res.ok) {
      throw new Error(
          result.message ||
          result.error ||
          `Customer save failed (${res.status})`
      );
    }

    // IMPORTANT:
    // No mockDB/customers push here.
    // Backend must save customer to Aiven.
    return result;
  },


  // ===================================================
  // 7. UPDATE CUSTOMER
  // ===================================================

  async updateCustomer(customerId, updatedData) {

    const res = await fetch(
        `${API_BASE}/customers/${customerId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatedData)
        }
    );

    const text = await res.text();

    let result;

    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { message: text };
    }

    if (!res.ok) {
      throw new Error(
          result.message ||
          result.error ||
          `Customer update failed (${res.status})`
      );
    }

    return result;
  },


  // ===================================================
  // 8. DELETE CUSTOMER
  // ===================================================

  async deleteCustomer(customerId) {

    const res = await fetch(
        `${API_BASE}/customers/${customerId}`,
        {
          method: 'DELETE'
        }
    );

    const text = await res.text();

    let result;

    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { message: text };
    }

    if (!res.ok) {
      throw new Error(
          result.message ||
          result.error ||
          `Customer deletion failed (${res.status})`
      );
    }

    return result;
  },


  // ===================================================
  // 9. RECORD PURCHASE
  // ===================================================

  async recordPurchase(
      customerId,
      amount,
      description
  ) {

    const res = await fetch(
        `${API_BASE}/transactions/purchase`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            customerId,
            amount,
            description
          })
        }
    );

    const text = await res.text();

    let result;

    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { message: text };
    }

    if (!res.ok) {
      throw new Error(
          result.message ||
          result.error ||
          `Purchase save failed (${res.status})`
      );
    }

    // No local transaction fallback.
    return result;
  },


  // ===================================================
  // 10. RECORD PAYMENT
  // ===================================================

  async recordPayment(
      customerId,
      amount,
      description,
      paymentId = null
  ) {

    const res = await fetch(
        `${API_BASE}/transactions/payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            customerId,
            amount,
            description,
            paymentId
          })
        }
    );

    const text = await res.text();

    let result;

    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = { message: text };
    }

    if (!res.ok) {
      throw new Error(
          result.message ||
          result.error ||
          `Payment save failed (${res.status})`
      );
    }

    // No local transaction fallback.
    return result;
  },


  // ===================================================
  // 11. CUSTOMER STATEMENT
  // ===================================================

  async getCustomerStatement(customerId) {

    const res = await fetch(
        `${API_BASE}/customers/${customerId}/statement`
    );

    const text = await res.text();

    let result;

    try {
      result = text ? JSON.parse(text) : {};
    } catch {
      result = {};
    }

    if (!res.ok) {
      throw new Error(
          result.message ||
          result.error ||
          'Unable to load customer statement'
      );
    }

    return result;
  }

};