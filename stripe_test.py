#!/usr/bin/env python3
"""
Simple Stripe API Key Test
"""

import os
import stripe
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

def test_stripe_api_key():
    """Test if Stripe API key is valid"""
    api_key = os.environ.get('STRIPE_API_KEY')
    
    if not api_key:
        print("❌ STRIPE_API_KEY not found in environment")
        return False
    
    print(f"🔑 Testing Stripe API Key: {api_key[:20]}...")
    
    try:
        stripe.api_key = api_key
        
        # Try to retrieve account information
        account = stripe.Account.retrieve()
        
        print(f"✅ Stripe API Key is valid!")
        print(f"   Account ID: {account.id}")
        print(f"   Country: {account.country}")
        print(f"   Business Type: {account.business_type}")
        print(f"   Charges Enabled: {account.charges_enabled}")
        print(f"   Payouts Enabled: {account.payouts_enabled}")
        
        return True
        
    except stripe._error.AuthenticationError as e:
        print(f"❌ Stripe API Key Authentication Failed: {e}")
        return False
    except stripe._error.PermissionError as e:
        print(f"❌ Stripe API Key Permission Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Stripe API Error: {e}")
        return False

def test_stripe_price_ids():
    """Test if Stripe Price IDs are valid"""
    price_ids = {
        "basic": os.environ.get('STRIPE_BASIC_PRICE_ID'),
        "pro": os.environ.get('STRIPE_PRO_PRICE_ID'),
        "enterprise": os.environ.get('STRIPE_ENTERPRISE_PRICE_ID')
    }
    
    api_key = os.environ.get('STRIPE_API_KEY')
    if not api_key:
        print("❌ Cannot test Price IDs - STRIPE_API_KEY not found")
        return False
    
    stripe.api_key = api_key
    
    valid_prices = []
    invalid_prices = []
    
    for tier, price_id in price_ids.items():
        if not price_id or "placeholder" in price_id.lower():
            print(f"⚠️  {tier.title()} tier: Price ID not configured ({price_id})")
            continue
            
        try:
            price = stripe.Price.retrieve(price_id)
            print(f"✅ {tier.title()} tier: Price ID valid (${price.unit_amount/100}/month)")
            valid_prices.append(tier)
        except stripe._error.InvalidRequestError as e:
            print(f"❌ {tier.title()} tier: Invalid Price ID - {e}")
            invalid_prices.append(tier)
        except Exception as e:
            print(f"❌ {tier.title()} tier: Error retrieving price - {e}")
            invalid_prices.append(tier)
    
    return len(invalid_prices) == 0

if __name__ == "__main__":
    print("🧪 STRIPE INTEGRATION TEST")
    print("=" * 50)
    
    # Test API Key
    api_key_valid = test_stripe_api_key()
    print()
    
    # Test Price IDs if API key is valid
    if api_key_valid:
        price_ids_valid = test_stripe_price_ids()
        print()
        
        if api_key_valid and price_ids_valid:
            print("🎉 All Stripe configurations are valid!")
        else:
            print("⚠️  Some Stripe configurations need attention")
    else:
        print("❌ Cannot proceed with Price ID testing - API key invalid")
    
    print("=" * 50)