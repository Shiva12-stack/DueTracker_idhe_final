/* 
  Razorpay Online Payment Handler
  Creates a real order via the backend, opens Razorpay checkout,
  then verifies the payment via the backend before saving it.
*/

window.DueTrackerRazorpay = {

  async processPayment(amount, customer, onSuccess) {

    if (typeof Razorpay === 'undefined') {
      alert("Payment gateway failed to load. Please check your internet connection and try again.");
      return;
    }

    try {
      // Step 1: Ask OUR backend to create a real Razorpay order
      const orderRes = await fetch(`${API_BASE}/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });

      const order = await orderRes.json();

      if (!orderRes.ok || !order.id) {
        alert("❌ Unable to start payment: " + (order.error || "order creation failed"));
        return;
      }

      // Step 2: Open Razorpay checkout using the REAL order + REAL key from backend
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: "DueTracker Credit Payment",
        description: `Payment towards outstanding due for ${customer.name}`,
        handler: async function (response) {
          try {
            // Step 3: Verify the payment via OUR backend before trusting it
            const verifyRes = await fetch(`${API_BASE}/razorpay/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyResult = await verifyRes.json();

            if (verifyRes.ok && verifyResult.success) {
              onSuccess({
                paymentId: verifyResult.paymentId,
                amount: amount
              });
            } else {
              alert("❌ Payment verification failed: " + (verifyResult.message || "unknown error"));
            }
          } catch (err) {
            alert("❌ Payment verification error: " + err.message);
          }
        },
        prefill: {
          name: customer.name,
          email: customer.email || "",
          contact: customer.phone
        },
        theme: { color: "#6366f1" }
      };

      const rzp = new Razorpay(options);
      rzp.open();

    } catch (err) {
      alert("❌ Payment could not be started: " + err.message);
    }
  }
};