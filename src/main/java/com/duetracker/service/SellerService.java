package com.duetracker.service;

import com.duetracker.dto.SellerRegisterDTO;
import com.duetracker.model.Seller;
import com.duetracker.repository.SellerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class SellerService {

    @Autowired
    private SellerRepository sellerRepository;

    public Seller registerSeller(SellerRegisterDTO dto) {
        if (sellerRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("Seller with email " + dto.getEmail() + " already exists!");
        }
        Seller seller = new Seller(
                dto.getName(),
                dto.getEmail(),
                dto.getPhone(),
                dto.getPassword(), // In production, hash with BCrypt
                dto.getStoreName()
        );
        return sellerRepository.save(seller);
    }

    public Seller authenticateSeller(String identifier, String password) {
        Optional<Seller> sellerOpt = sellerRepository.findByEmailAndPassword(identifier, password);
        if (!sellerOpt.isPresent()) {
            sellerOpt = sellerRepository.findByPhoneAndPassword(identifier, password);
        }
        return sellerOpt.orElseThrow(() -> new RuntimeException("Invalid seller email/phone or password!"));
    }

    public Seller getSellerById(Long id) {
        return sellerRepository.findById(id).orElseThrow(() -> new RuntimeException("Seller not found!"));
    }
}
