import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * AI Router for RAG-based analysis of repository documentation.
 */
export const aiRouter = router({
  chat: publicProcedure
    .input(z.object({
      messages: z.array(z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string()
      }))
    }))
    .mutation(async ({ input }) => {
      // 1. Gather repository documentation for RAG context
      const docsDir = process.cwd();
      const docFiles = [
        "README.md",
        "ARCHITECTURE.md",
        "CONTRIBUTING.md",
        "SECURITY.md",
        "CODE_OF_CONDUCT.md"
      ];

      let combinedDocs = "";
      for (const file of docFiles) {
        try {
          const content = await fs.readFile(path.join(docsDir, file), "utf-8");
          combinedDocs += `\n--- FILE: ${file} ---\n${content}\n`;
        } catch (error) {
          console.warn(`[Ask AI] Could not read ${file}:`, error);
        }
      }

      // 2. Prepare system prompt with RAG context
      const systemPrompt = `You are the Redroom AI Assistant. Your goal is to help users understand the Redroom Geopolitical Intelligence Platform using the provided repository documentation.

REDROOM DOCUMENTATION CONTEXT:
${combinedDocs}

INSTRUCTIONS:
- Use only the provided context to answer questions about the project.
- If the answer isn't in the documentation, say you don't know based on the current docs.
- Be concise and professional.
- Use Markdown for formatting.`;

      // 3. Invoke LLM with the context
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          ...input.messages
        ]
      });

      return {
        content: response.choices?.[0]?.message?.content ?? "Извините, я не смог получить ответ от ИИ."
      };
    })
});
