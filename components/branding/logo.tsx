import Image from "next/image";

type BrandLogoProps = {
  variant?: "classic" | "app";
  size?: number;
  priority?: boolean;
  className?: string;
};

export function BrandLogo({
  variant = "classic",
  size = 72,
  priority = false,
  className,
}: BrandLogoProps) {
  const src = variant === "app" ? "/brand/logo-app.png" : "/brand/logo-classic.png";

  return (
    <Image
      src={src}
      alt={variant === "app" ? "Plume app icon" : "Plume"}
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
