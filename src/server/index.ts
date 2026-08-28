import amqp from 'amqplib'
import type { PlayingState } from '../internal/gamelogic/gamestate'
import { publishJSON } from '../internal/pubsub/publish'
import { ExchangePerilDirect, PauseKey } from '../internal/routing/routing'

async function main() {
  const rabbitConnString = 'amqp://guest:guest@localhost:5672/'
  const conn = await amqp.connect(rabbitConnString)
  console.log('Peril game server connected to RabbitMQ!')

  const publishCh = await conn.createConfirmChannel()

  try {
    await publishJSON<PlayingState>(publishCh, ExchangePerilDirect, PauseKey, {
      isPaused: true,
    })
  } catch (err) {
    console.error('Error publishing message:', err)
  }

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
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
