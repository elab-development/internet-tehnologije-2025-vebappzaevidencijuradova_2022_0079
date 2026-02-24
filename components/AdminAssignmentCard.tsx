interface AdminAssignmentCardProps {
  id: number;
  title: string;
  description?: string;
  dueDate: string;
  maxPoints: number;
  submissionCount: number;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function AdminAssignmentCard({
  title,
  description,
  dueDate,
  maxPoints,
  submissionCount,
  onClick,
  onDelete,
}: AdminAssignmentCardProps) {
  const isOverdue = new Date(dueDate) < new Date();

  return (
    <div
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer relative"
      onClick={onClick}
    >
      <button
        onClick={onDelete}
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-red-100 hover:bg-red-600 text-red-600 hover:text-white rounded-full transition-colors text-sm font-bold"
        title="Obriši zadatak"
      >
        ✕
      </button>
      <h3 className="text-xl font-bold mb-1 text-black pr-8">{title}</h3>
      {description && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>
      )}
      <div className="flex items-center gap-4 pt-3 border-t text-sm text-gray-600">
        <span className={isOverdue ? 'text-red-500' : 'text-gray-500'}>
          Rok: {new Date(dueDate).toLocaleDateString('sr-RS')}
        </span>
        <span>Max: {maxPoints} pts</span>
        <span className="ml-auto font-medium text-blue-600">
          {submissionCount} predati rad{submissionCount !== 1 ? 'ovi' : ''}
        </span>
      </div>
    </div>
  );
}
