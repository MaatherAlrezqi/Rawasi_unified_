# chat_service.py
from supabase_auth.errors import AuthApiError 

class ChatService:
    def __init__(self, supabase_client):
        self.client = supabase_client

    async def _get_me_id(self):
        """دالة مساعدة لجلب هوية المستخدم الحالي"""
        try:
            user_response = await self.client.auth.get_user()
            user = user_response.user
            if not user:
                raise Exception("Not authenticated")
            return user.id
        except AuthApiError:  # <-- هذا السطر سيعمل الآن بشكل صحيح
            raise Exception("Not authenticated")

    async def send(self, conversation_id: str, text: str):
        """إرسال رسالة جديدة"""
        me_id = await self._get_me_id()
        try:
            await self.client.from_("messages").insert({
                "conversation_id": conversation_id,
                "sender": me_id,
                "body": text
            }).execute()
        except Exception as e:
            print(f"Error sending message: {e}")
            raise

    async def get_or_create_conversation(self, other_id: str, project_id: str):
        """جلب أو إنشاء محادثة"""
        me_id = await self._get_me_id()
        
        # فرز الهويات لضمان الترتيب الصحيح
        a, b = (me_id, other_id) if me_id < other_id else (other_id, me_id)
        
        try:
            # Upsert يضمن إنشاء المحادثة إذا لم تكن موجودة
            response = await self.client.from_("conversations").upsert(
                {"project_id": project_id, "a": a, "b": b},
                on_conflict="project_id,a,b"
            ).select("id").single().execute()
            
            return response.data # { 'id': ... }
        except Exception as e:
            print(f"Error getting/creating conversation: {e}")
            raise