import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ size = 50, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Zypherex"
      width={size}
      height={size}
      className={cn("rounded-xl object-cover", className)}
      priority
    />
  );
}
