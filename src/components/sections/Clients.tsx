import { Reveal } from "@/components/Reveal";
import { clients } from "@/lib/content";

export function Clients() {
  return (
    <Reveal as="section" className="relative z-20 py-[12vh]">
      <div className="shell flex items-end justify-between border-t border-hairline pt-6">
        <h2 className="label" id="clients">
          (Clients)
        </h2>
        <span className="label">{clients.length} worked with</span>
      </div>

      <ol className="shell mt-[8vh] grid sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((name, i) => (
          <li
            key={name}
            className="fade group flex items-baseline gap-4 border-t border-hairline py-6 transition-colors duration-500 hover:border-signal"
            style={{ "--d": `${(i % 6) * 0.06}s` } as React.CSSProperties}
          >
            <span className="label">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="font-display text-[clamp(1.4rem,2.4vw,2rem)] leading-none transition-colors duration-500 group-hover:text-signal">
              {name}
            </h3>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}
