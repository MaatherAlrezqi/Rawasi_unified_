"""
RAWASI Provider Recommendation API
- Merges providers from JSON and Supabase
- Region aliasing (Riyadh -> Central, …)
- Tech match is optional unless user selects techs
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json, os, re, io, base64
from dotenv import load_dotenv
from PIL import Image

# ---- Optional Supabase client ----------------------------------------------
try:
    from supabase import create_client  # pip install supabase
except Exception:
    create_client = None
# ----------------------------------------------------------------------------

# ---- Optional Gemini (kept exactly as before) -------------------------------
import google.generativeai as genai
# ----------------------------------------------------------------------------

load_dotenv(".env")

app = Flask(__name__)
CORS(app)

# ------------------------- Region helpers ------------------------------------
REGION_ALIASES = {
    "riyadh": "central",
    "qassim": "central",
    "hail": "northern",
    "jeddah": "western",
    "makkah": "western",
    "mecca": "western",
    "taif": "western",
    "madinah": "western",
    "medina": "western",
    "dammam": "eastern",
    "khobar": "eastern",
    "dhahran": "eastern",
    "abha": "southern",
    "jizan": "southern",
    "jazan": "southern",
}

def normalize_region(s: str) -> str:
    s = (s or "").strip().lower()
    if not s or s in ("all", "any"):
        return "all"
    return REGION_ALIASES.get(s, s)

def listify(x):
    if not x:
        return []
    if isinstance(x, list):
        return x
    if isinstance(x, str):
        parts = [p.strip() for p in re.split(r"[;,/]", x) if p.strip()]
        return parts if parts else [x.strip()]
    return [str(x)]

# ------------------------- API class -----------------------------------------
class SupplierRecommendationAPI:
    def __init__(self):
        # LLM init (as you had)
        api_key = os.getenv("GEMINI_API_KEY")
        self.ai_enabled = False
        if api_key:
            try:
                genai.configure(api_key=api_key)
                model_name = "models/gemini-2.0-flash-exp"
                self.model = genai.GenerativeModel(model_name)
                self.vision_model = self.model
                self.ai_enabled = True
                print(f"✅ AI features enabled using: {model_name}")
            except Exception as e:
                print(f"⚠️ AI initialization failed: {e}")

        # Data
        self.supabase = self._init_supabase()
        self.tech_complexity_data = self._load_tech_complexity_data()
        self.suppliers_data = self._merge_sources()  # JSON + Supabase

    # ---------------------- data sources -------------------------------------
    def _init_supabase(self):
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE") or os.getenv("SUPABASE_ANON_KEY")
        if create_client and url and key:
            try:
                print("🔗 Connecting to Supabase…")
                return create_client(url, key)
            except Exception as e:
                print(f"⚠️ Supabase init failed: {e}")
        else:
            if not create_client:
                print("ℹ️ supabase-py not installed. Skipping Supabase merge.")
            else:
                print("ℹ️ SUPABASE_URL / KEY not set. Skipping Supabase merge.")
        return None

    def _load_json_suppliers(self):
        try:
            with open("modern_building_contractors - En.json", "r", encoding="utf-8") as f:
                data = json.load(f)
                print(f"✅ Loaded {len(data)} suppliers from JSON")
                mapped = []
                for s in data:
                    name = s.get("Contractor_Name") or s.get("Factory_Name") or s.get("company_name")
                    tech = s.get("Building_Tech_Type") or s.get("Tech_Type") or s.get("technologies")
                    region = s.get("Preferred_Region") or s.get("location") or ""
                    mapped.append({
                        "source": "json",
                        "provider_id": None,  # no UUID from JSON
                        "name": name,
                        "region": region,
                        "region_norm": normalize_region(region),
                        "technologies": listify(tech),
                        "rating": s.get("totalScore") or s.get("rating"),
                        "contact": s.get("Contact_Person") or s.get("contact"),
                        "email": s.get("Email") or s.get("emails") or "",
                        "phone": s.get("Mobile_Number") or s.get("phone_number") or "",
                        "raw": s
                    })
                return mapped
        except Exception as e:
            print(f"❌ Error reading JSON file: {e}")
            return []

    def _load_supabase_suppliers(self):
        if not self.supabase:
            return []

        try:
            # providers
            pr = self.supabase.table("provider").select("*").execute()
            providers = pr.data or []

            # provider_technologies
            pt = self.supabase.table("provider_technologies").select("*").execute()
            ptech = pt.data or []
            tech_map = {}
            for row in ptech:
                pid = row.get("provider_id")
                tech_map.setdefault(pid, []).append(row.get("technology"))

            mapped = []
            for p in providers:
                pid = p.get("provider_id") or p.get("id")
                company = p.get("company_name")
                if not company:
                    continue
                region = p.get("location") or ""
                techs = tech_map.get(pid, [])
                portfolio = listify(p.get("portfolio_description"))
                # merge portfolio descriptions if they look like technologies
                techs = list(set([t for t in (techs + portfolio) if t]))

                mapped.append({
                    "source": "supabase",
                    "provider_id": pid,
                    "name": company,
                    "region": region,
                    "region_norm": normalize_region(region),
                    "technologies": techs,
                    "rating": p.get("rating"),
                    "contact": p.get("contact_person") or "",
                    "email": p.get("email") or "",
                    "phone": p.get("phone_number") or "",
                    "raw": p
                })

            print(f"✅ Loaded {len(mapped)} suppliers from Supabase")
            return mapped
        except Exception as e:
            print(f"⚠️ Failed to load providers from Supabase: {e}")
            return []

    def _merge_sources(self):
        data = self._load_json_suppliers()
        data += self._load_supabase_suppliers()
        print(f"📦 Total suppliers merged: {len(data)}")
        return data

    # ---------------------- tech dictionary ----------------------------------
    def _load_tech_complexity_data(self):
        return {
            "Autoclaved Aerated Concrete": {"complexity_range": (2, 5), "alias": ["AAC", "ALC"]},
            "Precast system": {"complexity_range": (4, 8), "alias": ["Precast Concrete"]},
            "ICF": {"complexity_range": (4, 7), "alias": ["Insulated Concrete Forms"]},
            "Modular LGS": {"complexity_range": (4, 6), "alias": ["Light Steel", "Prefabricated Units"]},
            "Repidwall": {"complexity_range": (5, 8), "alias": ["Rapid Wall"]},
            "Tunnel Formwork": {"complexity_range": (6, 9), "alias": ["Tunnel Forms"]},
            "3D panel system (M2)": {"complexity_range": (4, 7), "alias": ["3D Panel"]},
            "Concrete modular": {"complexity_range": (7, 10), "alias": ["Modular Concrete"]},
            "Panel Wall System": {"complexity_range": (5, 8), "alias": ["Wall Panel"]},
            "Post tension": {"complexity_range": (4, 8), "alias": ["Post-tension"]},
            "Form work system": {"complexity_range": (3, 6), "alias": ["Formwork"]},
            "Steel Structer": {"complexity_range": (5, 8), "alias": ["Steel Frame", "Steel Structure"]},
            "ALC": {"complexity_range": (2, 5), "alias": ["Autoclaved Lightweight Concrete"]},
            "BIM": {"complexity_range": (5, 9), "alias": ["Building Information Modeling"]},
            "Prefabrication": {"complexity_range": (4, 8), "alias": ["Prefab"]},
        }

    # ---------------------- optional plan analysis (unchanged) ----------------
    def analyze_construction_plan(self, image_data):
        if not self.ai_enabled:
            return None
        try:
            image_bytes = base64.b64decode(image_data.split(",")[1] if "," in image_data else image_data)
            image = Image.open(io.BytesIO(image_bytes))
            prompt = (
                "Analyze this construction plan and evaluate its complexity on a scale of 1 to 10.\n"
                "Consider: structural complexity, elements, systems, methodology, and scale.\n"
                "Provide ONLY:\nComplexity Score: X/10\nExplanation: ...\n"
            )
            response = self.vision_model.generate_content([prompt, image])
            return response.text
        except Exception as e:
            print(f"⚠️ Error analyzing image: {e}")
            return None

    def parse_complexity_score(self, analysis_text):
        try:
            if not analysis_text:
                return 5
            for line in analysis_text.split("\n"):
                if "Complexity" in line or "Score" in line:
                    nums = re.findall(r"\d+", line)
                    if nums:
                        return max(1, min(10, int(nums[0])))
        except Exception as e:
            print(f"⚠️ Error parsing complexity score: {e}")
        return 5

    # ---------------------- tech suggestion by complexity ---------------------
    def recommend_tech_based_on_complexity(self, complexity_score):
        recs = []
        for tech, meta in self.tech_complexity_data.items():
            lo, hi = meta["complexity_range"]
            if lo <= complexity_score <= hi:
                mid = (lo + hi) / 2
                suitability = max(0, 100 - abs(complexity_score - mid) * 10)
                recs.append({"technology": tech, "suitability_score": suitability})
        recs.sort(key=lambda x: x["suitability_score"], reverse=True)
        return recs

    # ---------------------- matching -----------------------------------------
    def _tech_matches(self, supplier_techs, target_techs):
        """Return (bool match, matched_tech) – true if user selected nothing OR any tech/alias matches"""
        if not target_techs:
            return True, None  # ← relaxed: no selection = don't filter out
        st = [t.lower() for t in supplier_techs]
        for t in target_techs:
            t_low = (t or "").lower()
            if any(t_low in s for s in st):
                return True, t
            # aliases
            for alias in self.tech_complexity_data.get(t, {}).get("alias", []):
                a_low = alias.lower()
                if any(a_low in s for s in st):
                    return True, t
        return False, None

    def find_matching_suppliers(self, project_data):
        target_location = project_data.get("location", "").strip()
        target_techs   = listify(project_data.get("techNeeds", []))
        proj_region    = normalize_region(target_location)

        print(f"🔍 Matching for location='{target_location}' → region='{proj_region}', techs={target_techs}")

        matches = []
        for s in self.suppliers_data:
            name = s.get("name")
            if not name:
                continue

            supp_region = s.get("region_norm") or normalize_region(s.get("region"))
            supp_techs  = listify(s.get("technologies"))

            region_match = (
                proj_region == "all" or
                supp_region == "all" or
                proj_region == supp_region
            )

            tech_match, matched_tech = self._tech_matches(supp_techs, target_techs)

            # Scoring
            score, reasons = 0, []
            if region_match:
                score += 50
                reasons.append("Region match")
            if tech_match:
                score += 50
                reasons.append("Technology expertise")

            rating = s.get("rating")
            if isinstance(rating, (int, float)):
                score += max(0, (rating - 3.0) * 10)

            if tech_match:  # still require at least tech_ok (or no tech selected)
                matches.append({
                    "source": s.get("source"),
                    "provider_id": s.get("provider_id"),
                    "name": name,
                    "region": s.get("region"),
                    "technology": supp_techs,
                    "rating": rating,
                    "contact": s.get("contact"),
                    "email": s.get("email"),
                    "phone": s.get("phone"),
                    "match_score": round(score, 1),
                    "match_reasons": reasons,
                    "region_match": region_match,
                    "tech_match": tech_match,
                    "matched_technology": matched_tech
                })

        matches.sort(key=lambda x: x["match_score"], reverse=True)
        return matches

    # ---------------------- AI insights ---------------------------------------
    def get_ai_insights(self, project_data, matching_suppliers):
        if not self.ai_enabled or not matching_suppliers:
            return None
        try:
            prompt = f"""
