package com.duetracker.service;

import com.duetracker.model.Customer;
import com.duetracker.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    public Customer addCustomer(Customer customer) {
        return customerRepository.save(customer);
    }

    public List<Customer> getCustomersBySellerId(Long sellerId) {
        return customerRepository.findBySellerId(sellerId);
    }

    public Customer authenticateCustomer(String name, String phone) {
        return customerRepository.findByNameAndPhone(name, phone)
                .orElseGet(() -> customerRepository.findByPhone(phone)
                        .orElseThrow(() -> new RuntimeException("No customer found matching provided name & phone number.")));
    }

    public Customer getCustomerById(Long id) {
        return customerRepository.findById(id).orElseThrow(() -> new RuntimeException("Customer not found!"));
    }
}
