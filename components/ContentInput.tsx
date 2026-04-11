type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function ContentInput({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Source Content</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your blog post, webinar transcript, product launch note, or long-form content here..."
        className="min-h-[220px] w-full rounded-xl border p-4 outline-none"
      />
    </div>
  );
}