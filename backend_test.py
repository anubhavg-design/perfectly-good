import requests
import sys
import json
from datetime import datetime
import uuid

class PerfectlyGoodAPITester:
    def __init__(self, base_url="https://green-grab-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()  # Use session to maintain cookies
        self.user_id = None
        self.vendor_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        
        if headers:
            default_headers.update(headers)

        try:
            if method == 'GET':
                response = self.session.get(url, headers=default_headers, timeout=30)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=default_headers, timeout=30)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=default_headers, timeout=30)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                try:
                    error_detail = response.json()
                    details += f", Response: {error_detail}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return None

    def test_auth_flow(self):
        """Test complete authentication flow"""
        print("\n📋 Testing Authentication Flow...")
        
        # Test admin login
        login_data = {
            "email": "admin@perfectlygood.com",
            "password": "admin123"
        }
        
        login_response = self.run_test(
            "Admin login (/auth/login)",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if not login_response:
            return False
        
        self.user_id = login_response.get('user_id')
        print(f"✅ Logged in as: {login_response.get('name')} ({login_response.get('email')})")
        
        # Test /auth/me
        me_response = self.run_test(
            "Get current user (/auth/me)",
            "GET",
            "auth/me",
            200
        )
        
        if me_response and me_response.get('user_id') == self.user_id:
            print(f"✅ User data matches: {me_response.get('name')}")
        
        return me_response is not None
    
    def test_register_flow(self):
        """Test user registration"""
        print("\n📝 Testing User Registration...")
        
        timestamp = int(datetime.now().timestamp())
        register_data = {
            "name": f"Test User {timestamp}",
            "email": f"testuser{timestamp}@example.com",
            "password": "test1234"
        }
        
        register_response = self.run_test(
            "User registration (/auth/register)",
            "POST",
            "auth/register",
            200,
            data=register_data
        )
        
        if register_response:
            print(f"✅ Registered user: {register_response.get('name')}")
            return True
        
        return False
    
    def test_logout(self):
        """Test logout"""
        print("\n🚪 Testing Logout...")
        
        logout_response = self.run_test(
            "Logout (/auth/logout)",
            "POST",
            "auth/logout",
            200
        )
        
        if logout_response:
            # Test that we can't access protected endpoint after logout
            me_response = self.run_test(
                "Access protected endpoint after logout (/auth/me)",
                "GET",
                "auth/me",
                401  # Should be unauthorized
            )
            return True
        
        return False

    def test_drops_endpoints(self):
        """Test drops/food items endpoints"""
        print("\n🍕 Testing Drops Endpoints...")
        
        # Test get all drops
        drops = self.run_test(
            "Get all drops (/drops)",
            "GET",
            "drops",
            200
        )
        
        if drops is not None:
            print(f"✅ Found {len(drops)} drops")
            
            # Test get specific drop if any exist
            if len(drops) > 0:
                item_id = drops[0].get('item_id')
                if item_id:
                    drop_detail = self.run_test(
                        f"Get drop detail (/drops/{item_id})",
                        "GET",
                        f"drops/{item_id}",
                        200
                    )
                    return drop_detail is not None
        
        return drops is not None

    def test_vendor_creation(self):
        """Test vendor creation"""
        print("\n🏪 Testing Vendor Creation...")
        
        vendor_data = {
            "name": f"Test Vendor {datetime.now().strftime('%H%M%S')}",
            "location": {
                "lat": 12.9716,
                "lon": 77.5946,
                "address": "Test Location, Bangalore"
            },
            "category": "Restaurant"
        }
        
        response = self.run_test(
            "Create vendor (/vendor/create)",
            "POST",
            "vendor/create",
            200,
            data=vendor_data
        )
        
        if response:
            self.vendor_id = response.get('vendor_id')
            print(f"✅ Vendor created: {self.vendor_id}")
            return True
        
        return False

    def test_vendor_drops(self):
        """Test vendor drop management"""
        print("\n📦 Testing Vendor Drop Management...")
        
        if not self.vendor_id:
            print("❌ No vendor ID available, skipping vendor tests")
            return False
        
        # Create a drop
        drop_data = {
            "name": "Test Food Item",
            "description": "Delicious test food",
            "original_price": 100.0,
            "discounted_price": 70.0,
            "quantity_available": 5,
            "pickup_start_time": "18:00",
            "pickup_end_time": "20:00",
            "image_url": "https://via.placeholder.com/300x200"
        }
        
        create_response = self.run_test(
            "Create drop (/vendor/drops)",
            "POST",
            "vendor/drops",
            200,
            data=drop_data
        )
        
        if not create_response:
            return False
        
        item_id = create_response.get('item_id')
        
        # Get vendor drops
        vendor_drops = self.run_test(
            "Get vendor drops (/vendor/drops)",
            "GET",
            "vendor/drops",
            200
        )
        
        if vendor_drops:
            print(f"✅ Vendor has {len(vendor_drops)} drops")
        
        # Update drop
        update_data = {
            "quantity_available": 3,
            "is_active": True
        }
        
        update_response = self.run_test(
            f"Update drop (/vendor/drops/{item_id})",
            "PUT",
            f"vendor/drops/{item_id}",
            200,
            data=update_data
        )
        
        return update_response is not None

    def test_order_flow(self):
        """Test order creation and verification (without actual payment)"""
        print("\n🛒 Testing Order Flow...")
        
        # Get available drops first
        drops = self.run_test(
            "Get drops for order",
            "GET",
            "drops",
            200
        )
        
        if not drops or len(drops) == 0:
            print("❌ No drops available for order testing")
            return False
        
        # Use first available drop
        drop = drops[0]
        item_id = drop.get('item_id')
        
        # Create order (this creates Razorpay order)
        order_data = {
            "food_item_id": item_id,
            "quantity": 1,
            "user_location": {
                "lat": 12.9716,
                "lon": 77.5946
            }
        }
        
        order_response = self.run_test(
            "Create order (/orders/create)",
            "POST",
            "orders/create",
            200,
            data=order_data
        )
        
        if order_response:
            print(f"✅ Razorpay order created: {order_response.get('razorpay_order_id')}")
            print(f"✅ Amount: ₹{order_response.get('amount', 0) / 100}")
        
        # Get user orders
        user_orders = self.run_test(
            "Get user orders (/orders/user)",
            "GET",
            "orders/user",
            200
        )
        
        if user_orders is not None:
            print(f"✅ User has {len(user_orders)} orders")
        
        return order_response is not None

    def test_vendor_orders(self):
        """Test vendor orders endpoint"""
        print("\n📋 Testing Vendor Orders...")
        
        if not self.vendor_id:
            print("❌ No vendor ID available, skipping vendor orders test")
            return False
        
        vendor_orders = self.run_test(
            "Get vendor orders (/vendor/orders)",
            "GET",
            "vendor/orders",
            200
        )
        
        if vendor_orders is not None:
            print(f"✅ Vendor has {len(vendor_orders)} orders")
            return True
        
        return False

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Clean up any test users and vendors created during testing
        mongo_commands = f"""
        use('test_database');
        db.users.deleteMany({{email: /testuser.*@example.com/}});
        if ('{self.vendor_id}') {{
            db.vendors.deleteMany({{vendor_id: '{self.vendor_id}'}});
            db.food_items.deleteMany({{vendor_id: '{self.vendor_id}'}});
        }}
        print('Test data cleaned');
        """
        
        import subprocess
        try:
            subprocess.run(['mongosh', '--eval', mongo_commands], 
                          capture_output=True, text=True, timeout=30)
            print("✅ Test data cleaned up")
        except Exception as e:
            print(f"⚠️ Cleanup warning: {e}")

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Perfectly Good API Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        
        try:
            # Test authentication flow
            auth_success = self.test_auth_flow()
            if not auth_success:
                print("❌ Authentication failed, aborting remaining tests")
                return 1
            
            # Test registration (this will logout current user)
            register_success = self.test_register_flow()
            
            # Login again as admin for remaining tests
            if register_success:
                self.test_auth_flow()  # Login again as admin
            
            # Run other tests
            drops_success = self.test_drops_endpoints()
            vendor_success = self.test_vendor_creation()
            vendor_drops_success = self.test_vendor_drops()
            order_success = self.test_order_flow()
            vendor_orders_success = self.test_vendor_orders()
            
            # Test logout
            logout_success = self.test_logout()
            
            # Print summary
            print(f"\n📊 Test Summary:")
            print(f"Tests run: {self.tests_run}")
            print(f"Tests passed: {self.tests_passed}")
            print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
            
            # Print failed tests
            failed_tests = [t for t in self.test_results if not t['success']]
            if failed_tests:
                print(f"\n❌ Failed Tests:")
                for test in failed_tests:
                    print(f"  - {test['test']}: {test['details']}")
            
            return 0 if self.tests_passed == self.tests_run else 1
            
        finally:
            self.cleanup_test_data()

def main():
    tester = PerfectlyGoodAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())