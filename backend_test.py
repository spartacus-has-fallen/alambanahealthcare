import requests
import sys
import json
from datetime import datetime

class AlambanaAPITester:
    def __init__(self, base_url="http://localhost:8000/api"):
        self.base_url = base_url
        self.admin_token = None
        self.patient_token = None
        self.doctor_token = None
        self.doctor_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    self.log_test(name, True)
                    return True, response_data
                except:
                    self.log_test(name, True, "No JSON response")
                    return True, {}
            else:
                try:
                    error_data = response.json()
                    self.log_test(name, False, f"Status {response.status_code}: {error_data}")
                except:
                    self.log_test(name, False, f"Status {response.status_code}: {response.text}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@alambana.health", "password": "admin123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            return True
        return False

    def test_patient_login(self):
        """Test patient login"""
        success, response = self.run_test(
            "Patient Login",
            "POST",
            "auth/login",
            200,
            data={"email": "patient@test.com", "password": "patient123"}
        )
        if success and 'token' in response:
            self.patient_token = response['token']
            return True
        return False

    def test_doctor_login(self):
        """Test doctor login"""
        success, response = self.run_test(
            "Doctor Login",
            "POST",
            "auth/login",
            200,
            data={"email": "doctor@test.com", "password": "doctor123"}
        )
        if success and 'token' in response:
            self.doctor_token = response['token']
            return True
        return False

    def test_patient_referral_code(self):
        """Test getting patient referral code"""
        success, response = self.run_test(
            "Get Patient Referral Code",
            "GET",
            "referral/my-code",
            200,
            token=self.patient_token
        )
        return success

    def test_patient_referral_stats(self):
        """Test getting patient referral stats"""
        success, response = self.run_test(
            "Get Patient Referral Stats",
            "GET",
            "referral/stats",
            200,
            token=self.patient_token
        )
        return success

    def test_create_health_record(self):
        """Test creating health record"""
        health_data = {
            "record_type": "weekly",
            "date": "2025-01-15",
            "weight": 70.5,
            "blood_pressure_systolic": 120,
            "blood_pressure_diastolic": 80,
            "oxygen_level": 98.5,
            "sugar_level": 95.0,
            "heart_rate": 72,
            "notes": "Feeling good, regular exercise"
        }
        success, response = self.run_test(
            "Create Health Record",
            "POST",
            "health-records",
            200,
            data=health_data,
            token=self.patient_token
        )
        return success

    def test_get_health_records(self):
        """Test getting health records"""
        success, response = self.run_test(
            "Get Health Records",
            "GET",
            "health-records",
            200,
            token=self.patient_token
        )
        return success

    def test_create_doctor_profile(self):
        """Test creating doctor profile"""
        doctor_data = {
            "specialization": "Cardiology",
            "qualification": "MBBS MD",
            "experience_years": 10,
            "license_number": "MCI12345",
            "bio": "Experienced cardiologist with 10 years of practice",
            "consultation_fee": 500.0,
            "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "available_time_slots": ["09:00-10:00", "10:00-11:00", "14:00-15:00", "15:00-16:00"]
        }
        success, response = self.run_test(
            "Create Doctor Profile",
            "POST",
            "doctors/profile",
            200,
            data=doctor_data,
            token=self.doctor_token
        )
        if success and 'id' in response:
            self.doctor_id = response['id']
        return success

    def test_get_doctor_profile(self):
        """Test getting doctor profile"""
        success, response = self.run_test(
            "Get Doctor Profile",
            "GET",
            "doctors/profile/me",
            200,
            token=self.doctor_token
        )
        return success

    def test_get_pending_doctors(self):
        """Test getting pending doctors (admin)"""
        success, response = self.run_test(
            "Get Pending Doctors",
            "GET",
            "admin/doctors/pending",
            200,
            token=self.admin_token
        )
        return success

    def test_approve_doctor(self):
        """Test approving doctor (admin)"""
        if not self.doctor_id:
            self.log_test("Approve Doctor", False, "No doctor ID available")
            return False
            
        success, response = self.run_test(
            "Approve Doctor",
            "PUT",
            f"admin/doctors/{self.doctor_id}/approve",
            200,
            data={"approved": True},
            token=self.admin_token
        )
        return success

    def test_get_analytics(self):
        """Test getting admin analytics"""
        success, response = self.run_test(
            "Get Admin Analytics",
            "GET",
            "admin/analytics",
            200,
            token=self.admin_token
        )
        return success

    def test_book_appointment(self):
        """Test booking appointment"""
        if not self.doctor_id:
            self.log_test("Book Appointment", False, "No approved doctor available")
            return False
            
        appointment_data = {
            "doctor_id": self.doctor_id,
            "appointment_type": "online",
            "appointment_date": "2025-01-20",
            "appointment_time": "10:00-11:00",
            "notes": "Regular checkup"
        }
        success, response = self.run_test(
            "Book Appointment",
            "POST",
            "appointments",
            200,
            data=appointment_data,
            token=self.patient_token
        )
        return success

    def test_ai_symptom_checker(self):
        """Test AI symptom checker"""
        symptom_data = {
            "symptoms": "I have been experiencing chest pain and shortness of breath for the past 2 days",
            "age": 35,
            "gender": "male"
        }
        success, response = self.run_test(
            "AI Symptom Checker",
            "POST",
            "ai/symptom-check",
            200,
            data=symptom_data,
            token=self.patient_token
        )
        return success

    def test_get_doctors_list(self):
        """Test getting approved doctors list"""
        success, response = self.run_test(
            "Get Doctors List",
            "GET",
            "doctors",
            200
        )
        return success

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Alambana Healthcare API Tests")
        print("=" * 50)

        # Authentication Tests
        print("\n📋 AUTHENTICATION TESTS")
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping admin tests")
        
        if not self.test_patient_login():
            print("❌ Patient login failed - stopping patient tests")
            
        if not self.test_doctor_login():
            print("❌ Doctor login failed - stopping doctor tests")

        # Patient Flow Tests
        if self.patient_token:
            print("\n👤 PATIENT FLOW TESTS")
            self.test_patient_referral_code()
            self.test_patient_referral_stats()
            self.test_create_health_record()
            self.test_get_health_records()

        # Doctor Flow Tests
        if self.doctor_token:
            print("\n👨‍⚕️ DOCTOR FLOW TESTS")
            self.test_create_doctor_profile()
            self.test_get_doctor_profile()

        # Admin Flow Tests
        if self.admin_token:
            print("\n🔧 ADMIN FLOW TESTS")
            self.test_get_pending_doctors()
            if self.doctor_id:
                self.test_approve_doctor()
            self.test_get_analytics()

        # Appointment Tests
        if self.patient_token and self.doctor_id:
            print("\n📅 APPOINTMENT TESTS")
            self.test_book_appointment()

        # AI Tests
        if self.patient_token:
            print("\n🤖 AI SYMPTOM CHECKER TESTS")
            self.test_ai_symptom_checker()

        # Public API Tests
        print("\n🌐 PUBLIC API TESTS")
        self.test_get_doctors_list()

        # Print Summary
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")

        # Print Failed Tests
        failed_tests = [t for t in self.test_results if not t['success']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   • {test['name']}: {test['details']}")

        return self.tests_passed == self.tests_run

def main():
    tester = AlambanaAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())