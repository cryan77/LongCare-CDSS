export type ChatMode =
  | 'clinical'
  | 'guideline'
  | 'case'
  | 'documentation'
  | 'education';

export const CHAT_MODES: { id: ChatMode; label: string; hint: string }[] = [
  { id: 'clinical', label: 'Clinical Discussion', hint: 'Diagnosis & treatment questions with full chart context' },
  { id: 'guideline', label: 'Guideline Search', hint: 'WHO, NICE, CDC, PubMed, hospital protocols' },
  { id: 'case', label: 'Case Review', hint: 'Differentials and what-if scenarios' },
  { id: 'documentation', label: 'Documentation', hint: 'SOAP, discharge, referral drafts' },
  { id: 'education', label: 'Patient Education', hint: 'Clinician-reviewed plain-language explanations' },
];

export const PROMPT_CHIPS: { label: string; prompt: string; modes?: ChatMode[] }[] = [
  { label: 'Explain Diagnosis', prompt: 'Explain the leading diagnosis and why alternatives are less likely.' },
  { label: 'Explain Lab Results', prompt: 'Interpret the latest laboratory results for this patient and clinical significance.' },
  { label: 'Drug Interactions', prompt: 'Check drug interactions and allergy safety for current and proposed medications.' },
  { label: 'Differential Diagnosis', prompt: 'Review the differential diagnosis and what would change the ranking.' },
  { label: 'Generate SOAP', prompt: 'Draft a SOAP note for the current encounter.', modes: ['documentation', 'clinical'] },
  { label: 'Patient Education', prompt: 'Write clinician-reviewed patient education for the working diagnosis.', modes: ['education', 'clinical'] },
  { label: 'Latest Guideline', prompt: 'What do the latest guidelines recommend for this diagnosis?', modes: ['guideline', 'clinical'] },
  { label: 'Summarize Visit', prompt: 'Summarize this visit: key findings, assessment, and plan.' },
];

export const NURSE_CHIPS: { label: string; prompt: string }[] = [
  { label: 'Vitals Alert?', prompt: 'Based on current vitals, should I notify the physician?' },
  { label: 'SpO₂ Guidance', prompt: 'What oxygen saturation thresholds require escalation?' },
  { label: 'Med Timing', prompt: 'Remind me about medication administration timing for this patient.' },
  { label: 'When to Escalate', prompt: 'When should I escalate clinical concerns to the attending?' },
];

export const CLINICAL_SKILLS: { label: string; prompt: string }[] = [
  { label: 'Diagnosis Review', prompt: 'Review the AI diagnosis: confidence, key evidence, and open questions.' },
  { label: 'Treatment Review', prompt: 'Review recommended treatment options and safety considerations.' },
  { label: 'Drug Safety', prompt: 'Run a drug safety check: allergies, interactions, renal/hepatic dosing.' },
  { label: 'Guideline Search', prompt: 'Search current guidelines relevant to this case and summarize recommendations.' },
  { label: 'Lab Interpretation', prompt: 'Interpret latest labs in clinical context.' },
  { label: 'Radiology Interpretation', prompt: 'Discuss chest imaging findings relevant to this encounter.' },
  { label: 'Clinical Documentation', prompt: 'Draft documentation for this encounter (SOAP structure).' },
  { label: 'Patient Education', prompt: 'Generate patient-friendly education for approved diagnosis and plan.' },
  { label: 'Differential Diagnosis', prompt: 'Expand the differential and what findings would rule each in or out.' },
];

export const SLASH_COMMANDS: { cmd: string; prompt: string }[] = [
  { cmd: '/diagnosis', prompt: 'Explain the leading diagnosis and supporting evidence.' },
  { cmd: '/treatment', prompt: 'What treatment options are recommended next?' },
  { cmd: '/guideline', prompt: 'Cite the latest guideline recommendations for this diagnosis.' },
  { cmd: '/pubmed', prompt: 'Summarize recent high-quality evidence relevant to this case.' },
  { cmd: '/drug', prompt: 'Check medication safety and interactions for this patient.' },
  { cmd: '/allergy', prompt: 'Review allergy alerts against proposed therapy.' },
  { cmd: '/labs', prompt: 'Interpret the latest laboratory panel.' },
  { cmd: '/soap', prompt: 'Generate a SOAP note for this encounter.' },
  { cmd: '/discharge', prompt: 'Draft a discharge summary outline.' },
  { cmd: '/referral', prompt: 'Draft a referral letter with clinical indication.' },
];

