package com.duetracker.controller;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/razorpay")
@CrossOrigin
public class RazorpayController {

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    // Create Razorpay Order
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> request) {

        try {
            double amount = Double.parseDouble(
                    request.get("amount").toString()
            );

            if (amount <= 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Amount must be greater than 0"));
            }

            // Convert rupees to paise
            int amountInPaise = (int) Math.round(amount * 100);

            RazorpayClient razorpay =
                    new RazorpayClient(keyId, keySecret);

            JSONObject orderRequest = new JSONObject();

            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put(
                    "receipt",
                    "due_" + System.currentTimeMillis()
            );

            Order order = razorpay.orders.create(orderRequest);

            Map<String, Object> response = new HashMap<>();

            response.put("id", order.get("id"));
            response.put("amount", amountInPaise);
            response.put("currency", "INR");
            response.put("keyId", keyId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "error",
                            "Unable to create Razorpay order"
                    ));
        }
    }

    // Verify Razorpay Payment
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(
            @RequestBody Map<String, String> request) {

        try {

            String orderId =
                    request.get("razorpay_order_id");

            String paymentId =
                    request.get("razorpay_payment_id");

            String signature =
                    request.get("razorpay_signature");

            if (orderId == null ||
                    paymentId == null ||
                    signature == null) {

                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "message",
                                "Missing payment details"
                        ));
            }

            JSONObject options = new JSONObject();

            options.put("razorpay_order_id", orderId);
            options.put("razorpay_payment_id", paymentId);
            options.put("razorpay_signature", signature);

            boolean verified =
                    Utils.verifyPaymentSignature(
                            options,
                            keySecret
                    );

            if (verified) {

                return ResponseEntity.ok(
                        Map.of(
                                "success", true,
                                "message",
                                "Payment verified successfully",
                                "paymentId",
                                paymentId
                        )
                );

            } else {

                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "message",
                                "Payment verification failed"
                        ));
            }

        } catch (Exception e) {

            e.printStackTrace();

            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "success", false,
                            "message",
                            "Payment verification error"
                    ));
        }
    }
}