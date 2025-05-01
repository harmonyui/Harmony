import { emailMeetingRequestSchema } from '@harmony/util/src/types/network'
import { NodeMailerEmailService } from '@harmony/server/src/api/services/email-service'
import { SUPPORT_EMAIL } from '@harmony/util/src/constants'

export async function POST(req: Request): Promise<Response> {
  const request = emailMeetingRequestSchema.parse(await req.json())

  const mailer = new NodeMailerEmailService()

  const subject = `${request.name} has requested a meeting`
  const body = `<p>${request.comments}</p>
    <p>${request.email}</p>`
  await mailer.sendMail({
    to: SUPPORT_EMAIL,
    subject,
    body,
  })

  return new Response(JSON.stringify({}), {
    status: 200,
  })
}
