package com.duetracker.controller;

import com.duetracker.dto.DashboardSummaryDTO;
import com.duetracker.model.Customer;
import com.duetracker.service.CustomerService;
import com.duetracker.service.SellerService;
import com.duetracker.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sellers")
@CrossOrigin(origins = "*")
public class SellerController {

    @Autowired
    private SellerService sellerService;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private TransactionService transactionService;

    @GetMapping("/{sellerId}/dashboard")
    public ResponseEntity<DashboardSummaryDTO> getDashboard(@PathVariable Long sellerId) {
        DashboardSummaryDTO summary = transactionService.getSellerDashboardSummary(sellerId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/{sellerId}/customers")
    public ResponseEntity<List<Customer>> getCustomers(@PathVariable Long sellerId) {
        List<Customer> customers = customerService.getCustomersBySellerId(sellerId);
        return ResponseEntity.ok(customers);
    }

    @PostMapping("/{sellerId}/customers")
    public ResponseEntity<Customer> addCustomer(@PathVariable Long sellerId, @RequestBody Customer customer) {
        customer.setSellerId(sellerId);
        Customer saved = customerService.addCustomer(customer);
        return ResponseEntity.ok(saved);
    }
}
