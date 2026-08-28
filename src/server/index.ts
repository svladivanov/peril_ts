import amqp from 'amqplib'
import { getInput, printServerHelp } from '../internal/gamelogic/gamelogic'
import type { PlayingState } from '../internal/gamelogic/gamestate'
import { publishJSON } from '../internal/pubsub/publish'
import { ExchangePerilDirect, PauseKey } from '../internal/routing/routing'

async function main() {
  const rabbitConnString = 'amqp://guest:guest@localhost:5672/'
  const conn = await amqp.connect(rabbitConnString)
  console.log('Peril game server connected to RabbitMQ!')
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

  const publishCh = await conn.createConfirmChannel()

  printServerHelp()

  while (true) {
    const words = await getInput()
    if (words.length === 0) continue

    const command = words[0]

    switch (command) {
      case 'pause':
        console.log('Publishing paused game state')
        try {
          await publishJSON<PlayingState>(
            publishCh,
            ExchangePerilDirect,
            PauseKey,
            {
              isPaused: true,
            },
          )
        } catch (err) {
          console.error('Error publishing message:', err)
        }
        break

      case 'resume':
        console.log('Sending resume message')
        try {
          await publishJSON<PlayingState>(
            publishCh,
            ExchangePerilDirect,
            PauseKey,
            {
              isPaused: false,
            },
          )
        } catch (err) {
          console.error('Error publishing message:', err)
        }
        break

      case 'quit':
        console.log('Exiting... Goodbye!')
        process.exit(0)
        break

      default:
        console.log(`Command ${words[0]} is unknown`)
        break
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
