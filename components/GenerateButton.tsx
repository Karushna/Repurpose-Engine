type Props = {
  isLoading: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export default function GenerateButton({
  isLoading,
  onClick,
  disabled,
}: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
    >
      {isLoading ? "Generating..." : "Generate Posts"}
    </button>
  );
}