#!/usr/bin/env python3
"""
Backend Testing Suite for MailChimp Email Automation Integration
Tests all MailChimp-related endpoints and functionality
"""

import requests
import json
import time
import asyncio
from typing import Dict, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

class MailChimpBackendTester:
    def __init__(self):
        # Get backend URL from frontend .env
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.split('=')[1].strip()
                    break
            else:
                self.base_url = "https://bugfinder-6.preview.emergentagent.com"
        
        self.api_url = f"{self.base_url}/api"
        self.test_results = []
        
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
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "AI Bug Hunter" in data.get("message", ""):
                    self.log_test("API Root Connectivity", "PASS", 
                                f"API responding correctly (v{data.get('version', 'unknown')})")
                else:
                    self.log_test("API Root Connectivity", "WARN", 
                                "API responding but unexpected message", data)
            else:
                self.log_test("API Root Connectivity", "FAIL", 
                            f"HTTP {response.status_code}", {"status_code": response.status_code})
                
        except requests.exceptions.RequestException as e:
            self.log_test("API Root Connectivity", "FAIL", f"Connection error: {str(e)}")
    
    def test_mailchimp_health_check(self):
        """Test MailChimp health check endpoint"""
        try:
            response = requests.get(f"{self.api_url}/mailchimp/health", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                status = data.get("status", "unknown")
                
                if status == "healthy":
                    self.log_test("MailChimp Health Check", "PASS", 
                                f"Service healthy, response time: {data.get('response_time', 'N/A')}")
                elif status == "unhealthy":
                    error_msg = data.get("error", "Unknown error")
                    self.log_test("MailChimp Health Check", "FAIL", 
                                f"Service unhealthy: {error_msg}", data)
                else:
                    self.log_test("MailChimp Health Check", "WARN", 
                                f"Unknown status: {status}", data)
            else:
                self.log_test("MailChimp Health Check", "FAIL", 
                            f"HTTP {response.status_code}", {"status_code": response.status_code})
                
        except requests.exceptions.RequestException as e:
            self.log_test("MailChimp Health Check", "FAIL", f"Connection error: {str(e)}")
    
    def test_user_registration_with_email(self):
        """Test user registration endpoint with welcome email automation"""
        test_email = "testuser@example.com"
        test_name = "Test User"
        test_plan = "free"
        
        try:
            # Test user registration
            registration_data = {
                "email": test_email,
                "name": test_name,
                "plan": test_plan
            }
            
            response = requests.post(
                f"{self.api_url}/auth/register", 
                data=registration_data,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if registration was successful
                if data.get("status") == "success":
                    user_id = data.get("user_id")
                    welcome_email_status = data.get("welcome_email")
                    
                    if user_id and welcome_email_status == "scheduled":
                        self.log_test("User Registration with Email", "PASS", 
                                    f"User created (ID: {user_id[:8]}...) and welcome email scheduled")
                    else:
                        self.log_test("User Registration with Email", "WARN", 
                                    "Registration successful but email scheduling unclear", data)
                else:
                    self.log_test("User Registration with Email", "FAIL", 
                                f"Registration failed: {data.get('message', 'Unknown error')}", data)
            else:
                error_data = {}
                try:
                    error_data = response.json()
                except:
                    error_data = {"raw_response": response.text}
                
                self.log_test("User Registration with Email", "FAIL", 
                            f"HTTP {response.status_code}", error_data)
                
        except requests.exceptions.RequestException as e:
            self.log_test("User Registration with Email", "FAIL", f"Connection error: {str(e)}")
    
    def test_admin_send_test_email(self):
        """Test admin endpoint for sending test emails"""
        test_cases = [
            {"email_type": "welcome", "description": "Welcome Email"},
            {"email_type": "subscription", "description": "Subscription Email"}
        ]
        
        for test_case in test_cases:
            try:
                test_data = {
                    "email": "admin@example.com",
                    "name": "Admin Test",
                    "email_type": test_case["email_type"]
                }
                
                response = requests.post(
                    f"{self.api_url}/admin/send-test-email",
                    data=test_data,
                    timeout=15
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "success":
                        self.log_test(f"Admin Test Email - {test_case['description']}", "PASS", 
                                    f"Test email scheduled: {data.get('message', '')}")
                    else:
                        self.log_test(f"Admin Test Email - {test_case['description']}", "FAIL", 
                                    f"Unexpected response: {data}", data)
                else:
                    error_data = {}
                    try:
                        error_data = response.json()
                    except:
                        error_data = {"raw_response": response.text}
                    
                    self.log_test(f"Admin Test Email - {test_case['description']}", "FAIL", 
                                f"HTTP {response.status_code}", error_data)
                    
            except requests.exceptions.RequestException as e:
                self.log_test(f"Admin Test Email - {test_case['description']}", "FAIL", 
                            f"Connection error: {str(e)}")
    
    def test_mailchimp_add_user(self):
        """Test manual MailChimp audience addition endpoint"""
        try:
            test_data = {
                "email": "manual@example.com",
                "name": "Manual Test User",
                "plan": "pro"
            }
            
            response = requests.post(
                f"{self.api_url}/mailchimp/add-user",
                data=test_data,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                status = data.get("status", "unknown")
                
                if status == "success":
                    self.log_test("MailChimp Add User", "PASS", 
                                f"User added to audience: {data.get('member_id', 'N/A')}")
                elif status == "updated":
                    self.log_test("MailChimp Add User", "PASS", 
                                f"User updated in audience: {data.get('member_id', 'N/A')}")
                elif status == "skipped":
                    reason = data.get("reason", "Unknown reason")
                    self.log_test("MailChimp Add User", "WARN", 
                                f"Operation skipped: {reason}", data)
                elif status == "error":
                    error_msg = data.get("error", "Unknown error")
                    self.log_test("MailChimp Add User", "FAIL", 
                                f"MailChimp error: {error_msg}", data)
                else:
                    self.log_test("MailChimp Add User", "WARN", 
                                f"Unknown status: {status}", data)
            else:
                error_data = {}
                try:
                    error_data = response.json()
                except:
                    error_data = {"raw_response": response.text}
                
                self.log_test("MailChimp Add User", "FAIL", 
                            f"HTTP {response.status_code}", error_data)
                
        except requests.exceptions.RequestException as e:
            self.log_test("MailChimp Add User", "FAIL", f"Connection error: {str(e)}")
    
    def test_environment_configuration(self):
        """Test environment configuration and service initialization"""
        try:
            # Check if required environment variables are set
            required_vars = [
                'MAILCHIMP_API_KEY',
                'MAILCHIMP_SERVER_PREFIX', 
                'DEFAULT_AUDIENCE_ID',
                'SENDER_NAME',
                'REPLY_TO_EMAIL'
            ]
            
            missing_vars = []
            placeholder_vars = []
            
            for var in required_vars:
                value = os.environ.get(var)
                if not value:
                    missing_vars.append(var)
                elif "placeholder" in value.lower():
                    placeholder_vars.append(f"{var}={value}")
            
            if missing_vars:
                self.log_test("Environment Configuration", "FAIL", 
                            f"Missing variables: {', '.join(missing_vars)}")
            elif placeholder_vars:
                self.log_test("Environment Configuration", "WARN", 
                            f"Placeholder values detected: {', '.join(placeholder_vars)}")
            else:
                self.log_test("Environment Configuration", "PASS", 
                            "All required environment variables are configured")
                
        except Exception as e:
            self.log_test("Environment Configuration", "FAIL", f"Configuration check error: {str(e)}")
    
    def test_error_handling(self):
        """Test error handling for various scenarios"""
        
        # Test invalid email type for admin endpoint
        try:
            response = requests.post(
                f"{self.api_url}/admin/send-test-email",
                data={
                    "email": "test@example.com",
                    "name": "Test",
                    "email_type": "invalid_type"
                },
                timeout=10
            )
            
            if response.status_code == 400:
                self.log_test("Error Handling - Invalid Email Type", "PASS", 
                            "Correctly rejected invalid email type")
            else:
                self.log_test("Error Handling - Invalid Email Type", "FAIL", 
                            f"Expected 400, got {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("Error Handling - Invalid Email Type", "FAIL", 
                        f"Connection error: {str(e)}")
        
        # Test missing required fields
        try:
            response = requests.post(
                f"{self.api_url}/auth/register",
                data={"name": "Test User"},  # Missing email
                timeout=10
            )
            
            if response.status_code in [400, 422]:  # 422 for validation errors
                self.log_test("Error Handling - Missing Required Fields", "PASS", 
                            "Correctly rejected missing email field")
            else:
                self.log_test("Error Handling - Missing Required Fields", "FAIL", 
                            f"Expected 400/422, got {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            self.log_test("Error Handling - Missing Required Fields", "FAIL", 
                        f"Connection error: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("Starting MailChimp Backend Integration Tests")
        print("=" * 60)
        
        # Test basic connectivity first
        self.test_api_root()
        
        # Test environment configuration
        self.test_environment_configuration()
        
        # Test MailChimp service health
        self.test_mailchimp_health_check()
        
        # Test user registration with email automation
        self.test_user_registration_with_email()
        
        # Test admin endpoints
        self.test_admin_send_test_email()
        
        # Test MailChimp audience management
        self.test_mailchimp_add_user()
        
        # Test error handling
        self.test_error_handling()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["status"] == "PASS"])
        failed_tests = len([r for r in self.test_results if r["status"] == "FAIL"])
        warning_tests = len([r for r in self.test_results if r["status"] == "WARN"])
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"⚠️  Warnings: {warning_tests}")
        print()
        
        if failed_tests > 0:
            print("FAILED TESTS:")
            for result in self.test_results:
                if result["status"] == "FAIL":
                    print(f"❌ {result['test']}: {result['details']}")
            print()
        
        if warning_tests > 0:
            print("WARNINGS:")
            for result in self.test_results:
                if result["status"] == "WARN":
                    print(f"⚠️  {result['test']}: {result['details']}")
            print()
        
        # Overall status
        if failed_tests == 0:
            if warning_tests == 0:
                print("🎉 ALL TESTS PASSED!")
            else:
                print("✅ All critical tests passed (some warnings)")
        else:
            print("❌ Some tests failed - review above for details")
        
        print("=" * 60)

if __name__ == "__main__":
    tester = MailChimpBackendTester()
    tester.run_all_tests()