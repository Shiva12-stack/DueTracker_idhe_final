package com.duetracker.service;

import com.duetracker.dto.DashboardSummaryDTO;
import com.duetracker.dto.PaymentRequestDTO;
import com.duetracker.dto.PurchaseRequestDTO;
import com.duetracker.model.Customer;
import com.duetracker.model.Seller;
import com.duetracker.model.Transaction;
import com.duetracker.repository.CustomerRepository;
import com.duetracker.repository.SellerRepository;
import com.duetracker.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private SellerRepository sellerRepository;

    public Transaction recordPurchase(PurchaseRequestDTO dto) {
        Transaction tx = new Transaction(
                dto.getCustomerId(),
                "PURCHASE",
                dto.getAmount(),
                dto.getDescription(),
                null
        );
        return transactionRepository.save(tx);
    }

    public Transaction recordPayment(PaymentRequestDTO dto) {
        Transaction tx = new Transaction(
                dto.getCustomerId(),
                "PAYMENT",
                dto.getAmount(),
                dto.getDescription() != null ? dto.getDescription() : "Customer Payment",
                dto.getPaymentId()
        );
        return transactionRepository.save(tx);
    }

    public List<Transaction> getCustomerTransactions(Long customerId) {
        return transactionRepository.findByCustomerIdOrderByTransactionDateDesc(customerId);
    }

    public DashboardSummaryDTO getSellerDashboardSummary(Long sellerId) {
        Seller seller = sellerRepository.findById(sellerId)
                .orElseThrow(() -> new RuntimeException("Seller not found"));

        List<Customer> customers = customerRepository.findBySellerId(sellerId);
        long totalCustomers = customers.size();

        BigDecimal totalPurchases = BigDecimal.ZERO;
        BigDecimal totalPayments = BigDecimal.ZERO;

        for (Customer c : customers) {
            List<Transaction> txList = transactionRepository.findByCustomerIdOrderByTransactionDateDesc(c.getId());
            for (Transaction tx : txList) {
                if ("PURCHASE".equalsIgnoreCase(tx.getType())) {
                    totalPurchases = totalPurchases.add(tx.getAmount());
                } else if ("PAYMENT".equalsIgnoreCase(tx.getType())) {
                    totalPayments = totalPayments.add(tx.getAmount());
                }
            }
        }

        BigDecimal totalPendingDue = totalPurchases.subtract(totalPayments);
        if (totalPendingDue.compareTo(BigDecimal.ZERO) < 0) {
            totalPendingDue = BigDecimal.ZERO;
        }

        return new DashboardSummaryDTO(totalCustomers, totalPurchases, totalPayments, totalPendingDue, seller.getStoreName());
    }
}
