#!/usr/bin/env python3
"""
Focused Backend Testing for Specific Endpoints
Testing only the requested endpoints: webhook, supported-languages, analysis-types, and basic API health
"""

import requests
import json
import time
from typing import Dict, Any

class FocusedBackendTester:
    def __init__(self):
        # Get backend URL from frontend .env
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.split('=')[1].strip()
                    break
            else:
                self.base_url = "https://codebugsleuth.preview.emergentagent.com"
        
        self.api_url = f"{self.base_url}/api"
        self.test_results = []
        
        print(f"🎯 FOCUSED BACKEND TESTING")
        print(f"Testing backend at: {self.api_url}")
        print("=" * 60)
    
    def log_test(self, test_name: str, status: str, details: str = "", response_data: Dict = None):
        """Log test results"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        if response_data:
            result["response"] = response_data
        
        self.test_results.append(result)
        
        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        print(f"{status_emoji} {test_name}: {status}")
        if details:
            print(f"   Details: {details}")
        if response_data and status == "FAIL":
            print(f"   Response: {json.dumps(response_data, indent=2)}")
        print()
    
    def test_api_root(self):
        """Test GET /api/ returns connection status"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                message = data.get("message", "")
                version = data.get("version", "")
                status = data.get("status", "")
                
                if "AI Bug Hunter" in message and version and status:
                    self.log_test("Basic API Health Check", "PASS", 
                                f"API responding correctly - Message: '{message}', Version: {version}, Status: {status}")
                else:
                    self.log_test("Basic API Health Check", "FAIL", 
                                f"API responding but missing expected fields", data)
            else:
                self.log_test("Basic API Health Check", "FAIL", 
                            f"HTTP {response.status_code}", {"status_code": response.status_code})
                
        except requests.exceptions.RequestException as e:
            self.log_test("Basic API Health Check", "FAIL", f"Connection error: {str(e)}")
    
    def test_webhook_stripe_endpoint(self):
        """Test POST /api/webhook/stripe endpoint exists and handles payload"""
        try:
            # Test with a mock Stripe webhook payload structure
            mock_webhook_payload = {
                "id": "evt_test_webhook",
                "object": "event",
                "api_version": "2020-08-27",
                "created": int(time.time()),
                "data": {
                    "object": {
                        "id": "cs_test_session",
                        "object": "checkout.session",
                        "payment_status": "paid"
                    }
                },
                "livemode": False,
                "pending_webhooks": 1,
                "request": {
                    "id": None,
                    "idempotency_key": None
                },
                "type": "checkout.session.completed"
            }
            
            # Mock Stripe signature header (in production this would be real)
            headers = {
                "Stripe-Signature": "t=1234567890,v1=mock_signature_for_testing",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                f"{self.api_url}/webhook/stripe",
                json=mock_webhook_payload,
                headers=headers,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if webhook was received (even if signature verification fails in demo mode)
                if "received" in data or "error" in data:
                    if data.get("received") == True:
                        self.log_test("Webhook Endpoint - Stripe", "PASS", 
                                    "Webhook endpoint exists and processed payload successfully")
                    else:
                        # Even if there's an error (like signature verification), the endpoint exists and is handling requests
                        error_msg = data.get("error", "Unknown error")
                        if "signature" in error_msg.lower() or "webhook" in error_msg.lower():
                            self.log_test("Webhook Endpoint - Stripe", "PASS", 
                                        f"Webhook endpoint exists and handles requests (signature verification expected to fail in test): {error_msg}")
                        else:
                            self.log_test("Webhook Endpoint - Stripe", "WARN", 
                                        f"Webhook endpoint exists but returned error: {error_msg}")
                else:
                    self.log_test("Webhook Endpoint - Stripe", "FAIL", 
                                f"Unexpected response format", data)
            else:
                # Check if it's a method not allowed or similar - endpoint exists but wrong method
                if response.status_code == 405:
                    self.log_test("Webhook Endpoint - Stripe", "FAIL", 
                                "Endpoint exists but method not allowed")
                elif response.status_code == 404:
                    self.log_test("Webhook Endpoint - Stripe", "FAIL", 
                                "Webhook endpoint not found")
                else:
                    error_data = {}
                    try:
                        error_data = response.json()
                    except:
                        error_data = {"raw_response": response.text}
                    
                    self.log_test("Webhook Endpoint - Stripe", "FAIL", 
                                f"HTTP {response.status_code}", error_data)
                
        except requests.exceptions.RequestException as e:
            self.log_test("Webhook Endpoint - Stripe", "FAIL", f"Connection error: {str(e)}")
    
    def test_supported_languages_endpoint(self):
        """Test GET /api/supported-languages returns proper response"""
        try:
            response = requests.get(f"{self.api_url}/supported-languages", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                languages = data.get("languages", [])
                
                if isinstance(languages, list) and len(languages) > 0:
                    # Check if languages have expected structure
                    sample_lang = languages[0] if languages else {}
                    expected_fields = ["name", "extension", "type"] or ["id", "name", "extension"]
                    
                    has_expected_structure = any(field in sample_lang for field in expected_fields)
                    
                    if has_expected_structure:
                        language_names = [lang.get("name", lang.get("id", "unknown")) for lang in languages]
                        self.log_test("Supported Languages Endpoint", "PASS", 
                                    f"Endpoint returns {len(languages)} supported languages: {', '.join(language_names[:5])}{'...' if len(language_names) > 5 else ''}")
                    else:
                        self.log_test("Supported Languages Endpoint", "WARN", 
                                    f"Endpoint returns languages but structure may be unexpected", data)
                else:
                    self.log_test("Supported Languages Endpoint", "FAIL", 
                                "Endpoint returns empty or invalid languages list", data)
            else:
                self.log_test("Supported Languages Endpoint", "FAIL", 
                            f"HTTP {response.status_code}", {"status_code": response.status_code})
                
        except requests.exceptions.RequestException as e:
            self.log_test("Supported Languages Endpoint", "FAIL", f"Connection error: {str(e)}")
    
    def test_analysis_types_endpoint(self):
        """Test GET /api/analysis-types returns proper response"""
        try:
            response = requests.get(f"{self.api_url}/analysis-types", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                types = data.get("types", [])
                
                if isinstance(types, list) and len(types) > 0:
                    # Check if analysis types have expected structure
                    sample_type = types[0] if types else {}
                    expected_fields = ["id", "name", "description"]
                    
                    has_expected_structure = all(field in sample_type for field in expected_fields)
                    
                    if has_expected_structure:
                        type_names = [t.get("name", t.get("id", "unknown")) for t in types]
                        self.log_test("Analysis Types Endpoint", "PASS", 
                                    f"Endpoint returns {len(types)} analysis types: {', '.join(type_names)}")
                    else:
                        self.log_test("Analysis Types Endpoint", "WARN", 
                                    f"Endpoint returns types but structure may be unexpected", data)
                else:
                    self.log_test("Analysis Types Endpoint", "FAIL", 
                                "Endpoint returns empty or invalid types list", data)
            else:
                self.log_test("Analysis Types Endpoint", "FAIL", 
                            f"HTTP {response.status_code}", {"status_code": response.status_code})
                
        except requests.exceptions.RequestException as e:
            self.log_test("Analysis Types Endpoint", "FAIL", f"Connection error: {str(e)}")
    
    def run_focused_tests(self):
        """Run the focused tests as requested"""
        print("🎯 FOCUSED BACKEND TESTING - SPECIFIC ENDPOINTS")
        print("=" * 60)
        
        print("\n📋 BASIC API HEALTH")
        print("-" * 30)
        self.test_api_root()
        
        print("\n🔗 WEBHOOK INFRASTRUCTURE")
        print("-" * 30)
        self.test_webhook_stripe_endpoint()
        
        print("\n📊 SUPPORTED LANGUAGES & ANALYSIS TYPES")
        print("-" * 30)
        self.test_supported_languages_endpoint()
        self.test_analysis_types_endpoint()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📋 FOCUSED TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["status"] == "PASS"])
        failed_tests = len([r for r in self.test_results if r["status"] == "FAIL"])
        warning_tests = len([r for r in self.test_results if r["status"] == "WARN"])
        
        print(f"📊 TEST STATISTICS:")
        print(f"   Total Tests: {total_tests}")
        print(f"   ✅ Passed: {passed_tests}")
        print(f"   ❌ Failed: {failed_tests}")
        print(f"   ⚠️  Warnings: {warning_tests}")
        print()
        
        # Show failed tests
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for result in self.test_results:
                if result["status"] == "FAIL":
                    print(f"   ❌ {result['test']}: {result['details']}")
            print()
        
        # Show warnings
        if warning_tests > 0:
            print("⚠️  WARNINGS:")
            for result in self.test_results:
                if result["status"] == "WARN":
                    print(f"   ⚠️  {result['test']}: {result['details']}")
            print()
        
        # Overall status
        if failed_tests == 0:
            if warning_tests == 0:
                print("🟢 ALL FOCUSED TESTS PASSED")
            else:
                print("🟡 TESTS PASSED WITH WARNINGS")
        else:
            print("🔴 SOME TESTS FAILED")
        
        print("=" * 60)
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = FocusedBackendTester()
    success = tester.run_focused_tests()
    
    # Exit with appropriate code
    exit(0 if success else 1)