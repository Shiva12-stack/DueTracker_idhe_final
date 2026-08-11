package com.duetracker.repository;

import com.duetracker.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByCustomerIdOrderByTransactionDateDesc(Long customerId);
    List<Transaction> findByCustomerIdInOrderByTransactionDateDesc(List<Long> customerIds);
}
