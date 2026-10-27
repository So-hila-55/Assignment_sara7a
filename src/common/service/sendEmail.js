
import nodemailer from "nodemailer"

let transporter

const getTransporter = async () => {
    if (transporter) return transporter

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        })
    } else {
        const testAccount = await nodemailer.createTestAccount()
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            auth: { user: testAccount.user, pass: testAccount.pass },
        })
    }
    return transporter
}

const sendEmail = async ({ to, subject, html, attachments = [] } = {}) => {
    const mailer = await getTransporter()
    const info = await mailer.sendMail({
        from: '"Saraha App" <no-reply@saraha.app>',
        to,
        subject,
        html: html || "<b>Hello</b>",
        attachments,
    })

    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) console.log("Preview email:", previewUrl)

    return info
}

export default sendEmail