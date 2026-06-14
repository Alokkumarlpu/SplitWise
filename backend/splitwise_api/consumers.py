import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from splitwise_api.models import Expense, ChatMessage

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.expense_id = self.scope['url_route']['kwargs']['expense_id']
        self.room_group_name = f'chat_expense_{self.expense_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message = data.get('message')
            user_id = data.get('user_id')

            if not message or not user_id:
                return

            saved_msg = await self.save_message(self.expense_id, user_id, message)
            
            # Broadcast to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'id': saved_msg.id,
                    'message': message,
                    'user': {
                        'id': saved_msg.user.id,
                        'username': saved_msg.user.username,
                        'email': saved_msg.user.email
                    },
                    'created_at': saved_msg.created_at.isoformat()
                }
            )
        except Exception as e:
            # Handle any parsing/saving errors gracefully
            pass

    async def chat_message(self, event):
        # Send message to client
        await self.send(text_data=json.dumps({
            'id': event['id'],
            'message': event['message'],
            'user': event['user'],
            'created_at': event['created_at']
        }))

    @database_sync_to_async
    def save_message(self, expense_id, user_id, message):
        user = User.objects.get(id=user_id)
        expense = Expense.objects.get(id=expense_id)
        return ChatMessage.objects.create(
            expense=expense,
            user=user,
            message=message
        )
