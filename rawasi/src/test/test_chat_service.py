# test_chat_service.py
import pytest
from unittest.mock import MagicMock, AsyncMock

# افترض أن لديك ملف chat_service.py في نفس المجلد
# وأن لديك كلاس ChatService بداخله
from chat_service import ChatService

# --- الثوابت والمتغيرات الوهمية ---

# معرف وهمي للمستخدم الحالي
MOCK_ME_ID = "user_me_123"

# --- Fixtures (الإعدادات المسبقة للاختبار) ---

@pytest.fixture
def mock_supabase_client():
    """
    Fixture لإنشاء "عميل Supabase وهمي" (Mock)
    نستخدم MagicMock لخداع كل السلاسل (chaining) مثل .from_().insert()
    """
    return MagicMock()

@pytest.fixture
def chat_service(mock_supabase_client):
    """Fixture لإنشاء خدمتنا وتمرير العميل الوهمي لها"""
    return ChatService(mock_supabase_client)

@pytest.mark.asyncio
async def test_send_message_calls_insert_correctly(chat_service, mock_supabase_client, mocker):
    """
    Method 1 Test: Ensure 'send' calls 'insert' with the correct data
    """
    # 1. Arrange:
    conv_id = "conv_abc"
    text = "Hello from pytest"
    
    # Mock the internal _get_me_id function to avoid test complexity
    # This tells pytest-mock to find the chat_service object and replace _get_me_id
    mocker.patch.object(chat_service, '_get_me_id', return_value=MOCK_ME_ID)
    
    # Setup the chained mock
    # This ensures the chain .from_().insert().execute() is an AsyncMock
    # so we can use await on it
    mock_supabase_client.from_().insert().execute = AsyncMock()

    # 2. Act:
    await chat_service.send(conv_id, text)

    # 3. Assert:
    # Was .from_() called with the correct table name?
    mock_supabase_client.from_.assert_called_with("messages")
    # Was .insert() called with the correct data?
    expected_payload = {
        "conversation_id": conv_id,
        "sender": MOCK_ME_ID,
        "body": text
    }
    mock_supabase_client.from_().insert.assert_called_with(expected_payload)
    # Was the call executed?
    mock_supabase_client.from_().insert().execute.assert_called_once()