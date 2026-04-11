type Props = {
  selectedChannelId: string;
  publishMode: "queue" | "schedule";
  scheduledAt: string;
  onPublishModeChange: (value: "queue" | "schedule") => void;
  onScheduledAtChange: (value: string) => void;
  onPublish: () => void;
  isPublishing: boolean;
  disabled?: boolean;
};

export default function PublishPanel({
  selectedChannelId,
  publishMode,
  scheduledAt,
  onPublishModeChange,
  onScheduledAtChange,
  onPublish,
  isPublishing,
  disabled = false,
}: Props) {
  const isButtonDisabled =
    disabled ||
    !selectedChannelId ||
    isPublishing ||
    (publishMode === "schedule" && !scheduledAt);

  return (
    <div className="space-y-4 rounded-2xl border p-4">
      <h3 className="text-lg font-semibold">Publish</h3>

      <div className="space-y-2">
        <label className="text-sm font-medium">Publish Mode</label>
        <select
          value={publishMode}
          onChange={(e) =>
            onPublishModeChange(e.target.value as "queue" | "schedule")
          }
          className="w-full rounded-xl border p-3 outline-none"
        >
          <option value="queue">Add to Queue</option>
          <option value="schedule">Schedule</option>
        </select>
      </div>

      {publishMode === "schedule" && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Schedule Time</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => onScheduledAtChange(e.target.value)}
            className="w-full rounded-xl border p-3 outline-none"
          />
          <p className="text-xs text-gray-500">
            Choose a future date and time.
          </p>
        </div>
      )}

      {!selectedChannelId && (
        <p className="text-sm text-amber-700">
          Select a Buffer channel before publishing.
        </p>
      )}

      <button
        type="button"
        onClick={onPublish}
        disabled={isButtonDisabled}
        className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {isPublishing ? "Publishing..." : "Publish to Buffer"}
      </button>
    </div>
  );
}