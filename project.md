---
title: CustomerIQ
created: 2026-09-24
author: AI-assisted
last_updated: 2026-09-25
updated_by: AI-assisted
status: active
---

# CustomerIQ

## Intelligent Customer & Claims Platform for Cell Group

### Hackathon Project Proposal

---

## 1. Executive Summary

**CustomerIQ** is an intelligent customer and claims management platform designed for Cell Group.

The platform creates a **360-degree view of each customer** by bringing together information relating to insurance, medical aid, healthcare interactions, claims, customer engagement and service history.

CustomerIQ will use this unified customer profile together with an AI/ML intelligence layer to identify patterns, generate customer insights, assist with claims analysis, support customer service and recommend relevant next actions.

The goal is not to replace Cell Group's existing systems. Instead, CustomerIQ acts as an **intelligent layer that connects customer information and transforms it into actionable insights**.

The system will consist of:

* A **Next.js web application** for customers and Cell employees
* A **Node.js backend** responsible for business logic and APIs
* A **PostgreSQL database** for structured customer and operational data
* A dedicated **AI/ML service and trained model** for customer profiling, anomaly detection, segmentation and intelligent recommendations
* A dashboard for Cell employees to monitor customers, claims, insights and alerts

---

# 2. Problem statement

Winning a new client costs more than keeping one Cell already has. The book still loses people because there is no profile that shows who is worth keeping and who is starting to leave, and no intervention that reaches them before they go. A lapse is the expensive end of the story: replacing that client means finding, convincing, and onboarding someone new. The cheaper action is a timely offer while they are still a client. Without a profile of value and of risk, everyone looks the same until they have already left, and a call after they are gone is not retention.

---

# 3. The Proposed Solution

CustomerIQ will provide a centralized platform where authorized Cell employees can view a customer's complete relationship with Cell.

The system will:

1. Create a unified Customer 360 profile
2. Track customer interactions and journeys
3. Segment customers based on observable behaviour
4. Analyse claims for unusual patterns
5. Identify important customer events
6. Generate actionable insights
7. Provide an AI-powered customer assistant
8. Recommend relevant next actions
9. Provide dashboards and analytics to Cell employees

The platform will have two major experiences:

### Customer Experience

Customers can:

* View their information
* View policies and memberships
* Track claims
* Ask questions
* Find relevant services
* Receive notifications
* Submit claims
* Get assistance

### Cell Employee Experience

Employees can:

* Search customers
* View Customer 360 profiles
* Review claims
* View AI-generated insights
* Investigate flagged claims
* Monitor customer journeys
* View customer segments
* Receive alerts
* Take recommended actions

---

# 4. Core Concept: Customer 360

Customer 360 is the foundation of the entire platform.

Instead of looking at a customer as a single record, CustomerIQ builds a complete representation of their relationship with Cell.

For example:

```text
                    CUSTOMER
                       |
       +---------------+---------------+
       |               |               |
       v               v               v
  INSURANCE         CELLMED        NECTACARE
       |               |               |
   Policies         Plans          Healthcare
   Claims           Claims         Pharmacy
   Payments         Benefits       Visits
       |               |               |
       +---------------+---------------+
                       |
                       v
                 CUSTOMER 360
                       |
       +---------------+---------------+
       |               |               |
       v               v               v
   Behaviour       Engagement      Insights
       |               |               |
       +---------------+---------------+
                       |
                       v
                AI INTELLIGENCE
```

---

# 5. Customer Profile

Each customer will have a unified profile.

Example:

```text
CUSTOMER 360

John Moyo

Customer ID: CUS-00182
Customer Since: 2022

--------------------------------

PRODUCTS

✓ Motor Insurance
✓ Medical Aid
✓ Healthcare Services

--------------------------------

INSURANCE

Active Policies: 2
Previous Claims: 3
Upcoming Renewal: 15 Oct 2026

--------------------------------

MEDICAL

Medical Plan: Premium
Dependants: 3
Medical Claims: 7

--------------------------------

ENGAGEMENT

Digital Engagement: High
Last Interaction: 2 days ago

--------------------------------

CURRENT INSIGHTS

⚠ Motor policy renewal approaching
⚠ Medical claim under review
✓ High digital engagement
```

