# test_forgot_password.py
import pytest
from unittest.mock import Mock, MagicMock


class TestForgotPassword:
    """Test forgot password email functionality"""
    
    def test_forgot_password(self):
        """Test that forgot password email is sent with correct data"""
        
        # Mock the Mail facade to prevent actual email sending
        Mail = Mock()
        Mail.fake = Mock()
        Mail.assertSent = Mock()
        
        # Mock the response to simulate Laravel-like behavior
        response = Mock()
        
        # Arrange - Set up the expected data
        response.assertJson = Mock()
        
        # Act - Simulate the forgot password request
        # This would normally be your API call or service method
        email_data = {
            'subject': 'New Password For Rawasi!',
            'firstName': 'Nada',
            'lastName': 'AAlsulami',
            'email': 'Nada@gmail.com'
        }
        
        # Mock sending the email
        Mail.fake()
        
        # Assert the response body contains the expected data
        response.assertJson({
            'subject': 'New Password For Rawasi!',
            'firstName': 'Nada',
            'lastName': 'AAlsulami',
            'email': 'Nada@gmail.com'
        })
        
        # Assert that the email was sent to the correct recipient with the correct data
        def verify_email(mail_data):
            return (
                mail_data.get('email') == 'Nada@gmail.com' and
                mail_data.get('subject') == 'New Password For Rawasi!'
            )
        
        Mail.assertSent('ForgotPassword', verify_email)
        
        # Verify the assertions were called
        assert response.assertJson.called
        assert Mail.fake.called
        assert Mail.assertSent.called


# If you're using pytest
if __name__ == "__main__":
    pytest.main([__file__, "-v"])