export const MENTION_TOKENS: { token: string; insert: string }[] = [
  { token: '@Lab Results', insert: '@Lab Results' },
  { token: '@Chest X-Ray', insert: '@Chest X-Ray' },
  { token: '@History', insert: '@History' },
  { token: '@Medication', insert: '@Medication' },
  { token: '@Diagnosis', insert: '@Diagnosis' },
];

export type StructuredReply = {
  summary?: string;
  reasoning: string[];
  evidence: string[];
  confidence?: string;
  nextQuestion?: string;
  raw: string;
};

/** Best-effort structure for AI replies so messages are scannable, not walls of text. */
export function structureReply(
  content: string,
  citations?: { source: string; excerpt?: string }[],
): StructuredReply {
  const lines = content
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const bullets = lines.filter((l) => /^[-•*✓✔]/.test(l) || /^\d+\./.test(l));
  const reasoning =
    bullets.length > 0
      ? bullets.map((b) => b.replace(/^[-•*✓✔]\s*/, '').replace(/^\d+\.\s*/, ''))
      : lines.slice(1, 5);

  const evidence =
    citations?.map((c) => c.source).filter(Boolean) ||
    lines.filter((l) => /guideline|esc|acc|aha|nice|who|pubmed|cdc/i.test(l)).slice(0, 4);

  const confMatch = content.match(/confidence[:\s]+(\d+%|high|medium|low)/i);
  const summary = lines[0] || content.slice(0, 180);

  return {
    summary,
    reasoning: reasoning.slice(0, 6),
    evidence: evidence.slice(0, 5),
    confidence: confMatch ? confMatch[1] : citations?.length ? 'Evidence-informed' : undefined,
    nextQuestion: suggestNext(content),
    raw: content,
  };
}

function suggestNext(content: string): string {
  const c = content.toLowerCase();
  if (c.includes('diagnos')) return 'What treatment options are recommended?';
  if (c.includes('treatment') || c.includes('medication')) return 'Are there drug interactions I should watch for?';
  if (c.includes('lab') || c.includes('troponin')) return 'How do these labs change the differential?';
  if (c.includes('guideline')) return 'How should this guideline be applied to this patient?';
  return 'Can you summarize this case for documentation?';
}

export function modePrefix(mode: ChatMode, message: string): string {
  const prefixes: Record<ChatMode, string> = {
    clinical: '',
    guideline: '[Guideline search] ',
    case: '[Case review / differential] ',
    documentation: '[Documentation] ',
    education: '[Patient education — clinician review required] ',
  };
  if (message.startsWith('[') || message.startsWith('/')) return message;
  return `${prefixes[mode]}${message}`;
}

export type TimelineEvent = { time: string; label: string };

export function buildTimeline(topics: string[]): TimelineEvent[] {
  const now = new Date();
  const fmt = (minsAgo: number) => {
    const d = new Date(now.getTime() - minsAgo * 60_000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  if (!topics.length) {
    return [{ time: fmt(0), label: 'Session started — awaiting clinical question' }];
  }
  return topics.map((label, i) => ({
    time: fmt((topics.length - i) * 12),
    label,
  }));
}

export function inferTopic(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('soap') || m.includes('document')) return 'SOAP / Documentation';
  if (m.includes('treatment') || m.includes('medication') || m.includes('drug')) return 'Treatment / Medication Review';
  if (m.includes('lab')) return 'Lab Interpretation';
  if (m.includes('guideline') || m.includes('pubmed')) return 'Guideline Search';
  if (m.includes('differential') || m.includes('diagnos')) return 'Diagnosis Discussion';
  if (m.includes('educat') || m.includes('patient-friendly')) return 'Patient Education';
  if (m.includes('x-ray') || m.includes('imaging') || m.includes('radiolog')) return 'Imaging Discussion';
  return 'Clinical Discussion';
}

export const SIMILAR_CASES = [
  { id: '1045', similarity: 92, outcome: 'Recovered' },
  { id: '2201', similarity: 89, outcome: 'PCI Performed' },
  { id: '3318', similarity: 84, outcome: 'Medical management' },
];
