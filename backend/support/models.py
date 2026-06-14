from django.db import models
from django.contrib.auth.models import User

class SupportTicket(models.Model):
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('resolved', 'Resolved'),
    )
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='support_tickets')
    name = models.CharField(max_name=255) if False else models.CharField(max_length=255, null=True, blank=True) # for guest users
    email = models.EmailField(null=True, blank=True) # for guest users
    subject = models.CharField(max_length=255)
    message = models.TextField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        submitter = self.user.username if self.user else self.email or "Guest"
        return f"Ticket {self.id}: {self.subject} by {submitter} ({self.status})"
