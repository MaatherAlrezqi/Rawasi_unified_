import pytest
import sys
import os
from recommend import get_top_recommendations

class TestGetTopRecommendations:
    """Test the recommendation ranking system"""
    
    # قمت بنقل البيانات المشتركة هنا لتنظيم الكود
    PROJECT_DATA = {
        'type': 'Commercial',
        'sizeSqm': 3000,
        'complexity': 'high',
        'location': 'Jeddah',
        'budget': 20000000,
        'timelineMonths': 15,
        'techNeeds': ['BIM', 'IoT-Integration']
    }
    
    PROVIDERS_DATA = [
        {
            'id': 1, 'name': 'Provider A', 'technologies': ['BIM', 'IoT-Integration', 'Solar-Panels'],
            'baseCost': 3000000, 'costPerSqm': 5500, 'location': 'Jeddah',
            'projectTypes': ['Commercial'], 'minTimeline': 12
        },
        {
            'id': 2, 'name': 'Provider B', 'technologies': ['BIM'],
            'baseCost': 2500000, 'costPerSqm': 5000, 'location': 'Riyadh',
            'projectTypes': ['Commercial'], 'minTimeline': 10
        },
        {
            'id': 3, 'name': 'Provider C', 'technologies': ['IoT-Integration', 'Smart-Lighting'],
            'baseCost': 4000000, 'costPerSqm': 6000, 'location': 'Jeddah',
            'projectTypes': ['Commercial', 'Residential'], 'minTimeline': 14
        }
    ]

    @pytest.mark.asyncio
    async def test_get_top_recommendations_logic(self): 
        """
        Test that the function returns the correct count AND the correct order.
        Provider A (id:1) should be first (matches location + 2 techs).
        Provider C (id:3) should be second (matches location + 1 tech).
        """
        
        # Arrange
        project = self.PROJECT_DATA
        providers = self.PROVIDERS_DATA
        requested_count = 2
        
        # Act
        recommendations = await get_top_recommendations(project, providers, requested_count)
        
        # Assert
        assert isinstance(recommendations, list), "Result must be a list"
        assert len(recommendations) == requested_count, \
            f"Should return exactly {requested_count} recommendations"
        
        assert 'id' in recommendations[0], "Recommendation must have an id"
        assert recommendations[0]['id'] == 1, "Provider A (id:1) should be the top recommendation"
        assert recommendations[1]['id'] == 3, "Provider C (id:3) should be the second recommendation"
        assert 'score' in recommendations[0], "Recommendation should include a score"

    # <-- التعديل: إضافة اختبار لحالة خاصة (Edge Case)
    @pytest.mark.asyncio
    async def test_get_top_recommendations_more_than_available(self):
        """Test that the function returns all available providers if count is too high"""
        
        # Arrange
        project = self.PROJECT_DATA
        providers = self.PROVIDERS_DATA # <-- لدينا 3 مزودين خدمة
        requested_count = 5 # <-- نطلب 5
        
        # Act
        recommendations = await get_top_recommendations(project, providers, requested_count)
        
        # Assert
        # يجب أن يرجع 3 فقط (كل المتاحين)
        assert len(recommendations) == len(providers), \
            "Should return all available providers if requested count is higher"
        assert recommendations[0]['id'] == 1 # التأكد أن الترتيب ما زال صحيحاً


# Configuration for pytest
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])