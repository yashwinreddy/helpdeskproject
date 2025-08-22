import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { insertArticleSchema, type InsertArticle, type Article } from '@shared/schema';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const articleFormSchema = insertArticleSchema.extend({
  tagsString: z.string(),
});

type ArticleFormData = z.infer<typeof articleFormSchema>;

interface ArticleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: Article | null;
}

export function ArticleForm({ open, onOpenChange, article }: ArticleFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      title: '',
      body: '',
      status: 'draft',
      tags: [],
      tagsString: '',
    },
  });

  // Reset form when article changes
  useEffect(() => {
    if (article) {
      form.reset({
        title: article.title,
        body: article.body,
        status: article.status,
        tags: article.tags,
        tagsString: article.tags.join(', '),
      });
    } else {
      form.reset({
        title: '',
        body: '',
        status: 'draft',
        tags: [],
        tagsString: '',
      });
    }
  }, [article, form]);

  const createArticleMutation = useMutation({
    mutationFn: async (data: ArticleFormData) => {
      const { tagsString, ...articleData } = data;
      const tags = tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
      const finalData: InsertArticle = { ...articleData, tags };
      
      if (article) {
        return api.updateArticle(article.id, finalData);
      } else {
        return api.createArticle(finalData);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: `Article ${article ? 'updated' : 'created'} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/kb'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${article ? 'update' : 'create'} article`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ArticleFormData) => {
    createArticleMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-article-form">
        <DialogHeader>
          <DialogTitle>
            {article ? 'Edit Article' : 'Create New Article'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Article title"
                      {...field}
                      data-testid="input-article-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Article content and instructions"
                      rows={8}
                      className="resize-y min-h-[200px]"
                      {...field}
                      data-testid="textarea-article-body"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tagsString"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="billing, payments, refunds"
                        {...field}
                        data-testid="input-article-tags"
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-gray-500">Comma-separated tags</p>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-article-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createArticleMutation.isPending}
                data-testid="button-submit"
              >
                {createArticleMutation.isPending ? 
                  (article ? "Updating..." : "Creating...") : 
                  (article ? "Update Article" : "Create Article")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
