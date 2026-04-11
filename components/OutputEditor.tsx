type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export default function OutputEditor({ label, value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[180px] w-full rounded-xl border p-3 outline-none"
      />
    </div>
  );
}