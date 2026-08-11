package com.duetracker.dto;

import java.math.BigDecimal;

public class DashboardSummaryDTO {
    private long totalCustomers;
    private BigDecimal totalPurchases;
    private BigDecimal totalPayments;
    private BigDecimal totalPendingDue;
    private String storeName;

    public DashboardSummaryDTO() {
        this.totalPurchases = BigDecimal.ZERO;
        this.totalPayments = BigDecimal.ZERO;
        this.totalPendingDue = BigDecimal.ZERO;
    }

    public DashboardSummaryDTO(long totalCustomers, BigDecimal totalPurchases, BigDecimal totalPayments, BigDecimal totalPendingDue, String storeName) {
        this.totalCustomers = totalCustomers;
        this.totalPurchases = totalPurchases;
        this.totalPayments = totalPayments;
        this.totalPendingDue = totalPendingDue;
        this.storeName = storeName;
    }

    public long getTotalCustomers() { return totalCustomers; }
    public void setTotalCustomers(long totalCustomers) { this.totalCustomers = totalCustomers; }

    public BigDecimal getTotalPurchases() { return totalPurchases; }
    public void setTotalPurchases(BigDecimal totalPurchases) { this.totalPurchases = totalPurchases; }

    public BigDecimal getTotalPayments() { return totalPayments; }
    public void setTotalPayments(BigDecimal totalPayments) { this.totalPayments = totalPayments; }

    public BigDecimal getTotalPendingDue() { return totalPendingDue; }
    public void setTotalPendingDue(BigDecimal totalPendingDue) { this.totalPendingDue = totalPendingDue; }

    public String getStoreName() { return storeName; }
    public void setStoreName(String storeName) { this.storeName = storeName; }
}
