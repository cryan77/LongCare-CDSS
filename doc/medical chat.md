For an **AI-CDSS**, the **Medical Chat** should **not** look like ChatGPT. A generic chat interface encourages users to ask broad questions and can lose important clinical context.

Instead, think of it as a **Clinical AI Workspace** that combines:

* Patient-aware conversations
* Medical literature search (RAG)
* Clinical reasoning
* Document generation
* Order assistance

The AI should always know **who the patient is**, **what encounter is open**, and **what data is available**.

---

# UX Goals

The page should answer:

* Why did the AI make this diagnosis?
* What if the patient's condition changes?
* What do current guidelines recommend?
* Can you summarize this case?
* Can you generate documentation?

Not:

> "Hello, how can I help?"

---

# Recommended Layout

Instead of a centered chatbot.

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Clinical AI Assistant                                                               Patient: John Smith     │
├─────────────────────────────┬─────────────────────────────────────────────┬───────────────────────────────┤
│ Patient Context             │ Conversation                               │ AI Insights                  │
│ 25%                         │ 50%                                        │ 25%                          │
└─────────────────────────────┴─────────────────────────────────────────────┴───────────────────────────────┘
```

This is much closer to Epic, Cerner, or Microsoft healthcare UX.

---

# Left Panel — Patient Context

Always visible.

```text
Patient

John Smith

56 Years

Male

---------------------------------

Diagnosis

Acute Coronary Syndrome

---------------------------------

Symptoms

Chest Pain

Dyspnea

Sweating

---------------------------------

Labs

Troponin ↑

HbA1c ↑

---------------------------------

Allergies

Penicillin

---------------------------------

Current Medication

Metformin

Atorvastatin

---------------------------------

Timeline

Admission

ECG

X-Ray

Diagnosis

Treatment

```

The AI automatically uses this context.

The doctor doesn't need to paste patient information.

---

# Center Panel — Conversation

Normal conversation.

```text
────────────────────────────────────────────

Doctor

Why is pulmonary embolism less likely?

────────────────────────────────────────────

AI

Pulmonary embolism was considered.

Reasons against:

• Normal oxygen saturation

• No DVT history

• ECG findings favor ACS

Evidence

ESC 2025

PubMed

Confidence

High

────────────────────────────────────────────
```

---

# AI Messages Should Be Structured

Instead of paragraphs.

Example:

```text
Answer

----------------------------------

Summary

ACS remains the leading diagnosis.

----------------------------------

Reasoning

• Elevated troponin

• ST elevation

• Typical symptoms

----------------------------------

Evidence

ESC Guidelines

ACC/AHA

----------------------------------

Confidence

91%

----------------------------------

Next Suggested Question

"What treatment options are recommended?"

```

---

# Prompt Suggestions

Instead of empty input.

Show quick chips.

```text
Suggested Questions

[Explain Diagnosis]

[Explain Lab Results]

[Drug Interactions]

[Differential Diagnosis]

[Generate SOAP]

[Patient Education]

[Latest Guideline]

[Summarize Visit]

```

This reduces typing and improves discoverability.

---

# Right Panel — AI Insights

Not conversation.

Supporting information.

---

## Evidence

```text
Evidence

ESC ACS Guideline

★★★★★

ACC/AHA

★★★★★

PubMed

2 Articles

```

---

## Similar Cases

```text
Similar Patients

Case #1045

92% Similar

Recovered

--------------------

Case #2201

89%

PCI Performed
```

---

## Conversation Context

```text
Context

Patient

Diagnosis

Labs

Imaging

Medication

History

```

This reassures clinicians about what the AI is using.

---

## AI Memory

Instead of repeating questions.

```text
Conversation Summary

Discussed

Diagnosis

Treatment

Drug Interaction

Pending

Discharge Summary
```

---

# Input Area

Instead of only a textbox.

```text
________________________________________________

Ask a clinical question...

📎

🎤

🖼

+

Send

```

Buttons:

Attachment

Voice

Medical image

Insert lab result

Insert guideline

---

# AI Skills Menu

Instead of typing everything.

```text
Clinical Skills

Diagnosis Review

Treatment Review

Drug Safety

