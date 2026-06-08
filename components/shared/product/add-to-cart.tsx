'use client'
import { Cart, CartItem } from "@/types"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { addItemToCart, removeItemFromCart } from '@/lib/actions/cart.actions';
import {Plus, Minus, Loader} from 'lucide-react'
import {useTransition} from 'react'

const AddToCart = ({cart, item}: {item:CartItem, cart?:Cart}) => {

    const router = useRouter()

    const [isPending, startTransition] = useTransition()
    
    const handleAddToCart = async () => {
        startTransition(async () => {
            const res = await addItemToCart(item)

            if (!res.success) {
                console.log("failed to add to cart")
                return
            }
            console.log("Added to Cart")
        })
    }

    // Check if item is in cart
    const existItem = cart && cart.items.find((x) => x.productId === item.productId)

    // Handle remove from cart
    const handleRemoveFromCart = async () => {
        startTransition(async () => {
            const res = await removeItemFromCart(item.productId)
            console.log(res.success)
        })
    }

    return existItem ? (
        <div className="flex items-center gap-1 mt-4">
            <Button type="button" variant="outline" className="px-4 py-2" onClick={handleRemoveFromCart}>
                {isPending ? <Loader className="w-4 h-4 animate-spin" /> : <Minus className="h-2 w-2" />}
            </Button>
            <span className="px-2">{existItem.qty}</span>
            <Button type="button" variant="outline" className="px-4 py-2" onClick={handleAddToCart}>
                {isPending ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="h-2 w-2" />}
            </Button>
        </div>
    ) : (
        <Button className="w-full bg-black text-white hover:bg-gray-800" type="button" onClick={handleAddToCart}>
            {isPending ? <Loader className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add to Cart
        </Button>
    )
}

export default AddToCart