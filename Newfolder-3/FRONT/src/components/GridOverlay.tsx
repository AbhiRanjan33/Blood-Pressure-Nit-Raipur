export default function GridOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]">
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        backgroundPosition: '0 0, 0 0'
      }} />
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-fuchsia-500/5 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-fuchsia-400/40 to-transparent" />
    </div>
  );
}


