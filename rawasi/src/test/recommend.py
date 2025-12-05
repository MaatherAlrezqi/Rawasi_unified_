"""
Python version of recommend.js
Recommendation system for construction providers
"""

def score_provider(provider, project):
    """
    Score a provider based on how well they match project requirements
    
    Args:
        provider: Dict containing provider information
        project: Dict containing project requirements
        
    Returns:
        float: Score between 0 and 1
    """
    if not project:
        return 0.5
    
    score = 0
    
    # Technology match (30%)
    tech_match = calculate_tech_match(
        provider.get('technologies', []), 
        project.get('techNeeds', [])
    )
    score += tech_match * 0.3
    
    # Budget fit (25%)
    base_cost = provider.get('baseCost', 0)
    cost_per_sqm = provider.get('costPerSqm', 0)
    size_sqm = project.get('sizeSqm', 0)
    est_cost = base_cost + (cost_per_sqm * size_sqm)
    
    budget = project.get('budget', 0)
    budget_fit = min(1, budget / est_cost) if est_cost > 0 else 0
    score += budget_fit * 0.25
    
    # Location (20%)
    provider_location = provider.get('location', '').lower()
    project_location = project.get('location', '').lower()
    location_score = 1 if project_location in provider_location else 0.3
    score += location_score * 0.2
    
    # Experience with project type (15%)
    project_types = provider.get('projectTypes', [])
    project_type = project.get('type', '')
    type_experience = 1 if project_type in project_types else 0.5
    score += type_experience * 0.15
    
    # Timeline (10%)
    timeline_months = project.get('timelineMonths', 0)
    min_timeline = provider.get('minTimeline', 6)
    timeline_score = 1 if timeline_months >= min_timeline else 0.3
    score += timeline_score * 0.1
    
    return min(1, score)


def calculate_tech_match(provider_tech, project_tech_needs):
    """
    Calculate technology match percentage
    
    Args:
        provider_tech: List of provider technologies
        project_tech_needs: List of required technologies
        
    Returns:
        float: Match ratio between 0 and 1
    """
    if not project_tech_needs:
        return 0.5
    
    provider_tech_set = {t.lower() for t in provider_tech}
    matches = sum(1 for need in project_tech_needs 
                  if need.lower() in provider_tech_set)
    
    return matches / len(project_tech_needs)


def estimate_cost_and_time(project):
    """
    Estimate construction cost and timeline for Saudi market
    
    Args:
        project: Dict with project details
        
    Returns:
        dict: Contains estCost, estTimeMonths, and risk
    """
    base_rates = {
        'Residential': {'costPerSqm': 4500, 'monthsPer1000Sqm': 3},
        'Commercial': {'costPerSqm': 6000, 'monthsPer1000Sqm': 4},
        'Industrial': {'costPerSqm': 3500, 'monthsPer1000Sqm': 2.5},
        'Mixed-Use': {'costPerSqm': 5200, 'monthsPer1000Sqm': 3.5}
    }
    
    project_type = project.get('type', 'Residential')
    rates = base_rates.get(project_type, base_rates['Residential'])
    
    # Complexity multipliers
    complexity_multipliers = {
        'low': {'cost': 0.9, 'time': 0.9},
        'medium': {'cost': 1.0, 'time': 1.0},
        'high': {'cost': 1.3, 'time': 1.4}
    }
    
    complexity = project.get('complexity', 'medium')
    multiplier = complexity_multipliers.get(complexity, complexity_multipliers['medium'])
    
    # Location multipliers (Riyadh is baseline)
    location_multipliers = {
        'Riyadh': 1.0,
        'Jeddah': 1.1,
        'Dammam': 1.05,
        'Mecca': 1.15,
        'Medina': 1.12
    }
    
    location = project.get('location', 'Riyadh')
    location_multiplier = location_multipliers.get(location, 1.0)
    
    # Calculate cost
    size_sqm = project.get('sizeSqm', 0)
    base_cost = rates['costPerSqm'] * size_sqm
    adjusted_cost = base_cost * multiplier['cost'] * location_multiplier
    
    # Calculate time
    base_time = (size_sqm / 1000) * rates['monthsPer1000Sqm']
    adjusted_time = base_time * multiplier['time']
    
    # Risk calculation
    budget = project.get('budget', 0)
    timeline_months = project.get('timelineMonths', 0)
    
    cost_risk = max(0, adjusted_cost - budget) / budget if budget > 0 else 0
    time_risk = max(0, adjusted_time - timeline_months) / timeline_months if timeline_months > 0 else 0
    total_risk = (cost_risk + time_risk) / 2
    
    return {
        'estCost': round(adjusted_cost),
        'estTimeMonths': round(adjusted_time * 10) / 10,
        'risk': min(1, total_risk)
    }


async def get_top_recommendations(project, providers, count=3):
    """
    Get top N recommended providers for a project
    
    Args:
        project: Dict with project details
        providers: List of provider dicts
        count: Number of recommendations to return
        
    Returns:
        list: Top providers sorted by score
    """
    try:
        # Score all providers
        scored_providers = []
        for provider in providers:
            provider_copy = provider.copy()
            provider_copy['score'] = score_provider(provider, project)
            scored_providers.append(provider_copy)
        
        # Sort by score (descending)
        scored_providers.sort(key=lambda p: p['score'], reverse=True)
        
        # Return top N
        return scored_providers[:count]
        
    except Exception as e:
        print(f"Error in get_top_recommendations: {e}")
        return []