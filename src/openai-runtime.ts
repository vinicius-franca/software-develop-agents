import type { AgentRunRequest, AgentRunResult, AgentRuntime } from "./agent-runtime.js";

interface OpenAIResponse {
  id?: string;
  output_text?: string;
  usage?: { input_tokens?: number; output_tokens?: number };
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
}

function outputText(response: OpenAIResponse): string {
  if (response.output_text) return response.output_text;
  const text = response.output?.flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text")
    .map((content) => content.text ?? "")
    .join("");
  if (!text) throw new Error("OpenAI response did not include output text.");
  return text;
}

function artifactFor(role: AgentRunRequest["role"]): AgentRunResult["artifactName"] {
  return role === "product-owner" ? "product-brief.md" : "spec.md";
}

function buildInstructions(request: AgentRunRequest): string {
  const artifact = artifactFor(request.role);
  const context = Object.entries(request.artifacts)
    .map(([name, content]) => `## Existing artifact: ${name}\n${content}`)
    .join("\n\n");
  return [
    request.instructions,
    "Return only content suitable for the requested Markdown artifact. Do not claim validation, execute tools, or move workflow state.",
    `Task ID: ${request.task.taskId}`,
    `Task title: ${request.task.title}`,
    `Target artifact: ${artifact}`,
    context
  ].filter(Boolean).join("\n\n");
}

export class OpenAIResponsesRuntime implements AgentRuntime {
  readonly name = "openai-responses";

  constructor(
    private readonly apiKey = process.env.OPENAI_API_KEY,
    private readonly model = process.env.OPENAI_MODEL ?? "gpt-5"
  ) {}

  async run(request: AgentRunRequest): Promise<AgentRunResult> {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY is required when using the OpenAI runtime.");
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        store: false,
        input: buildInstructions(request),
        text: {
          format: {
            type: "json_schema",
            name: "agent_artifact",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["artifact_markdown"],
              properties: { artifact_markdown: { type: "string" } }
            }
          }
        }
      })
    });
    if (!response.ok) throw new Error(`OpenAI request failed (${response.status}): ${await response.text()}`);
    const payload = await response.json() as OpenAIResponse;
    const parsed = JSON.parse(outputText(payload)) as { artifact_markdown?: unknown };
    if (typeof parsed.artifact_markdown !== "string" || !parsed.artifact_markdown.trim()) {
      throw new Error("OpenAI response did not include a valid artifact_markdown value.");
    }
    return {
      artifactName: artifactFor(request.role),
      artifactMarkdown: parsed.artifact_markdown.trimEnd() + "\n",
      model: this.model,
      requestId: payload.id,
      usage: { inputTokens: payload.usage?.input_tokens, outputTokens: payload.usage?.output_tokens },
      rawOutput: parsed
    };
  }
}
