interface AdminCourseCardProps {
  id: number;
  name: string;
  description?: string;
  teacherName: string;
  accessCode: string;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export function AdminCourseCard({
  name,
  description,
  teacherName,
  accessCode,
  onClick,
  onDelete,
}: AdminCourseCardProps) {
  return (
    <div
      className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer relative"
      onClick={onClick}
    >
      <button
        onClick={onDelete}
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-red-100 hover:bg-red-600 text-red-600 hover:text-white rounded-full transition-colors text-sm font-bold"
        title="Obriši predmet"
      >
        ✕
      </button>
      <h3 className="text-xl font-bold mb-2 text-black pr-8">{name}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {description || 'Nema opisa'}
      </p>
      <div className="flex items-center justify-between text-sm pt-4 border-t">
        <span className="text-gray-500">Nastavnik: {teacherName}</span>
        <span className="font-mono text-blue-600 font-medium">{accessCode}</span>
      </div>
    </div>
  );
}
