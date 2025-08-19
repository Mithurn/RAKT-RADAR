#!/usr/bin/env python3
"""
Simple script to reset route status for testing
Run this to reset all routes to 'pending' status
"""

import sqlite3
import os

def reset_route_status():
    db_path = 'instance/rakt_radar.db'
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found: {db_path}")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Reset all routes to pending
        cursor.execute("UPDATE routes SET status = 'pending'")
        affected_rows = cursor.rowcount
        
        conn.commit()
        conn.close()
        
        print(f"✅ Reset {affected_rows} routes to 'pending' status")
        print("🔄 Now try starting the route again!")
        
    except Exception as e:
        print(f"❌ Error resetting routes: {e}")

if __name__ == "__main__":
    reset_route_status()
