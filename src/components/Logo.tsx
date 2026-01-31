interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
}

const sizeClasses: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
};

const themeClasses: Record<NonNullable<LogoProps['theme']>, { label: string; title: string }> = {
  light: {
    label: 'text-slate-500',
    title: 'text-slate-900',
  },
  dark: {
    label: 'text-slate-200',
    title: 'text-white',
  },
};

export function Logo({ size = 'md', theme = 'light' }: LogoProps) {
  const colors = themeClasses[theme];

  return (
    <div className="flex items-center gap-3" aria-label="Language Cards">
      <div
        className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-sky-500 font-semibold tracking-wide text-white shadow-lg shadow-indigo-500/30 ${sizeClasses[size]}`}
      >
        LC
      </div>
      <div className="flex flex-col leading-none text-left">
        <span
          className={`text-[0.65rem] font-semibold uppercase tracking-[0.4em] ${colors.label}`}
        >
          language
        </span>
        <span className={`text-lg font-bold ${colors.title}`}>cards</span>
      </div>
    </div>
  );
}