This allows an employee to understand the customer's relationship with Cell without navigating several separate systems.

---

# 6. Customer Journey

CustomerIQ will maintain a timeline of important customer events.

Example:

```text
CUSTOMER JOURNEY

2026

Jan 12
Purchased motor insurance

Feb 03
Submitted insurance claim

Feb 07
Claim processed

Mar 18
Healthcare visit

Apr 02
Pharmacy interaction

May 10
Contacted customer support

Aug 21
Logged into CustomerIQ

Sep 24
Submitted medical claim
```

This gives employees contextual information when interacting with the customer.

---

# 7. Customer Segmentation

The AI layer will help group customers based on observable behaviour.

Examples include:

### Product Relationship

* Insurance Only
* Medical Only
* Insurance + Medical
* Multi-Service Customer

### Engagement

* New Customer
* Active Customer
* Highly Engaged
* Low Digital Engagement

### Interaction Channel

* Digital First
* WhatsApp First
* Call Centre First
* Branch First

These segments help Cell understand how different groups interact with its services.

The segmentation should be based on defined data and measurable behaviour rather than subjective assumptions.

---

# 8. AI Intelligence Layer

The AI component will be a central part of CustomerIQ.

Instead of using AI only as a chatbot, we will train models to analyse customer and operational data.

The AI layer will support:

* Customer segmentation
* Behaviour analysis
* Claim anomaly detection
* Pattern detection
* Customer insights
* Recommendations
* Risk prioritisation
* AI-assisted explanations

---

# 9. AI Model

The team will develop and train an ML model using historical or synthetic CustomerIQ data.

For the hackathon, the dataset can contain fields such as:

```text
Customer ID
Age
Location
Customer Since
Products Held
Policy Count
Claim Count
Claim Frequency
Average Claim Value
Medical Claims
Healthcare Visits
Pharmacy Transactions
Digital Interactions
Support Interactions
Payment History
Policy Renewal Date
```

The exact features will depend on the data available to the team.

---

# 10. Model Capabilities

The trained model can support several tasks.

## 10.1 Customer Segmentation

The model identifies behavioural patterns and groups customers into meaningful segments.

Example:

```text
Customer
    |
    v
Feature Extraction
    |
    v
ML Model
    |
    v
Customer Segment

"Highly Engaged Multi-Service Customer"
```

---

## 10.2 Claim Anomaly Detection

When a claim is submitted, the model analyses it against relevant historical patterns.

Example:

```text
Claim Amount: $1,850

Provider Average: $470

Previous Similar Claim: 13 days ago

Claim Frequency: Elevated

        ↓

AI MODEL

        ↓

REVIEW RECOMMENDED
```

The model should not automatically declare a claim fraudulent.

Instead, it provides a **risk/anomaly signal** that helps a human investigator decide whether further review is required.

---

# 11. Explainable AI

Every AI-generated insight should provide supporting factors.

Instead of:

```text
Risk Score: 91
```

CustomerIQ should show:

```text
CLAIM ANALYSIS

Review Recommended

Reasons:

• Claim amount differs significantly
  from historical patterns

• Similar claim occurred recently

• Claim frequency is elevated

• Supporting information requires
  additional verification
```

This makes the system easier for employees to understand and investigate.

---

# 12. Intelligent Recommendations

CustomerIQ will also identify potential next actions.

For example:

```text
CUSTOMER

Motor policy expires soon

        ↓

AI ANALYSIS

Customer is digitally engaged

        ↓

RECOMMENDATION

Send renewal notification
```

Another example:

