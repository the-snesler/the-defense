import type { Article } from "@nofus/shared";
import ArticleList from "../components/ArticleList";
import RerollButton from "../components/RerollButton";
import SubmissionConfirm from "../components/SubmissionConfirm";

interface TopicSelectionPhaseProps {
  articleOptions: Article[];
  hasSubmitted: boolean;
  hasRerolled: boolean;
  onChooseArticle: (articleId: string) => void;
  onReroll: () => void;
}

export default function TopicSelectionPhase({
  articleOptions,
  hasSubmitted,
  hasRerolled,
  onChooseArticle,
  onReroll
}: TopicSelectionPhaseProps) {
  if (hasSubmitted) {
    return (
      <SubmissionConfirm
        message="Article selected!"
        subtext="Waiting for other players..."
      />
    );
  }

  // Calculate which articles to show based on reroll status
  const articlesToShow = articleOptions.slice(
    hasRerolled ? 3 : 0,
    hasRerolled ? 6 : 3
  );

  return (
    <>
      <h2 className="text-lg font-semibold text-white mb-4">
        Choose an Article
      </h2>

      {articlesToShow.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">Loading articles...</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <ArticleList
              articles={articlesToShow}
              onSelectArticle={onChooseArticle}
            />
          </div>

          <RerollButton onReroll={onReroll} disabled={hasRerolled} />
        </>
      )}
    </>
  );
}
