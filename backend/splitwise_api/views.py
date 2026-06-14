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

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import AccessToken
from .models import UserProfile, NotificationPreference, PrivacySettings, UserSession, BlockedUser
from .serializers import (
    UserSettingsSerializer, NotificationPreferenceSerializer, PrivacySettingsSerializer,
    UserSessionSerializer, BlockedUserSerializer, PasswordChangeSerializer
)

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access_token = response.data['access']
            try:
                decoded_token = AccessToken(access_token)
                jti = decoded_token['jti']
                user_id = decoded_token['user_id']
                
                # Fetch request metadata
                ip_address = self.get_client_ip(request)
                user_agent = request.META.get('HTTP_USER_AGENT', '')
                
                # Create session record
                UserSession.objects.create(
                    user_id=user_id,
                    jti=jti,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
            except Exception as e:
                pass
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class ProfileSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSettingsSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserSettingsSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AvatarUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        avatar_data = request.data.get('avatar_base64')
        if not avatar_data:
            return Response({"error": "avatar_base64 is required"}, status=400)

        profile = request.user.profile
        profile.avatar_base64 = avatar_data
        profile.save()
        return Response({"message": "Avatar uploaded successfully", "avatar_base64": profile.avatar_base64})

class PreferencesSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        profile = request.user.profile
        profile.default_currency = request.data.get('default_currency', profile.default_currency)
        profile.timezone = request.data.get('timezone', profile.timezone)
        profile.language = request.data.get('language', profile.language)
        profile.save()
        
        return Response({
            "default_currency": profile.default_currency,
            "timezone": profile.timezone,
            "language": profile.language
        })

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({"message": "Password changed successfully."})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        user = request.user
        
        # Soft delete the user
        user.is_active = False
        user.save()
        
        # Terminate all active sessions
        UserSession.objects.filter(user=user).delete()
        
        return Response({"message": "Account successfully deactivated."})

class NotificationSettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        pref = request.user.notifications
        serializer = NotificationPreferenceSerializer(pref)
        return Response(serializer.data)

    def put(self, request):
        pref = request.user.notifications
        serializer = NotificationPreferenceSerializer(pref, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PrivacySettingsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        privacy = request.user.privacy
        blocked_users = BlockedUser.objects.filter(user=request.user)
        active_sessions = UserSession.objects.filter(user=request.user).order_by('-created_at')
        
        # Determine the current active session
        auth_header = request.headers.get('Authorization', '')
        current_jti = ""
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                current_jti = AccessToken(token)['jti']
            except Exception:
                pass

        sessions_data = []
        for session in active_sessions:
            sessions_data.append({
                "id": session.id,
                "ip_address": session.ip_address,
                "user_agent": session.user_agent,
                "created_at": session.created_at,
                "is_current": session.jti == current_jti
            })

        return Response({
            "discoverable": privacy.discoverable,
            "blocked_users": BlockedUserSerializer(blocked_users, many=True).data,
            "active_sessions": sessions_data
        })

    def put(self, request):
        privacy = request.user.privacy
        privacy.discoverable = request.data.get('discoverable', privacy.discoverable)
        privacy.save()
        return Response({"discoverable": privacy.discoverable})

class BlockUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        blocked_user_id = request.data.get('blocked_user_id')
        if not blocked_user_id:
            return Response({"error": "blocked_user_id is required"}, status=400)
            
        try:
            user_to_block = User.objects.get(id=blocked_user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        if user_to_block == request.user:
            return Response({"error": "You cannot block yourself"}, status=400)

        blocked_user, created = BlockedUser.objects.get_or_create(
            user=request.user,
            blocked_user=user_to_block
        )
        
        serializer = BlockedUserSerializer(blocked_user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class UnblockUserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        blocked_user_id = request.data.get('blocked_user_id')
        if not blocked_user_id:
            return Response({"error": "blocked_user_id is required"}, status=400)

        BlockedUser.objects.filter(user=request.user, blocked_user_id=blocked_user_id).delete()
        return Response({"message": "User unblocked successfully."})

class TerminateSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({"error": "session_id is required"}, status=400)

        UserSession.objects.filter(user=request.user, id=session_id).delete()
        return Response({"message": "Session terminated successfully."})

class LogoutAllView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Terminate all active sessions for this user
        UserSession.objects.filter(user=request.user).delete()
        return Response({"message": "Successfully logged out from all devices."})


