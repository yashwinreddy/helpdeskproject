import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArticleCard } from '@/components/kb/article-card';
import { ArticleForm } from '@/components/kb/article-form';
import { Plus, Search } from 'lucide-react';
import type { Article } from '@shared/schema';

export default function KnowledgeBase() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [articleFormOpen, setArticleFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (searchQuery) queryParams.append('query', searchQuery);
  if (statusFilter) queryParams.append('status', statusFilter);
  
  const queryKey = [`/api/kb${queryParams.toString() ? `?${queryParams.toString()}` : ''}`];

  const { data: articles, isLoading } = useQuery({
    queryKey,
  });

  const articlesData = articles as Article[] || [];
  const canManage = user?.role === 'admin';

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setArticleFormOpen(true);
  };

  const handleCreateNew = () => {
    setEditingArticle(null);
    setArticleFormOpen(true);
  };

  const handleCloseForm = () => {
    setArticleFormOpen(false);
    setEditingArticle(null);
  };

  return (
    <div className="p-6" data-testid="page-knowledge-base">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" data-testid="text-page-title">Knowledge Base</h2>
          <p className="text-gray-600" data-testid="text-page-description">Manage articles for AI triage system</p>
        </div>
        {canManage && (
          <Button 
            onClick={handleCreateNew}
            className="bg-primary hover:bg-primary/90"
            data-testid="button-add-article"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Article
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card className="mb-6" data-testid="card-search-filters">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-articles"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-300 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : articlesData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-articles">
          {articlesData.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onEdit={canManage ? handleEditArticle : () => {}}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid="text-no-articles-title">
                No articles found
              </h3>
              <p className="text-gray-600 mb-4" data-testid="text-no-articles-description">
                {searchQuery || statusFilter 
                  ? "Try adjusting your search criteria or filters"
                  : "Get started by creating your first knowledge base article"
                }
              </p>
              {canManage && !searchQuery && !statusFilter && (
                <Button onClick={handleCreateNew} data-testid="button-create-first-article">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Article
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {canManage && (
        <ArticleForm
          open={articleFormOpen}
          onOpenChange={handleCloseForm}
          article={editingArticle}
        />
      )}
    </div>
  );
}
