export type ProgressRecord = {
  completed: boolean;
  completedAt: Date | null;
};

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function subtractDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() - days);
  return next;
}

export function calculateLearningMetrics(
  records: ProgressRecord[],
  totalLessons: number,
  now = new Date(),
) {
  const completedRecords = records.filter(
    (record) => record.completed && record.completedAt,
  );
  const activityDays = new Set(
    completedRecords.map((record) => dayKey(record.completedAt as Date)),
  );

  let cursor = now;
  if (!activityDays.has(dayKey(cursor))) {
    cursor = subtractDays(cursor, 1);
  }

  let streak = 0;
  while (activityDays.has(dayKey(cursor))) {
    streak += 1;
    cursor = subtractDays(cursor, 1);
  }

  const completed = completedRecords.length;
  return {
    completed,
    totalLessons,
    percentage: totalLessons === 0 ? 0 : Math.round((completed / totalLessons) * 100),
    streak,
  };
}
