import Link from "next/link";
import { ReactNode } from "react";

interface InlineLinkProps {
  link: string;
  children: ReactNode;
  className?: string;
}

export function InlineLink({ link, children, className = "" }: InlineLinkProps) {
  return (
    <Link href={link} className={`text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors ${className}`}>
      {children}
    </Link>
  );
}
