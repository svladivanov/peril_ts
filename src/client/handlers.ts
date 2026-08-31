import type { ArmyMove } from '../internal/gamelogic/gamedata'
import type { GameState, PlayingState } from '../internal/gamelogic/gamestate'
import { handleMove, MoveOutcome } from '../internal/gamelogic/move'
import { handlePause } from '../internal/gamelogic/pause'
import { AckType } from '../internal/pubsub/consume'

export const handlerPause =
  (gs: GameState) =>
    (ps: PlayingState): AckType => {
      handlePause(gs, ps)
      process.stdout.write('> ')
      return AckType.Ack
    }

export const handlerMove = (gs: GameState) => (move: ArmyMove) => {
  try {
    const outcome = handleMove(gs, move)
    switch (outcome) {
      case MoveOutcome.Safe:
      case MoveOutcome.MakeWar:
        return AckType.Ack
      default:
        return AckType.NackDiscard
    }
  } finally {
    process.stdout.write('> ')
  }
}
