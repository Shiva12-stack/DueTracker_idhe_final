package com.duetracker.controller;

import com.duetracker.model.Customer;
import com.duetracker.model.Transaction;
import com.duetracker.service.CustomerService;
import com.duetracker.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "*")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private TransactionService transactionService;

    @GetMapping("/{customerId}")
    public ResponseEntity<Customer> getCustomerProfile(@PathVariable Long customerId) {
        Customer customer = customerService.getCustomerById(customerId);
        return ResponseEntity.ok(customer);
    }

    @GetMapping("/{customerId}/statement")
    public ResponseEntity<?> getStatement(@PathVariable Long customerId) {
        Customer customer = customerService.getCustomerById(customerId);
        List<Transaction> transactions = transactionService.getCustomerTransactions(customerId);

        BigDecimal totalPurchases = BigDecimal.ZERO;
        BigDecimal totalPayments = BigDecimal.ZERO;

        for (Transaction tx : transactions) {
            if ("PURCHASE".equalsIgnoreCase(tx.getType())) {
                totalPurchases = totalPurchases.add(tx.getAmount());
            } else if ("PAYMENT".equalsIgnoreCase(tx.getType())) {
                totalPayments = totalPayments.add(tx.getAmount());
            }
        }

        BigDecimal pendingDue = totalPurchases.subtract(totalPayments);
        if (pendingDue.compareTo(BigDecimal.ZERO) < 0) {
            pendingDue = BigDecimal.ZERO;
        }

        Map<String, Object> statement = new HashMap<>();
        statement.put("customer", customer);
        statement.put("transactions", transactions);
        statement.put("totalPurchases", totalPurchases);
        statement.put("totalPayments", totalPayments);
        statement.put("pendingDue", pendingDue);

        return ResponseEntity.ok(statement);
    }
}
