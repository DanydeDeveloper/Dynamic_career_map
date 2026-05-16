import { areaLabel } from "@/lib/constants";
import { parseJson } from "@/lib/format";

type VisibilityBarsProps = {
  items: Array<{
    area: string;
    score: number;
    level: string;
    evidenceJson: string;
  }>;
};

export function VisibilityBars({ items }: VisibilityBarsProps) {
  return (
    <div className="progress-list">
      {items.map((item) => {
        const evidence = parseJson<string[]>(item.evidenceJson, []);

        return (
          <div className="progress-row" key={item.area}>
            <div className="progress-label">
              <span>{areaLabel(item.area)}</span>
              <strong>
                {item.score}% · {item.level}
              </strong>
            </div>
            <div className="progress-track" aria-hidden="true">
              <div className="progress-fill" style={{ width: `${Math.min(item.score, 100)}%` }} />
            </div>
            {evidence.length > 0 ? <span className="muted">{evidence.join(", ")}</span> : null}
          </div>
        );
      })}
    </div>
  );
}
