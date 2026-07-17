For a modern **AI Clinical Decision Support System**, the **X-ray Analysis page** should not just display an image with an AI result. It should act like a **Radiology AI Workstation**, combining image viewing, AI findings, clinical context, comparison, and reporting.

Think of it as a hybrid of **OHIF Viewer + PACS + AI Assistant + Radiology Report Generator**.

---

# Design Principles

The page should answer:

1. **What am I looking at?**
2. **What did AI detect?**
3. **How confident is the AI?**
4. **Why did it detect this?**
5. **How does this compare with previous images?**
6. **What should I do next?**

---

# Overall Layout

A three-panel layout is ideal.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Imaging > Chest X-Ray > John Smith (MRN:102394)                          AI Analysis Complete | Export Report │
├────────────────────────────┬──────────────────────────────────────────────┬─────────────────────────────────────┤
│ Patient & Study            │ Image Viewer                                │ AI Findings & Actions               │
│ (20%)                      │ (55%)                                       │ (25%)                              │
└────────────────────────────┴──────────────────────────────────────────────┴─────────────────────────────────────┘
```

---

# Header

```text
────────────────────────────────────────────────────────────

← Back

Patient

John Smith

Study

Chest PA X-Ray

Date

2026-07-16

Status

AI Analyzed

Radiologist

Pending Review

[Compare Previous]

[Generate Report]

────────────────────────────────────────────────────────────
```

---

# Left Sidebar — Patient & Study Context

Always visible.

```text
Patient

John Smith

Male

56 Years

MRN

102394

------------------------------------

Clinical Indication

Chest Pain

Shortness of Breath

------------------------------------

Known Conditions

✓ Diabetes

✓ Hypertension

------------------------------------

Allergies

Penicillin

------------------------------------

Previous Studies

2026-06-10

2025-12-04

```

---

# Center Panel — Medical Image Viewer

This is the main workspace.

Large diagnostic image.

```text
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│             Chest X-Ray                     │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

---

# Viewer Toolbar

```text
Zoom

Pan

Reset

Window Level

Brightness

Contrast

Invert

Measurements

Annotation

Overlay

Fullscreen

```

For DICOM support later:

```text
Series

Study

Window Presets

Crosshair

Reference Lines

MPR

```

---

# AI Overlay Toggle

Doctors should be able to compare:

```text
○ Original

○ AI Heatmap

○ Segmentation

○ Bounding Boxes

```

Example:

Original

↓

Heatmap

↓

Lung Segmentation

↓

Detected Opacity

---

# AI Findings Panel

Instead of one sentence.

Use cards.

```text
━━━━━━━━━━━━━━━━━━━━━━

Primary Finding

Right Lower Lobe Opacity

Confidence

92%

Severity

Moderate

━━━━━━━━━━━━━━━━━━━━━━
```

---

# Detected Findings

```text
Detected Findings

✓ Right Lower Lobe Opacity

✓ Mild Pleural Effusion

✓ Enlarged Cardiac Silhouette

No Pneumothorax

No Fracture

```

---

# Anatomical Regions

Interactive.

```text
Lungs

Abnormal

Heart

Normal

Pleura

Abnormal

Bones

Normal

Diaphragm

Normal
```

Clicking highlights the area on the image.

---

# Explainability Panel

```text
AI Explanation

The opacity is likely caused by:

• Increased density

• Loss of normal lung markings

• Location consistent with lower lobe

```

---

# Confidence Chart

Instead of one percentage.

```text
Opacity

92%

Pleural Effusion

84%

Pneumonia

81%

Pulmonary Edema

18%

```

Bar chart works well.

---

# Differential Imaging Findings

```text
Possible Diagnoses

Community Pneumonia

91%

Pulmonary Edema

28%

COVID Pneumonia

19%

Lung Cancer

11%

```

---

# Clinical Correlation

```text
Clinical Correlation

Symptoms

✓ Fever

✓ Cough

✓ Dyspnea

Laboratory

✓ WBC Elevated

✓ CRP Elevated

AI Assessment

Findings support pneumonia.
```

