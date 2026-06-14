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
