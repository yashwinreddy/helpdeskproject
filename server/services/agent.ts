import { storage } from "../storage";
import { llmProvider } from "./llm";
import { createAuditLog } from "../utils/audit";
import type { Ticket } from "@shared/schema";
import { randomUUID } from "crypto";

export async function triageTicket(ticketId: string): Promise<void> {
  const traceId = randomUUID();
  
  try {
    // Get ticket details
    const ticket = await storage.getTicket(ticketId);
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    
    // Log triage start
    await createAuditLog({
      ticketId,
      traceId,
      actor: "system",
      action: "TRIAGE_STARTED",
      meta: { ticketId },
    });
    
    // Step 1: Classify the ticket
    const startClassify = Date.now();
    const classificationResult = await llmProvider.classify(`${ticket.title} ${ticket.description}`);
    const classifyLatency = Date.now() - startClassify;
    
    await createAuditLog({
      ticketId,
      traceId,
      actor: "system",
      action: "AGENT_CLASSIFIED",
      meta: {
        predictedCategory: classificationResult.predictedCategory,
        confidence: classificationResult.confidence,
        latencyMs: classifyLatency,
      },
    });
    
    // Step 2: Retrieve relevant KB articles
    const startRetrieval = Date.now();
    const searchQuery = `${ticket.title} ${ticket.description}`;
    const kbArticles = await storage.searchKB(searchQuery);
    const retrievalLatency = Date.now() - startRetrieval;
    
    // Filter and score articles (simple relevance based on keyword matching)
    const scoredArticles = kbArticles
      .slice(0, 5) // Limit to top 5 for performance
      .map(article => ({
        ...article,
        relevanceScore: calculateRelevanceScore(searchQuery, article.title + " " + article.body),
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3); // Top 3 most relevant
    
    await createAuditLog({
      ticketId,
      traceId,
      actor: "system",
      action: "KB_RETRIEVED",
      meta: {
        articlesFound: scoredArticles.length,
        articleIds: scoredArticles.map(a => a.id),
        latencyMs: retrievalLatency,
      },
    });
    
    // Step 3: Draft reply
    const startDraft = Date.now();
    const draftResult = await llmProvider.draft(
      `${ticket.title} ${ticket.description}`,
      scoredArticles.map(a => ({ id: a.id, title: a.title, body: a.body }))
    );
    const draftLatency = Date.now() - startDraft;
    
    await createAuditLog({
      ticketId,
      traceId,
      actor: "system",
      action: "DRAFT_GENERATED",
      meta: {
        draftLength: draftResult.draftReply.length,
        citationsCount: draftResult.citations.length,
        latencyMs: draftLatency,
      },
    });
    
    // Step 4: Create agent suggestion
    const modelInfo = {
      provider: "stub",
      model: "deterministic-v1.0", 
      promptVersion: "1.0",
      latencyMs: classifyLatency + retrievalLatency + draftLatency,
    };
    
    const agentSuggestion = await storage.createAgentSuggestion({
      ticketId,
      predictedCategory: classificationResult.predictedCategory,
      articleIds: draftResult.citations,
      draftReply: draftResult.draftReply,
      confidence: classificationResult.confidence,
      autoClosed: false,
      modelInfo,
    });
    
    // Step 5: Decision making
    const config = await storage.getConfig();
    const shouldAutoClose = config.autoCloseEnabled && 
                          classificationResult.confidence >= config.confidenceThreshold;
    
    if (shouldAutoClose) {
      // Auto-close the ticket
      await storage.updateTicket(ticketId, {
        status: "resolved",
        agentSuggestionId: agentSuggestion.id,
        category: classificationResult.predictedCategory,
      });
      
      // Create the agent reply
      await storage.createTicketReply({
        ticketId,
        authorId: null,
        authorType: "system",
        content: draftResult.draftReply,
      });
      
      // Update agent suggestion to mark as auto-closed
      await storage.createAgentSuggestion({
        ticketId: agentSuggestion.ticketId,
        predictedCategory: agentSuggestion.predictedCategory,
        articleIds: agentSuggestion.articleIds,
        draftReply: agentSuggestion.draftReply,
        confidence: agentSuggestion.confidence,
        modelInfo: agentSuggestion.modelInfo as any,
        autoClosed: true,
      });
      
      await createAuditLog({
        ticketId,
        traceId,
        actor: "system",
        action: "AUTO_CLOSED",
        meta: {
          confidence: classificationResult.confidence,
          threshold: config.confidenceThreshold,
          agentSuggestionId: agentSuggestion.id,
        },
      });
    } else {
      // Assign to human agent
      await storage.updateTicket(ticketId, {
        status: "waiting_human",
        agentSuggestionId: agentSuggestion.id,
        category: classificationResult.predictedCategory,
      });
      
      await createAuditLog({
        ticketId,
        traceId,
        actor: "system",
        action: "ASSIGNED_TO_HUMAN",
        meta: {
          confidence: classificationResult.confidence,
          threshold: config.confidenceThreshold,
          reason: "confidence_below_threshold",
        },
      });
    }
    
    await createAuditLog({
      ticketId,
      traceId,
      actor: "system",
      action: "TRIAGE_COMPLETED",
      meta: {
        totalLatencyMs: Date.now() - startClassify,
        autoResolved: shouldAutoClose,
      },
    });
    
  } catch (error) {
    await createAuditLog({
      ticketId,
      traceId,
      actor: "system",
      action: "TRIAGE_ERROR",
      meta: {
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}

function calculateRelevanceScore(query: string, content: string): number {
  const queryWords = query.toLowerCase().split(/\s+/);
  const contentWords = content.toLowerCase().split(/\s+/);
  
  let matches = 0;
  for (const queryWord of queryWords) {
    if (queryWord.length < 3) continue; // Skip short words
    
    for (const contentWord of contentWords) {
      if (contentWord.includes(queryWord) || queryWord.includes(contentWord)) {
        matches++;
        break;
      }
    }
  }
  
  // Score based on match ratio and content length
  const matchRatio = matches / queryWords.length;
  const lengthBonus = Math.min(contentWords.length / 100, 1); // Bonus for longer articles
  
  return matchRatio * 0.8 + lengthBonus * 0.2;
}
