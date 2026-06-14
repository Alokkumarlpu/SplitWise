from django.db import models
from django.contrib.auth.models import User

class Group(models.Model):
    name = models.CharField(max_name=255) if False else models.CharField(max_length=255)  # Safe CharField
    members = models.ManyToManyField(User, related_name='splitwise_groups')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Expense(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='expenses')
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expenses_paid')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.description} ({self.amount})"

class ExpenseSplit(models.Model):
    SPLIT_TYPES = (
        ('equal', 'Equal'),
        ('unequal', 'Unequal'),
        ('percentage', 'Percentage'),
        ('shares', 'Shares'),
    )
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='splits')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='expense_splits')
    amount = models.DecimalField(max_digits=12, decimal_places=2) # Owed amount
    split_type = models.CharField(max_length=15, choices=SPLIT_TYPES)
    split_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True) # Percent, Share, or custom amount value

    def __str__(self):
        return f"{self.user.username} owes {self.amount} for {self.expense.description}"

class Settlement(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='settlements')
    payer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='settlements_paid')
    payee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='settlements_received')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.payer.username} paid {self.payee.username} {self.amount} in {self.group.name}"

class ChatMessage(models.Model):
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='chat_messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} on {self.expense.description}: {self.message[:20]}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    full_name = models.CharField(max_length=255, null=True, blank=True)
    phone_number = models.CharField(max_length=30, null=True, blank=True)
    avatar_base64 = models.TextField(null=True, blank=True)  # Store Base64 string directly for Render compatibility
    default_currency = models.CharField(max_length=10, default='INR')
    timezone = models.CharField(max_length=50, default='UTC')
    language = models.CharField(max_length=10, default='en')

    def __str__(self):
        return f"Profile for {self.user.username}"

class NotificationPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notifications')
    # Group Notification Preferences
    notify_group_added = models.BooleanField(default=True)
    notify_friend_added = models.BooleanField(default=True)
    # Expense Notification Preferences
    notify_expense_added = models.BooleanField(default=True)
    notify_expense_updated = models.BooleanField(default=True)
    notify_expense_comment = models.BooleanField(default=True)
    notify_expense_due = models.BooleanField(default=True)
    notify_payment_received = models.BooleanField(default=True)
    # News & Updates
    notify_monthly_summary = models.BooleanField(default=True)
    notify_product_updates = models.BooleanField(default=True)
    notify_tips = models.BooleanField(default=True)

    def __str__(self):
        return f"Notification Preferences for {self.user.username}"

class PrivacySettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='privacy')
    discoverable = models.BooleanField(default=True)

    def __str__(self):
        return f"Privacy Settings for {self.user.username}"

class UserSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    jti = models.CharField(max_length=255, unique=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Session {self.jti[:8]} for {self.user.username}"

class BlockedUser(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocking')
    blocked_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'blocked_user')

    def __str__(self):
        return f"{self.user.username} blocked {self.blocked_user.username}"

# Signals to automatically create profiles and preferences upon User creation
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def create_user_settings(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
        NotificationPreference.objects.create(user=instance)
        PrivacySettings.objects.create(user=instance)

