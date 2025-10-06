#!/usr/bin/env python3
"""
Direct Stripe Integration Test (bypass emergentintegrations)
"""

import os
import stripe
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env', override=True)

def test_direct_stripe():
    """Test Stripe directly without emergentintegrations"""
    api_key = os.environ.get('STRIPE_API_KEY')
    stripe.api_key = api_key
    
    try:
        # Test 1: Basic account retrieval
        print("🧪 Testing Stripe Account Access...")
        account = stripe.Account.retrieve()
        print(f"✅ Account ID: {account.id}")
        print(f"✅ Country: {account.country}")
        print(f"✅ Charges Enabled: {account.charges_enabled}")
        
        # Test 2: Price retrieval
        print("\n🧪 Testing Price Retrieval...")
        prices = {
            "basic": os.environ.get('STRIPE_BASIC_PRICE_ID'),
            "pro": os.environ.get('STRIPE_PRO_PRICE_ID'),  
            "enterprise": os.environ.get('STRIPE_ENTERPRISE_PRICE_ID')
        }
        
        for tier, price_id in prices.items():
            try:
                price = stripe.Price.retrieve(price_id)
                print(f"✅ {tier.title()}: ${price.unit_amount/100}/{price.recurring.interval}")
            except Exception as e:
                print(f"❌ {tier.title()}: {e}")
        
        # Test 3: Create a simple checkout session
        print("\n🧪 Testing Checkout Session Creation...")
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': os.environ.get('STRIPE_PRO_PRICE_ID'),
                'quantity': 1,
            }],
            mode='subscription',
            success_url='https://example.com/success',
            cancel_url='https://example.com/cancel',
        )
        print(f"✅ Checkout Session Created: {session.id}")
        print(f"✅ Payment URL: {session.url}")
        
        return True
        
    except stripe.AuthenticationError as e:
        print(f"❌ Authentication Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return False

if __name__ == "__main__":
    print("🔍 DIRECT STRIPE INTEGRATION TEST")
    print("=" * 50)
    test_direct_stripe()
    print("=" * 50)