from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Q
from decimal import Decimal

from .models import Group, Expense, ExpenseSplit, Settlement, ChatMessage
from .serializers import (
    UserSerializer, GroupSerializer, ExpenseSerializer,
    SettlementSerializer, ChatMessageSerializer
)
from .utils import calculate_group_balances, simplify_debts

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GroupViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Group.objects.filter(members=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # Automatically make the creator a member of the group
        group = serializer.save()
        group.members.add(self.request.user)

    @action(detail=True, methods=['post'], url_path='add-member')
    def add_member(self, request, pk=None):
        group = self.get_object()
        identifier = request.data.get('identifier')  # username or email
        if not identifier:
            return Response({"error": "username or email identifier is required"}, status=400)

        try:
            user_to_add = User.objects.get(Q(username=identifier) | Q(email=identifier))
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        if user_to_add in group.members.all():
            return Response({"error": "User already in group"}, status=400)

        group.members.add(user_to_add)
        return Response({"message": f"Successfully added {user_to_add.username} to group"}, status=200)

    @action(detail=True, methods=['post'], url_path='remove-member')
    def remove_member(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"error": "user_id is required"}, status=400)

        try:
            user_to_remove = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        if user_to_remove not in group.members.all():
            return Response({"error": "User is not in the group"}, status=400)

        group.members.remove(user_to_remove)
        return Response({"message": f"Successfully removed {user_to_remove.username} from group"}, status=200)

class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter expenses in groups the user belongs to
        return Expense.objects.filter(group__members=self.request.user).distinct().order_by('-created_at')

    def destroy(self, request, *args, **kwargs):
        # Deleting expense automatically deletes ExpenseSplits due to cascade delete
        return super().destroy(request, *args, **kwargs)

class SettlementViewSet(viewsets.ModelViewSet):
    serializer_class = SettlementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter settlements in groups the user belongs to
        return Settlement.objects.filter(group__members=self.request.user).distinct().order_by('-created_at')

class ChatMessageListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, expense_id):
        # Verify user is member of the group this expense belongs to
        try:
            expense = Expense.objects.get(id=expense_id, group__members=request.user)
        except Expense.DoesNotExist:
            return Response({"error": "Expense not found or unauthorized"}, status=404)

        messages = ChatMessage.objects.filter(expense=expense).order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, expense_id):
        try:
            expense = Expense.objects.get(id=expense_id, group__members=request.user)
        except Expense.DoesNotExist:
            return Response({"error": "Expense not found or unauthorized"}, status=404)

        message_text = request.data.get('message')
        if not message_text:
            return Response({"error": "Message body is required"}, status=400)

        msg = ChatMessage.objects.create(
            expense=expense,
            user=request.user,
            message=message_text
        )
        serializer = ChatMessageSerializer(msg)
        return Response(serializer.data, status=201)

class UserSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('search', '')
        if len(query) < 2:
            return Response([])
        
        # Search users by username or email, excluding the requesting user
        users = User.objects.filter(
            Q(username__icontains=query) | Q(email__icontains=query)
        ).exclude(id=request.user.id)[:10]
        
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

class GlobalBalanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        groups = Group.objects.filter(members=user)
        
        total_owed = Decimal('0.00')
        total_owe = Decimal('0.00')
        
        debts_to_receive = []
        debts_to_pay = []

        for group in groups:
            balances = calculate_group_balances(group)
            user_balance = balances.get(user.id, Decimal('0.00'))
            
            if user_balance > Decimal('0.00'):
                total_owed += user_balance
            elif user_balance < Decimal('0.00'):
                total_owe += abs(user_balance)

            # Extract simplified debts for the current user
            members = group.members.all()
            user_map = {m.id: m for m in members}
            simplified = simplify_debts(balances, user_map)

            for tx in simplified:
                if tx['to_user_id'] == user.id:
                    debts_to_receive.append({
                        'group_id': group.id,
                        'group_name': group.name,
                        'from_user_id': tx['from_user_id'],
                        'from_username': tx['from_username'] if 'from_username' in tx else tx['from_user'].username,
                        'amount': str(tx['amount'])
                    })
                elif tx['from_user_id'] == user.id:
                    debts_to_pay.append({
                        'group_id': group.id,
                        'group_name': group.name,
                        'to_user_id': tx['to_user_id'],
                        'to_username': tx['to_username'] if 'to_username' in tx else tx['to_user'].username,
                        'amount': str(tx['amount'])
                    })

        return Response({
            'total_net_balance': str(total_owed - total_owe),
            'total_owed': str(total_owed),
            'total_owe': str(total_owe),
            'debts_to_receive': debts_to_receive,
            'debts_to_pay': debts_to_pay
        })

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

