interface AssignmentCardProps {
  title: string;
  description?: string;
  dueDate: string;
  maxPoints: number;
  submissionCount?: number;
  submission?: {
    id: number;
    grade: number | null;
    submittedAt: string;
    plagiarismScore: number | null;
  } | null;
  isOverdue: boolean;
  userRole: string;
  onSubmit?: () => void;
  onClick?: () => void;
}

export function AssignmentCard({
  title,
  description,
  dueDate,
  maxPoints,
  submissionCount,
  submission,
  isOverdue,
  userRole,
  onSubmit,
  onClick,
}: AssignmentCardProps) {
  const hasSubmitted = submission !== null;
  const isGraded = submission?.grade !== null && submission?.grade !== undefined;

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
          <h3 className="text-xl font-bold mb-1 text-black">{title}</h3>
          {description && (
            <p className="text-black text-sm line-clamp-2">{description}</p>
          )}
        </div>

        {/* Status badges for students */}
        {userRole === 'STUDENT' && (
          <div className="flex gap-2 ml-4">
            {hasSubmitted && (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                ✓ Submitted
              </span>
            )}
            {isOverdue && !hasSubmitted && (
              <span className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
                Overdue
              </span>
            )}
            {isGraded && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium">
                {submission.grade}/{maxPoints}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Meta info */}
      <div className="flex items-center justify-between pt-3 border-t text-sm">
        <div className="flex gap-4 text-gray-600">
          <span>Due: {new Date(dueDate).toLocaleDateString()}</span>
          <span>Max: {maxPoints} points</span>
          {userRole === 'TEACHER' && submissionCount !== undefined && (
            <span>{submissionCount} submission{submissionCount !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Submit button for students */}
        {userRole === 'STUDENT' && !hasSubmitted && !isOverdue && onSubmit && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSubmit();
            }}
            className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Submit
          </button>
        )}
      </div>

      {/* Plagiarism score for students */}
      {userRole === 'STUDENT' && submission !== null && submission?.plagiarismScore !== null && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Plagiarism Score:</span>
            <span className={`text-sm font-medium ${
              submission.plagiarismScore! < 10 ? 'text-green-600' :
              submission.plagiarismScore! < 25 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {submission.plagiarismScore.toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function EmptyAssignmentState() {
  return (
    <div className="bg-white rounded-lg shadow p-12 text-center">
      <p className="text-xl text-gray-500">No assignments yet</p>
    </div>
  );
}
