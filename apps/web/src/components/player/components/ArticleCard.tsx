import type { Article } from "@nofus/shared";

interface ArticleCardProps {
  article: Article;
  onSelect: (articleId: string) => void;
  isSelected?: boolean;
  disabled?: boolean;
}

export default function ArticleCard({
  article,
  onSelect,
  isSelected = false,
  disabled = false
}: ArticleCardProps) {
  return (
    <div
      className={`bg-gray-700 rounded-lg p-4 border ${
        isSelected ? 'border-green-500' : 'border-gray-600'
      }`}
    >
      <h3 className="text-white font-semibold mb-2">
        {article.title}
      </h3>
      <p className="text-gray-300 text-sm mb-3 line-clamp-3">
        {article.extract}
      </p>
      <button
        onClick={() => onSelect(article.id)}
        disabled={disabled || isSelected}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        {isSelected ? 'Selected' : 'Choose This Article'}
      </button>
    </div>
  );
}
