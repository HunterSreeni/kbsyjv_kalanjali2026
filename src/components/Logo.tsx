export function Logo({ size = 40 }: { size?: number }) {
  return (
    <img
      src="/logo.webp"
      alt="Kalanjali 2026"
      width={size}
      height={size}
      className="rounded-full"
      style={{ width: size, height: size }}
    />
  )
}
