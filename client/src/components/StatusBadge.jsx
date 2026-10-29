const statusStyles = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-accent text-white',
  completed: 'bg-green-100 text-green-800',
};

const statusLabels = {
  draft: 'Draft',
  active: 'Live',
  completed: 'Completed',
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`
        inline-block text-xs font-medium
        px-2 py-0.5 rounded-pill
        ${statusStyles[status] || statusStyles.draft}
      `}
    >
      {statusLabels[status] || status}
    </span>
  );
}
