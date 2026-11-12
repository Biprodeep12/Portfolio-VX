import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-dvh grid place-items-center px-5">
      <div className="panel w-full max-w-md p-8 text-center">
        <span className="mx-auto grid place-items-center size-11 rounded-md bg-warn-soft text-warn mb-4">
          <SearchX className="size-5" />
        </span>
        <div className="mono text-muted mb-1">404 · ResourceNotFoundException</div>
        <h1 className="text-[18px] font-semibold mb-2">Resource not found</h1>
        <p className="text-muted mb-6">The page you requested doesn&apos;t exist in this account or was moved.</p>
        <Link href="/" className="btn-primary">
          <ArrowLeft className="size-3.5" /> Back to console
        </Link>
      </div>
    </div>
  );
}
