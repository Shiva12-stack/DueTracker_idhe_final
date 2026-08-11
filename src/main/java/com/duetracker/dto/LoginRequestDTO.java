package com.duetracker.dto;

public class LoginRequestDTO {
    private String identifier; // email or phone or name
    private String password;   // for seller
    private String phone;      // for customer

    public LoginRequestDTO() {}

    public String getIdentifier() { return identifier; }
    public void setIdentifier(String identifier) { this.identifier = identifier; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
