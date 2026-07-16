For a production **AI Clinical Decision Support System (AI-CDSS)**, the **Diagnosis page** is the most critical screen. It should not resemble a ChatGPT conversation. Instead, it should function as a **clinical decision workspace**, where AI supports the clinician with evidence, reasoning, and recommendations while leaving the final decision to the doctor.

---

# Diagnosis Page Layout

Use a three-column layout on desktop.

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Diagnosis > Patient > John Smith (MRN: 102394)                    Status: Under Review      Save | Export │
├───────────────────────┬───────────────────────────────────────────┬────────────────────────────────────────┤
│ Patient Summary       │ AI Clinical Analysis                      │ Actions & Evidence                    │
│ (25%)                 │ (50%)                                    │ (25%)                                │
└───────────────────────┴───────────────────────────────────────────┴────────────────────────────────────────┘
```

---

# Header

The header provides context without scrolling.

```text
────────────────────────────────────────────────────────────────────────

← Back

John Smith

Male • 56 Years

MRN: 102394

Visit:
Emergency Department

Chief Complaint:
Chest Pain

Status:
AI Analysis Complete

Last Updated:
10:43 AM

[Generate Report]

[Approve Diagnosis]

────────────────────────────────────────────────────────────────────────
```

---

# Left Panel – Patient Clinical Context

The left column is always visible.

```text
Patient Overview

────────────────────────────

Age

56

Gender

Male

Height

175 cm

Weight

82 kg

BMI

26.8

────────────────────────────

Allergies

⚠ Penicillin

────────────────────────────

Medical History

✓ Hypertension

✓ Diabetes

✓ Hyperlipidemia

────────────────────────────

Current Medication

Metformin

Amlodipine

Atorvastatin

────────────────────────────

Chief Complaint

Chest pain

Shortness of breath

Sweating

────────────────────────────

Timeline

08:20 Arrival

08:31 ECG

08:45 Blood Draw

09:10 X-Ray

10:20 AI Analysis

```

---

# Center Panel – AI Diagnosis

This is the main workspace.

---

## AI Status

```text
AI Analysis

Completed

Duration

5.3 seconds

Models Used

✓ Clinical Reasoning

✓ Medical Vision

✓ Knowledge Retrieval

Confidence

91%

```

---

## Primary Diagnosis

Large highlighted card.

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Primary Diagnosis

Acute Coronary Syndrome

Confidence

91%

Risk

HIGH

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```

---

## Differential Diagnosis

```text
Possible Alternatives

──────────────────────────────

Acute Coronary Syndrome

91%

██████████

Pulmonary Embolism

41%

████

Aortic Dissection

18%

██

GERD

9%

█

```

---

## Clinical Reasoning

Expandable card.

```text
Clinical Reasoning

▼

The diagnosis is primarily supported by:

✓ Chest pain

✓ Elevated Troponin

✓ ST elevation on ECG

✓ Diabetes history

✓ Hypertension

No evidence suggesting pneumonia.

No significant signs of pulmonary infection.

```

---

## Supporting Clinical Evidence

```text
Evidence Used

Symptoms

✓ Chest pain

✓ Sweating

✓ Dyspnea

Laboratory

✓ Troponin ↑

✓ CK-MB ↑

Imaging

✓ ECG abnormal

✓ Chest X-ray normal

Medical History

✓ Diabetes

✓ Hypertension

```

---

## Explainability

```text
AI Explainability

──────────────────────────

Important Factors

Troponin

32%

ECG

29%

Symptoms

18%

Medical History

14%

Age

7%

```

A horizontal contribution chart works well here.

---

## Suggested Next Tests

```text
Recommended Diagnostic Tests

☐ Coronary Angiography

☐ Echocardiogram

☐ Repeat Troponin

☐ Lipid Profile

```

---

# Right Panel – Safety & Knowledge

---

## Drug Safety

```text
Drug Safety

⚠ Penicillin Allergy

No interaction detected

Kidney function normal

```

---

## Clinical Guidelines

