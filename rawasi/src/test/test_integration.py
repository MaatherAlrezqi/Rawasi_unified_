# test_integration.py
import pytest
import os
from supabase import create_client, Client

class TestSystemIntegration:
    
    # --- Test Case 1: Supabase Database Connection ---
    def test_supabase_connection(self):
        """
        Integration Test 1: Verify system can connect to Supabase database.
        Corresponds to: System successfully log in to access database.
        """
        # 1. Input: Load credentials from environment
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")

        # Check if credentials exist
        if not url or not key:
            pytest.skip("Supabase credentials missing in .env file - Skipping DB Test")

        try:
            # 2. Act: Initialize Client and attempt a simple query
            supabase: Client = create_client(url, key)
            
            # We select 1 record just to verify connection is alive
            response = supabase.table("profiles").select("*").limit(1).execute()

            # 3. Assert: Verify the connection was successful
            # If the query runs without error, the connection is good.
            # We also check if data is a list (even if empty, it means access is granted)
            assert response.data is not None, "Failed to retrieve data from Supabase"
            assert isinstance(response.data, list), "Data format is incorrect"
            
            print("\n✅ Test 1 Passed: Connected to Supabase successfully.")
            
        except Exception as e:
            pytest.fail(f"Supabase Connection failed: {str(e)}")

    # --- Test Case 2: Gemini API Integration ---
    def test_gemini_api_connection(self, api_instance):
        """
        Integration Test 2: Verify successfully receive result from API.
        """
        # 1. Input Data
        project_data = {
            'name': 'Test Villa',
            'type': 'Residential',
            'location': 'Riyadh',
            'sizeSqm': 500,
            'budget': 1000000,
            'timelineMonths': 12,
            'techNeeds': ['BIM'],
            'complexity_score': 5
        }
        
        # Dummy supplier data for testing
        dummy_suppliers = [{
            'name': 'Test Contractor',
            'score': 4.2,
            'technology': 'BIM',
            'region': 'Riyadh'
        }]

        # Check if API Key is enabled
        if not api_instance.ai_enabled:
            # Last attempt to check if key exists directly in environment
            import os
            if not os.getenv('GEMINI_API_KEY'):
                pytest.skip("Gemini API Key missing or invalid (.env file missing?) - Skipping API Test")

        # 2. Act (Call the function)
        try:
            print("\n⏳ Contacting Gemini API...")
            insights = api_instance.get_ai_insights(project_data, dummy_suppliers)
            
            # 3. Assert (Verify results)
            assert insights is not None, "API returned None"
            assert isinstance(insights, dict), "Result should be a dictionary"
            
            # Check for expected keys in the response
            expected_keys = ['summary', 'recommendations'] 
            found_keys = [k for k in expected_keys if k in insights]
            assert len(found_keys) > 0, f"Result missing expected keys. Got: {insights.keys()}"
            
            print(f"\n✅ Test 2 Passed: API Response received successfully.")
            
        except Exception as e:
            pytest.fail(f"API Integration failed with error: {str(e)}")