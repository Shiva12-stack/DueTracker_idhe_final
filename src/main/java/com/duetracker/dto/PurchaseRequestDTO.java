package com.duetracker.dto;

import java.math.BigDecimal;

public class PurchaseRequestDTO {
    private Long customerId;
    private BigDecimal amount;
    private String description;

    public PurchaseRequestDTO() {}

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
