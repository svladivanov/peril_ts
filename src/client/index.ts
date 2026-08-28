import amqp from 'amqplib'
import {
  clientWelcome,
  commandStatus,
  getInput,
  printClientHelp,
  printQuit,
} from '../internal/gamelogic/gamelogic'
import { GameState } from '../internal/gamelogic/gamestate'
import { commandMove } from '../internal/gamelogic/move'
import { commandSpawn } from '../internal/gamelogic/spawn'
import { SimpleQueueType, subscribeJSON } from '../internal/pubsub/consume'
import { ExchangePerilDirect, PauseKey } from '../internal/routing/routing'
import { handlerPause } from './handlers'

async function main() {
  const rabbitConnString = 'amqp://guest:guest@localhost:5672/'
  const conn = await amqp.connect(rabbitConnString)
  console.log('Peril game client connected to RabbitMQ!')

  const signals = ['SIGINT', 'SIGTERM']
  signals.forEach((signal) => {
    process.on(signal, async () => {
      try {
        await conn.close()
        console.log('RabbitMQ connection closed.')
      } catch (err) {
        console.error('Error closing RabbitMQ connection:', err)
      } finally {
        process.exit(0)
      }
    })
  })

  const username = await clientWelcome()
  const gameState = new GameState(username)

  await subscribeJSON(
    conn,
    ExchangePerilDirect,
    `${PauseKey}.${username}`,
    PauseKey,
    SimpleQueueType.Transient,
    handlerPause(gameState),
  )

  while (true) {
    const words = await getInput()
    if (words.length === 0) continue

    const command = words[0]

    switch (command) {
      case 'spawn':
        try {
          commandSpawn(gameState, words)
          break
        } catch (err) {
          console.error('Could not complete command: ', err)
          break
        }
      case 'move':
        try {
          commandMove(gameState, words)
          break
        } catch (err) {
          console.error('Could not complete command: ', err)
          break
        }
      case 'status':
        await commandStatus(gameState)
        break
      case 'help':
        printClientHelp()
        break
      case 'spam':
        console.log('Spamming not allowed yet!')
        break
      case 'quit':
        printQuit()
        process.exit(0)
        break
      default:
        console.log(`Command ${command} is unknown`)
        break
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
