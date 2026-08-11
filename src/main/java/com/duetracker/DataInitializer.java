package com.duetracker;

import com.duetracker.model.Customer;
import com.duetracker.model.Seller;
import com.duetracker.model.Transaction;
import com.duetracker.repository.CustomerRepository;
import com.duetracker.repository.SellerRepository;
import com.duetracker.repository.TransactionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner seedDemoData(
            SellerRepository sellerRepo,
            CustomerRepository customerRepo,
            TransactionRepository txnRepo) {

        return args -> {
            // Only seed if no sellers exist
            if (sellerRepo.count() > 0) return;

            // Demo Seller
            Seller seller = new Seller("Ramesh Gupta", "ramesh@guptastore.com",
                    "9876543210", "seller123", "Gupta General Store");
            seller = sellerRepo.save(seller);

            // Demo Customers
            Customer c1 = new Customer(seller.getId(), "Rahul Sharma",
                    "9123456789", "rahul@email.com", "Gandhi Nagar, Delhi");
            c1 = customerRepo.save(c1);

            Customer c2 = new Customer(seller.getId(), "Priya Patel",
                    "9876512345", "", "MG Road, Ahmedabad");
            c2 = customerRepo.save(c2);

            // Demo Transactions
            txnRepo.save(new Transaction(c1.getId(), "PURCHASE",
                    new BigDecimal("1500.00"), "Rice 10kg, Oil 5L", null));
            txnRepo.save(new Transaction(c1.getId(), "PAYMENT",
                    new BigDecimal("500.00"), "Cash payment", null));
            txnRepo.save(new Transaction(c2.getId(), "PURCHASE",
                    new BigDecimal("2200.00"), "Monthly groceries", null));

            System.out.println("========================================");
            System.out.println(" DueTracker started on port 8889");
            System.out.println(" Open: http://localhost:8889");
            System.out.println(" Demo login: ramesh@guptastore.com / seller123");
            System.out.println("========================================");
        };
    }
}
