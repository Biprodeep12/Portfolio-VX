import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BP_STATS } from "@/data/blueprint";
import { FLOW_COUNT, SCENES } from "@/data/scenes";

const HOPS = ["client", "edge", "nginx", "api", "postgres"];

/** Home-page entry to /blueprint: a small live request path and the counts. */
export function BlueprintTeaser() {
  return (
    <Link
      prefetch={false}
      href="/blueprint/"
      className="group mt-6 panel grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] items-center gap-6 md:gap-10 px-6 sm:px-8 py-7 hover:border-line-strong transition-colors"
    >
      <div className="min-w-0">
        <div className="mono text-[12px] text-muted">
          <span className="text-faint">04 </span>svc/blueprint
        </div>
        <h3 className="mt-2 font-semibold text-[17px] tracking-tight text-fg">Blueprint: learn system design with a 1M-user app</h3>
        <p className="mt-1.5 text-muted leading-relaxed max-w-[600px]">
          How a production system is designed, step by step: requirements and estimates, every layer from frontend to AWS, scaling
          and trade-offs. Interactive maps, a live load estimator and quick checks along the way.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-accent">
            Open the blueprint <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
          <span className="mono text-[11.5px] text-faint">
            {Object.keys(SCENES).length} maps · {FLOW_COUNT} flows · {BP_STATS.decisions} decisions
          </span>
        </div>
      </div>
      <div className="hidden sm:flex items-center" aria-hidden>
        {HOPS.map((h, i) => (
          <span key={h} className="flex items-center">
            <span
              className={`h-7 px-2.5 inline-flex items-center rounded-[5px] border mono text-[11px] transition-colors ${
                i === HOPS.length - 1 ? "border-line-strong text-fg bg-subtle" : "border-line text-fg-2 bg-panel group-hover:border-line-strong"
              }`}
            >
              {h}
            </span>
            {i < HOPS.length - 1 && (
              <span className="edge relative w-5 lg:w-7 h-px">
                <span className="packet absolute -top-[2.5px] size-1.5 rounded-full bg-accent" style={{ animationDelay: `${i * 0.45}s` }} />
              </span>
            )}
          </span>
        ))}
      </div>
    </Link>
  );
}
