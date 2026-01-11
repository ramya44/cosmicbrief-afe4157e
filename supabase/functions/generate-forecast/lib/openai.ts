// OpenAI API call logic
// supabase/functions/generate-forecast/lib/openai.ts
import type { ForecastSections } from "../../_shared/lib/types.ts";

export function buildForecastTool() {
  return {
    name: "save_forecast",
    description: "Save the forecast sections for the reader",
    input_schema: {
      type: "object",
      properties: {
        who_you_are_right_now: { type: "string" },
        whats_happening_in_your_life: { type: "string" },
        pivotal_life_theme: { type: "string" },
        what_is_becoming_tighter_or_less_forgiving: { type: "string" },
        upgrade_hook: { type: "string" },
      },
      required: [
        "who_you_are_right_now",
        "whats_happening_in_your_life",
        "pivotal_life_theme",
        "what_is_becoming_tighter_or_less_forgiving",
        "upgrade_hook",
      ],
    },
  };
}

export async function generateForecast(args: {
  openaiApiKey: string;
  systemPrompt: string;
  userPrompt: string;
  logStep: (step: string, details?: Record<string, unknown>) => void;
}): Promise<
  | { ok: true; sections: ForecastSections; usage: unknown }
  | { ok: false; error: string; status?: number; usage?: unknown }
> {
  const { openaiApiKey, systemPrompt, userPrompt, logStep } = args;

  const forecastTool = buildForecastTool();

  const openAITool = {
    type: "function",
    function: {
      name: forecastTool.name,
      description: forecastTool.description,
      parameters: forecastTool.input_schema,
    },
  };

  const payload = {
    model: "gpt-4.1-mini",
    temperature: 0.65,
    max_tokens: 600,
    presence_penalty: 0.3,
    frequency_penalty: 0.0,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    tools: [openAITool],
    tool_choice: { type: "function", function: { name: "save_forecast" } },
  };

  // Do not log payload. Log metadata only.
  logStep("OPENAI_REQUEST", { model: payload.model, max_tokens: payload.max_tokens });

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    return { ok: false, error: errorText, status: resp.status };
  }

  const data = await resp.json();
  const usage = data.usage || null;

  const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) return { ok: false, error: "Missing tool output", usage };

  let parsed: ForecastSections;
  try {
    parsed = JSON.parse(toolCall.function.arguments);
  } catch (e) {
    return { ok: false, error: `Failed to parse tool JSON: ${e instanceof Error ? e.message : String(e)}`, usage };
  }

  if (!parsed?.who_you_are_right_now) return { ok: false, error: "Empty forecast output", usage };

  return { ok: true, sections: parsed, usage };
}
