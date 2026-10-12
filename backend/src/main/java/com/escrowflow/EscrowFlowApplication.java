package com.escrowflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement
public class EscrowFlowApplication {
    public static void main(String[] args) {
        SpringApplication.run(EscrowFlowApplication.class, args);
    }
}
