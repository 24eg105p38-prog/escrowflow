package com.escrowflow.service;

import com.escrowflow.model.Notification;
import com.escrowflow.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public void notifyUser(Long userId, Long actorId, Long contractId, Long milestoneId, String message) {
        notificationRepository.create(userId, actorId, contractId, milestoneId, message);
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserId(userId);
    }

    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    public void markAsRead(Long notifId, Long userId) {
        notificationRepository.markAsRead(notifId, userId);
    }
}
