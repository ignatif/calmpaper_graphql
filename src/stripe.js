const stipeNode = require('stripe')

const stripe = stipeNode(process.env.STRIPE_SECRET_KEY)

export default stripe
