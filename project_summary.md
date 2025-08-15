
# Project Summary: RAKT-RADAR MVP

## Overview
RAKT-RADAR aims to prevent blood wastage and save lives by predicting expiries and auto-routing transfers of blood units. It connects supply and demand in real-time across registered blood banks and hospitals.

## Key Functionalities (MVP Scope)
1.  **Centralized Registry:** A unified database to store all blood unit details (type, quantity, expiry) from every registered hospital and blood bank.
2.  **Continuous Tracking:** Real-time monitoring and syncing of stock levels and expiry dates.
3.  **Expiry Prediction (Mocked):** Flagging blood units nearing expiry (e.g., 5-7 days before). For MVP, this can be a simple rule-based flag.
4.  **Demand Matching (Mocked):** Matching near-expiry surplus units with hospitals facing shortages, prioritizing based on expiry date, proximity, and urgency. For MVP, this can be a simplified matching logic.
5.  **Routing (Mocked):** Suggesting optimal transfer paths. For MVP, this can be a placeholder or a simple distance calculation.
6.  **User Interface:** A web dashboard for hospitals and blood banks to view inventory, near-expiry units, and potentially initiate transfers.

## Technical Requirements
*   **Backend:** Python with FastAPI (Fast, async, quick setup).
*   **Database:** PostgreSQL (Relational storage for structured blood bank data). Firebase Realtime DB was mentioned for live updates, but for MVP, PostgreSQL can handle this.
*   **Machine Learning:** scikit-learn (for expiry prediction models - *mocked for MVP*).
*   **Routing & Maps:** Google Maps JavaScript & Directions API (for location mapping, proximity checks, and optimal routes - *mocked/simplified for MVP*).
*   **Frontend:** React.js (Web dashboard).
*   **Hosting:** Vercel (Frontend), Heroku (Backend) - *Deployment will be local for MVP demo*.

## Workflow (based on diagram and presentation)
1.  **Data Management:** Hospitals and Blood Banks continuously update their inventory (stock and expiry info) which is tracked and stored in a central Registry.
2.  **Operational Intelligence:**
    *   **Expiry Prediction:** The system identifies units nearing expiry.
    *   **Demand Matching:** If a match is found between a near-expiry unit and a demand, it proceeds to routing.
    *   **Routing:** Suggests the transfer path.
3.  **System Administrator:** Interacts with the system, likely managing users and overseeing the process.

## MVP Strategy
Given the 1-day deadline, the focus will be on demonstrating the *workflow* with mocked data and simplified logic for complex features like expiry prediction, demand matching, and routing. The system should be deployable on the user's local system.