```text
CLAIM

Missing supporting document

        ↓

AI / RULE ENGINE

Required document not found

        ↓

RECOMMENDATION

Request supporting document
```

The recommendation is presented to an authorized employee or customer. The system does not automatically take sensitive actions without appropriate authorization.

---

# 13. AI Customer Assistant

CustomerIQ will include an AI assistant that allows customers to interact with the platform naturally.

Customers can ask questions such as:

> "What policies do I have?"

> "What is the status of my claim?"

> "When does my policy expire?"

> "Where can I find a healthcare facility?"

> "How do I submit a claim?"

The assistant will combine the customer's authenticated information with Cell-approved knowledge.

The AI should only expose information the authenticated customer is authorized to access.

---

# 14. Claims Workflow

The claims process will follow this structure:

```text
Customer
    |
    v
Submit Claim
    |
    v
Upload Documents
    |
    v
Node.js Backend
    |
    v
Validate Claim
    |
    v
AI Analysis
    |
    +----------------+
    |                |
    v                v
Normal          Review
    |                |
    v                v
Process        Human Review
    |                |
    +--------+-------+
             |
             v
       Claim Decision
             |
             v
       Customer Update
```

---

# 15. CustomerIQ Dashboard

The employee dashboard will provide a centralized overview.

Example:

```text
CustomerIQ COMMAND CENTRE

--------------------------------------------

Customers
24,812

Active Policies
31,492

Claims Today
1,284

Requires Review
23

--------------------------------------------

CUSTOMER ACTIVITY

Highly Engaged       38%
Active               44%
Low Engagement       18%

--------------------------------------------

CLAIM INTELLIGENCE

Normal               1,174
Review Required         87
High Priority           23

--------------------------------------------

INSIGHTS

⚠ Claims requiring review
⚠ Upcoming renewals
⚠ Missing claim documents
✓ Increased digital engagement
```

All figures shown above are examples for the prototype and would be populated from actual or synthetic data in the implementation.

---

# 16. Technology Architecture

The system will use the following stack.

## Frontend

### Next.js

Responsibilities:

* Customer portal
* Employee dashboard
* Customer profiles
* Claims interface
* Analytics
* AI assistant
* Authentication interface
* Responsive web application

Additional technologies:

* TypeScript
* Tailwind CSS
* shadcn/ui
* Recharts
* React

---

# 17. Backend

## Node.js

The Node.js backend will act as the main application API.

Recommended framework:

### NestJS or Express.js

For the hackathon, either can work. A modular NestJS architecture would provide a clean enterprise-style structure.

Backend responsibilities:

* Authentication
* Authorization
* Customer management
* Customer profiles
* Policies
* Medical memberships
* Claims
* Healthcare interactions
* Customer interactions
* Notifications
* AI integration
* Analytics
* Audit logging

Example API structure:

```text
/api/v1

/auth
/customers
/customers/:id/profile
/customers/:id/interactions

/policies
/medical
/claims
/providers

/ai
/ai/profile
/ai/segment
/ai/analyse-claim
/ai/recommendations

/analytics
/notifications
```

---

# 18. Database

## PostgreSQL

PostgreSQL will be the primary relational database.

Core tables:

```text
users
customers
customer_profiles

insurance_policies
medical_memberships
dependants

claims
claim_documents
claim_events

healthcare_visits
pharmacy_transactions

customer_interactions
customer_events

customer_segments
customer_insights
customer_recommendations

ai_predictions
ai_features

notifications
audit_logs
```

---

# 19. Example Database Relationship

```text
customers
    |
    +---- insurance_policies
    |
    +---- medical_memberships
    |
    +---- dependants
    |
    +---- claims
    |       |
    |       +---- claim_documents
    |       +---- claim_events
    |
    +---- healthcare_visits
    |
    +---- pharmacy_transactions
    |
    +---- customer_interactions
    |
    +---- customer_events
    |
    +---- customer_segments
    |
    +---- customer_insights
    |
    +---- customer_recommendations
```

