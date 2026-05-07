interface SubmissionConfirmProps {
  message: string;
  subtext?: string;
}

export default function SubmissionConfirm({ message, subtext }: SubmissionConfirmProps) {
  return (
    <div className="text-center py-8">
      <div className="text-green-400 text-5xl mb-4">✓</div>
      <p className="text-gray-300 text-lg">{message}</p>
      {subtext && (
        <p className="text-gray-400 text-sm mt-2">{subtext}</p>
      )}
    </div>
  );
}