```text
Supporting Guidelines

ESC Acute Coronary Syndrome

2025

Confidence Match

95%

ACC/AHA

NSTEMI Guideline

92%

```

Clicking opens the evidence summary.

---

## Similar Cases

```text
Similar Historical Cases

Case #1298

90% Similar

Outcome

Recovered

--------------------------

Case #2150

88% Similar

PCI Performed

```

---

## AI Confidence

```text
Confidence

91%

Evidence Quality

High

Image Quality

Excellent

Lab Completeness

100%

```

---

# Medical Image Section

Below the diagnosis.

```text
Chest X-Ray

──────────────────────────────────────────

Original Image

AI Heatmap

Finding

No pulmonary infiltrates

Normal cardiac silhouette

Image Confidence

94%

[Open DICOM Viewer]

```

---

# Laboratory Results

Instead of a table, highlight abnormalities.

```text
Laboratory

────────────────────────────────────

Troponin

2.8 ng/mL

🔴 High

Reference

<0.04

────────────────────

Glucose

195

🟡 High

────────────────────

HbA1c

8.4%

🟡 High

────────────────────

WBC

8.1

🟢 Normal

```

---

# AI Chat

Instead of a floating chatbot, embed it.

```text
Clinical Assistant

Ask about this patient...

________________________________

> Why is pulmonary embolism less likely?

────────────────────────────

AI

Pulmonary embolism was considered.

Reasons against:

• Normal oxygen saturation

• No DVT history

• ECG consistent with ACS

Sources

ESC Guidelines

PubMed

```

---

# Doctor Review Panel

Always at the bottom.

```text
Doctor Decision

────────────────────────────

Diagnosis

▼ Acute Coronary Syndrome

Confidence Accepted

91%

Notes

_____________________________________

_____________________________________

_____________________________________

```

Buttons:

```text
Approve

Modify Diagnosis

Request More Analysis

Order Tests

Generate SOAP Note

Generate Referral

Export PDF

Send to EHR

```

---

# Right Drawer (Optional)

Instead of navigating away, use a collapsible drawer.

Tabs:

```text
Evidence

History

Knowledge

Chat

Documents

```

---

# Workflow Progress

At the top of the page.

```text
Patient Data

✓

Labs

✓

Imaging

✓

AI Analysis

✓

Doctor Review

Current

Clinical Report

Pending

```

---

# Color Coding

Use restrained, clinical colors.

* 🔵 Blue: Information
* 🟢 Green: Normal
* 🟡 Amber: Review needed
* 🔴 Red: Critical
* ⚪ Gray: Inactive
* 🟣 Purple: AI-generated insights

Avoid excessive bright colors to reduce cognitive load.

---

# Component Structure (React)

```text
DiagnosisPage

├── DiagnosisHeader

├── WorkflowStepper

├── PatientSummaryCard

├── ComplaintCard

├── HistoryCard

├── MedicationCard

├── LabResultsCard

├── ImagingCard

├── DiagnosisCard

├── DifferentialDiagnosisCard

├── ExplainabilityCard

├── EvidenceCard

├── GuidelinesCard

├── RecommendedTestsCard

├── AIChatPanel

├── DoctorDecisionPanel

└── ReportActionsToolbar
```

---

# Data Flow

```text
Patient Record
      │
      ▼
Symptoms + History + Labs + Images
      │
      ▼
LangGraph Orchestrator
      │
      ├── Diagnosis Agent
      ├── Vision Agent
      ├── Knowledge (RAG) Agent
      └── Safety Checks
      │
      ▼
Unified AI Assessment
      │
      ▼
Diagnosis Page
      │
      ▼
Doctor Review & Approval
      │
      ▼
Clinical Report → EHR (FHIR/HL7)
```

This layout mirrors how clinicians work: **review patient context → assess AI findings → examine supporting evidence → make the final clinical decision → document and communicate the outcome**. It also cleanly separates AI-generated content from clinician-approved decisions, which is essential for a safe and auditable CDSS.
