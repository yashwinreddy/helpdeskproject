import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { Article } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';

interface ArticleCardProps {
  article: Article;
  onEdit: (article: Article) => void;
}

export function ArticleCard({ article, onEdit }: ArticleCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteArticleMutation = useMutation({
    mutationFn: (id: string) => api.deleteArticle(id),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Article deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/kb'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete article",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      deleteArticleMutation.mutate(article.id);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`card-article-${article.id}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid={`text-article-title-${article.id}`}>
              {article.title}
            </h3>
            <p className="text-gray-600 text-sm" data-testid={`text-article-description-${article.id}`}>
              {article.body.substring(0, 150)}
              {article.body.length > 150 && '...'}
            </p>
          </div>
          <Badge 
            variant={article.status === 'published' ? 'default' : 'secondary'}
            className={article.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
            data-testid={`badge-article-status-${article.id}`}
          >
            {article.status === 'published' ? 'Published' : 'Draft'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4" data-testid={`tags-${article.id}`}>
          {article.tags.map((tag, index) => (
            <Badge 
              key={index}
              variant="outline"
              className="text-xs"
              data-testid={`badge-tag-${article.id}-${index}`}
            >
              {tag}
            </Badge>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span data-testid={`text-article-updated-${article.id}`}>
            Updated {formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true })}
          </span>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onEdit(article)}
              data-testid={`button-edit-${article.id}`}
            >
              Edit
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleDelete}
              disabled={deleteArticleMutation.isPending}
              className="text-red-600 hover:text-red-700"
              data-testid={`button-delete-${article.id}`}
            >
              {deleteArticleMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
