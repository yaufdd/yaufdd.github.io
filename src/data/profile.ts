import type { Locale } from '../i18n/ui';

type Localized = Record<Locale, string>;

export interface Job {
  period: Localized;
  text: Localized;
}

/** Oldest first, as in the reference design. Source: the owner's Wantedly profile. */
export const experience: readonly Job[] = [
  {
    period: { ja: '2022 – 2023', en: '2022 – 2023' },
    text: {
      ja: '一越株式会社 — フルスタック開発者。ランディングページ、サーバー構築、管理画面の開発。',
      en: 'Ichikoshi Co., Ltd. — Full-stack developer: landing pages, server setup and an admin panel.',
    },
  },
  {
    period: { ja: '2024 – 2025', en: '2024 – 2025' },
    text: { ja: 'FEAT MUSIC — Go デベロッパー。', en: 'FEAT MUSIC — Go developer.' },
  },
  {
    period: { ja: '2025 – 現在', en: '2025 – Present' },
    text: {
      ja: '旅行会社 — 開発部 フルスタックエンジニア。手作業の業務を、実際に使われる製品に変える。',
      en: 'Travel company — Full-stack engineer. Turning manual work into products people actually use.',
    },
  },
];

export const education = {
  degree: {
    ja: 'MIREA（ロシア技術大学）| 学士（セキュアソフトウェア開発）| 2020 – 2024',
    en: 'MIREA – Russian Technological University | Bachelor (secure software development) | 2020 – 2024',
  },
  note: {
    ja: '情報技術学部 情報システムと技術。卒業研究は、教育プロセスを自動化する Telegram ボット。',
    en: 'Institute of Information Technologies, Information Systems and Technologies. Graduation project: a Telegram bot that automates educational processes.',
  },
} satisfies Record<string, Localized>;

export const contacts = {
  email: 'ercbamba@gmail.com',
  github: 'https://github.com/yaufdd',
  languages: { ja: '日本語・ロシア語・英語', en: 'Japanese · Russian · English' } satisfies Localized,
};
