package com.duetracker.repository;

import com.duetracker.model.Seller;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SellerRepository extends JpaRepository<Seller, Long> {
    Optional<Seller> findByEmail(String email);
    Optional<Seller> findByPhone(String phone);
    Optional<Seller> findByEmailAndPassword(String email, String password);
    Optional<Seller> findByPhoneAndPassword(String phone, String password);
}
