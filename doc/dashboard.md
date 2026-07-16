For an **enterprise AI-CDSS**, the dashboard should be **role-oriented**, not feature-oriented. Each dashboard should answer the user's first question when they log in:

* **Admin:** *Is the system healthy?*
* **Doctor:** *Which patients need my attention?*
* **Nurse:** *What care tasks are due now?*
* **Patient:** *What do I need to know or do today?*

Instead of trying to fit everything on one page, use a **widget-based dashboard** where each widget represents one business function.

---

# Overall Navigation

All users share the same application shell.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Logo │ Search │ Notifications │ Help │ User Profile │
├──────────────┬──────────────────────────────────────────────────────────┤
│ Sidebar      │ Dashboard (Role Specific)                               │
│              │                                                         │
│ Dashboard    │                                                         │
│ ...          │                                                         │
│              │                                                         │
└──────────────┴──────────────────────────────────────────────────────────┘
```

---

# 1. Administrator Dashboard

The admin dashboard is a **system operations dashboard**, similar to cloud platforms like Azure or AWS.

## Layout

```text
------------------------------------------------------------

Good Morning, Administrator

System Status        Healthy

------------------------------------------------------------

 KPI Cards

 Users        AI Requests      Hospitals     Active Sessions

------------------------------------------------------------

 Infrastructure

 API Status

 Database

 GPU

 Vector DB

 Storage

------------------------------------------------------------

 AI Monitoring

 Average Response

 Cost Today

 Hallucination Alerts

 Failed Requests

------------------------------------------------------------

 Security

 Failed Logins

 Active Tokens

 Audit Events

------------------------------------------------------------

 Recent Activities

 User Created

 Knowledge Updated

 AI Model Changed

------------------------------------------------------------
```

---

## Suggested Widgets

### Top Row (Executive KPIs)

```text
Users

Doctors

Nurses

Patients

Hospitals
```

---

### AI Monitoring

```text
Diagnosis Requests

Treatment Requests

RAG Searches

Vision Analysis

Average Latency

Token Usage

Cost Today
```

---

### Infrastructure

```text
FastAPI

Healthy

Redis

Healthy

PostgreSQL

Healthy

Pinecone

Healthy

LLM Provider

Healthy
```

---

### Security

```text
Unauthorized Access

Expired Tokens

Failed Login Attempts

Audit Events

Permission Changes
```

---

### Quick Actions

```text
Create User

Upload Guidelines

Configure AI

Backup Database

View Logs
```

---

# 2. Doctor Dashboard

This dashboard should behave like a **clinical command center**.

The doctor shouldn't search for work.

The dashboard tells them:

> "These patients need your attention."

---

## Layout

```text
------------------------------------------------------------

Good Morning Dr. Ahmed

Today's Schedule

09:00

Patient Queue

Critical Alerts

------------------------------------------------------------

My Patients

------------------------------------------------------------

AI Alerts

------------------------------------------------------------

Pending Reviews

------------------------------------------------------------

Today's Appointments

------------------------------------------------------------

Recent Reports

------------------------------------------------------------

Clinical Knowledge Updates

------------------------------------------------------------
```

---

## Recommended Sections

### Patient Queue

```text
John Smith

Chest Pain

HIGH PRIORITY

--------------------

Mary Brown

Diabetes Review

MEDIUM
```

---

### AI Alerts

```text
High Troponin

Possible Stroke

Drug Interaction

Abnormal ECG

Sepsis Risk
```

---

### Pending AI Reviews

```text
Diagnosis waiting approval

Treatment requires review

SOAP note draft

Referral letter draft
```

---

### Today's Schedule

```text
09:00

John Smith

10:00

Mary Brown

11:00

Ahmed Ali
```

---

### Recent Patients

Shows recently opened charts.

---

### Clinical News

Hospital protocol updates.

New NICE guideline.

New drug warning.

---

### Quick Actions

```text
New Diagnosis

Search Patient

Upload Image

Medical Chat

Knowledge Search
```

---

# 3. Nurse Dashboard

Nurses focus on **care delivery**, not diagnosis.

Everything revolves around tasks.

---

## Layout

```text
------------------------------------------------------------

Welcome Sarah

Assigned Patients

Medication Due

Vitals Due

Tasks

------------------------------------------------------------

My Patients

------------------------------------------------------------

Medication Schedule

------------------------------------------------------------

Vitals Monitoring

------------------------------------------------------------

AI Care Alerts

------------------------------------------------------------

Messages

------------------------------------------------------------
```

---

## My Patients

```text
Room 301

John Smith

Medication Due

--------------

Room 304

Mary Brown

Vitals Due
```

---

## Medication Schedule

```text
08:00

