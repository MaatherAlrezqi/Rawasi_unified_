"""
RAWASI Timeline Prediction API
Flask wrapper for the construction timeline prediction model
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from google.generativeai.types import GenerationConfig
import re
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')

app = Flask(__name__)
CORS(app)

class ModernConstructionTimePredictor:
    def __init__(self):
        """Initialize the Gemini AI predictor for modern construction"""
        api_key = os.getenv('GEMINI_API_KEY')
        
        if api_key:
            try:
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel('gemini-2.5-pro')
                self.ai_enabled = True
                print(f"✅ AI enabled for timeline prediction")
            except Exception as e:
                print(f"⚠️ AI initialization failed: {e}")
                self.ai_enabled = False
        else:
            print("⚠️ No API key - AI service unavailable")
            self.ai_enabled = False
        
        # Modern construction constraints
        self.min_time = 3    # Minimum reasonable months
        self.max_time = 60   # Maximum reasonable months
        
        # Define all construction techniques
        self.all_techniques = [
            "Precast system",
            "A L C PANEL",
            "Autoclaved Aerated Concrete",
            "EPS WALL PANEL",
            "Form Work (Light Weight Foam Concrete)",
            "Tunnel Form",
            "Precast",
            "Insulated Concrete Form (ICF)",
            "3D Concrete panels",
            "Lightweight Aerated Concrete",
            "Lightweight Concrete Panels",
            "Permanent Formwork",
            "Rammed Earth",
            "Sandwich panels",
            "Sismo",
            "Steel Frame",
            "Post-Tensioning",
            "Precast Concrete",
            "Tunnel form",
            "Tunnel Formwork",
            "Waffle-Crete building system (precast concrete panels for wall & slab)"
        ]
        
        # Detailed efficiency factors from Document 2
        self.efficiency_factors = {
            # Original 'standard' value
            'Standard': 0.30,
            
            # 3D Concrete panels / 3D printing
            '3D_Concrete_Panels': 0.40,
            
            # Sismo
            'Sismo': 0.40,
            
            # EPS WALL PANEL / Sandwich panels
            'EPS_Wall_Panel': 0.50,
            
            # Tunnel Form / Tunnel Formwork
            'Tunnel_Form': 0.50,
            
            # Precast system / Precast Concrete
            'Precast_System': 0.60,
            
            # Insulated Concrete Form (ICF)
            'ICF': 0.60,
            
            # Waffle-Crete (precast)
            'Waffle_Crete': 0.60,
            
            # Modular Building System
            'Modular_Building': 0.65,
            
            # Autoclaved Aerated Concrete / ALC PANEL
            'ALC_Panel': 0.75,
            
            # Steel Frame
            'Steel_Frame': 0.75,
            
            # Form Work (Light Weight Foam Concrete)
            'Light_Weight_Foam_Formwork': 0.80,
            
            # Permanent Formwork
            'Permanent_Formwork': 0.80,
            
            # Post-Tensioning
            'Post_Tensioning': 0.85,
            
            # Rammed Earth (No time improvement)
            'Rammed_Earth': 1.00
        }
        
    def extract_numeric_value(self, text):
        """Extract numeric value from AI response"""
        numbers = re.findall(r'\d+\.?\d*', text)
        return float(numbers[0]) if numbers else None
    
    def validate_time(self, months):
        """Ensure prediction is within reasonable bounds"""
        return max(self.min_time, min(self.max_time, months))
    
    def predict_construction_time(self, area_sqm, num_floors, complexity=3, selected_techniques=None):
        """
        Predict construction time using modern techniques
        
        Args:
            area_sqm (float): Total area in square meters
            num_floors (int): Number of floors
            complexity (int): 1-5 (1=simple, 5=complex)
            selected_techniques (list): List of selected construction techniques
        """
        
        if selected_techniques is None or len(selected_techniques) == 0:
            selected_techniques = self.all_techniques
        
        if not self.ai_enabled:
            return {
                'success': False,
                'error': 'AI service not available',
                'message': 'Timeline prediction requires AI service. Please configure GEMINI_API_KEY.'
            }
        
        techniques_list = "\n".join([f"- {tech}" for tech in selected_techniques])
        
        prompt = f"""
        As an expert in modern construction technologies, estimate the construction timeline using these specific techniques:
        
        Project Details:
        - Total Area: {area_sqm} square meters
        - Number of Floors: {num_floors}
        - Complexity Level: {complexity}/5
        
        Use these construction techniques:
        {techniques_list}
        
        Provide ONLY the numeric value in months (no text explanation). 
        The estimate should reflect efficient modern construction practices using these specific techniques.
        
        Consider the efficiency gains from:
        - Prefabricated systems (Precast, ALC Panels, 3D Concrete panels)
        - Rapid formwork systems (Tunnel Form, ICF, Permanent Formwork)
        - Lightweight materials (Lightweight Concrete, Aerated Concrete)
        - Modular construction techniques
        - Advanced structural systems (Post-Tensioning, Steel Frame)
        
        Expected output format: XX.X
        """
        
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=GenerationConfig(
                    temperature=0.0,  # deterministic output
                    top_p=1.0,
                    top_k=1
                )
            )
            response_text = response.text.strip()
            
            # Extract numeric value
            predicted_months = self.extract_numeric_value(response_text)
            
            if predicted_months is None:
                return {
                    'success': False,
                    'error': 'Failed to parse AI response',
                    'message': 'AI did not return a valid numeric prediction'
                }
            
            # Apply modern constraints
            predicted_months = self.validate_time(predicted_months)
            
            return {
                'success': True,
                'area_sqm': area_sqm,
                'num_floors': num_floors,
                'complexity': complexity,
                'predicted_months': round(predicted_months, 1),
                'techniques_used': selected_techniques,
                'method': 'ai'
            }
            
        except Exception as e:
            print(f"⚠️ AI prediction failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'message': 'AI prediction failed. Please try again.'
            }

# Initialize predictor
predictor = ModernConstructionTimePredictor()

# ==================== API ENDPOINTS ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'ai_enabled': predictor.ai_enabled,
        'service': 'timeline_prediction'
    })

@app.route('/api/predict-timeline', methods=['POST'])
def predict_timeline():
    """Predict construction timeline"""
    try:
        data = request.json
        
        # Extract parameters
        area_sqm = float(data.get('sizeSqm', 1500))
        num_floors = int(data.get('Nfloors', 2))
        complexity = int(data.get('complexity', 3))
        tech_needs = data.get('techNeeds', [])
        
        print(f"\n🔥 Timeline Request:")
        print(f"   Area: {area_sqm} sqm")
        print(f"   Floors: {num_floors}")
        print(f"   Complexity: {complexity}/5")
        print(f"   Technologies: {tech_needs}")
        
        # Get prediction
        result = predictor.predict_construction_time(
            area_sqm=area_sqm,
            num_floors=num_floors,
            complexity=complexity,
            selected_techniques=tech_needs if tech_needs else None
        )
        
        if result['success']:
            print(f"✅ Predicted timeline: {result['predicted_months']} months ({result['method']})")
        else:
            print(f"❌ Prediction failed: {result.get('message')}")
        
        return jsonify(result), 200 if result['success'] else 500
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Failed to predict timeline'
        }), 500

if __name__ == '__main__':
    print("\n" + "="*70)
    print("🚀 RAWASI Timeline Prediction API")
    print("="*70)
    print(f"✅ AI enabled: {predictor.ai_enabled}")
    print(f"✅ Techniques available: {len(predictor.all_techniques)}")
    print(f"✅ Efficiency factors loaded: {len(predictor.efficiency_factors)}")
    print("="*70)
    print("📡 Server: http://localhost:5002")
    print("="*70 + "\n")
    
    app.run(host='0.0.0.0', port=5002, debug=True)