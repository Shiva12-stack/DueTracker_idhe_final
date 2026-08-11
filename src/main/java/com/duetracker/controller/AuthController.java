package com.duetracker.controller;

import com.duetracker.dto.LoginRequestDTO;
import com.duetracker.dto.SellerRegisterDTO;
import com.duetracker.model.Customer;
import com.duetracker.model.Seller;
import com.duetracker.service.CustomerService;
import com.duetracker.service.SellerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private SellerService sellerService;

    @Autowired
    private CustomerService customerService;

    @PostMapping("/seller/register")
    public ResponseEntity<?> registerSeller(@RequestBody SellerRegisterDTO dto) {
        try {
            Seller registered = sellerService.registerSeller(dto);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("message", "Seller registered successfully!");
            resp.put("seller", registered);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping("/seller/login")
    public ResponseEntity<?> loginSeller(@RequestBody LoginRequestDTO dto) {
        try {
            Seller seller = sellerService.authenticateSeller(dto.getIdentifier(), dto.getPassword());
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("role", "SELLER");
            resp.put("seller", seller);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(401).body(err);
        }
    }

    @PostMapping("/customer/login")
    public ResponseEntity<?> loginCustomer(@RequestBody LoginRequestDTO dto) {
        try {
            Customer customer = customerService.authenticateCustomer(dto.getIdentifier(), dto.getPhone());
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("role", "CUSTOMER");
            resp.put("customer", customer);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.status(401).body(err);
        }
    }
}
