const sgMail = require('@sendgrid/mail')

const fromEmail = 'jonathanfelsilva@gmail.com'
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const enviarEmailBoasVindas = (email, name) => {
    sgMail.send({
        to: email,
        from: fromEmail,
        subject: `Bem-vindo(a), ${name}!`,
        text: 'É muito bom ter você conosco!'
    })
}

const enviarEmailCancelamento = (email, name) => {
    sgMail.send({
        to: email,
        from: fromEmail,
        subject: `É uma pena ver você partir!`,
        text: `Ficamos tristes em ver você partir, ${name}. Por favor, nos diga o motivo.`
    })
}

// sgMail.send({
//     to: 'jonathan.silva@ideagri.com.br',
//     from: 'jonathanfelsilva@gmail.com',
//     subject: 'Teste de primeiro e-mail',
//     text: 'Espero que funcione!'
// })

module.exports = { enviarEmailBoasVindas, enviarEmailCancelamento }


