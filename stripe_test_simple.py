#!/usr/bin/env python3
"""
Simple Stripe API Key Verification Test
"""

import os
import stripe
from dotenv import load_dotenv

# Load environment variables with override
load_dotenv('/app/backend/.env', override=True)

def test_stripe_connection():
    """Test basic Stripe connection"""
    api_key = os.environ.get('STRIPE_API_KEY')
    
    print("🔑 Testing Stripe API Key configured...")
    
    try:
        stripe.api_key = api_key
        
        # Simple ping test
        balance = stripe.Balance.retrieve()
        print(f"✅ Stripe connection successful!")
        print(f"   Available balance: ${balance.available[0].amount/100} {balance.available[0].currency.upper()}")
        
        return True
        
    except stripe.AuthenticationError as e:
        print(f"❌ Authentication Error: {e}")
        return False
    except stripe.PermissionError as e:
        print(f"❌ Permission Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_stripe_connection()