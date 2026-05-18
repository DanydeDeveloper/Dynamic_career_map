import { areaLabel } from "@/lib/constants";
import { parseJson } from "@/lib/format";

type ProfileSummaryProps = {
  profile: {
    interestsJson: string;
    inclinationsJson: string;
    activityFormatsJson: string;
    stabilityJson: string;
    summaryText: string;
    curatorComment: string | null;
  } | null;
  curatorName?: string | null;
  showCuratorComment?: boolean;
};

const inclinationLabels: Record<string, string> = {
  analytical_thinking: "Аналитическое мышление",
  creative_thinking: "Креативное мышление",
  communication: "Коммуникация",
  research_orientation: "Исследовательская ориентация",
  practical_making: "Практическое создание"
};

const formatLabels: Record<string, string> = {
  teamwork: "Командная работа",
  individual_work: "Индивидуальная работа",
  competition: "Соревнование",
  project_work: "Проектная работа",
  public_speaking: "Публичные выступления"
};

const stabilityLabels: Record<string, string> = {
  not_checked: "не проверено",
  low: "слабый интерес",
  unstable: "нестабильно",
  growing: "растет",
  stable: "устойчиво"
};

export function ProfileSummary({ profile, curatorName, showCuratorComment = true }: ProfileSummaryProps) {
  if (!profile) {
    return <div className="empty-state">Характеристика пока не сформирована.</div>;
  }

  const interests = parseJson<Record<string, number>>(profile.interestsJson, {});
  const inclinations = parseJson<Record<string, number>>(profile.inclinationsJson, {});
  const activityFormats = parseJson<Record<string, number>>(profile.activityFormatsJson, {});
  const stability = parseJson<Record<string, string>>(profile.stabilityJson, {});

  return (
    <div className="profile-summary">
      <p>{profile.summaryText}</p>

      <div className="split-line" />

      <div className="grid three">
        <div>
          <h3 className="panel-title">Интересы</h3>
          <div className="tags">
            {Object.entries(interests).map(([key, value]) => (
              <span className="tag primary" key={key}>
                {areaLabel(key)}: {value}/10
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="panel-title">Склонности</h3>
          <div className="tags">
            {Object.entries(inclinations).map(([key, value]) => (
              <span className="tag" key={key}>
                {inclinationLabels[key] ?? key}: {value}/10
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="panel-title">Форматы</h3>
          <div className="tags">
            {Object.entries(activityFormats).map(([key, value]) => (
              <span className="tag accent" key={key}>
                {formatLabels[key] ?? key}: {value}/10
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="split-line" />

      <h3 className="panel-title">Устойчивость интересов</h3>
      <div className="tags">
        {Object.entries(stability).map(([key, value]) => (
          <span className="tag" key={key}>
            {areaLabel(key)}: {stabilityLabels[value] ?? value}
          </span>
        ))}
      </div>

      {showCuratorComment && profile.curatorComment ? (
        <>
          <div className="split-line" />
          <p>
            <strong>Комментарий куратора{curatorName ? ` ${curatorName}` : ""}:</strong>{" "}
            {profile.curatorComment}
          </p>
        </>
      ) : null}
    </div>
  );
}
