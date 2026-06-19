"use client";

interface TweakCardProps {
  id: string;
  title: string;
  description: string;
  loading: string | null;
  /** Button label when idle */
  actionLabel?: string;
  /** The actual script filename (defaults to id if not set) */
  scriptName?: string;
  /** Optional second button (e.g. "Restore") */
  secondaryAction?: { label: string; script: string };
  result?: { success: boolean; message: string } | null;
  onApply: (script: string) => void;
  /** Disable the apply button once successful */
  disableOnSuccess?: boolean;
}

export default function TweakCard({
  id,
  title,
  description,
  loading,
  actionLabel = "Apply",
  scriptName,
  secondaryAction,
  result,
  onApply,
  disableOnSuccess = false,
}: TweakCardProps) {
  const mainScript = scriptName || id;
  const isBusy = loading === id;
  const isDone = result?.success;
  const hasError = result && !result.success;

  return (
    <div
      className={`flex items-center justify-between bg-zinc-800/50 p-4 rounded-lg border transition-colors ${
        isDone
          ? "border-emerald-600/50"
          : hasError
          ? "border-amber-600/50"
          : "border-zinc-700/50"
      }`}
    >
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-sm text-zinc-400">{description}</p>
        {result && (
          <p
            className={`text-xs mt-2 ${
              isDone ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {result.message.substring(0, 120)}
          </p>
        )}
      </div>

      <div className="flex gap-3 shrink-0 ml-4">
        {secondaryAction && (
          <button
            onClick={() => onApply(secondaryAction.script)}
            disabled={isBusy}
            className="bg-zinc-700 hover:bg-amber-600 transition-colors px-4 py-2 rounded-md font-medium disabled:opacity-50 text-sm"
          >
            {secondaryAction.label}
          </button>
        )}

        <button
          onClick={() => onApply(mainScript)}
          disabled={isBusy || (disableOnSuccess && !!isDone)}
          className={`transition-colors px-6 py-2 rounded-md font-medium disabled:opacity-50 ${
            isDone
              ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600 cursor-default"
              : hasError
              ? "bg-amber-600/20 text-amber-400 border border-amber-600"
              : "bg-zinc-700 hover:bg-emerald-600 text-white"
          }`}
        >
          {isBusy ? "Applying..." : isDone ? "Applied" : actionLabel}
        </button>
      </div>
    </div>
  );
}
