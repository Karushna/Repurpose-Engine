type Channel = {
  id: string;
  name: string;
  displayName?: string | null;
  service: string;
};

type Props = {
  channels: Channel[];
  value: string;
  onChange: (value: string) => void;
};

export default function ChannelSelector({ channels, value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Buffer Channel</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border p-3 outline-none"
      >
        <option value="">Select a channel</option>
        {channels.map((channel) => (
          <option key={channel.id} value={channel.id}>
            {channel.displayName || channel.name} ({channel.service})
          </option>
        ))}
      </select>
    </div>
  );
}
