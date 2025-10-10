#!/usr/bin/env python3
"""
Analytics and Health Endpoints Testing Suite
Testing new analytics endpoints and health checks as requested
"""

import requests
import json
import time
from typing import Dict, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

class AnalyticsHealthTester:
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
        self.critical_issues = []
        
        print(f"🔍 ANALYTICS & HEALTH ENDPOINTS TESTING")
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
        
        if status == "FAIL" and is_critical:
            self.critical_issues.append(f"{test_name}: {details}")
        
        status_emoji = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
        critical_marker = " 🚨 CRITICAL" if status == "FAIL" and is_critical else ""
        print(f"{status_emoji} {test_name}: {status}{critical_marker}")
        if details:
            print(f"   Details: {details}")
        if response_data and status == "FAIL":
            print(f"   Response: {json.dumps(response_data, indent=2)}")
        print()
    
    def test_health_endpoint(self):
        """Test GET /api/health - Should return healthy status with database connection"""
        try:
            response = requests.get(f"{self.api_url}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                status = data.get("status")
                service = data.get("service")
                version = data.get("version")
                database = data.get("database")
                timestamp = data.get("timestamp")
                
                if status == "healthy":
                    if all([service, version, database, timestamp]):
                        if database == "connected":
                            self.log_test("Health Endpoint", "PASS", 
                                        f"Service healthy with database connection. Version: {version}, Service: {service}")
                        else:
                            self.log_test("Health Endpoint", "FAIL", 
                                        f"Database not connected: {database}", data, is_critical=True)
                    else:
                        missing_fields = []
                        if not service: missing_fields.append("service")
                        if not version: missing_fields.append("version")
                        if not database: missing_fields.append("database")
                        if not timestamp: missing_fields.append("timestamp")
                        
                        self.log_test("Health Endpoint", "FAIL", 
                                    f"Missing required fields: {', '.join(missing_fields)}", data, is_critical=True)
                elif status == "unhealthy":
                    error = data.get("error", "Unknown error")
                    self.log_test("Health Endpoint", "FAIL", 
                                f"Service unhealthy: {error}", data, is_critical=True)
                else:
                    self.log_test("Health Endpoint", "FAIL", 
                                f"Invalid status: {status}", data, is_critical=True)
            else:
                self.log_test("Health Endpoint", "FAIL", 
                            f"HTTP {response.status_code}", {"status_code": response.status_code}, is_critical=True)
                
        except requests.exceptions.RequestException as e:
            self.log_test("Health Endpoint", "FAIL", f"Connection error: {str(e)}", is_critical=True)
    
    def test_version_endpoint(self):
        """Test GET /api/version - Should return version 2.0.0"""
        try:
            response = requests.get(f"{self.api_url}/version", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                version = data.get("version")
                api_version = data.get("api_version")
                environment = data.get("environment")
                last_updated = data.get("last_updated")
                
                if version == "2.0.0":
                    if all([api_version, environment, last_updated]):
                        self.log_test("Version Endpoint", "PASS", 
                                    f"Version 2.0.0 confirmed. API: {api_version}, Environment: {environment}")
                    else:
                        self.log_test("Version Endpoint", "PASS", 
                                    f"Version 2.0.0 confirmed but some optional fields missing", data)
                else:
                    self.log_test("Version Endpoint", "FAIL", 
                                f"Expected version 2.0.0, got: {version}", data, is_critical=True)
            else:
                self.log_test("Version Endpoint", "FAIL", 
                            f"HTTP {response.status_code}", {"status_code": response.status_code}, is_critical=True)
                
        except requests.exceptions.RequestException as e:
            self.log_test("Version Endpoint", "FAIL", f"Connection error: {str(e)}", is_critical=True)
    
    def test_admin_analytics_overview(self):
        """Test GET /api/analytics/admin/overview - Platform-wide metrics"""
        try:
            response = requests.get(f"{self.api_url}/analytics/admin/overview", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields from review request
                required_fields = [
                    "total_users", "active_subscriptions", "monthly_revenue", 
                    "total_analyses", "conversion_rate"
                ]
                
                missing_fields = []
                for field in required_fields:
                    if field not in data:
                        missing_fields.append(field)
                
                if not missing_fields:
                    # Validate data types
                    total_users = data.get("total_users")
                    active_subscriptions = data.get("active_subscriptions")
                    monthly_revenue = data.get("monthly_revenue")
                    total_analyses = data.get("total_analyses")
                    conversion_rate = data.get("conversion_rate")
                    
                    if (isinstance(total_users, int) and 
                        isinstance(active_subscriptions, int) and
                        isinstance(monthly_revenue, (int, float)) and
                        isinstance(total_analyses, int) and
                        isinstance(conversion_rate, (int, float))):
                        
                        self.log_test("Admin Analytics Overview", "PASS", 
                                    f"All required metrics present: {total_users} users, {active_subscriptions} subscriptions, ${monthly_revenue} revenue, {total_analyses} analyses, {conversion_rate}% conversion")
                    else:
                        self.log_test("Admin Analytics Overview", "FAIL", 
                                    f"Invalid data types in response", data, is_critical=True)
                else:
                    self.log_test("Admin Analytics Overview", "FAIL", 
                                f"Missing required fields: {', '.join(missing_fields)}", data, is_critical=True)
            else:
                self.log_test("Admin Analytics Overview", "FAIL", 
                            f"HTTP {response.status_code}", {"status_code": response.status_code}, is_critical=True)
                
        except requests.exceptions.RequestException as e:
            self.log_test("Admin Analytics Overview", "FAIL", f"Connection error: {str(e)}", is_critical=True)
    
    def test_admin_analytics_trends(self):
        """Test GET /api/analytics/admin/trends - 30-day trend data"""
        try:
            response = requests.get(f"{self.api_url}/analytics/admin/trends", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                trends = data.get("trends")
                
                if trends and isinstance(trends, list):
                    if len(trends) == 30:  # Should return 30 days of data
                        # Check structure of trend data
                        sample_trend = trends[0] if trends else {}
                        required_trend_fields = ["date", "analyses", "new_users"]
                        
                        missing_trend_fields = []
                        for field in required_trend_fields:
                            if field not in sample_trend:
                                missing_trend_fields.append(field)
                        
                        if not missing_trend_fields:
                            # Validate date format and data types
                            valid_format = True
                            for trend in trends[:3]:  # Check first 3 entries
                                if (not isinstance(trend.get("date"), str) or
                                    not isinstance(trend.get("analyses"), int) or
                                    not isinstance(trend.get("new_users"), int)):
                                    valid_format = False
                                    break
                            
                            if valid_format:
                                total_analyses = sum(t.get("analyses", 0) for t in trends)
                                total_new_users = sum(t.get("new_users", 0) for t in trends)
                                
                                self.log_test("Admin Analytics Trends", "PASS", 
                                            f"30-day trend data properly formatted: {total_analyses} total analyses, {total_new_users} new users in period")
                            else:
                                self.log_test("Admin Analytics Trends", "FAIL", 
                                            f"Invalid data format in trends", data, is_critical=True)
                        else:
                            self.log_test("Admin Analytics Trends", "FAIL", 
                                        f"Missing trend fields: {', '.join(missing_trend_fields)}", data, is_critical=True)
                    else:
                        self.log_test("Admin Analytics Trends", "FAIL", 
                                    f"Expected 30 days of data, got {len(trends)}", data, is_critical=True)
                else:
                    self.log_test("Admin Analytics Trends", "FAIL", 
                                f"Missing or invalid trends data", data, is_critical=True)
            else:
                self.log_test("Admin Analytics Trends", "FAIL", 
                            f"HTTP {response.status_code}", {"status_code": response.status_code}, is_critical=True)
                
        except requests.exceptions.RequestException as e:
            self.log_test("Admin Analytics Trends", "FAIL", f"Connection error: {str(e)}", is_critical=True)
    
    def test_response_structure_validation(self):
        """Verify response structures match expected format"""
        try:
            # Test overview response structure
            overview_response = requests.get(f"{self.api_url}/analytics/admin/overview", timeout=10)
            trends_response = requests.get(f"{self.api_url}/analytics/admin/trends", timeout=10)
            
            structure_issues = []
            
            if overview_response.status_code == 200:
                overview_data = overview_response.json()
                
                # Check for additional useful fields
                optional_fields = ["subscription_breakdown", "new_users_last_30_days", "analyses_this_month"]
                present_optional = [field for field in optional_fields if field in overview_data]
                
                if present_optional:
                    self.log_test("Overview Response Structure", "PASS", 
                                f"Good structure with optional fields: {', '.join(present_optional)}")
                else:
                    self.log_test("Overview Response Structure", "PASS", 
                                "Basic required structure present")
            else:
                structure_issues.append(f"Overview endpoint failed: {overview_response.status_code}")
            
            if trends_response.status_code == 200:
                trends_data = trends_response.json()
                trends = trends_data.get("trends", [])
                
                if trends:
                    # Check date format consistency
                    date_formats_valid = True
                    for trend in trends[:5]:  # Check first 5
                        date_str = trend.get("date", "")
                        if not (len(date_str) == 10 and date_str.count("-") == 2):
                            date_formats_valid = False
                            break
                    
                    if date_formats_valid:
                        self.log_test("Trends Response Structure", "PASS", 
                                    "Date-based trend data properly formatted (YYYY-MM-DD)")
                    else:
                        structure_issues.append("Invalid date format in trends")
                else:
                    structure_issues.append("No trends data returned")
            else:
                structure_issues.append(f"Trends endpoint failed: {trends_response.status_code}")
            
            if structure_issues:
                self.log_test("Response Structure Validation", "FAIL", 
                            f"Structure issues: {'; '.join(structure_issues)}", is_critical=True)
            else:
                self.log_test("Response Structure Validation", "PASS", 
                            "All response structures properly formatted")
                
        except requests.exceptions.RequestException as e:
            self.log_test("Response Structure Validation", "FAIL", f"Connection error: {str(e)}", is_critical=True)
        except Exception as e:
            self.log_test("Response Structure Validation", "FAIL", f"Validation error: {str(e)}", is_critical=True)
    
    def run_analytics_health_tests(self):
        """Run all analytics and health endpoint tests"""
        print("🔍 ANALYTICS & HEALTH ENDPOINTS TESTING")
        print("=" * 80)
        
        # Health & Version Endpoints
        print("\n🏥 HEALTH & VERSION ENDPOINTS")
        print("-" * 40)
        self.test_health_endpoint()
        self.test_version_endpoint()
        
        # Admin Analytics Endpoints
        print("\n📊 ADMIN ANALYTICS ENDPOINTS")
        print("-" * 40)
        self.test_admin_analytics_overview()
        self.test_admin_analytics_trends()
        
        # Response Structure Validation
        print("\n🔍 RESPONSE STRUCTURE VALIDATION")
        print("-" * 40)
        self.test_response_structure_validation()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📋 ANALYTICS & HEALTH TESTING SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["status"] == "PASS"])
        failed_tests = len([r for r in self.test_results if r["status"] == "FAIL"])
        warning_tests = len([r for r in self.test_results if r["status"] == "WARN"])
        critical_failures = len([r for r in self.test_results if r["status"] == "FAIL" and r.get("critical", False)])
        
        print(f"📊 TEST STATISTICS:")
        print(f"   Total Tests: {total_tests}")
        print(f"   ✅ Passed: {passed_tests}")
        print(f"   ❌ Failed: {failed_tests}")
        print(f"   ⚠️  Warnings: {warning_tests}")
        print(f"   🚨 Critical Failures: {critical_failures}")
        print()
        
        # Critical Issues
        if self.critical_issues:
            print("🚨 CRITICAL ISSUES:")
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
        
        # Overall Status
        print("🎯 ANALYTICS & HEALTH ENDPOINTS STATUS:")
        if failed_tests == 0:
            print("   ✅ ALL ANALYTICS & HEALTH ENDPOINTS WORKING CORRECTLY")
        elif critical_failures == 0:
            print("   ⚠️  ANALYTICS & HEALTH ENDPOINTS MOSTLY WORKING - Minor issues detected")
        else:
            print("   ❌ CRITICAL ISSUES WITH ANALYTICS & HEALTH ENDPOINTS")
        
        print("\n" + "=" * 80)
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = AnalyticsHealthTester()
    success = tester.run_analytics_health_tests()
    
    # Exit with appropriate code
    exit(0 if success else 1)