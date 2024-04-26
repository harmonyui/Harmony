import { emailMeetingRequestSchema } from "@harmony/ui/src/types/network";
import { NodeMailerEmailService } from "@harmony/server/src/api/services/email-service";

export async function POST(req: Request): Promise<Response> {
    const request = emailMeetingRequestSchema.parse(await req.json());

    const mailer = new NodeMailerEmailService();

    const subject = `${request.name} has requested a meeting`;
    const body = `<p>${request.comments}</p>
    <p>${request.email}</p>`;
    await mailer.sendMail({
        to: 'jacob@harmonyui.app',
        subject,
        body
    });

    return new Response(JSON.stringify({}), {
        status: 200
    });
}