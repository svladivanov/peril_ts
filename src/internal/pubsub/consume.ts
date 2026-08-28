import type { Channel, ChannelModel, Replies } from 'amqplib'

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
