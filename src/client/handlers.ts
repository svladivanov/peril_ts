import type { ArmyMove } from '../internal/gamelogic/gamedata'
import type { GameState, PlayingState } from '../internal/gamelogic/gamestate'
import { handleMove } from '../internal/gamelogic/move'
import { handlePause } from '../internal/gamelogic/pause'

export const handlerPause =
  (gs: GameState) =>
    (ps: PlayingState): void => {
      handlePause(gs, ps)
      process.stdout.write('> ')
    }

export const handlerMove = (gs: GameState) => (move: ArmyMove) => {
  handleMove(gs, move)
  console.log(`Moved ${move.units.length} units to ${move.toLocation}`)
  process.stdout.write('> ')
}
