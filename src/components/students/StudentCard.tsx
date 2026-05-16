import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { areaLabel, priorityLabels } from "@/lib/constants";
import { parseJson } from "@/lib/format";

type StudentCardProps = {
  student: {
    id: string;
    name: string;
    age: number;
    grade: string;
    city: string;
    profile: { interestsJson: string } | null;
    eventMap: Array<{
      priority: string;
      event: {
        title: string;
        date: Date;
      };
    }>;
    proposals: Array<{ id: string }>;
  };
};

export function StudentCard({ student }: StudentCardProps) {
  const interests = parseJson<Record<string, number>>(student.profile?.interestsJson ?? "{}", {});
  const topInterests = Object.entries(interests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const nextEvent = student.eventMap[0];

  return (
    <Link className="student-card" href={`/students/${student.id}`}>
      <div className="student-card-top">
        <div>
          <h2 className="student-name">{student.name}</h2>
          <p className="muted">
            {student.grade}, {student.age} лет, {student.city}
          </p>
        </div>
        <ArrowRight size={20} aria-hidden="true" />
      </div>

      <div className="tags">
        {topInterests.map(([key, value]) => (
          <span className="tag primary" key={key}>
            {areaLabel(key)}: {value}/10
          </span>
        ))}
      </div>

      <div>
        <p className="muted">Ближайшее мероприятие</p>
        {nextEvent ? (
          <p>
            {nextEvent.event.title} · {priorityLabels[nextEvent.priority] ?? nextEvent.priority}
          </p>
        ) : (
          <p>Пока не запланировано</p>
        )}
      </div>

      <div className="tags">
        <span className={`tag ${student.proposals.length > 0 ? "warning" : ""}`}>
          {student.proposals.length} предложений на согласование
        </span>
        <span className="tag accent">Карта активна</span>
      </div>
    </Link>
  );
}
