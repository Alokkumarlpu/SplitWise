from rest_framework import serializers
from django.contrib.auth.models import User
from decimal import Decimal
from .models import (
    Group, Expense, ExpenseSplit, Settlement, ChatMessage,
    UserProfile, NotificationPreference, PrivacySettings, UserSession, BlockedUser
)
from .utils import calculate_splits, calculate_group_balances, simplify_debts

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class GroupMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class ExpenseSplitSerializer(serializers.ModelSerializer):
    user = GroupMemberSerializer(read_only=True)
    user_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = ExpenseSplit
        fields = ('id', 'user', 'user_id', 'amount', 'split_type', 'split_value')
        read_only_fields = ('amount',)

class ExpenseSerializer(serializers.ModelSerializer):
    payer = GroupMemberSerializer(read_only=True)
    payer_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='payer', write_only=True
    )
    splits = ExpenseSplitSerializer(many=True)

    class Meta:
        model = Expense
        fields = ('id', 'group', 'description', 'amount', 'payer', 'payer_id', 'splits', 'created_at')

    def create(self, validated_data):
        splits_data = validated_data.pop('splits')
        expense = Expense.objects.create(**validated_data)

        # Extract user IDs and split values
        members_ids = [item['user_id'] for item in splits_data]
        split_type = splits_data[0]['split_type'] if splits_data else 'equal'

        # Call utils to calculate splits
        try:
            calculated_splits = calculate_splits(
                total_amount=expense.amount,
                members_ids=members_ids,
                split_type=split_type,
                splits_data=splits_data
            )
        except ValueError as e:
            expense.delete()
            raise serializers.ValidationError(str(e))

        # Save splits
        for split_item in splits_data:
            uid = split_item['user_id']
            ExpenseSplit.objects.create(
                expense=expense,
                user_id=uid,
                amount=calculated_splits[uid],
                split_type=split_type,
                split_value=split_item.get('split_value')
            )

        return expense

    def update(self, instance, validated_data):
        splits_data = validated_data.pop('splits', None)
        
        instance.description = validated_data.get('description', instance.description)
        instance.amount = validated_data.get('amount', instance.amount)
        instance.payer = validated_data.get('payer', instance.payer)
        instance.group = validated_data.get('group', instance.group)
        instance.save()

        if splits_data is not None:
            # Delete old splits
            instance.splits.all().delete()

            members_ids = [item['user_id'] for item in splits_data]
            split_type = splits_data[0]['split_type'] if splits_data else 'equal'

            try:
                calculated_splits = calculate_splits(
                    total_amount=instance.amount,
                    members_ids=members_ids,
                    split_type=split_type,
                    splits_data=splits_data
                )
            except ValueError as e:
                raise serializers.ValidationError(str(e))

            for split_item in splits_data:
                uid = split_item['user_id']
                ExpenseSplit.objects.create(
                    expense=instance,
                    user_id=uid,
                    amount=calculated_splits[uid],
                    split_type=split_type,
                    split_value=split_item.get('split_value')
                )

        return instance

class SettlementSerializer(serializers.ModelSerializer):
    payer = GroupMemberSerializer(read_only=True)
    payer_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='payer', write_only=True
    )
    payee = GroupMemberSerializer(read_only=True)
    payee_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='payee', write_only=True
    )

    class Meta:
        model = Settlement
        fields = ('id', 'group', 'payer', 'payer_id', 'payee', 'payee_id', 'amount', 'created_at')

class ChatMessageSerializer(serializers.ModelSerializer):
    user = GroupMemberSerializer(read_only=True)

    class Meta:
        model = ChatMessage
        fields = ('id', 'expense', 'user', 'message', 'created_at')

class GroupSerializer(serializers.ModelSerializer):
    members = GroupMemberSerializer(many=True, read_only=True)
    member_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='members', many=True, write_only=True
    )
    net_balances = serializers.SerializerMethodField()
    simplified_debts = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ('id', 'name', 'members', 'member_ids', 'net_balances', 'simplified_debts', 'created_at')

    def get_net_balances(self, obj):
        balances = calculate_group_balances(obj)
        # Format decimal to string representation for JSON compatibility
        return {str(uid): str(bal) for uid, bal in balances.items()}

    def get_simplified_debts(self, obj):
        balances = calculate_group_balances(obj)
        members = obj.members.all()
        user_map = {m.id: m for m in members}
        simplified = simplify_debts(balances, user_map)
        
        return [
            {
                'from_user_id': tx['from_user_id'],
                'from_username': tx['from_user'].username,
                'to_user_id': tx['to_user_id'],
                'to_username': tx['to_user'].username,
                'amount': str(tx['amount'])
            }
            for tx in simplified
        ]

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('id', 'full_name', 'phone_number', 'avatar_base64', 'default_currency', 'timezone', 'language')

class UserSettingsSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.CharField(source='profile.full_name', allow_blank=True, required=False)
    phone_number = serializers.CharField(source='profile.phone_number', allow_blank=True, required=False)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'full_name', 'phone_number', 'profile')
        read_only_fields = ('id', 'username', 'profile')

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        
        instance.email = validated_data.get('email', instance.email)
        instance.save()

        profile = instance.profile
        profile.full_name = profile_data.get('full_name', profile.full_name)
        profile.phone_number = profile_data.get('phone_number', profile.phone_number)
        profile.save()

        return instance

class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        exclude = ('user',)

class PrivacySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrivacySettings
        fields = ('discoverable',)

class UserSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSession
        fields = ('id', 'ip_address', 'user_agent', 'created_at', 'last_activity')

class BlockedUserSerializer(serializers.ModelSerializer):
    blocked_user = GroupMemberSerializer(read_only=True)
    blocked_user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='blocked_user', write_only=True
    )

    class Meta:
        model = BlockedUser
        fields = ('id', 'blocked_user', 'blocked_user_id', 'created_at')

class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

