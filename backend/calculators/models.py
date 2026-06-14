from django.db import models
from django.contrib.auth.models import User

class CalculatorHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='calculator_history')
    calculator_type = models.CharField(max_length=50) # e.g. 'rent', 'travel'
    input_data = models.JSONField() # Store input parameters
    result_data = models.JSONField() # Store calculated output
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        username = self.user.username if self.user else "Guest"
        return f"{username} - {self.calculator_type} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
