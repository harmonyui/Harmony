import { emailFeedbackRequestSchema } from "@harmony/ui/src/types/network";
import { NodeMailerEmailService } from "../../../../../../src/server/api/services/email-service";

export async function POST(req: Request): Promise<Response> {
    const request = emailFeedbackRequestSchema.parse(await req.json());

    const mailer = new NodeMailerEmailService();

    const subject = `Feedback From ${request.name}`;
    const body = request.comments;
    await mailer.sendMail({
        to: 'jacob@harmonyui.app',
        subject,
        body
    });

    return new Response(JSON.stringify({}), {
        status: 200
    });
}