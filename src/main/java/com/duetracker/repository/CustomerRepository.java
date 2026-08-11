package com.duetracker.repository;

import com.duetracker.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    List<Customer> findBySellerId(Long sellerId);
    Optional<Customer> findByNameAndPhone(String name, String phone);
    Optional<Customer> findByPhone(String phone);
}