Metformin

Pending

----------------

09:00

Insulin

Completed

----------------

10:00

Antibiotics

Pending
```

---

## Vitals

```text
Blood Pressure

Pending

Temperature

Completed

Heart Rate

Pending
```

---

## AI Care Alerts

```text
Patient temperature increasing

Oxygen decreasing

High fall risk

Pressure ulcer risk
```

---

## Quick Actions

```text
Record Vitals

Medication Administration

Add Nursing Note

Request Doctor Review
```

---

# 4. Patient Dashboard

Patients should never see technical medical information first.

Instead:

"What should I do today?"

---

## Layout

```text
------------------------------------------------------------

Hello John

Good Morning

------------------------------------------------------------

Health Summary

------------------------------------------------------------

Today's Medication

------------------------------------------------------------

Upcoming Appointment

------------------------------------------------------------

Recent Test Results

------------------------------------------------------------

Messages

------------------------------------------------------------

Health Assistant

------------------------------------------------------------
```

---

## Health Summary

```text
Conditions

Diabetes

Hypertension

Weight

82kg

Blood Pressure

Normal
```

---

## Medication

```text
Metformin

Morning

Take Now

----------------

Vitamin D

Evening

Upcoming
```

---

## Appointment

```text
Tomorrow

Cardiology

10:30 AM

Join Telehealth
```

---

## Recent Results

Instead of:

```text
HbA1c

8.3%
```

Show:

```text
Blood sugar is higher than the target.

Please discuss with your doctor.
```

---

## Health Goals

```text
Walk

6000 / 8000

Water

1.8L

Medication

Completed
```

---

## AI Assistant

Patient asks:

> "Can I eat bananas?"

AI gives educational guidance.

Not diagnoses.

---

# Shared Dashboard Structure

Every dashboard should follow the same visual pattern to reduce the learning curve.

```text
┌──────────────────────────────────────────────────────┐
│ Greeting + Role + Notifications                      │
├──────────────────────────────────────────────────────┤
│ KPI Cards (4–6)                                      │
├───────────────────────┬──────────────────────────────┤
│ Main Work Area        │ Secondary Information        │
│                       │                              │
│ Large widgets         │ Alerts                       │
│                       │ Messages                     │
│                       │ Activity                     │
├───────────────────────┴──────────────────────────────┤
│ Quick Actions                                     │
└──────────────────────────────────────────────────────┘
```

---

# Suggested Grid Layout (12-Column)

Using Material UI's Grid system:

```text
┌──────────────────────────────────────────────────────┐
│ Header (12)                                          │
├────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┤
│ KPI 1 (3) │ KPI 2 (3) │ KPI 3 (3) │ KPI 4 (3)       │
├───────────────────────────────┬──────────────────────┤
│ Main Widget (8)               │ Alerts (4)          │
├───────────────────────────────┼──────────────────────┤
│ Secondary Widget (8)          │ Activity (4)        │
├───────────────────────────────┴──────────────────────┤
│ Full Width Widget (12)                              │
└──────────────────────────────────────────────────────┘
```

This gives consistency while allowing each role to populate the widgets differently.

---

# Widget Recommendations by Role

| Widget            |          Admin         |       Doctor       |        Nurse       |               Patient              |
| ----------------- | :--------------------: | :----------------: | :----------------: | :--------------------------------: |
| KPI Cards         |            ✅           |          ✅         |          ✅         |                  ✅                 |
| Calendar/Schedule |            ❌           |          ✅         |          ✅         |                  ✅                 |
| Patient Queue     |            ❌           |          ✅         |          ✅         |                  ❌                 |
| AI Alerts         |         System         |      Clinical      |        Care        |          Educational only          |
| Recent Activity   |       Audit logs       |   Patient history  |    Nursing tasks   |          Personal activity         |
| Quick Actions     | User/system management | Diagnosis, reports | Vitals, medication | Book appointment, upload documents |
| Charts            |     System metrics     |   Caseload trends  |   Task completion  |            Health trends           |
| Notifications     |     Security/system    |      Clinical      |        Care        |        Appointments/messages       |
| Messages          |  Admin communications  | Team collaboration | Team collaboration |        Doctor communications       |

### Design Principles

* **Admin dashboards** emphasize **operations, infrastructure, and governance**.
* **Doctor dashboards** emphasize **clinical decision-making and patient prioritization**.
* **Nurse dashboards** emphasize **task execution and continuous patient monitoring**.
* **Patient dashboards** emphasize **health management, communication, and engagement**.

This role-centered approach keeps each dashboard focused on what that user needs most within the first few seconds of logging in, reducing cognitive load and improving workflow efficiency.
