import { applyMove } from '../gameEngine';
import { TUTORIAL_SLOT, TUTORIAL_STEPS } from '../tutorial';

describe('tutorial steps', () => {
  it.each(TUTORIAL_STEPS.map((s, i) => [i, s] as const))('step %i passes when the piece is dropped on its target', (_i, step) => {
    const out = applyMove(step.state, TUTORIAL_SLOT, step.target.row, step.target.col);
    expect(out.ok).toBe(true);
    if (out.ok) expect(step.passed(out.result)).toBe(true);
  });

  it('does not pass a step when the piece is dropped somewhere else', () => {
    for (const step of TUTORIAL_STEPS) {
      const out = applyMove(step.state, TUTORIAL_SLOT, 0, 0);
      expect(out.ok).toBe(true);
      if (out.ok) expect(step.passed(out.result)).toBe(false);
    }
  });
});
