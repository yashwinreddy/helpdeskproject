import { storage } from "../storage";
import type { Article } from "@shared/schema";

export async function searchArticles(query: string, limit: number = 10): Promise<Article[]> {
  if (!query.trim()) {
    return storage.getArticles(undefined, "published");
  }
  
  const articles = await storage.searchKB(query);
  return articles.slice(0, limit);
}

export function extractKeywords(text: string): string[] {
  // Simple keyword extraction
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  // Remove common stop words
  const stopWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 
    'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these',
    'those', 'are', 'was', 'were', 'been', 'have', 'has', 'had', 'will',
    'would', 'could', 'should', 'may', 'might', 'must', 'can'
  ]);
  
  return Array.from(new Set(words.filter(word => !stopWords.has(word))))
    .slice(0, 10); // Limit to 10 keywords
}
