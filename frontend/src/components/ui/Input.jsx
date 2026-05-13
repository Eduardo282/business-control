export default function Input({ label, error, ...props }) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="text-xs font-semibold text-light-text-secondary dark:text-zinc-400 ml-1 uppercase tracking-wider transition-colors">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...props}
          className={`w-full rounded-xl px-4 py-3 text-sm bg-white text-light-text-primary dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-[#153465] focus:outline-none border border-zinc-300 disabled:bg-zinc-100 disabled:text-zinc-500 disabled:border-zinc-200 disabled:cursor-not-allowed disabled:placeholder:text-zinc-400 disabled:focus:ring-0 ${
            error ?
              "border-light-error dark:border-red-500/50 focus:border-light-error dark:focus:border-red-500"
            : ""
          }`}
        />
      </div>
      {error && (
        <span className="text-xs text-red-400 ml-1 animate-fadeIn">
          {error}
        </span>
      )}
    </div>
  );
}
