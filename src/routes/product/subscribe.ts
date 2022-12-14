import { Type } from '@sinclair/typebox'

import { UnauthorizedError } from '../../common/fastify'
import { pool } from '../../common/postgres'
import { IToggleSubscriptionResult } from './sql/toggleSubscription'
import toggleSubscription from './sql/toggleSubscription.sql'
import { TFastify } from '..'

export default async function routes(fastify: TFastify) {
  const schema = {
    params: Type.Object({
      id: Type.Number(),
    }),
    body: Type.Union([
      Type.Object({
        prices: Type.Array(
          Type.Object({
            limit: Type.Number(),
            fluctuation: Type.Union([Type.Literal('more'), Type.Literal('less')]),
            unit: Type.Number(),
          })
        ),
        hasCardDiscount: Type.Boolean(),
        hasCouponDiscount: Type.Boolean(),
        canBuy: Type.Boolean(),
      }),
      Type.Null(),
    ]),
  }

  fastify.post('/product/:id/subscribe', { schema }, async (req) => {
    const user = req.user
    if (!user) throw UnauthorizedError('로그인 후 시도해주세요')

    const { rows } = await pool.query<IToggleSubscriptionResult>(toggleSubscription, [
      req.params.id,
      user.id,
      req.body ? JSON.stringify(req.body) : null,
    ])

    return { isSubscribed: rows[0].result }
  })
}
