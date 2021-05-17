import Cart from 'models/cart'
import Domain from 'models/domain'
import connectDB from 'middleware/mongodb'

const handler = async (req, res) => {
  const user = req.payload.id
  const carts = await Cart.find({user}).lean()
  console.log("checkout", carts)
  let carts_failed = []
  console.log("checkout api")
  for(let cart of carts){
      
    let domain = await Domain.findOne({name: cart.domain})
    if(!domain){
      console.log("create new domain", cart.domain)
      domain = new Domain({name: cart.domain, price:50, status:"Taken", user})
      await domain.save()
      await Cart.deleteOne({_id: cart._id})
//      await Promise.all( domain.save(), Cart.deleteOne({_id: cart._id}) )
    }
    else if(domain.status == "Available" || domain.status == "Taken"){
      domain.status = "Taken"
      domain.user = user
      await Promise.all( [ domain.save(), Cart.deleteOne({_id: cart._id}) ] )
      console.log("change domain status", domain)
    }
    else{
      carts_failed.push(cart.domain)
      await Cart.deleteOne({_id: cart._id})
    }
  }
  if(carts_failed.length == 0)
    res.status(200).json({type: "success"})
  else
    res.status(200).json({type: "fail", carts_failed})
}

export default connectDB(handler, "auth")