The **Treatment Page** should be designed differently from the Diagnosis page. The diagnosis page answers **"What does the patient likely have?"**, while the treatment page answers **"What should we do next?"**.

Think of it as a **clinical treatment planning workspace**. The AI suggests a plan, performs safety checks, and cites evidence—but the clinician reviews, modifies, and approves the final treatment.

---

# Treatment Page Goals

The page should help the doctor:

1. Review the confirmed diagnosis.
2. Select or modify a treatment plan.
3. Verify medication safety.
4. Order additional tests or procedures.
5. Create follow-up plans.
6. Educate the patient.
7. Generate prescriptions and documentation.

---

# Overall Layout

A three-column layout works well.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Treatment Plan > John Smith (MRN 102394)                   Diagnosis: Acute Coronary Syndrome (Confirmed)   │
├───────────────────────┬────────────────────────────────────────────┬─────────────────────────────────────────┤
│ Patient Context       │ AI Treatment Plan                          │ Safety & Actions                        │
│ (25%)                 │ (50%)                                     │ (25%)                                  │
└───────────────────────┴────────────────────────────────────────────┴─────────────────────────────────────────┘
```

---

# Header

```text
──────────────────────────────────────────────────────────────────────────────

← Back

Treatment Planning

Patient:
John Smith

Diagnosis:
Acute Coronary Syndrome

Doctor:
Dr. Ahmed

Status:
Pending Approval

Generated:
10:44 AM

[Save Draft]

[Approve Treatment]

──────────────────────────────────────────────────────────────────────────────
```

---

# Left Panel — Patient Context

The doctor should never leave the treatment page to view important patient information.

---

## Patient Summary

```text
Patient Information

────────────────────────

Age

56

Gender

Male

BMI

26.8

Blood Group

A+

```

---

## Allergies

```text
Allergies

⚠ Penicillin

⚠ Ibuprofen
```

---

## Current Medications

```text
Current Medication

Metformin

Amlodipine

Atorvastatin

Aspirin
```

---

## Chronic Conditions

```text
Medical Conditions

Diabetes

Hypertension

Hyperlipidemia
```

---

## Recent Labs

```text
Latest Labs

Troponin ↑

HbA1c ↑

Creatinine Normal

Potassium Normal

```

---

# Center Panel — AI Treatment Plan

This is the primary workspace.

---

## Treatment Summary

Large card.

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recommended Treatment

Acute Coronary Syndrome

Evidence Strength

HIGH

Guideline

ESC 2025

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Medication Recommendations

Instead of a table, use editable cards.

```text
Medication

──────────────────────────────

Aspirin

81 mg

Once Daily

Start Immediately

Evidence

★★★★★

----------------------------

Atorvastatin

80 mg

Night

Evidence

★★★★★

----------------------------

Heparin

Weight Based

IV

Evidence

★★★★☆

```

Each medication card includes:

```
Drug

Dose

Frequency

Duration

Route

Evidence

Reference

Modify Button
```

---

## Drug Timeline

Visual schedule.

```text
Today

08:00

✔ Aspirin

09:00

✔ Heparin

20:00

Atorvastatin

Tomorrow

Morning

Metformin

```

---

## Non-Drug Therapy

```text
Lifestyle

✓ Smoking cessation

✓ Cardiac diet

✓ Exercise after discharge

✓ Weight reduction

✓ Stress management

```

---

## Procedures

```text
Recommended Procedures

☐ Coronary Angiography

☐ PCI

☐ Echocardiogram

☐ Cardiology Consultation

```

---

## Follow-up Plan

```text
Follow-up

Cardiology

Within

24 Hours

Repeat Troponin

6 Hours

Clinic Review

2 Weeks

```

---

# Right Panel — Safety

This panel continuously validates the treatment.

---

## Drug Interaction

```text
Medication Safety

────────────────────────

Interaction

None

Kidney Dose

Normal

Liver Dose

Normal

Pregnancy

N/A

```

---

## Allergy Check

```text
Safety Alerts

⚠ Penicillin Allergy

No Penicillin Prescribed

