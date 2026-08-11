/* 
  Razorpay Online Payment Handler
  Handles online payment processing for Customer Portal PAY NOW
*/

window.DueTrackerRazorpay = {
  
  processPayment(amount, customer, onSuccess) {
    const formattedAmount = Number(amount).toFixed(2);
    
    // Check if Razorpay JS SDK is loaded
    if (typeof Razorpay !== 'undefined') {
      const options = {
        key: "rzp_test_duetracker_key", // Test key
        amount: Math.round(amount * 100), // amount in paise
        currency: "INR",
        name: "DueTracker Credit Payment",
        description: `Payment towards outstanding due for ${customer.name}`,
        image: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        handler: function (response) {
          console.log("Razorpay Payment Success:", response);
          onSuccess({
            paymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
            amount: amount
          });
        },
        prefill: {
          name: customer.name,
          email: customer.email || "",
          contact: customer.phone
        },
        theme: {
          color: "#6366f1"
        }
      };

      try {
        const rzp = new Razorpay(options);
        rzp.open();
        return;
      } catch (err) {
        console.warn("Razorpay SDK initialization fallback:", err);
      }
    }

    // Fallback Simulated Checkout Modal
    this.openSimulatedCheckout(formattedAmount, customer, onSuccess);
  },

  openSimulatedCheckout(amount, customer, onSuccess) {
    const modalHtml = `
      <div id="razorpay-simulation-modal" class="modal-overlay open">
        <div class="modal-card" style="border: 2px solid #6366f1; background: #0f172a;">
          <div style="text-align: center; margin-bottom: 1.5rem;">
            <div style="background: rgba(99, 102, 241, 0.2); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; color: #a5b4fc;">
              💳
            </div>
            <h3 style="font-size: 1.4rem;">Razorpay Checkout</h3>
            <p style="color: #94a3b8; font-size: 0.9rem;">Test Payment Gateway Mode</p>
          </div>

          <div style="background: rgba(30, 41, 59, 0.7); padding: 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; font-size: 0.95rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="color: #94a3b8;">Paying To:</span>
              <strong style="color: #ffffff;">DueTracker Shop</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="color: #94a3b8;">Customer:</span>
              <span>${customer.name} (${customer.phone})</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 700; color: #38bdf8; margin-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.75rem;">
              <span>Amount:</span>
              <span>₹${amount}</span>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label>Select Payment Method</label>
            <select id="rzp-pay-method" class="input-control">
              <option value="UPI">Razorpay UPI / Google Pay / PhonePe</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="NETBANKING">Net Banking</option>
            </select>
          </div>

          <div style="display: flex; gap: 1rem;">
            <button type="button" id="rzp-cancel-btn" class="btn btn-secondary" style="flex: 1;">Cancel</button>
            <button type="button" id="rzp-confirm-btn" class="btn btn-success" style="flex: 2;">
              Pay ₹${amount} Now
            </button>
          </div>
        </div>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    document.body.appendChild(wrapper);

    document.getElementById('rzp-cancel-btn').onclick = () => {
      wrapper.remove();
    };

    document.getElementById('rzp-confirm-btn').onclick = () => {
      const payId = 'pay_' + Math.random().toString(36).substr(2, 9);
      wrapper.remove();
      onSuccess({
        paymentId: payId,
        amount: amount
      });
    };
  }
};
