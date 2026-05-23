"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-6 text-center">
      <p className="text-slate-500 dark:text-slate-400 text-sm">
        Algo salió mal. Por favor intenta de nuevo.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-gold-500 text-white text-sm font-medium hover:bg-gold-600 transition-colors"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
