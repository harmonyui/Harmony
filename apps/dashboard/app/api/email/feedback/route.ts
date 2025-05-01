import { emailFeedbackRequestSchema } from '@harmony/util/src/types/network'
import { NodeMailerEmailService } from '@harmony/server/src/api/services/email-service'
import { SUPPORT_EMAIL } from '@harmony/util/src/constants'

export async function POST(req: Request): Promise<Response> {
  const request = emailFeedbackRequestSchema.parse(await req.json())

  const mailer = new NodeMailerEmailService()

  const subject = `Feedback From ${request.name}`
  const body = request.comments
  await mailer.sendMail({
    to: SUPPORT_EMAIL,
    subject,
    body,
  })

  return new Response(JSON.stringify({}), {
    status: 200,
  })
}
