import requests
import json

def test_ai_symptom_checker_public():
    """Test AI symptom checker without authentication (public endpoint)"""
    url = "http://localhost:8000/api/ai/symptom-check"
    
    symptom_data = {
        "symptoms": "I have been experiencing headache and fever for the past 2 days",
        "age": 28,
        "gender": "female"
    }
    
    headers = {'Content-Type': 'application/json'}
    
    print("🔍 Testing AI Symptom Checker (Public - No Auth)...")
    print(f"   URL: {url}")
    
    try:
        response = requests.post(url, json=symptom_data, headers=headers, timeout=30)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ AI Symptom Checker (Public) - PASSED")
            print(f"   Assessment: {result.get('assessment', 'N/A')[:100]}...")
            print(f"   Risk Level: {result.get('risk_level', 'N/A')}")
            print(f"   Suggested Specialist: {result.get('suggested_specialist', 'N/A')}")
            print(f"   Emergency Alert: {result.get('emergency_alert', False)}")
            return True
        else:
            print(f"❌ AI Symptom Checker (Public) - FAILED: Status {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ AI Symptom Checker (Public) - FAILED: Exception {str(e)}")
        return False

if __name__ == "__main__":
    test_ai_symptom_checker_public()