This connects imaging to the clinical context.

---

# Previous Study Comparison

One of the most valuable features.

```text
Previous X-Ray

2026-06-10

↓

Current

2026-07-16

Changes

Opacity Increased

Pleural Effusion New

Heart Size Stable
```

Even better:

Side-by-side viewer.

```text
Previous          Current

□                  □
```

---

# Timeline

```text
Imaging Timeline

2025

Normal

↓

2026-02

Small opacity

↓

2026-05

Improved

↓

Today

Moderate opacity
```

---

# AI Recommendations

```text
Suggested Next Steps

Repeat X-Ray

48 Hours

CT Chest

Recommended

Pulmonology Referral

Recommended

Blood Culture

Suggested
```

---

# Report Generator

Instead of another page.

```text
Radiology Report

Findings

...

Impression

...

Recommendation

...
```

Buttons:

```text
Generate

Edit

Approve

Export PDF

Send to EHR
```

---

# Clinical AI Chat

Patient-aware.

```text
Ask AI

Why is this likely pneumonia?

-----------------------------------

AI

Because:

• Consolidation pattern

• Lower lobe involvement

• Elevated inflammatory markers

Evidence

RSNA

WHO

```

---

# Quality Assessment

Very useful.

```text
Image Quality

Exposure

Good

Rotation

Minimal

Motion

None

Quality Score

95%
```

If quality is poor:

```text
Recommendation

Repeat image.

Reason

Patient rotation.

```

---

# AI Processing Timeline

```text
Upload

✓

Preprocessing

✓

Lung Segmentation

✓

Finding Detection

✓

Clinical Correlation

✓

Report Generation

✓
```

---

# Right Sidebar

Organize into collapsible cards:

```text
AI Findings

Evidence

Clinical Correlation

Recommendations

Report

Chat
```

---

# Bottom Action Bar

```text
Approve Findings

Request Radiologist Review

Generate Report

Compare Study

Share

Export

Send to EHR
```

---

# Mobile/Tablet Tabs

```text
Image

Findings

Comparison

Report

Chat
```

---

# React Component Structure

```text
ImagingAnalysisPage

├── ImagingHeader
├── PatientStudyCard
├── StudyTimeline
├── ImageViewer
├── ViewerToolbar
├── OverlayControls
├── FindingsCard
├── AnatomyStatusCard
├── ExplainabilityCard
├── ConfidenceChart
├── ClinicalCorrelationCard
├── PreviousStudyComparison
├── RecommendationCard
├── ReportEditor
├── AIChatPanel
├── QualityAssessmentCard
└── ActionToolbar
```

---

# End-to-End Workflow

```text
Upload X-Ray
      │
      ▼
Image Validation
      │
      ▼
AI Vision Model
      │
      ├── Lung Segmentation
      ├── Pathology Detection
      ├── Explainability (Heatmap)
      ├── Clinical Correlation
      └── Report Draft
      │
      ▼
Image Review
      │
      ▼
Radiologist / Doctor Review
      │
      ▼
Approve Report
      │
      ▼
Save to PACS / EHR
```

## UX Enhancements

To make the page feel like a professional radiology workstation rather than an image viewer:

* **Center-first design:** Dedicate over half the screen to the image viewer, with resizable side panels.
* **Linked interactions:** Clicking a finding (e.g., "Right lower lobe opacity") automatically highlights the corresponding region on the image; clicking a highlighted region scrolls to its finding card.
* **Layer controls:** Allow toggling AI heatmaps, segmentation masks, and bounding boxes independently.
* **Synchronized comparison:** When comparing current and prior studies, zooming or panning one image updates the other.
* **Context-sensitive actions:** If AI detects a critical finding (e.g., pneumothorax), surface high-priority actions such as **Notify Clinician** or **Request Radiologist Review** prominently.
* **Collapsible side panels:** Let clinicians maximize the image viewer when performing detailed visual inspection while keeping findings one click away.

This design closely matches workflows in modern PACS systems while adding AI-assisted interpretation, explainability, and clinical decision support in a way that integrates naturally into radiologists' and physicians' daily practice.
