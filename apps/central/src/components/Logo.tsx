import Image from "next/image";
import Link from "next/link";

export function Logo({ className = "", href = "/panel" }: { className?: string, href?: string }) {
  return (
    <Link href={href} className={`block focus-visible:ring-brand-primary ${className}`}>
      <Image 
        src="/logo-IT.png" 
        alt="ITAL GROUP" 
        width={140} 
        height={40} 
        className="h-10 w-auto object-contain"
        priority
      />
    </Link>
  );
}
