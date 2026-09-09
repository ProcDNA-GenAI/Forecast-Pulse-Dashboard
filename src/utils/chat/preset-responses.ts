export type PresetChatResponse = {
  question: string;
  answer: string;
  sourceLabel: "InsightSphere";
};

export const PRESET_RESPONSE_DELAY_MS = 5000;

export const PRESET_CHAT_RESPONSES: readonly PresetChatResponse[] = [
  {
    question: "What could these signals mean for Obicetrapib’s launch assumptions?",
    answer:
      "**Overall, the launch assumptions are broadly holding, but two areas warrant closer monitoring.** Market growth is running above plan at **2.1% vs. 1.58%**, while patients are escalating to advanced therapy faster at **7.3 vs. 8.4 months**. If these trends persist, they could increase the launch-ready patient pool for Obicetrapib and support an upside scenario, while diagnosis, treatment and compliance assumptions remain broadly stable.",
    sourceLabel: "InsightSphere",
  },
  {
    question:
      "What are the early signals form Lipfendra launch that our team should consider while revaluating Obi forecast?",
    answer: [
      "- **Uptake is slightly ahead of plan:** Lipfendra reached **10.4% NPS share vs. 10.0% forecast** by Dec’26, suggesting oral advanced-LLT adoption may be somewhat faster than assumed.",
      "- **Escalation is happening earlier:** Median time to escalation declined from roughly **8.5 to 7.6 months**, which could support a larger launch-ready patient pool for Obi.",
      "- **Most growth is still switch-driven:** About **85% of Lipfendra starts come from other advanced therapies**, so competitive conversion remains the primary source of business today.",
      "- **There are early signs of category expansion:** Newly intensified patients are increasing over time, reaching roughly **16% of starts by Dec’26**, suggesting some patients may be moving into advanced therapy earlier.",
      "- **Prescriber adoption is broadening:** Active Lipfendra writers increased from about **1,200 to 2,950**, while concentration among the top writers declined — indicating adoption is spreading beyond the initial high-volume prescribers.",
      "",
      "**Overall:** Lipfendra provides early evidence of **faster oral adoption, earlier treatment escalation and a gradually broadening market**, while remaining predominantly switch-driven. These are the signals NAP should continue monitoring when reassessing Obi’s **uptake, escalation and addressable-patient assumptions**.",
    ].join("\n"),
    sourceLabel: "InsightSphere",
  },
];

export function normalizePresetQuestion(question: string): string {
  return question.trim().replace(/\s+/g, " ");
}

export function findPresetChatResponse(question: string): PresetChatResponse | undefined {
  const normalizedQuestion = normalizePresetQuestion(question);
  return PRESET_CHAT_RESPONSES.find(
    (preset) => normalizePresetQuestion(preset.question) === normalizedQuestion,
  );
}
