#!/usr/bin/env python3
"""
Comprehensive Backend Testing Suite for AI Bug Hunter SaaS Platform
Deployment Readiness Testing covering all systems and integrations
"""

import requests
import json
import time
import asyncio
from typing import Dict, Any
import os
from dotenv import load_dotenv
import tempfile
from pathlib import Path

# Load environment variables
load_dotenv('/app/backend/.env')

class ComprehensiveBackendTester:
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
        self.deployment_blockers = []
        self.critical_issues = []
        
        print(f"🚀 DEPLOYMENT READINESS TESTING")
        print(f"Testing backend at: {self.api_url}")
        print("=" * 80)
    
    def log_test(self, test_name: str, status: str, details: str = "", response_data: Dict = None, is_critical: bool = False):
        """Log test results"""
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "critical": is_critical
        }
        if response_data:
            result["response"] = response_data
        
        self.test_results.append(result)
        
        # Track deployment blockers and critical issues
        if status == "FAIL" and is_critical:
            self.deployment_blockers.append(f"{test_name}: {details}")
        elif status == "FAIL":
            self.critical_issues.append(f"{test_name}: {details}")
        
        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        critical_marker = " 🚨 DEPLOYMENT BLOCKER" if status == "FAIL" and is_critical else ""
        print(f"{status_emoji} {test_name}: {status}{critical_marker}")
        if details:
            print(f"   Details: {details}")
        if response_data and status == "FAIL":
            print(f"   Response: {json.dumps(response_data, indent=2)}")
        print()
    
    # ========== CORE APPLICATION HEALTH TESTS ==========
    
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
    
    # ========== MULTI-TIER SUBSCRIPTION SYSTEM TESTS ==========
    
    def test_subscription_plans_endpoint(self):
        """Test subscription plans endpoint"""
        try:
            response = requests.get(f"{self.api_url}/subscription/plans", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                plans = data.get("plans", [])
                
                if len(plans) == 4:  # Free, Basic, Pro, Enterprise
                    plan_names = [plan.get("name", "") for plan in plans]
                    expected_tiers = ["Free Tier", "Basic Tier", "Pro Tier", "Enterprise Tier"]
                    
                    if all(tier in plan_names for tier in expected_tiers):
                        self.log_test("Subscription Plans Endpoint", "PASS", 
                                    f"All 4 subscription tiers available: {', '.join(plan_names)}", is_critical=True)
                    else:
                        self.log_test("Subscription Plans Endpoint", "FAIL", 
                                    f"Missing expected tiers. Found: {plan_names}", data, is_critical=True)
                else:
                    self.log_test("Subscription Plans Endpoint", "FAIL", 
                                f"Expected 4 plans, found {len(plans)}", data, is_critical=True)
            else:
                self.log_test("Subscription Plans Endpoint", "FAIL", 
                            f"HTTP {response.status_code}", {"status_code": response.status_code}, is_critical=True)
                
        except requests.exceptions.RequestException as e:
            self.log_test("Subscription Plans Endpoint", "FAIL", f"Connection error: {str(e)}", is_critical=True)
    
    def test_subscription_tiers_endpoint(self):
        """Test subscription tiers endpoint with Stripe Payment Links configuration"""
        try:
            response = requests.get(f"{self.api_url}/subscription/tiers", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                tiers = data.get("tiers", [])
                
                expected_tiers = ["basic", "pro", "enterprise"]
                expected_prices = [9.0, 19.0, 49.0]
                
                found_tiers = [tier.get("id") for tier in tiers]
                available_tiers = [tier for tier in tiers if tier.get("available_for_purchase", False)]
                payment_link_tiers = [tier for tier in tiers if tier.get("payment_method") == "stripe_payment_link"]
                
                if all(tier in found_tiers for tier in expected_tiers):
                    if len(available_tiers) == 3 and len(payment_link_tiers) == 3:
                        # Verify payment links are valid Stripe URLs
                        valid_links = []
                        for tier in tiers:
                            payment_link = tier.get("payment_link", "")
                            if payment_link and payment_link.startswith("https://buy.stripe.com/"):
                                valid_links.append(tier["id"])
                        
                        if len(valid_links) == 3:
                            self.log_test("Subscription Tiers with Payment Links", "PASS", 
                                        f"All 3 tiers available with valid Stripe payment links: {valid_links}", is_critical=True)
                        else:
                            self.log_test("Subscription Tiers with Payment Links", "FAIL", 
                                        f"Only {len(valid_links)}/3 tiers have valid payment links", data, is_critical=True)
                    else:
                        self.log_test("Subscription Tiers with Payment Links", "FAIL", 
                                    f"Only {len(available_tiers)}/3 tiers available for purchase", data, is_critical=True)
                else:
                    self.log_test("Subscription Tiers with Payment Links", "FAIL", 
                                f"Missing expected tiers. Found: {found_tiers}", data, is_critical=True)
            else:
                self.log_test("Subscription Tiers with Payment Links", "FAIL", 
                            f"HTTP {response.status_code}", {"status_code": response.status_code}, is_critical=True)
                
        except requests.exceptions.RequestException as e:
            self.log_test("Subscription Tiers with Payment Links", "FAIL", f"Connection error: {str(e)}", is_critical=True)
    
    # ========== STRIPE INTEGRATION TESTS ==========
    
    def test_stripe_payment_links_checkout(self):
        """Test Stripe Payment Links checkout for all tiers"""
        tiers = ["basic", "pro", "enterprise"]
        expected_prices = {"basic": 9.0, "pro": 19.0, "enterprise": 49.0}
        
        for tier in tiers:
            try:
                checkout_data = {
                    "tier": tier,
                    "user_email": "deployment.test@example.com"
                }
                
                response = requests.post(
                    f"{self.api_url}/subscription/checkout",
                    data=checkout_data,
                    timeout=15
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Check for payment link response format
                    payment_link = data.get("payment_link", "")
                    redirect_url = data.get("redirect_url", "")
                    tier_name = data.get("tier", "")
                    monthly_price = data.get("monthly_price", 0)
                    payment_id = data.get("payment_id", "")
                    
                    if (payment_link and payment_link.startswith("https://buy.stripe.com/") and
                        redirect_url == payment_link and
                        tier_name == tier and
                        monthly_price == expected_prices[tier] and
                        payment_id):
                        
                        self.log_test(f"Stripe Payment Link - {tier.title()} Tier", "PASS", 
                                    f"Payment link generated successfully: ${monthly_price}/month, Payment ID: {payment_id[:8]}...", is_critical=True)
                    else:
                        missing_fields = []
                        if not payment_link or not payment_link.startswith("https://buy.stripe.com/"):
                            missing_fields.append("valid payment_link")
                        if redirect_url != payment_link:
                            missing_fields.append("matching redirect_url")
                        if tier_name != tier:
                            missing_fields.append("correct tier")
                        if monthly_price != expected_prices[tier]:
                            missing_fields.append("correct price")
                        if not payment_id:
                            missing_fields.append("payment_id")
                        
                        self.log_test(f"Stripe Payment Link - {tier.title()} Tier", "FAIL", 
                                    f"Invalid response format. Missing: {', '.join(missing_fields)}", data, is_critical=True)
                else:
                    error_data = {}
                    try:
                        error_data = response.json()
                    except:
                        error_data = {"raw_response": response.text}
                    
                    self.log_test(f"Stripe Payment Link - {tier.title()} Tier", "FAIL", 
                                f"HTTP {response.status_code}", error_data, is_critical=True)
                    
            except requests.exceptions.RequestException as e:
                self.log_test(f"Stripe Payment Link - {tier.title()} Tier", "FAIL", 
                            f"Connection error: {str(e)}", is_critical=True)
    
    def test_stripe_price_ids_configuration(self):
        """Test Stripe Price IDs configuration"""
        try:
            # Check environment variables for Price IDs
            price_ids = {
                "basic": os.environ.get('STRIPE_BASIC_PRICE_ID'),
                "pro": os.environ.get('STRIPE_PRO_PRICE_ID'),
                "enterprise": os.environ.get('STRIPE_ENTERPRISE_PRICE_ID')
            }
            
            configured_ids = []
            missing_ids = []
            placeholder_ids = []
            
            for tier, price_id in price_ids.items():
                if not price_id:
                    missing_ids.append(tier)
                elif "placeholder" in price_id.lower():
                    placeholder_ids.append(f"{tier}={price_id}")
                else:
                    configured_ids.append(f"{tier}={price_id}")
            
            if missing_ids:
                self.log_test("Stripe Price IDs Configuration", "FAIL", 
                            f"Missing Price IDs for: {', '.join(missing_ids)}", is_critical=True)
            elif placeholder_ids:
                self.log_test("Stripe Price IDs Configuration", "FAIL", 
                            f"Placeholder Price IDs detected: {', '.join(placeholder_ids)}", is_critical=True)
            else:
                self.log_test("Stripe Price IDs Configuration", "PASS", 
                            f"All Price IDs configured: {len(configured_ids)} tiers", is_critical=True)
                
        except Exception as e:
            self.log_test("Stripe Price IDs Configuration", "FAIL", 
                        f"Configuration check error: {str(e)}", is_critical=True)
    
    # ========== CODE ANALYSIS ENGINE TESTS ==========
    
    def test_code_analysis_upload(self):
        """Test code analysis via file upload"""
        try:
            # Create a test Python file with security issues
            test_code = '''
import os
password = input("Enter password: ")
query = "SELECT * FROM users WHERE id = " + user_id
eval(user_input)
'''
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(test_code)
                temp_file_path = f.name
            
            try:
                with open(temp_file_path, 'rb') as f:
                    files = {'file': ('test_security.py', f, 'text/plain')}
                    data = {'analysis_type': 'comprehensive'}
                    
                    response = requests.post(
                        f"{self.api_url}/analyze/upload",
                        files=files,
                        data=data,
                        timeout=30
                    )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    issues = result.get("issues", [])
                    security_score = result.get("security_score", 0)
                    
                    if len(issues) >= 3 and security_score < 50:  # Should detect multiple security issues
                        self.log_test("Code Analysis Engine - Upload", "PASS", 
                                    f"Analysis working: {len(issues)} issues found, security score: {security_score}/100", is_critical=True)
                    else:
                        self.log_test("Code Analysis Engine - Upload", "WARN", 
                                    f"Analysis may not be detecting issues properly: {len(issues)} issues, score: {security_score}")
                else:
                    error_data = {}
                    try:
                        error_data = response.json()
                    except:
                        error_data = {"raw_response": response.text}
                    
                    self.log_test("Code Analysis Engine - Upload", "FAIL", 
                                f"HTTP {response.status_code}", error_data, is_critical=True)
            finally:
                # Clean up temp file
                os.unlink(temp_file_path)
                
        except requests.exceptions.RequestException as e:
            self.log_test("Code Analysis Engine - Upload", "FAIL", 
                        f"Connection error: {str(e)}", is_critical=True)
        except Exception as e:
            self.log_test("Code Analysis Engine - Upload", "FAIL", 
                        f"Test setup error: {str(e)}", is_critical=True)
    
    def test_code_analysis_text(self):
        """Test code analysis via text input"""
        try:
            test_data = {
                "file_content": "while True:\n    print('infinite loop')\n    # no sleep or break",
                "file_type": "python",
                "analysis_type": "performance"
            }
            
            response = requests.post(
                f"{self.api_url}/analyze/text",
                json=test_data,
                timeout=20
            )
            
            if response.status_code == 200:
                result = response.json()
                
                issues = result.get("issues", [])
                summary = result.get("summary", "")
                
                if issues and "analysis" in summary.lower():
                    self.log_test("Code Analysis Engine - Text", "PASS", 
                                f"Text analysis working: {len(issues)} issues found", is_critical=True)
                else:
                    self.log_test("Code Analysis Engine - Text", "WARN", 
                                f"Analysis completed but may not be working optimally: {summary}")
            else:
                error_data = {}
                try:
                    error_data = response.json()
                except:
                    error_data = {"raw_response": response.text}
                
                self.log_test("Code Analysis Engine - Text", "FAIL", 
                            f"HTTP {response.status_code}", error_data, is_critical=True)
                
        except requests.exceptions.RequestException as e:
            self.log_test("Code Analysis Engine - Text", "FAIL", 
                        f"Connection error: {str(e)}", is_critical=True)
    
    def test_supported_languages(self):
        """Test supported languages endpoint"""
        try:
            response = requests.get(f"{self.api_url}/supported-languages", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                languages = data.get("languages", [])
                
                expected_languages = ["python", "javascript", "typescript", "java", "cpp"]
                found_languages = [lang.get("type") for lang in languages]
                
                if all(lang in found_languages for lang in expected_languages):
                    self.log_test("Supported Languages", "PASS", 
                                f"{len(languages)} languages supported including major ones")
                else:
                    self.log_test("Supported Languages", "WARN", 
                                f"Some expected languages missing. Found: {found_languages}")
            else:
                self.log_test("Supported Languages", "FAIL", 
                            f"HTTP {response.status_code}", {"status_code": response.status_code})
                
        except requests.exceptions.RequestException as e:
            self.log_test("Supported Languages", "FAIL", f"Connection error: {str(e)}")
    
    # ========== AUTHENTICATION & USER MANAGEMENT TESTS ==========
    
    def test_user_authentication_flow(self):
        """Test complete user authentication flow"""
        test_email = "deployment.test@aibughunter.com"
        test_name = "Deployment Test User"
        
        # Test registration
        try:
            registration_data = {
                "email": test_email,
                "name": test_name,
                "plan": "free"
            }
            
            response = requests.post(
                f"{self.api_url}/auth/register",
                data=registration_data,
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                user_id = data.get("user_id")
                
                if user_id and data.get("status") == "success":
                    self.log_test("User Registration", "PASS", 
                                f"User registered successfully (ID: {user_id[:8]}...)", is_critical=True)
                    
                    # Test login
                    login_data = {
                        "email": test_email,
                        "password": "demo"
                    }
                    
                    login_response = requests.post(
                        f"{self.api_url}/auth/login",
                        data=login_data,
                        timeout=10
                    )
                    
                    if login_response.status_code == 200:
                        login_result = login_response.json()
                        if login_result.get("status") == "success":
                            self.log_test("User Login", "PASS", 
                                        f"Login successful for registered user", is_critical=True)
                        else:
                            self.log_test("User Login", "FAIL", 
                                        f"Login failed: {login_result}", is_critical=True)
                    else:
                        self.log_test("User Login", "FAIL", 
                                    f"Login HTTP {login_response.status_code}", is_critical=True)
                else:
                    self.log_test("User Registration", "FAIL", 
                                f"Registration failed: {data}", data, is_critical=True)
            else:
                error_data = {}
                try:
                    error_data = response.json()
                except:
                    error_data = {"raw_response": response.text}
                
                self.log_test("User Registration", "FAIL", 
                            f"HTTP {response.status_code}", error_data, is_critical=True)
                
        except requests.exceptions.RequestException as e:
            self.log_test("User Authentication Flow", "FAIL", 
                        f"Connection error: {str(e)}", is_critical=True)
    
    # ========== PERFORMANCE & RELIABILITY TESTS ==========
    
    def test_api_response_times(self):
        """Test API response times for critical endpoints"""
        endpoints = [
            ("/", "Root endpoint"),
            ("/subscription/plans", "Subscription plans"),
            ("/supported-languages", "Supported languages"),
            ("/mailchimp/health", "MailChimp health")
        ]
        
        slow_endpoints = []
        
        for endpoint, description in endpoints:
            try:
                start_time = time.time()
                response = requests.get(f"{self.api_url}{endpoint}", timeout=10)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    if response_time < 2.0:  # Under 2 seconds is acceptable
                        self.log_test(f"Response Time - {description}", "PASS", 
                                    f"Response time: {response_time:.3f}s")
                    elif response_time < 5.0:  # Under 5 seconds is warning
                        self.log_test(f"Response Time - {description}", "WARN", 
                                    f"Slow response time: {response_time:.3f}s")
                        slow_endpoints.append(f"{description}: {response_time:.3f}s")
                    else:  # Over 5 seconds is failure
                        self.log_test(f"Response Time - {description}", "FAIL", 
                                    f"Very slow response time: {response_time:.3f}s")
                        slow_endpoints.append(f"{description}: {response_time:.3f}s")
                else:
                    self.log_test(f"Response Time - {description}", "FAIL", 
                                f"HTTP {response.status_code} in {response_time:.3f}s")
                    
            except requests.exceptions.RequestException as e:
                self.log_test(f"Response Time - {description}", "FAIL", 
                            f"Connection error: {str(e)}")
        
        if slow_endpoints:
            self.log_test("Overall API Performance", "WARN", 
                        f"Some endpoints are slow: {', '.join(slow_endpoints)}")
        else:
            self.log_test("Overall API Performance", "PASS", 
                        "All tested endpoints respond within acceptable time limits")
    
    def test_concurrent_requests(self):
        """Test handling of concurrent requests"""
        try:
            import threading
            import queue
            
            results_queue = queue.Queue()
            num_threads = 5
            
            def make_request():
                try:
                    response = requests.get(f"{self.api_url}/", timeout=10)
                    results_queue.put(("success", response.status_code))
                except Exception as e:
                    results_queue.put(("error", str(e)))
            
            # Start concurrent requests
            threads = []
            start_time = time.time()
            
            for _ in range(num_threads):
                thread = threading.Thread(target=make_request)
                thread.start()
                threads.append(thread)
            
            # Wait for all threads to complete
            for thread in threads:
                thread.join()
            
            total_time = time.time() - start_time
            
            # Collect results
            successes = 0
            errors = 0
            
            while not results_queue.empty():
                result_type, result_data = results_queue.get()
                if result_type == "success" and result_data == 200:
                    successes += 1
                else:
                    errors += 1
            
            if successes == num_threads:
                self.log_test("Concurrent Request Handling", "PASS", 
                            f"All {num_threads} concurrent requests succeeded in {total_time:.3f}s")
            elif successes > 0:
                self.log_test("Concurrent Request Handling", "WARN", 
                            f"{successes}/{num_threads} concurrent requests succeeded, {errors} failed")
            else:
                self.log_test("Concurrent Request Handling", "FAIL", 
                            f"All {num_threads} concurrent requests failed", is_critical=True)
                
        except Exception as e:
            self.log_test("Concurrent Request Handling", "FAIL", 
                        f"Test setup error: {str(e)}")
    
    def run_all_tests(self):
        """Run comprehensive deployment readiness tests"""
        print("🚀 COMPREHENSIVE DEPLOYMENT READINESS TESTING")
        print("=" * 80)
        
        # ========== CORE APPLICATION HEALTH ==========
        print("\n📋 CORE APPLICATION HEALTH")
        print("-" * 40)
        self.test_api_root()
        self.test_environment_configuration()
        
        # ========== MULTI-TIER SUBSCRIPTION SYSTEM ==========
        print("\n💳 MULTI-TIER SUBSCRIPTION SYSTEM")
        print("-" * 40)
        self.test_subscription_plans_endpoint()
        self.test_subscription_tiers_endpoint()
        
        # ========== STRIPE INTEGRATION ==========
        print("\n💰 STRIPE INTEGRATION")
        print("-" * 40)
        self.test_stripe_price_ids_configuration()
        self.test_stripe_checkout_sessions()
        
        # ========== CODE ANALYSIS ENGINE ==========
        print("\n🔍 CODE ANALYSIS ENGINE")
        print("-" * 40)
        self.test_code_analysis_upload()
        self.test_code_analysis_text()
        self.test_supported_languages()
        
        # ========== AUTHENTICATION & USER MANAGEMENT ==========
        print("\n👤 AUTHENTICATION & USER MANAGEMENT")
        print("-" * 40)
        self.test_user_authentication_flow()
        
        # ========== MAILCHIMP EMAIL AUTOMATION ==========
        print("\n📧 MAILCHIMP EMAIL AUTOMATION")
        print("-" * 40)
        self.test_mailchimp_health_check()
        self.test_user_registration_with_email()
        self.test_admin_send_test_email()
        self.test_mailchimp_add_user()
        
        # ========== PERFORMANCE & RELIABILITY ==========
        print("\n⚡ PERFORMANCE & RELIABILITY")
        print("-" * 40)
        self.test_api_response_times()
        self.test_concurrent_requests()
        
        # ========== ERROR HANDLING ==========
        print("\n🛡️ ERROR HANDLING & SECURITY")
        print("-" * 40)
        self.test_error_handling()
        
        # Print comprehensive summary
        self.print_deployment_summary()
    
    def print_deployment_summary(self):
        """Print comprehensive deployment readiness summary"""
        print("\n" + "=" * 80)
        print("🚀 DEPLOYMENT READINESS ASSESSMENT")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["status"] == "PASS"])
        failed_tests = len([r for r in self.test_results if r["status"] == "FAIL"])
        warning_tests = len([r for r in self.test_results if r["status"] == "WARN"])
        critical_tests = len([r for r in self.test_results if r.get("critical", False)])
        critical_failures = len([r for r in self.test_results if r["status"] == "FAIL" and r.get("critical", False)])
        
        print(f"📊 TEST STATISTICS:")
        print(f"   Total Tests: {total_tests}")
        print(f"   ✅ Passed: {passed_tests}")
        print(f"   ❌ Failed: {failed_tests}")
        print(f"   ⚠️  Warnings: {warning_tests}")
        print(f"   🚨 Critical Tests: {critical_tests}")
        print(f"   🚨 Critical Failures: {critical_failures}")
        print()
        
        # Deployment Blockers
        if self.deployment_blockers:
            print("🚨 DEPLOYMENT BLOCKERS (MUST FIX BEFORE DEPLOYMENT):")
            for blocker in self.deployment_blockers:
                print(f"   ❌ {blocker}")
            print()
        
        # Critical Issues
        if self.critical_issues:
            print("⚠️  CRITICAL ISSUES (SHOULD FIX BEFORE DEPLOYMENT):")
            for issue in self.critical_issues:
                print(f"   ❌ {issue}")
            print()
        
        # Failed Tests Detail
        if failed_tests > 0:
            print("❌ FAILED TESTS DETAIL:")
            for result in self.test_results:
                if result["status"] == "FAIL":
                    critical_marker = " 🚨" if result.get("critical", False) else ""
                    print(f"   ❌ {result['test']}{critical_marker}: {result['details']}")
            print()
        
        # Warnings
        if warning_tests > 0:
            print("⚠️  WARNINGS:")
            for result in self.test_results:
                if result["status"] == "WARN":
                    print(f"   ⚠️  {result['test']}: {result['details']}")
            print()
        
        # Deployment Readiness Decision
        print("🎯 DEPLOYMENT READINESS DECISION:")
        if len(self.deployment_blockers) == 0:
            if critical_failures == 0:
                if failed_tests == 0:
                    if warning_tests == 0:
                        print("   🟢 READY FOR DEPLOYMENT - All systems operational!")
                        deployment_status = "READY"
                    else:
                        print("   🟡 READY FOR DEPLOYMENT - Minor warnings present but not blocking")
                        deployment_status = "READY_WITH_WARNINGS"
                else:
                    print("   🟡 CONDITIONALLY READY - Non-critical failures present")
                    deployment_status = "CONDITIONALLY_READY"
            else:
                print("   🔴 NOT READY FOR DEPLOYMENT - Critical system failures detected")
                deployment_status = "NOT_READY"
        else:
            print("   🔴 DEPLOYMENT BLOCKED - Critical deployment blockers must be resolved")
            deployment_status = "BLOCKED"
        
        print()
        print("📋 DEPLOYMENT RECOMMENDATIONS:")
        
        if deployment_status == "READY":
            print("   ✅ All systems are operational and ready for production deployment")
            print("   ✅ All critical functionality is working correctly")
            print("   ✅ No deployment blockers detected")
            
        elif deployment_status == "READY_WITH_WARNINGS":
            print("   ✅ Core systems are operational and ready for deployment")
            print("   ⚠️  Address warnings when possible to improve system reliability")
            print("   ✅ No critical issues blocking deployment")
            
        elif deployment_status == "CONDITIONALLY_READY":
            print("   ⚠️  Core systems are working but some non-critical features have issues")
            print("   ⚠️  Consider fixing failed tests before deployment for better user experience")
            print("   ✅ No critical deployment blockers present")
            
        elif deployment_status == "NOT_READY":
            print("   ❌ Critical system failures detected that will impact user experience")
            print("   ❌ Fix all critical failures before attempting deployment")
            print("   ⚠️  Review and test all core functionality")
            
        else:  # BLOCKED
            print("   🚨 DEPLOYMENT BLOCKED - Critical infrastructure issues detected")
            print("   🚨 Resolve all deployment blockers before proceeding")
            print("   🚨 These issues will prevent the application from functioning properly")
        
        print("\n" + "=" * 80)
        
        return deployment_status

if __name__ == "__main__":
    tester = ComprehensiveBackendTester()
    deployment_status = tester.run_all_tests()
    
    # Exit with appropriate code for CI/CD systems
    if deployment_status in ["READY", "READY_WITH_WARNINGS"]:
        exit(0)  # Success
    elif deployment_status == "CONDITIONALLY_READY":
        exit(1)  # Warning
    else:
        exit(2)  # Failure