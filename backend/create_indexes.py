#!/usr/bin/env python3
"""
MongoDB Index Creation Script
Creates indexes for better query performance
"""

import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=True)

async def create_indexes():
    """Create indexes for all collections"""
    
    # Connect to MongoDB
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME')
    
    if not mongo_url or not db_name:
        print("❌ MONGO_URL or DB_NAME not found in environment")
        return
    
    print(f"🔗 Connecting to MongoDB...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        print("\n📊 Creating indexes...")
        
        # Users collection indexes
        print("\n1️⃣  Users collection:")
        await db.users.create_index("id", unique=True)
        print("   ✅ Created unique index on 'id'")
        
        await db.users.create_index("email", unique=True)
        print("   ✅ Created unique index on 'email'")
        
        await db.users.create_index("subscription_tier")
        print("   ✅ Created index on 'subscription_tier'")
        
        await db.users.create_index("created_at")
        print("   ✅ Created index on 'created_at'")
        
        # Analysis results collection indexes
        print("\n2️⃣  Analysis results collection:")
        await db.analysis_results.create_index("id", unique=True)
        print("   ✅ Created unique index on 'id'")
        
        await db.analysis_results.create_index("user_id")
        print("   ✅ Created index on 'user_id'")
        
        await db.analysis_results.create_index("timestamp")
        print("   ✅ Created index on 'timestamp'")
        
        await db.analysis_results.create_index([("user_id", 1), ("timestamp", -1)])
        print("   ✅ Created compound index on 'user_id' and 'timestamp'")
        
        await db.analysis_results.create_index("file_type")
        print("   ✅ Created index on 'file_type'")
        
        # Payment transactions collection indexes
        print("\n3️⃣  Payment transactions collection:")
        await db.payment_transactions.create_index("id", unique=True)
        print("   ✅ Created unique index on 'id'")
        
        await db.payment_transactions.create_index("user_id")
        print("   ✅ Created index on 'user_id'")
        
        await db.payment_transactions.create_index("stripe_session_id")
        print("   ✅ Created index on 'stripe_session_id'")
        
        await db.payment_transactions.create_index("status")
        print("   ✅ Created index on 'status'")
        
        await db.payment_transactions.create_index("created_at")
        print("   ✅ Created index on 'created_at'")
        
        # List all indexes
        print("\n📋 Verifying indexes...")
        
        print("\n   Users indexes:")
        async for index in db.users.list_indexes():
            print(f"     - {index['name']}: {index.get('key', {})}")
        
        print("\n   Analysis results indexes:")
        async for index in db.analysis_results.list_indexes():
            print(f"     - {index['name']}: {index.get('key', {})}")
        
        print("\n   Payment transactions indexes:")
        async for index in db.payment_transactions.list_indexes():
            print(f"     - {index['name']}: {index.get('key', {})}")
        
        print("\n✅ All indexes created successfully!")
        print("\n💡 These indexes will improve query performance for:")
        print("   • User lookups by email and ID")
        print("   • Analysis history queries")
        print("   • Subscription tier filtering")
        print("   • Payment transaction lookups")
        print("   • Date-based analytics queries")
        
    except Exception as e:
        print(f"\n❌ Error creating indexes: {str(e)}")
    finally:
        client.close()
        print("\n🔌 MongoDB connection closed")

if __name__ == "__main__":
    asyncio.run(create_indexes())
