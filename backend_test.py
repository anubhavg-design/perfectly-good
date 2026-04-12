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
        self.admin_user_id = None
        self.created_vendor_id = None
        self.created_menu_item_id = None
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

    def test_seeded_data(self):
        """Test that 8 drops are seeded"""
        print("\n🌱 Testing Seeded Data...")
        
        drops = self.run_test(
            "Get all drops (should have 8 seeded)",
            "GET",
            "drops",
            200
        )
        
        if drops is not None:
            print(f"✅ Found {len(drops)} drops (expected 8)")
            if len(drops) >= 8:
                print("✅ Seeded data appears complete")
                return True
            else:
                print(f"⚠️ Expected 8 drops, found {len(drops)}")
        
        return drops is not None

    def test_search_and_filters(self):
        """Test search and filter functionality on drops"""
        print("\n🔍 Testing Search and Filter Features...")
        
        # Test categories endpoint
        categories = self.run_test(
            "Get categories (/drops/categories)",
            "GET",
            "drops/categories",
            200
        )
        
        if categories:
            print(f"✅ Found categories: {categories}")
            expected_categories = ["Bakery", "Restaurant", "Cafe", "Grocery Store"]
            for cat in expected_categories:
                if cat in categories:
                    print(f"✅ Category '{cat}' found")
                else:
                    print(f"⚠️ Category '{cat}' missing")
        
        # Test category filter
        if categories and "Bakery" in categories:
            bakery_drops = self.run_test(
                "Filter by Bakery category (/drops?category=Bakery)",
                "GET",
                "drops?category=Bakery",
                200
            )
            if bakery_drops is not None:
                print(f"✅ Bakery filter returned {len(bakery_drops)} items")
        
        # Test search filter
        search_drops = self.run_test(
            "Search for 'chicken' (/drops?search=chicken)",
            "GET",
            "drops?search=chicken",
            200
        )
        if search_drops is not None:
            print(f"✅ Search returned {len(search_drops)} items")
        
        # Test price filter
        price_drops = self.run_test(
            "Filter by max price 100 (/drops?max_price=100)",
            "GET",
            "drops?max_price=100",
            200
        )
        if price_drops is not None:
            print(f"✅ Price filter returned {len(price_drops)} items")
        
        # Test sort by price
        sorted_drops = self.run_test(
            "Sort by price (/drops?sort_by=price)",
            "GET",
            "drops?sort_by=price",
            200
        )
        if sorted_drops is not None:
            print(f"✅ Price sort returned {len(sorted_drops)} items")
            if len(sorted_drops) >= 2:
                first_price = sorted_drops[0].get('discounted_price', 0)
                second_price = sorted_drops[1].get('discounted_price', 0)
                if first_price <= second_price:
                    print("✅ Price sorting appears correct")
                else:
                    print(f"⚠️ Price sorting may be incorrect: {first_price} > {second_price}")
        
        return categories is not None

    def test_password_reset_flow(self):
        """Test password reset functionality"""
        print("\n🔑 Testing Password Reset Flow...")
        
        # Test forgot password
        forgot_response = self.run_test(
            "Forgot password (/auth/forgot-password)",
            "POST",
            "auth/forgot-password",
            200,
            data={"email": "admin@perfectlygood.com"}
        )
        
        if not forgot_response:
            return False
        
        reset_token = forgot_response.get('reset_token')
        if reset_token:
            print(f"✅ Reset token received: {reset_token[:20]}...")
            
            # Test reset password
            reset_response = self.run_test(
                "Reset password (/auth/reset-password)",
                "POST",
                "auth/reset-password",
                200,
                data={
                    "token": reset_token,
                    "new_password": "admin123"  # Reset to same password
                }
            )
            
            if reset_response:
                print("✅ Password reset successful")
                return True
        
        return False

    def test_vendor_order_status_management(self):
        """Test vendor order status management (picked_up/cancelled)"""
        print("\n📦 Testing Vendor Order Status Management...")
        
        # First, login as demo vendor
        vendor_login = self.run_test(
            "Demo vendor login",
            "POST",
            "auth/login",
            200,
            data={"email": "vendor@demo.com", "password": "vendor123"}
        )
        
        if not vendor_login:
            print("❌ Could not login as demo vendor")
            return False
        
        # Get vendor orders
        vendor_orders = self.run_test(
            "Get vendor orders for status testing",
            "GET",
            "vendor/orders",
            200
        )
        
        if not vendor_orders or len(vendor_orders) == 0:
            print("⚠️ No orders found for vendor - creating test scenario")
            # Login as regular user to create an order first
            user_login = self.run_test(
                "Login as admin to create test order",
                "POST",
                "auth/login",
                200,
                data={"email": "admin@perfectlygood.com", "password": "admin123"}
            )
            
            if user_login:
                # Get drops to create order
                drops = self.run_test("Get drops for test order", "GET", "drops", 200)
                if drops and len(drops) > 0:
                    # Create test order
                    order_data = {"food_item_id": drops[0]['item_id'], "quantity": 1}
                    order_response = self.run_test(
                        "Create test order", "POST", "orders/create", 200, data=order_data
                    )
                    
                    if order_response:
                        # Simulate payment verification (simplified for testing)
                        verify_data = {
                            "razorpay_order_id": order_response['razorpay_order_id'],
                            "razorpay_payment_id": "test_payment_id",
                            "razorpay_signature": "test_signature",
                            "food_item_id": drops[0]['item_id'],
                            "quantity": 1
                        }
                        # Note: This will fail payment verification but that's expected
                        print("⚠️ Order creation attempted (payment verification will fail in test)")
            
            # Login back as vendor
            self.run_test(
                "Login back as vendor",
                "POST",
                "auth/login",
                200,
                data={"email": "vendor@demo.com", "password": "vendor123"}
            )
            
            vendor_orders = self.run_test(
                "Get vendor orders after test setup",
                "GET",
                "vendor/orders",
                200
            )
        
        if vendor_orders and len(vendor_orders) > 0:
            # Find a reserved order to test status changes
            reserved_order = None
            for order in vendor_orders:
                if order.get('status') == 'reserved':
                    reserved_order = order
                    break
            
            if reserved_order:
                order_id = reserved_order['order_id']
                
                # Test marking as picked up
                pickup_response = self.run_test(
                    f"Mark order as picked up (/vendor/orders/{order_id}/status)",
                    "PUT",
                    f"vendor/orders/{order_id}/status",
                    200,
                    data={"status": "picked_up"}
                )
                
                if pickup_response:
                    print("✅ Order marked as picked up")
                
                # Test marking as cancelled (on another order if available)
                for order in vendor_orders:
                    if order.get('status') == 'reserved' and order['order_id'] != order_id:
                        cancel_response = self.run_test(
                            f"Mark order as cancelled (/vendor/orders/{order['order_id']}/status)",
                            "PUT",
                            f"vendor/orders/{order['order_id']}/status",
                            200,
                            data={"status": "cancelled"}
                        )
                        
                        if cancel_response:
                            print("✅ Order marked as cancelled (quantity should be restored)")
                        break
                
                return True
            else:
                print("⚠️ No reserved orders found to test status changes")
        
        print("⚠️ Order status management tests completed with limited data")
        return True

    def test_demo_vendor_login(self):
        """Test login with demo vendor credentials"""
        print("\n👤 Testing Demo Vendor Login...")
        
        vendor_login = self.run_test(
            "Demo vendor login (vendor@demo.com)",
            "POST",
            "auth/login",
            200,
            data={"email": "vendor@demo.com", "password": "vendor123"}
        )
        
        if vendor_login:
            print(f"✅ Demo vendor logged in: {vendor_login.get('name')}")
            print(f"✅ Role: {vendor_login.get('role')}")
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

    def test_admin_authentication(self):
        """Test admin login with correct role"""
        print("\n=== ADMIN AUTHENTICATION ===")
        
        # Test admin login
        response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@perfectlygood.com", "password": "admin123"}
        )
        
        if response:
            user_role = response.get('role')
            if user_role == 'admin':
                self.log_test("Admin role verification", True, f"Role: {user_role}")
                self.admin_user_id = response.get('user_id')
                return True
            else:
                self.log_test("Admin role verification", False, f"Expected 'admin', got '{user_role}'")
                return False
        else:
            self.log_test("Admin login", False, "Login failed")
            return False

    def test_admin_vendor_management(self):
        """Test admin vendor management endpoints"""
        print("\n=== ADMIN VENDOR MANAGEMENT ===")
        
        # Test GET /api/admin/vendors
        vendors = self.run_test(
            "List vendors (admin only)",
            "GET",
            "admin/vendors",
            200
        )
        if vendors is not None:
            self.log_test("GET /api/admin/vendors", True, f"Found {len(vendors)} vendors")
        else:
            self.log_test("GET /api/admin/vendors", False, "Failed to get vendors")

        # Test POST /api/admin/vendors - Create new vendor
        timestamp = datetime.now().strftime('%H%M%S')
        vendor_data = {
            "name": f"Test Vendor {timestamp}",
            "category": "Restaurant",
            "location": {"lat": 28.6139, "lon": 77.2090, "address": "Test Location Delhi"},
            "email": f"testvendor{timestamp}@test.com",
            "password": "testpass123",
            "logo_url": None
        }
        
        response = self.run_test(
            "Create vendor with user account",
            "POST",
            "admin/vendors",
            200,
            data=vendor_data
        )
        
        if response:
            self.created_vendor_id = response.get('vendor_id')
            self.log_test("POST /api/admin/vendors", True, f"Created vendor: {self.created_vendor_id}")
            return True
        else:
            self.log_test("POST /api/admin/vendors", False, "Failed to create vendor")
            return False

    def test_admin_menu_management(self):
        """Test admin menu management endpoints"""
        print("\n=== ADMIN MENU MANAGEMENT ===")
        
        if not self.created_vendor_id:
            self.log_test("Menu management tests", False, "No vendor ID available")
            return False

        # Test GET /api/admin/vendors/{id}/menu
        menu_items = self.run_test(
            "Get vendor menu items",
            "GET",
            f"admin/vendors/{self.created_vendor_id}/menu",
            200
        )
        if menu_items is not None:
            self.log_test("GET /api/admin/vendors/{id}/menu", True, f"Found {len(menu_items)} menu items")
        else:
            self.log_test("GET /api/admin/vendors/{id}/menu", False, "Failed to get menu items")

        # Test POST /api/admin/vendors/{id}/menu - Add menu item
        menu_item_data = {
            "name": "Test Menu Item",
            "description": "A test menu item for API testing",
            "original_price": 250.0,
            "image_url": None
        }
        
        response = self.run_test(
            "Add menu item to vendor",
            "POST",
            f"admin/vendors/{self.created_vendor_id}/menu",
            200,
            data=menu_item_data
        )
        
        if response:
            self.created_menu_item_id = response.get('menu_item_id')
            self.log_test("POST /api/admin/vendors/{id}/menu", True, f"Created menu item: {self.created_menu_item_id}")
        else:
            self.log_test("POST /api/admin/vendors/{id}/menu", False, "Failed to create menu item")

        # Test DELETE /api/admin/menu-items/{id} - Soft delete menu item
        if self.created_menu_item_id:
            response = self.run_test(
                "Soft delete menu item",
                "DELETE",
                f"admin/menu-items/{self.created_menu_item_id}",
                200
            )
            if response is not None:
                self.log_test("DELETE /api/admin/menu-items/{id}", True, "Menu item soft deleted")
            else:
                self.log_test("DELETE /api/admin/menu-items/{id}", False, "Failed to delete menu item")

        return True

    def test_vendor_menu_access(self):
        """Test vendor menu access"""
        print("\n=== VENDOR MENU ACCESS ===")
        
        # Login as demo vendor first
        response = self.run_test(
            "Demo vendor login",
            "POST",
            "auth/login",
            200,
            data={"email": "vendor@demo.com", "password": "vendor123"}
        )
        
        if not response:
            self.log_test("Vendor login for menu test", False, "Failed to login as vendor")
            return False

        # Test GET /api/vendor/menu
        menu_items = self.run_test(
            "Get vendor own menu items",
            "GET",
            "vendor/menu",
            200
        )
        if menu_items is not None:
            self.log_test("GET /api/vendor/menu", True, f"Vendor can access {len(menu_items)} menu items")
            return True
        else:
            self.log_test("GET /api/vendor/menu", False, "Failed to get vendor menu")
            return False

    def test_vendor_drop_from_menu(self):
        """Test vendor drop creation from menu items"""
        print("\n=== VENDOR DROP FROM MENU ===")
        
        # Get vendor's menu items first
        menu_items = self.run_test(
            "Get menu for drop creation",
            "GET",
            "vendor/menu",
            200
        )
        
        if not menu_items or len(menu_items) == 0:
            self.log_test("Vendor drop from menu", False, "No menu items available")
            return False

        # Test POST /api/vendor/drops - Create drop from menu item
        menu_item = menu_items[0]
        drop_data = {
            "menu_item_id": menu_item['menu_item_id'],
            "discounted_price": menu_item['original_price'] * 0.7,  # 30% discount
            "quantity_available": 5,
            "pickup_start_time": "18:00",
            "pickup_end_time": "20:00"
        }
        
        response = self.run_test(
            "Create drop from menu item",
            "POST",
            "vendor/drops",
            200,
            data=drop_data
        )
        if response:
            self.log_test("POST /api/vendor/drops (from menu)", True, f"Drop created from menu item")
            return True
        else:
            self.log_test("POST /api/vendor/drops (from menu)", False, "Failed to create drop from menu")
            return False

    def test_convenience_fee_calculation(self):
        """Test 5% convenience fee in order creation"""
        print("\n=== CONVENIENCE FEE TESTING ===")
        
        # Login as regular user first
        response = self.run_test(
            "User login for order test",
            "POST",
            "auth/login",
            200,
            data={"email": "testuser@example.com", "password": "test1234"}
        )
        
        if not response:
            # Try to register user first
            response = self.run_test(
                "Register test user",
                "POST",
                "auth/register",
                200,
                data={"name": "Test User", "email": "testuser@example.com", "password": "test1234"}
            )

        # Get available drops
        drops = self.run_test(
            "Get available drops for order",
            "GET",
            "drops",
            200
        )
        
        if not drops or len(drops) == 0:
            self.log_test("Convenience fee test", False, "No drops available")
            return False

        # Test POST /api/orders/create - Check convenience fee calculation
        drop = drops[0]
        order_data = {
            "food_item_id": drop['item_id'],
            "quantity": 2
        }
        
        response = self.run_test(
            "Create order with convenience fee",
            "POST",
            "orders/create",
            200,
            data=order_data
        )
        
        if response:
            item_total = response.get('item_total', 0)
            convenience_fee = response.get('convenience_fee', 0)
            total = response.get('total', 0)
            
            expected_fee = round(item_total * 0.05, 2)  # 5% convenience fee
            expected_total = item_total + convenience_fee
            
            fee_correct = abs(convenience_fee - expected_fee) < 0.01
            total_correct = abs(total - expected_total) < 0.01
            
            if fee_correct and total_correct:
                self.log_test("Convenience fee calculation", True, f"5% fee: ₹{convenience_fee} on ₹{item_total}")
            else:
                self.log_test("Convenience fee calculation", False, f"Expected ₹{expected_fee}, got ₹{convenience_fee}")
            
            return fee_correct and total_correct

        return False

    def test_admin_access_control(self):
        """Test 403 returned when non-admin tries admin endpoints"""
        print("\n=== ADMIN ACCESS CONTROL ===")
        
        # Login as vendor (non-admin)
        response = self.run_test(
            "Vendor login for access control test",
            "POST",
            "auth/login",
            200,
            data={"email": "vendor@demo.com", "password": "vendor123"}
        )
        
        if not response:
            self.log_test("Access control test setup", False, "Failed to login as vendor")
            return False

        # Test non-admin access to admin endpoints - should return 403
        response = self.run_test(
            "Non-admin access to admin endpoint",
            "GET",
            "admin/vendors",
            403  # Should be forbidden
        )
        if response is None:  # 403 should return None from run_test
            self.log_test("403 for non-admin access", True, "Non-admin correctly blocked from admin endpoints")
            return True
        else:
            self.log_test("403 for non-admin access", False, "Non-admin was not blocked")
            return False

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Perfectly Good API Tests...")
        print(f"🌐 Testing against: {self.base_url}")
        
        try:
            # Test admin authentication first
            admin_auth_success = self.test_admin_authentication()
            if not admin_auth_success:
                print("❌ Admin authentication failed, aborting admin tests")
                return 1
            
            # Test admin panel features
            self.test_admin_vendor_management()
            self.test_admin_menu_management()
            
            # Test vendor menu features
            self.test_vendor_menu_access()
            self.test_vendor_drop_from_menu()
            
            # Test convenience fee
            self.test_convenience_fee_calculation()
            
            # Test access control
            self.test_admin_access_control()
            
            # Login back as admin for remaining tests
            self.test_admin_authentication()
            
            # Test authentication flow
            auth_success = self.test_auth_flow()
            if not auth_success:
                print("❌ Authentication failed, aborting remaining tests")
                return 1
            
            # Test seeded data first
            seeded_data_success = self.test_seeded_data()
            
            # Test search and filter features
            search_filter_success = self.test_search_and_filters()
            
            # Test password reset flow
            password_reset_success = self.test_password_reset_flow()
            
            # Test demo vendor login
            demo_vendor_success = self.test_demo_vendor_login()
            
            # Test vendor order status management
            order_status_success = self.test_vendor_order_status_management()
            
            # Login back as admin for remaining tests
            self.test_auth_flow()
            
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