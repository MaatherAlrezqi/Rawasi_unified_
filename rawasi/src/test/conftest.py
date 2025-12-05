# conftest.py
import pytest
import sys
import os

# Add current path to allow Python to find project files
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from recommendation_api import app, recommendation_api

@pytest.fixture
def client():
    """Provides a test client for Flask requests"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def api_instance():
    """Provides an instance of the main class for direct method testing"""
    return recommendation_api