✓ Safe

```

---

## Contraindications

```text
Contraindications

NSAIDs

Avoid

Reason

Recent ACS

```

---

## Monitoring

```text
Required Monitoring

Blood Pressure

Daily

Creatinine

48 Hours

ECG

Repeat

Troponin

6 Hours

```

---

## Evidence Panel

```text
Supporting Evidence

ESC Guideline

★★★★★

ACC/AHA

★★★★★

PubMed

Recent Trial

```

---

# Cost & Availability (Optional)

Useful for hospitals.

```text
Medication Availability

Aspirin

Available

Atorvastatin

Available

Heparin

Low Stock

Alternative

Enoxaparin
```

---

# AI Explanation

```text
Why This Treatment?

The recommendation is based on:

✓ Confirmed Acute Coronary Syndrome

✓ Elevated Troponin

✓ High cardiovascular risk

✓ ESC 2025 Guideline

Expected Outcome

Reduced mortality

Reduced recurrent MI risk

```

---

# Prescription Builder

Instead of free text.

```text
Prescription

────────────────────────────

✓ Aspirin

81 mg

Daily

30 Days

----------------------------

✓ Atorvastatin

80 mg

Night

30 Days

----------------------------

[Generate Prescription]

```

---

# Patient Instructions

Automatically generated.

```text
Patient Instructions

• Take medications as prescribed.

• Seek emergency care if chest pain returns.

• Avoid smoking.

• Follow cardiac diet.

• Return in two weeks.

```

---

# Doctor Review

Everything is editable.

```text
Doctor Review

Diagnosis

Confirmed

Treatment

Modify ▼

Doctor Notes

____________________________________

____________________________________

____________________________________

```

---

# Bottom Toolbar

```text
Approve Treatment

Modify Medication

Request Pharmacy Review

Order Procedure

Generate Prescription

Generate Discharge Summary

Send to Pharmacy

Send to EHR

Export PDF
```

---

# Mobile-Friendly Tabs (if needed)

Instead of three columns:

```text
Patient

Treatment

Safety

Procedures

Monitoring

Evidence

Prescription

```

---

# React Component Structure

```text
TreatmentPage

├── TreatmentHeader

├── PatientContextCard

├── DiagnosisSummaryCard

├── MedicationPlanCard

├── DrugCard

├── DrugTimeline

├── ProcedureRecommendationCard

├── LifestyleCard

├── MonitoringCard

├── InteractionCheckerCard

├── AllergyAlertCard

├── EvidenceCard

├── PrescriptionBuilder

├── PatientInstructionCard

├── DoctorReviewPanel

└── ActionToolbar
```

---

# User Workflow

```text
Diagnosis Approved
        │
        ▼
Open Treatment Page
        │
        ▼
Review Patient Context
        │
        ▼
Review AI Treatment Recommendations
        │
        ▼
Automatic Safety Checks
        │
        ▼
Modify Medications (if needed)
        │
        ▼
Order Tests / Procedures
        │
        ▼
Generate Prescription
        │
        ▼
Doctor Approval & Signature
        │
        ▼
Send Orders to Pharmacy/EHR
        │
        ▼
Generate Patient Instructions
```

---

# Recommended Tab Structure

Instead of placing everything on one long page, organize the center workspace into tabs:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Treatment │ Medications │ Procedures │ Monitoring │ Evidence │ Prescription │
└─────────────────────────────────────────────────────────────────────────────┘
```

Each tab focuses on one aspect of the care plan:

* **Treatment:** Overall AI care plan, goals, and follow-up.
* **Medications:** Editable medication cards with dosing, alternatives, and interaction checks.
* **Procedures:** Imaging, surgery, referrals, and specialist consultations.
* **Monitoring:** Vital signs, laboratory monitoring, and reassessment schedule.
* **Evidence:** Guideline recommendations, clinical trials, and AI reasoning.
* **Prescription:** Final prescription preview, patient instructions, and export/send actions.

This structure keeps the page manageable for complex cases while allowing clinicians to review, edit, and approve each part of the treatment plan before it is committed to the EHR.
