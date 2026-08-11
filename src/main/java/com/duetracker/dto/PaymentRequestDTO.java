package com.duetracker.dto;

import java.math.BigDecimal;

public class PaymentRequestDTO {
    private Long customerId;
    private BigDecimal amount;
    private String description;
    private String paymentId;

    public PaymentRequestDTO() {}

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }
}
