interface CourseCardProps {
  name: string;
  description?: string;
  teacherName: string;
  accessCode?: string;
  studentCount?: number;
  onClick?: () => void;
}

export function CourseCard({
  name,
  description,
  teacherName,
  accessCode,
  studentCount,
  onClick,
}: CourseCardProps) {
  return (
    <div
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <h3 className="text-xl font-bold mb-2 text-black">{name}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {description || 'No description'}
      </p>
      <div className="flex items-center justify-between text-sm pt-4 border-t">
        <span className="text-gray-500">Nastavnik: {teacherName}</span>
        {accessCode && (
          <span className="font-mono text-blue-600 font-medium">{accessCode}</span>
        )}
        {studentCount !== undefined && (
          <span className="text-gray-500">{studentCount} students</span>
        )}
      </div>
    </div>
  );
}

export function EmptyCourseCard({ onClick }: { onClick: () => void }) {
  return (
    <div className="bg-white rounded-lg shadow p-12 text-center col-span-full">
      <p className="text-xl text-gray-500 mb-4">No courses yet</p>
      <button
        onClick={onClick}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Get Started
      </button>
    </div>
  );
}
