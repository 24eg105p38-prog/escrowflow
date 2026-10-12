package com.escrowflow.controller;

import com.escrowflow.config.JwtTokenProvider;
import com.escrowflow.model.Notification;
import com.escrowflow.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtTokenProvider jwtTokenProvider;

    public NotificationController(NotificationService notificationService, JwtTokenProvider jwtTokenProvider) {
        this.notificationService = notificationService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    private Long extractUserId(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return jwtTokenProvider.getUserIdFromJWT(bearer.substring(7));
        }
        throw new RuntimeException("Unauthorized");
    }

    /**
     * Representative REST Endpoint from Table 8:
     * GET /api/notifications -> Retrieve the authenticated user's notification log
     */
    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(HttpServletRequest request) {
        Long userId = extractUserId(request);
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    @PostMapping("/mark-read")
    public ResponseEntity<?> markAllRead(HttpServletRequest request) {
        Long userId = extractUserId(request);
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markSingleRead(@PathVariable Long id, HttpServletRequest request) {
        Long userId = extractUserId(request);
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
    }
}
