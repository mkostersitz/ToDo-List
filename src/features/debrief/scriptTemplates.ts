import type { DebriefMode, Language, WeekStats } from './types';

type TemplateSet = {
  opening: (stats: WeekStats, name?: string) => string;
  data: (stats: WeekStats) => string;
  close: (stats: WeekStats) => string;
};

const TEMPLATES: Record<DebriefMode, Record<Language, TemplateSet>> = {
  strong: {
    en: {
      opening: (_s) => `This was a strong week — you showed up consistently and it showed.`,
      data: (s) => `You completed ${s.completedHabits} of ${s.totalHabits} habits — ${Math.round(s.completionRate * 100)}% for the week.${s.streakHighlight ? ` Your ${s.streakHighlight.habitName} streak is at ${s.streakHighlight.streak} days.` : ''}`,
      close: (_s) => `Next week, keep that momentum. One habit at a time.`,
    },
    de: {
      opening: (_s) => `Das war eine starke Woche — du warst konsequent dabei.`,
      data: (s) => `Du hast ${s.completedHabits} von ${s.totalHabits} Gewohnheiten abgeschlossen — ${Math.round(s.completionRate * 100)}% diese Woche.`,
      close: (_s) => `Nächste Woche weiter so. Eine Gewohnheit nach der anderen.`,
    },
    es: {
      opening: (_s) => `Esta fue una semana fuerte — tu constancia se nota.`,
      data: (s) => `Completaste ${s.completedHabits} de ${s.totalHabits} hábitos — ${Math.round(s.completionRate * 100)}% esta semana.`,
      close: (_s) => `La próxima semana, mantén ese impulso. Un hábito a la vez.`,
    },
  },
  solid: {
    en: {
      opening: (_s) => `Steady week — some wins, some rough patches, and you kept going.`,
      data: (s) => `You completed ${s.completedHabits} of ${s.totalHabits} habits — ${Math.round(s.completionRate * 100)}% overall.${s.topHabit ? ` ${s.topHabit} was your most consistent.` : ''}`,
      close: (_s) => `Next week, pick one habit to protect above all others. That one counts.`,
    },
    de: {
      opening: (_s) => `Solide Woche — Höhen und Tiefen, aber du hast durchgehalten.`,
      data: (s) => `Du hast ${s.completedHabits} von ${s.totalHabits} Gewohnheiten abgeschlossen — ${Math.round(s.completionRate * 100)}% insgesamt.`,
      close: (_s) => `Nächste Woche eine Gewohnheit priorisieren. Die zählt.`,
    },
    es: {
      opening: (_s) => `Semana sólida — altibajos, pero seguiste adelante.`,
      data: (s) => `Completaste ${s.completedHabits} de ${s.totalHabits} hábitos — ${Math.round(s.completionRate * 100)}% en total.`,
      close: (_s) => `La próxima semana, elige un hábito para proteger. Ese cuenta.`,
    },
  },
  rough: {
    en: {
      opening: (_s) => `Tough week. That happens, and you're still here.`,
      data: (s) => `You logged ${s.completedHabits} of ${s.totalHabits} habits this week.${s.topHabit ? ` ${s.topHabit} held on.` : ' Something held on.'}`,
      close: (_s) => `Next week, aim for one habit done every day. Just one.`,
    },
    de: {
      opening: (_s) => `Schwierige Woche. Das passiert — und du bist noch da.`,
      data: (s) => `Du hast ${s.completedHabits} von ${s.totalHabits} Gewohnheiten protokolliert.`,
      close: (_s) => `Nächste Woche: eine Gewohnheit täglich. Nur eine.`,
    },
    es: {
      opening: (_s) => `Semana difícil. Eso pasa, y aquí estás.`,
      data: (s) => `Registraste ${s.completedHabits} de ${s.totalHabits} hábitos esta semana.`,
      close: (_s) => `La próxima semana, apunta a un hábito por día. Solo uno.`,
    },
  },
  slip: {
    en: {
      opening: (_s) => `This week was a slip. That's data, not defeat.`,
      data: (s) => `A low-completion week — ${Math.round(s.completionRate * 100)}% done. Streaks reset, and that's okay.`,
      close: (_s) => `One small thing next week. Pick it now, do it tomorrow.`,
    },
    de: {
      opening: (_s) => `Diese Woche war ein Rückschlag. Das sind Daten, keine Niederlage.`,
      data: (s) => `Wenig abgeschlossen diese Woche — ${Math.round(s.completionRate * 100)}%.`,
      close: (_s) => `Eine kleine Sache nächste Woche. Jetzt aussuchen, morgen umsetzen.`,
    },
    es: {
      opening: (_s) => `Esta semana fue un tropiezo. Eso es información, no derrota.`,
      data: (s) => `Semana de bajo rendimiento — ${Math.round(s.completionRate * 100)}% completado.`,
      close: (_s) => `Una pequeña cosa la próxima semana. Elígela ahora, hazla mañana.`,
    },
  },
};

export function getTemplates(mode: DebriefMode, language: Language): TemplateSet {
  return TEMPLATES[mode][language];
}

export function getMode(completionRate: number): DebriefMode {
  if (completionRate >= 0.85) return 'strong';
  if (completionRate >= 0.50) return 'solid';
  if (completionRate >= 0.25) return 'rough';
  return 'slip';
}
