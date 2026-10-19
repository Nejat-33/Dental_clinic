export function Thumb({ src, fallback, round }: { src: string | null; fallback: React.ReactNode; round?: boolean }) {
  return (
    <div
      className={`grid size-16 shrink-0 place-items-center overflow-hidden bg-brand-50 text-brand-600 ${round ? 'rounded-full' : 'rounded-xl'}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        fallback
      )}
    </div>
  );
}