# SUPPLIER RECOMMENDATION INSIGHTS
## PROJECT:
- Name: {project_data.get('name', 'Unnamed Project')}
- Type: {project_data.get('type', 'Residential')}
- Location: {project_data['location']}
- Size: {project_data.get('sizeSqm', 'N/A')} sqm
- Budget: {project_data.get('budget', 'N/A')} SAR
- Timeline: {project_data.get('timelineMonths', 'N/A')} months
- Technologies: {', '.join(project_data.get('techNeeds', []))}
- Complexity: {project_data.get('complexity_score', 'N/A')}/10

## TOP SUPPLIERS:
{json.dumps(matching_suppliers[:3], indent=2, ensure_ascii=False)}

Return concise JSON:
{{"summary": "...","key_advantages": ["..."],"potential_risks": ["..."],"recommendations": "..."}}
"""
            resp = self.model.generate_content(prompt)
            try:
                text = resp.text
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                elif "```" in text:
                    text = text.split("```")[1].split("```")[0].strip()
                return json.loads(text)
            except Exception:
                return {
                    "summary": (resp.text or "")[:200] + "...",
                    "key_advantages": [],
                    "potential_risks": [],
                    "recommendations": resp.text or ""
                }
        except Exception as e:
            print(f"⚠️ AI insights error: {e}")
            return None

# ------------------------- Flask routes --------------------------------------
recommendation_api = SupplierRecommendationAPI()

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "ai_enabled": recommendation_api.ai_enabled,
        "suppliers_loaded": len(recommendation_api.suppliers_data)
    })

@app.route("/api/recommend", methods=["POST"])
def recommend_providers():
    try:
        data = request.json or {}
        print(f"\n📥 Recommend request: {data.get('name')} @ {data.get('location')}")

        project = {
            "name": data.get("name", ""),
            "type": data.get("type", "Residential"),
            "location": data.get("location", "Riyadh"),
            "sizeSqm": data.get("sizeSqm", 1500),
            "budget": data.get("budget", 2_000_000),
            "timelineMonths": data.get("timelineMonths", 12),
            "Nfloors": data.get("Nfloors", 2),
            "techNeeds": listify(data.get("techNeeds", [])),
            "preferences": data.get("preferences", {}),
        }

        # optional plan
        analysis = None
        complexity = 5
        if data.get("planImage"):
            print("📷 Analyzing plan…")
            analysis = recommendation_api.analyze_construction_plan(data["planImage"])
            if analysis:
                complexity = recommendation_api.parse_complexity_score(analysis)

        project["complexity_score"] = complexity
        project["complexity_analysis"] = analysis

        tech_recs = recommendation_api.recommend_tech_based_on_complexity(complexity)

        matches = recommendation_api.find_matching_suppliers(project)
        if not matches:
            return jsonify({
                "success": False,
                "message": "No suppliers found matching the criteria.",
                "tech_recommendations": tech_recs[:5],
                "suggested_technologies": [t["technology"] for t in tech_recs[:5]]
            })

        top = matches[:5]
        insights = recommendation_api.get_ai_insights(project, top)

        return jsonify({
            "success": True,
            "project_complexity": complexity,
            "complexity_analysis": analysis,
            "total_matches": len(matches),
            "suppliers": top,
            "tech_recommendations": tech_recs[:5],
            "ai_insights": insights,
            "project_summary": {
                "name": project["name"],
                "type": project["type"],
                "location": project["location"],
                "budget": project["budget"],
                "timeline": project["timelineMonths"],
                "technologies": project["techNeeds"],
            },
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e), "message": "Failed"}), 500

@app.route("/api/technologies", methods=["GET"])
def get_technologies():
    return jsonify({"success": True, "technologies": list(recommendation_api.tech_complexity_data.keys())})

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🚀 RAWASI Provider Recommendation API")
    print("=" * 60)
    print(f"✅ Suppliers loaded: {len(recommendation_api.suppliers_data)}")
    print(f"✅ AI enabled: {recommendation_api.ai_enabled}")
    print(f"✅ Technologies available: {len(recommendation_api.tech_complexity_data)}")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5001, debug=True)
