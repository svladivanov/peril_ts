import type { GameState, PlayingState } from '../internal/gamelogic/gamestate'
import { handlePause } from '../internal/gamelogic/pause'

export const handlerPause =
  (gs: GameState) =>
  (ps: PlayingState): void => {
    handlePause(gs, ps)
    process.stdout.write('> ')
  }
