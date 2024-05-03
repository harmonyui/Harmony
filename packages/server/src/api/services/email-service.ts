import type {Transporter} from 'nodemailer';
import { createTransport} from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

export interface File {
	body: Buffer;
	name: string;
	type: string;
	size: number;
}

export interface MailOptions {
	to: string,
	subject: string,
	body: string,
	attachments?: File[]
}

export interface EmailService {
	sendMail: (options: MailOptions) => Promise<void>
}

export class NodeMailerEmailService implements EmailService {
	private transporter: Transporter<SMTPTransport.SentMessageInfo>
	constructor() {
		this.transporter = createTransport({
			host: "smtp.gmail.com",
			port: 465,
			secure: true,
			auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_KEY
			}
	    });
	}
	public async sendMail({to, subject, body, attachments}: MailOptions): Promise<void> {
		await this.transporter.sendMail({
			from: 'Harmony <bradofrado@gmail.com>', 
			to, 
			subject, 
			html: body, 
			attachments: attachments?.map(file => ({content: file.body, filename: file.name, contentType: file.type}))
		})
	}
}