import type { Article } from "@nofus/shared";
import ArticleCard from "./ArticleCard";

interface ArticleListProps {
  articles: Article[];
  onSelectArticle: (articleId: string) => void;
}

export default function ArticleList({ articles, onSelectArticle }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Loading articles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          onSelect={onSelectArticle}
        />
      ))}
    </div>
  );
}