---

# 20. AI Service Architecture

The trained model should be separated from the main Node.js application.

Recommended architecture:

```text
Next.js
    |
    v
Node.js API
    |
    +----------------------+
    |                      |
    v                      v
PostgreSQL            AI Service
                            |
                            v
                       Trained Model
```

The AI service can be implemented in **Python/FastAPI**, while Node.js remains the main backend.

This separation makes it easier to:

* Train models
* Deploy models
* Update models
* Test models
* Scale AI independently

---

# 21. AI Request Flow

For example, when a claim is submitted:

```text
Next.js
   |
   | POST /claims
   v
Node.js
   |
   | Save claim
   v
PostgreSQL
   |
   | Send relevant features
   v
AI Service
   |
   | Model prediction
   v
AI Model
   |
   | Prediction + factors
   v
Node.js
   |
   | Save result
   v
PostgreSQL
   |
   v
Next.js Dashboard
```

The employee can then see the AI-generated analysis.

---

# 22. Security

Because CustomerIQ would handle sensitive customer, financial and potentially medical information, security must be part of the architecture from the beginning.

The system should include:

* Authentication
* Role-based access control
* JWT/session security
* Password hashing
* API validation
* Encryption in transit
* Secure document storage
* Audit logs
* Access logging
* Rate limiting
* Input validation
* Restricted AI data access

Example roles:

```text
ADMIN
    |
    +-- Full system management

CLAIMS_OFFICER
    |
    +-- Claims
    +-- Customer information
    +-- AI claim insights

CUSTOMER_SERVICE
    |
    +-- Customer profiles
    +-- Customer interactions

CUSTOMER
    |
    +-- Own information
    +-- Own policies
    +-- Own claims
```

---

# 23. Privacy by Design

Customer profiling must be designed around legitimate business purposes and controlled access.

CustomerIQ should follow principles such as:

* Collect only required information
* Use data for defined purposes
* Restrict access based on role
* Keep an audit trail
* Avoid unnecessary sensitive attributes
* Provide appropriate customer transparency
* Separate model experimentation from production customer data

The AI model should assist employees rather than make irreversible decisions automatically.

---

# 24. Example End-to-End Scenario

### Customer: John Moyo

John has:

* Motor insurance
* Medical aid
* Three dependants
* Previous claims
* Healthcare interactions

### Step 1 — Customer logs in

CustomerIQ retrieves his Customer 360 profile.

### Step 2 — Customer submits a claim

John uploads documents and photographs.

### Step 3 — Node.js processes the claim

The claim is validated and stored in PostgreSQL.

### Step 4 — AI model analyses the claim

The model detects several unusual patterns.

### Step 5 — CustomerIQ creates an insight

```text
REVIEW RECOMMENDED

3 relevant anomaly signals detected.
```

### Step 6 — Employee opens the claim

They see:

* Claim information
* Customer history
* Previous relevant claims
* Provider information
* AI analysis
* Supporting factors

### Step 7 — Employee takes action

The employee requests additional documentation.

### Step 8 — Customer is notified

John receives:

> Your claim requires additional documentation.

### Step 9 — Customer uploads the document

The claim returns to the review workflow.

This demonstrates the complete CustomerIQ ecosystem.

---

# 25. Hackathon MVP

The team should not attempt to build the entire Cell ecosystem.

The MVP should focus on four core capabilities.

## MVP 1 — Customer 360

Build:

* Customer profile
* Products
* Claims
* Interactions
* Customer timeline
* Segmentation

## MVP 2 — Claims Intelligence

Build:

* Claim creation
* Document upload
* Claim dashboard
* AI anomaly detection
* Explainable insights

## MVP 3 — AI Assistant

Build:

* Customer questions
* Policy information
* Claim status
* Service discovery
* Guided claim submission

## MVP 4 — Cell Intelligence Dashboard

