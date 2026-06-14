from django.db import models
from django.contrib.auth.models import User
from splitwise_api.models import Group

class Activity(models.Model):
    ACTIVITY_TYPES = (
        ('expense_created', 'Expense Created'),
        ('expense_updated', 'Expense Updated'),
        ('expense_deleted', 'Expense Deleted'),
        ('settlement_made', 'Settlement Made'),
        ('member_added', 'Member Added'),
        ('member_removed', 'Member Removed'),
        ('chat_message', 'Chat Message'),
    )
    type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities_done', null=True, blank=True)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='activities', null=True, blank=True)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Activities'

    def __str__(self):
        username = self.user.username if self.user else "System"
        return f"{username} - {self.type} - {self.description[:30]}"
