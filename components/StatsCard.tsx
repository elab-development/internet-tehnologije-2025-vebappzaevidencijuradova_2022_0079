interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export function StatsCard({ title, value, subtitle }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold mb-1">{value}</p>
      {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
    </div>
  );
}
