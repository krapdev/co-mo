import { useEffect } from 'react';
import { Button } from './components/Button';
import { F } from './components/font';
import { DEFAULT_RULES } from './game/engine';
import type { Rng, Rules } from './game/types';
import { screenTint } from './game/view';
import { ArbitreScreen } from './screens/ArbitreScreen';
import { BanniScreen } from './screens/BanniScreen';
import { ChoixScreen } from './screens/ChoixScreen';
import { ConfirmScreen } from './screens/ConfirmScreen';
import { ContreScreen } from './screens/ContreScreen';
import { DebugScreen } from './screens/DebugScreen';
import { FinScreen } from './screens/FinScreen';
import { GrilleScreen } from './screens/GrilleScreen';
import { PariScreen } from './screens/PariScreen';
import { ResolutionScreen } from './screens/ResolutionScreen';
import { RevealScreen } from './screens/RevealScreen';
import { TamponScreen } from './screens/TamponScreen';
import { TirageScreen } from './screens/TirageScreen';
import type { ScreenProps } from './screens/types';
import { useKowo } from './useKowo';

const SCREENS = {
  grille: GrilleScreen,
  confirm: ConfirmScreen,
  tirage: TirageScreen,
  tampon: TamponScreen,
  choix: ChoixScreen,
  pari: PariScreen,
  contre: ContreScreen,
  reveal: RevealScreen,
  arbitre: ArbitreScreen,
  banni: BanniScreen,
  resolution: ResolutionScreen,
  fin: FinScreen,
  debug: DebugScreen,
} as const satisfies Record<string, (p: ScreenProps) => JSX.Element | null>;

/** Keep the installed app's status bar in step with the screen's tint. */
function useThemeColor(color: string) {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = color;
  }, [color]);
}

export interface AppProps {
  rules?: Rules;
  /** Overridable for deterministic runs in tests or demos. */
  rng?: Rng;
}

export default function App({ rules = DEFAULT_RULES, rng }: AppProps) {
  const [s, send] = useKowo(rules, rng);
  const { bg, ink } = screenTint(s);
  useThemeColor(bg);

  const Screen = SCREENS[s.screen];

  return (
    <div className="stage">
      <div className="phone">
        <div className="tint" style={{ background: bg }} />
        <div className="grain" />
        <div className="sheen" />

        <div className="surface" style={{ color: ink }}>
          <Screen s={s} send={send} ink={ink} rules={rules} />
        </div>

        <Button
          onClick={() => send({ type: s.screen === 'debug' ? 'closeDebug' : 'openDebug' })}
          flat
          bg="transparent"
          fg={ink}
          aria-label="Journal des tours"
          style={{
            position: 'absolute',
            right: 6,
            bottom: 4,
            width: 44,
            height: 44,
            borderRadius: '50%',
            opacity: 0.32,
            font: F('700 13px'),
          }}
        >
          log
        </Button>
      </div>
    </div>
  );
}