Build:

* Customer analytics
* Claims analytics
* AI alerts
* Segments
* Recommendations

---

# 26. Suggested Project Structure

## Frontend

```text
customeriq-web/
│
├── app/
│   ├── dashboard/
│   ├── customers/
│   ├── claims/
│   ├── analytics/
│   ├── assistant/
│   └── login/
│
├── components/
│   ├── dashboard/
│   ├── customers/
│   ├── claims/
│   ├── charts/
│   └── ui/
│
├── lib/
├── hooks/
├── services/
└── types/
```

## Backend

```text
customeriq-api/
│
├── src/
│   ├── auth/
│   ├── customers/
│   ├── policies/
│   ├── medical/
│   ├── claims/
│   ├── providers/
│   ├── interactions/
│   ├── ai/
│   ├── analytics/
│   ├── notifications/
│   └── audit/
│
├── database/
├── middleware/
├── config/
└── main.js
```

## AI

```text
customeriq-ai/
│
├── data/
├── notebooks/
├── models/
├── training/
├── inference/
├── preprocessing/
├── evaluation/
├── api/
└── requirements.txt
```

---

# 27. Future Expansion

After the hackathon, CustomerIQ could potentially expand into:

### Predictive customer engagement

Identify customers who may need proactive service.

### Claims automation

Automate parts of claims processing while retaining human oversight.

### Provider intelligence

Identify unusual provider-level patterns.

### Personalised customer journeys

Deliver relevant information based on customer activity and preferences.

### WhatsApp integration

Allow customers to interact with CustomerIQ through WhatsApp.

### Mobile application

Provide a dedicated CustomerIQ mobile experience.

### Advanced analytics

Give management deeper insight into:

* Customer behaviour
* Claims
* Products
* Service usage
* Engagement
* Operational patterns

---

# 28. Final Product Vision

CustomerIQ is not simply:

**"An AI chatbot."**

It is not simply:

**"A claims system."**

And it is not simply:

**"A customer database."**

It is an **intelligent customer and claims platform**.

The platform combines:

```text
             CustomerIQ
                 |
     +-----------+-----------+
     |           |           |
     v           v           v
 CUSTOMER     CLAIMS       AI
   360       INTELLIGENCE
     |           |           |
     +-----------+-----------+
                 |
                 v
          INSIGHTS & ACTIONS
                 |
       +---------+---------+
       |                   |
       v                   v
   CUSTOMER             CELL TEAM
   EXPERIENCE          INTELLIGENCE
```

### Core proposition

> **CustomerIQ brings together the customer's relationship with Cell, understands what is happening, identifies important patterns, and helps Cell and its customers take informed next steps.**

### Technology Stack

| Layer           | Technology               |
| --------------- | ------------------------ |
| Frontend        | Next.js + TypeScript     |
| UI              | Tailwind CSS + shadcn/ui |
| Backend         | Node.js                  |
| API             | REST                     |
| Database        | PostgreSQL               |
| AI/ML           | Custom-trained model     |
| AI API          | Python/FastAPI           |
| Authentication  | JWT / secure sessions    |
| Charts          | Recharts                 |
| Deployment      | Docker                   |
| Version Control | Git/GitHub               |

---

# 29. Hackathon Pitch

### **CustomerIQ**

### *One customer. One view. Intelligent action.*

CustomerIQ creates a unified view of every customer's relationship with Cell Group.

It combines customer profiling, insurance and medical information, claims, interactions and healthcare activity into one intelligent platform.

Our AI layer analyses patterns, identifies anomalies, generates explainable insights and recommends relevant actions.

For customers, CustomerIQ means simpler access to Cell services.

For employees, it means having the right customer context at the right time.

For Cell Group, it creates a foundation for more connected, data-driven customer service and operational decision-making.

**CustomerIQ doesn't replace Cell's existing ecosystem — it makes the ecosystem intelligent.**
