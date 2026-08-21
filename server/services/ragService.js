import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { CohereRerank } from "@langchain/cohere";

import {
  GOOGLE_API_KEY,
  COHERE_API_KEY,
  QDRANT_CONFIG,
  CANDIDATE_COUNT,
  MAX_SOURCES,
  RELEVANCE_THRESHOLD
} from "../config.js";

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-2",
  apiKey: GOOGLE_API_KEY,
});

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-3.5-flash-lite",
  temperature: 0,
  apiKey: GOOGLE_API_KEY,
});

const reranker = new CohereRerank({
  apiKey: COHERE_API_KEY,
  model: "rerank-v4.0-fast",
  topN: CANDIDATE_COUNT,
});

export async function retrieveAndRerank(userQuery) {
  try {
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      QDRANT_CONFIG,
    );

    const retriever = vectorStore.asRetriever({
      k: CANDIDATE_COUNT,
    });

    const candidates = await retriever.invoke(userQuery);

    console.log(`[RAG] Qdrant retrieved ${candidates.length} candidates.`);

    const seenContent = new Set();
    const uniqueCandidates = [];

    for (const doc of candidates) {
      const key = doc.pageContent?.trim();

      if (!key || seenContent.has(key)) {
        continue;
      }

      seenContent.add(key);
      uniqueCandidates.push(doc);
    }

    console.log(
      `[RAG] After deduplication: ${uniqueCandidates.length} candidates.`,
    );

    const rerankedDocuments = await reranker.compressDocuments(
      uniqueCandidates,
      userQuery,
    );

    console.log(`[RAG] Cohere reranked ${uniqueCandidates.length} candidates.`);

    const result = rerankedDocuments
      .filter(
        (doc) =>
          doc.metadata?.relevanceScore >=
          RELEVANCE_THRESHOLD,
      )
      .slice(0, MAX_SOURCES);

    console.log(`[RAG] Using ${result.length} documents as final context.`);

    result.forEach((doc, index) => {
      console.log(
        `[RAG] Source ${index + 1}: ${doc.metadata?.source ?? "unknown"}`,
      );
    });

    return result;
  } catch (error) {
    console.error(`[RAG] Retrieval/reranking failed:`, error);

    throw new Error(`RAG retrieval failed: ${error.message}`, {
      cause: error,
    });
  }
}

export async function generateAnswer({
  userQuery,
  documents,
  fileName,
  lastAnswer,
}) {
  try {
    const contextText = documents.map((doc) => doc.pageContent).join("\n\n");

    const SYSTEM_PROMPT = `You are a helpful assistant for a PDF question-answering system.

The user is currently asking about this uploaded file:
${fileName || "No specific file was provided."}

The previous answer in this conversation was:
${lastAnswer || "There is no previous answer. This is the first question."}

Use the retrieved context below to answer the user's current question.

Important rules:
- Answer based on the retrieved context.
- If the context does not contain the answer, say so plainly instead of guessing.
- You may use the previous answer to understand conversational context, but do not blindly repeat it.
- If the user asks a follow-up question, connect it to the previous answer when appropriate.
- Reply in plain prose, using normal sentences and short paragraphs.
- Do not use Markdown syntax of any kind.
- Do not use bullet points or numbered lists.
- Do not use headings.
- If you need to present related items, write them in a normal sentence separated by commas.

Current question:
${userQuery}

Retrieved context:
${contextText}`;

    const chatResult = await llm.invoke([
      ["system", SYSTEM_PROMPT],
      ["human", userQuery],
    ]);

    return chatResult.content;
  } catch (error) {
    console.error(`[RAG] LLM generation failed:`, error);

    throw new Error(`Answer generation failed: ${error.message}`, {
      cause: error,
    });
  }
}

export async function answerQuestion({ userQuery, fileName, lastAnswer }) {
  const documents = await retrieveAndRerank(userQuery);

  const answer = await generateAnswer({
    userQuery,
    documents,
    fileName,
    lastAnswer,
  });

  console.log("\n[CHAT] Final Answer:");
  console.log(answer);

  return {
    answer,
    documents,
  };
}
