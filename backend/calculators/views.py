from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from decimal import Decimal
from .models import CalculatorHistory
from .serializers import CalculatorHistorySerializer

class CalculatorHistoryListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        history = CalculatorHistory.objects.filter(user=request.user).order_by('-created_at')
        serializer = CalculatorHistorySerializer(history, many=True)
        return Response(serializer.data)

class RentCalculatorView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            total_amount = Decimal(str(request.data.get('total_amount', 0)))
            participants = int(request.data.get('participants', 1))
            room_weights = request.data.get('room_weights') # Expecting list of weights or None
        except (ValueError, TypeError) as e:
            return Response({"error": "Invalid input formats."}, status=status.HTTP_400_BAD_REQUEST)

        if total_amount <= 0 or participants <= 0:
            return Response({"error": "Total amount and participants count must be positive."}, status=status.HTTP_400_BAD_REQUEST)

        if room_weights:
            try:
                weights = [Decimal(str(w)) for w in room_weights]
            except Exception:
                return Response({"error": "Room size weights must be numbers."}, status=status.HTTP_400_BAD_REQUEST)

            if len(weights) != participants:
                return Response({"error": "Number of room weights must equal number of roommates."}, status=status.HTTP_400_BAD_REQUEST)

            total_weight = sum(weights)
            if total_weight <= 0:
                return Response({"error": "Sum of room weights must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)

            splits = []
            for w in weights:
                val = (total_amount * w / total_weight).quantize(Decimal('0.01'))
                splits.append(val)

            # Roundoff error fix
            diff = total_amount - sum(splits)
            if diff != 0:
                splits[0] += diff

            per_person_avg = (total_amount / Decimal(participants)).quantize(Decimal('0.01'))
            result_data = {
                "per_person": str(per_person_avg),
                "splits": [str(s) for s in splits]
            }
        else:
            per_person = (total_amount / Decimal(participants)).quantize(Decimal('0.01'))
            # Roundoff error adjustments
            splits = [per_person] * participants
            diff = total_amount - sum(splits)
            if diff != 0:
                splits[0] += diff

            result_data = {
                "per_person": str(per_person),
                "splits": [str(s) for s in splits]
            }

        # Log history if user is authenticated
        if request.user and request.user.is_authenticated:
            CalculatorHistory.objects.create(
                user=request.user,
                calculator_type='rent',
                input_data=request.data,
                result_data=result_data
            )

        return Response(result_data)

class TravelCalculatorView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            total_amount = Decimal(str(request.data.get('total_amount', 0)))
            participants = int(request.data.get('participants', 1))
        except (ValueError, TypeError) as e:
            return Response({"error": "Invalid input formats."}, status=status.HTTP_400_BAD_REQUEST)

        if total_amount <= 0 or participants <= 0:
            return Response({"error": "Total amount and participants count must be positive."}, status=status.HTTP_400_BAD_REQUEST)

        per_person = (total_amount / Decimal(participants)).quantize(Decimal('0.01'))
        splits = [per_person] * participants
        diff = total_amount - sum(splits)
        if diff != 0:
            splits[0] += diff

        result_data = {
            "per_person": str(per_person),
            "splits": [str(s) for s in splits]
        }

        # Log history if user is authenticated
        if request.user and request.user.is_authenticated:
            CalculatorHistory.objects.create(
                user=request.user,
                calculator_type='travel',
                input_data=request.data,
                result_data=result_data
            )

        return Response(result_data)

class InsuranceCalculatorView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            total_amount = Decimal(str(request.data.get('total_amount', 0)))
            participants = int(request.data.get('participants', 1))
            weights = request.data.get('weights') # Expected list of premium/age weights or None
        except (ValueError, TypeError) as e:
            return Response({"error": "Invalid input formats."}, status=status.HTTP_400_BAD_REQUEST)

        if total_amount <= 0 or participants <= 0:
            return Response({"error": "Total amount and participants count must be positive."}, status=status.HTTP_400_BAD_REQUEST)

        if weights:
            try:
                parsed_weights = [Decimal(str(w)) for w in weights]
            except Exception:
                return Response({"error": "Premium weights must be numbers."}, status=status.HTTP_400_BAD_REQUEST)

            if len(parsed_weights) != participants:
                return Response({"error": "Number of weights must equal number of participants."}, status=status.HTTP_400_BAD_REQUEST)

            total_weight = sum(parsed_weights)
            if total_weight <= 0:
                return Response({"error": "Sum of weights must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)

            splits = []
            for w in parsed_weights:
                val = (total_amount * w / total_weight).quantize(Decimal('0.01'))
                splits.append(val)

            diff = total_amount - sum(splits)
            if diff != 0:
                splits[0] += diff

            per_person_avg = (total_amount / Decimal(participants)).quantize(Decimal('0.01'))
            result_data = {
                "per_person": str(per_person_avg),
                "splits": [str(s) for s in splits]
            }
        else:
            per_person = (total_amount / Decimal(participants)).quantize(Decimal('0.01'))
            splits = [per_person] * participants
            diff = total_amount - sum(splits)
            if diff != 0:
                splits[0] += diff

            result_data = {
                "per_person": str(per_person),
                "splits": [str(s) for s in splits]
            }

        if request.user and request.user.is_authenticated:
            CalculatorHistory.objects.create(
                user=request.user,
                calculator_type='insurance',
                input_data=request.data,
                result_data=result_data
            )

        return Response(result_data)

class FurnitureCalculatorView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            total_amount = Decimal(str(request.data.get('total_amount', 0)))
            participants = int(request.data.get('participants', 1))
            weights = request.data.get('weights') # Expected list of weights or None
        except (ValueError, TypeError) as e:
            return Response({"error": "Invalid input formats."}, status=status.HTTP_400_BAD_REQUEST)

        if total_amount <= 0 or participants <= 0:
            return Response({"error": "Total amount and roommates count must be positive."}, status=status.HTTP_400_BAD_REQUEST)

        if weights:
            try:
                parsed_weights = [Decimal(str(w)) for w in weights]
            except Exception:
                return Response({"error": "Furniture weights must be numbers."}, status=status.HTTP_400_BAD_REQUEST)

            if len(parsed_weights) != participants:
                return Response({"error": "Number of weights must equal number of roommates."}, status=status.HTTP_400_BAD_REQUEST)

            total_weight = sum(parsed_weights)
            if total_weight <= 0:
                return Response({"error": "Sum of weights must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)

            splits = []
            for w in parsed_weights:
                val = (total_amount * w / total_weight).quantize(Decimal('0.01'))
                splits.append(val)

            diff = total_amount - sum(splits)
            if diff != 0:
                splits[0] += diff

            per_person_avg = (total_amount / Decimal(participants)).quantize(Decimal('0.01'))
            result_data = {
                "per_person": str(per_person_avg),
                "splits": [str(s) for s in splits]
            }
        else:
            per_person = (total_amount / Decimal(participants)).quantize(Decimal('0.01'))
            splits = [per_person] * participants
            diff = total_amount - sum(splits)
            if diff != 0:
                splits[0] += diff

            result_data = {
                "per_person": str(per_person),
                "splits": [str(s) for s in splits]
            }

        if request.user and request.user.is_authenticated:
            CalculatorHistory.objects.create(
                user=request.user,
                calculator_type='furniture',
                input_data=request.data,
                result_data=result_data
            )

        return Response(result_data)

class GuestCalculatorView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            total_amount = Decimal(str(request.data.get('total_amount', 0)))
            days_in_month = int(request.data.get('days_in_month', 30))
            participants = int(request.data.get('participants', 1))
            guest_days = request.data.get('guest_days', []) # Expected list of integers, e.g. [10, 0, 0]
        except (ValueError, TypeError) as e:
            return Response({"error": "Invalid input formats."}, status=status.HTTP_400_BAD_REQUEST)

        if total_amount <= 0 or participants <= 0 or days_in_month <= 0:
            return Response({"error": "Total amount, days in month, and roommates count must be positive."}, status=status.HTTP_400_BAD_REQUEST)

        if len(guest_days) != participants:
            guest_days = [0] * participants

        try:
            parsed_guest_days = [Decimal(str(d)) for d in guest_days]
        except Exception:
            return Response({"error": "Guest days must be numbers."}, status=status.HTTP_400_BAD_REQUEST)

        if any(d < 0 for d in parsed_guest_days):
            return Response({"error": "Guest days cannot be negative."}, status=status.HTTP_400_BAD_REQUEST)

        # Split math: permanent days = days_in_month per roommate
        # Total person days = (participants * days_in_month) + sum(guest_days)
        total_roommate_days = Decimal(participants * days_in_month)
        total_guest_days = sum(parsed_guest_days)
        total_days = total_roommate_days + total_guest_days

        if total_days <= 0:
            return Response({"error": "Total days must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)

        splits = []
        for g_days in parsed_guest_days:
            # roommate share = days_in_month + their guest days
            roommate_share = Decimal(days_in_month) + g_days
            val = (total_amount * roommate_share / total_days).quantize(Decimal('0.01'))
            splits.append(val)

        diff = total_amount - sum(splits)
        if diff != 0:
            splits[0] += diff

        per_person_avg = (total_amount / Decimal(participants)).quantize(Decimal('0.01'))
        result_data = {
            "per_person": str(per_person_avg),
            "splits": [str(s) for s in splits]
        }

        if request.user and request.user.is_authenticated:
            CalculatorHistory.objects.create(
                user=request.user,
                calculator_type='guest',
                input_data=request.data,
                result_data=result_data
            )

        return Response(result_data)
