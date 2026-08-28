import type { Channel, ChannelModel, ConsumeMessage, Replies } from 'amqplib'

export enum SimpleQueueType {
  Durable,
  Transient,
}

export const declareAndBind = async (
  conn: ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
): Promise<[Channel, Replies.AssertQueue]> => {
  const ch = await conn.createChannel()

  const queue = await ch.assertQueue(queueName, {
    durable: queueType === SimpleQueueType.Durable,
    autoDelete: queueType !== SimpleQueueType.Durable,
    exclusive: queueType !== SimpleQueueType.Durable,
  })

  await ch.bindQueue(queue.queue, exchange, key)

  return [ch, queue]
}

export const subscribeJSON = async <T>(
  conn: ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
  handler: (data: T) => void,
): Promise<void> => {
  const [ch, queue] = await declareAndBind(
    conn,
    exchange,
    queueName,
    key,
    queueType,
  )

  await ch.consume(queue.queue, (msg: ConsumeMessage | null) => {
    if (!msg) return

    let data: T
    try {
      data = JSON.parse(msg.content.toString())
    } catch (err) {
      console.error('Could not unmarshall message: ', err)
      return
    }

    handler(data)
    ch.ack(msg)
  })
}
