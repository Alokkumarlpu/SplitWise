from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from splitwise_api.models import UserSession

class SessionJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        jti = validated_token.get('jti')
        if not jti:
            raise AuthenticationFailed('Token is missing unique identifier (jti).')

        # Check if the session is recorded in active sessions
        if not UserSession.objects.filter(jti=jti).exists():
            raise AuthenticationFailed('Token is invalid or session has been terminated.')

        return super().get_user(validated_token)
