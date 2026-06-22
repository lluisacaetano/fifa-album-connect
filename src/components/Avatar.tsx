import { initials } from "@/data/players";

type Props = {
  name: string;
  photo?: string | null;
  size?: number;
  className?: string;
};

// Foto do colecionador, ou as iniciais sobre o gradiente FIFA quando não há foto.
export function Avatar({ name, photo, size = 40, className = "" }: Props) {
  const style = { width: size, height: size };
  if (photo) {
    return <img src={photo} alt={name} style={style} className={`shrink-0 rounded-full object-cover ${className}`} />;
  }
  return (
    <span style={style} className={`grid shrink-0 place-items-center rounded-full bg-fifa-gradient font-display text-white ${className}`} aria-hidden>
      <span style={{ fontSize: Math.round(size * 0.4) }}>{initials(name)}</span>
    </span>
  );
}
