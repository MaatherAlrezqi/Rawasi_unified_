import pytest
import sys
import os
from recommend import estimate_cost_and_time


class TestEstimateCostAndTime:
    """Test cost and timeline estimation for different project types"""
    
    # <-- التعديل: تعريف الثوابت (Constants) للتخلص من "Magic Numbers"
    RESIDENTIAL_RATE_RIYADH_MEDIUM = 4500  # 4500 SAR/sqm
    PROJECT_SIZE_SQM = 2000
    LOWER_BOUND_FACTOR = 0.9
    UPPER_BOUND_FACTOR = 1.1
    
    def test_estimate_residential_project(self):
        """Test cost and time estimations"""
        # Arrange
        
        project = {
            'type': 'Residential',
            'sizeSqm': self.PROJECT_SIZE_SQM,
            'complexity': 'medium',
            'location': 'Riyadh',
            'budget': 100000,
            'timelineMonths': 8
        }
        
        # Act
        result = estimate_cost_and_time(project)
        
        # Assert
        assert 'estCost' in result, "Result must include estimated cost"
        assert 'estTimeMonths' in result, "Result must include estimated time"
        assert 'risk' in result, "Result must include risk assessment"
        
        base_expected_cost = self.PROJECT_SIZE_SQM * self.RESIDENTIAL_RATE_RIYADH_MEDIUM
        expected_cost_range = (
            base_expected_cost * self.LOWER_BOUND_FACTOR,
            base_expected_cost * self.UPPER_BOUND_FACTOR
        )
        
        assert expected_cost_range[0] <= result['estCost'] <= expected_cost_range[1], \
            f"Estimated cost {result['estCost']} should be within reasonable range"
        
        assert result['estTimeMonths'] > 0, "Estimated time must be positive"
        assert 0 <= result['risk'] <= 1, "Risk should be between 0 and 1"

    # <-- التعديل: إضافة اختبار لحالة خاصة (Edge Case)
    def test_estimate_zero_size_project(self):
        """Test that a project with 0 sqm results in 0 cost and 0 time"""
        # Arrange
        project = {
            'type': 'Residential',
            'sizeSqm': 0, # <-- حالة خاصة
            'complexity': 'medium',
            'location': 'Riyadh',
        }
        
        # Act
        result = estimate_cost_and_time(project)

        # Assert
        # نفترض أن التكلفة والوقت يجب أن يكونا صفراً
        assert result['estCost'] == 0, "Cost should be 0 for 0 sqm"
        assert result['estTimeMonths'] == 0, "Time should be 0 for 0 sqm"


# Configuration for pytest
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])