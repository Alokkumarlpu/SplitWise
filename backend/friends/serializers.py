from rest_framework import serializers
from .models import Friendship, FriendInvite
from django.contrib.auth.models import User

class FriendshipSerializer(serializers.ModelSerializer):
    friend_id = serializers.IntegerField(source='friend.id', read_only=True)
    friend_username = serializers.CharField(source='friend.username', read_only=True)
    friend_email = serializers.CharField(source='friend.email', read_only=True)
    friend_full_name = serializers.CharField(source='friend.profile.full_name', read_only=True)
    friend_avatar_base64 = serializers.CharField(source='friend.profile.avatar_base64', read_only=True)
    balance = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = ('id', 'friend_id', 'friend_username', 'friend_email', 'friend_full_name', 'friend_avatar_base64', 'balance', 'created_at')

    def get_balance(self, obj):
        request = self.context.get('request')
        if not request or not request.user:
            return "0.00"
        
        user = request.user
        friend = obj.friend
        from splitwise_api.models import Group
        from splitwise_api.utils import calculate_group_balances, simplify_debts
        
        # Find groups they both share
        shared_groups = Group.objects.filter(members=user).filter(members=friend)
        total_balance = 0.0
        
        for group in shared_groups:
            balances = calculate_group_balances(group)
            members = group.members.all()
            user_map = {m.id: m for m in members}
            simplified = simplify_debts(balances, user_map)
            
            for tx in simplified:
                if tx['to_user_id'] == user.id and tx['from_user_id'] == friend.id:
                    total_balance += float(tx['amount'])
                elif tx['from_user_id'] == user.id and tx['to_user_id'] == friend.id:
                    total_balance -= float(tx['amount'])
                    
        return f"{total_balance:.2f}"

class FriendInviteSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = FriendInvite
        fields = ('id', 'sender', 'sender_username', 'email', 'status', 'created_at')
        read_only_fields = ('id', 'sender', 'status', 'created_at')
