package com.duetracker.controller;

import com.duetracker.dto.PaymentRequestDTO;
import com.duetracker.dto.PurchaseRequestDTO;
import com.duetracker.model.Transaction;
import com.duetracker.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @PostMapping("/purchase")
    public ResponseEntity<?> recordPurchase(@RequestBody PurchaseRequestDTO dto) {
        try {
            Transaction tx = transactionService.recordPurchase(dto);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("message", "Purchase transaction recorded successfully!");
            resp.put("transaction", tx);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/payment")
    public ResponseEntity<?> recordPayment(@RequestBody PaymentRequestDTO dto) {
        try {
            Transaction tx = transactionService.recordPayment(dto);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("message", "Payment transaction recorded successfully!");
            resp.put("transaction", tx);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}
