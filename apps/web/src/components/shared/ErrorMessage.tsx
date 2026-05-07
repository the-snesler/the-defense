interface ErrorMessageProps {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="bg-red-900 border border-red-600 rounded-lg p-4 mb-4">
      <p className="text-red-200">{message}</p>
    </div>
  );
}
