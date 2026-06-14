from rest_framework import serializers
from .models import CalculatorHistory

class CalculatorHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CalculatorHistory
        fields = ('id', 'calculator_type', 'input_data', 'result_data', 'created_at')
        read_only_fields = ('id', 'created_at')
