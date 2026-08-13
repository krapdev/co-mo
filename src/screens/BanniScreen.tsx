import { Button } from '../components/Button';
import { F } from '../components/font';
import { EQUIPES } from '../game/data';
import { arbitreOf } from '../game/engine';
import type { ScreenProps } from './types';

/** Confirmation gate for the harshest call: a banned clue ends the round. */
export function BanniScreen({ s, send, ink }: ScreenProps) {
  const arb = arbitreOf(s);

  return (
    <div
      className="screen-in"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', textAlign: 'center' }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        <div className="float-big" style={{ fontSize: 104, lineHeight: 1 }}>
          ⛔
        </div>
        <div style={{ font: F('800 44px/1.02'), transform: 'rotate(-1.5deg)' }}>Indice banni</div>
        <div style={{ font: F('700 21px/1.28'), opacity: 0.92, padding: '0 8px' }}>
          Le tour s’arrête · +{s.cur?.v ?? 0} pour {EQUIPES[arb].court}
        </div>
      </div>

      <Button
        onClick={() => send({ type: 'banniOk' })}
        bg="rgba(255,250,235,.95)"
        fg="#8f3410"
        ledge="rgba(28,18,6,.3)"
        ledgeH={6}
        style={{ minHeight: 82, borderRadius: 22, font: F('800 27px') }}
      >
        Confirmer
      </Button>

      <Button
        onClick={() => send({ type: 'banniBack' })}
        flat
        bg="rgba(28,18,6,.22)"
        fg={ink}
        style={{ marginTop: 10, minHeight: 56, font: F('800 21px') }}
      >
        Retour
      </Button>
    </div>
  );
}