Guideline Search

Lab Interpretation

Radiology Interpretation

Clinical Documentation

Patient Education

Differential Diagnosis

```

Choosing a skill preloads the appropriate prompt.

---

# Slash Commands

Like VS Code.

Typing:

```text
/
```

Shows:

```text
/diagnosis

/treatment

/guideline

/pubmed

/drug

/allergy

/labs

/soap

/discharge

/referral
```

---

# Mention Context

Typing:

```text
@
```

Shows:

```text
@Lab Results

@Chest X-Ray

@History

@Medication

@Diagnosis

```

Then:

```text
Explain @Chest X-Ray
```

---

# AI Response Toolbar

Every response should have actions.

```text
Copy

Regenerate

Save

Create Report

Add to Notes

Export

```

---

# Integrated Document Generation

Instead of another page.

Example:

```text
AI

Would you like to generate:

SOAP Note

Referral

Discharge Summary

Prescription

```

One click.

---

# Knowledge Search

Instead of another page.

Search inside chat.

```text
Doctor

Latest guideline for NSTEMI

AI

Summary

...

Supporting Sources

ESC 2025

PubMed

NICE
```

---

# Image Discussion

Doctor uploads X-ray.

```text
Image Uploaded

Chest X-Ray

----------------------------------

AI Findings

Possible right lower lobe opacity

Confidence

87%

----------------------------------

Explain

Generate Radiology Report

Compare Previous

```

---

# Lab Interpretation

```text
Doctor

Interpret latest CBC

AI

Abnormal

WBC

12.8

Likely infection

Hemoglobin

Normal

Platelets

Normal

Clinical significance

...
```

---

# Conversation Timeline

Instead of endless chat.

```text
Today

09:20

Diagnosis Discussion

10:10

Treatment Planning

10:30

Medication Review

11:00

SOAP Generated

```

---

# Bottom Quick Actions

```text
Generate SOAP

Generate Referral

Generate Prescription

Generate Summary

Generate Patient Instructions

```

---

# Floating Clinical Assistant

Instead of opening a separate page.

Every module could have:

```text
AI Assistant

Need help?

```

Click:

```text
Diagnosis Context Loaded

Treatment Context Loaded

Ready

```

---

# Component Structure

```text
MedicalChatPage

├── ChatHeader

├── PatientContextSidebar

├── ConversationPanel

├── PromptSuggestions

├── AIMessage

├── UserMessage

├── EvidenceCard

├── SimilarCasesCard

├── GuidelineCard

├── AIInsightPanel

├── SkillMenu

├── ChatComposer

├── GeneratedDocumentsPanel

└── ConversationTimeline
```

---

# Workflow

```text
Doctor opens patient
        │
        ▼
Patient context auto-loaded
        │
        ▼
Doctor asks a question
        │
        ▼
AI identifies intent
        │
        ├── Diagnosis reasoning
        ├── RAG guideline search
        ├── Drug safety
        ├── Vision analysis
        ├── Lab interpretation
        └── Documentation
        │
        ▼
Structured AI response
        │
        ▼
Doctor can:
  • Save to notes
  • Generate report
  • Create orders
  • Continue discussion
```

## Additional UX recommendations

Rather than having **one generic Medical Chat**, consider organizing it into **conversation modes** using tabs or a mode selector:

| Mode                    | Purpose                                                    | Context Loaded                   |
| ----------------------- | ---------------------------------------------------------- | -------------------------------- |
| **Clinical Discussion** | Ask diagnostic and treatment questions                     | Entire patient record            |
| **Guideline Search**    | Search WHO, NICE, CDC, PubMed, hospital protocols          | RAG only                         |
| **Case Review**         | Explore differential diagnoses and "what-if" scenarios     | Patient + AI diagnosis           |
| **Documentation**       | Generate SOAP notes, discharge summaries, referral letters | Patient + encounter              |
| **Patient Education**   | Produce clinician-reviewed patient-friendly explanations   | Approved diagnosis and treatment |

This approach prevents a single chat from becoming cluttered with unrelated topics and makes the AI feel like a **clinical copilot** with specialized capabilities rather than a general-purpose chatbot.
