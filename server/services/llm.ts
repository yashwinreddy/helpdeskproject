export interface ClassificationResult {
  predictedCategory: "billing" | "tech" | "shipping" | "other";
  confidence: number;
}

export interface DraftResult {
  draftReply: string;
  citations: string[];
}

export interface ModelInfo {
  provider: string;
  model: string;
  promptVersion: string;
  latencyMs: number;
}

export interface LLMProvider {
  classify(text: string): Promise<ClassificationResult>;
  draft(text: string, articles: Array<{id: string; title: string; body: string}>): Promise<DraftResult>;
}

export class StubLLMProvider implements LLMProvider {
  async classify(text: string): Promise<ClassificationResult> {
    const startTime = Date.now();
    
    const lowerText = text.toLowerCase();
    
    // Simple keyword-based classification
    let category: "billing" | "tech" | "shipping" | "other" = "other";
    let confidence = 0.5; // Base confidence
    
    // Billing keywords
    const billingKeywords = ["refund", "invoice", "payment", "charge", "billing", "credit card", "subscription"];
    const billingMatches = billingKeywords.filter(keyword => lowerText.includes(keyword)).length;
    
    // Technical keywords
    const techKeywords = ["error", "bug", "crash", "500", "login", "password", "technical", "api", "website"];
    const techMatches = techKeywords.filter(keyword => lowerText.includes(keyword)).length;
    
    // Shipping keywords
    const shippingKeywords = ["delivery", "shipping", "package", "tracking", "shipment", "delayed", "lost"];
    const shippingMatches = shippingKeywords.filter(keyword => lowerText.includes(keyword)).length;
    
    // Determine category based on matches
    const maxMatches = Math.max(billingMatches, techMatches, shippingMatches);
    
    if (maxMatches > 0) {
      if (billingMatches === maxMatches) {
        category = "billing";
        confidence = 0.6 + (billingMatches * 0.1);
      } else if (techMatches === maxMatches) {
        category = "tech";
        confidence = 0.6 + (techMatches * 0.1);
      } else if (shippingMatches === maxMatches) {
        category = "shipping";
        confidence = 0.6 + (shippingMatches * 0.1);
      }
    }
    
    // Cap confidence at 0.95
    confidence = Math.min(confidence, 0.95);
    
    // Add some randomness but keep it deterministic based on text length
    const textBasedRandom = (text.length % 20) / 100;
    confidence += textBasedRandom;
    confidence = Math.min(confidence, 0.95);
    
    return {
      predictedCategory: category,
      confidence: parseFloat(confidence.toFixed(2)),
    };
  }
  
  async draft(text: string, articles: Array<{id: string; title: string; body: string}>): Promise<DraftResult> {
    const startTime = Date.now();
    
    if (articles.length === 0) {
      return {
        draftReply: "Thank you for contacting our support team. We've received your request and will look into it shortly. If you have any urgent concerns, please don't hesitate to reach out.",
        citations: [],
      };
    }
    
    // Generate a response based on the category and articles
    const lowerText = text.toLowerCase();
    let draftReply = "";
    const citations: string[] = [];
    
    if (lowerText.includes("refund") || lowerText.includes("charge")) {
      draftReply = "Hello! I understand you're having a billing issue. I've reviewed your account and can help resolve this matter. ";
      
      // Find billing-related articles
      const billingArticles = articles.filter(a => 
        a.title.toLowerCase().includes("payment") || 
        a.title.toLowerCase().includes("billing") ||
        a.body.toLowerCase().includes("refund")
      );
      
      if (billingArticles.length > 0) {
        draftReply += "I've processed the necessary changes to address your concern. You should see the updates reflected in your account within 3-5 business days.";
        citations.push(...billingArticles.slice(0, 2).map(a => a.id));
      }
    } else if (lowerText.includes("error") || lowerText.includes("500") || lowerText.includes("login")) {
      draftReply = "I understand you're experiencing a technical issue. Let me help you resolve this problem. ";
      
      const techArticles = articles.filter(a => 
        a.title.toLowerCase().includes("error") || 
        a.title.toLowerCase().includes("troubleshooting") ||
        a.body.toLowerCase().includes("technical")
      );
      
      if (techArticles.length > 0) {
        draftReply += "Please try the following troubleshooting steps: clear your browser cache, try a different browser, or check our status page. If the issue persists, our technical team will investigate further.";
        citations.push(...techArticles.slice(0, 2).map(a => a.id));
      }
    } else if (lowerText.includes("shipping") || lowerText.includes("package") || lowerText.includes("delivery")) {
      draftReply = "Thank you for reaching out about your shipment. I can help you track your package and provide updates on delivery status. ";
      
      const shippingArticles = articles.filter(a => 
        a.title.toLowerCase().includes("shipping") || 
        a.title.toLowerCase().includes("tracking") ||
        a.body.toLowerCase().includes("delivery")
      );
      
      if (shippingArticles.length > 0) {
        draftReply += "I've checked your tracking information and will provide you with the most current status. If there are any delays, I'll ensure you receive regular updates.";
        citations.push(...shippingArticles.slice(0, 2).map(a => a.id));
      }
    } else {
      draftReply = "Thank you for contacting our support team. I've reviewed your request and am ready to assist you with your inquiry. ";
      // Use first available articles as general references
      if (articles.length > 0) {
        citations.push(...articles.slice(0, 2).map(a => a.id));
        draftReply += "Please refer to our knowledge base articles below for additional information that may be helpful.";
      }
    }
    
    if (citations.length > 0) {
      draftReply += "\n\nFor more information, please refer to our knowledge base articles that I've included as references.";
    }
    
    return {
      draftReply,
      citations,
    };
  }
  
  getModelInfo(latencyMs: number): ModelInfo {
    return {
      provider: "stub",
      model: "deterministic-v1.0",
      promptVersion: "1.0",
      latencyMs,
    };
  }
}

// Export singleton instance
export const llmProvider = new StubLLMProvider();
