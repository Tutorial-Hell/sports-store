import Link from "next/link"
import Image from "next/image"
import {Card, CardHeader, CardContent} from "@/components/ui/card"
import ProductPrice from "./product-price"
import AddToCart from "./add-to-cart"
import { Product } from '@/types'


const ProductCard = ({product}: {product: Product }) => {
    return (  <Card className="w-full max-w-sm">

                  <CardHeader className="p-0 items-center">
                    <Link href={`/product/${product.slug}`}>
                      {product.images[0] && (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          height={300}
                          width={300}
                          priority={true} />
                      )}
                    </Link>
                  </CardHeader>
                  <CardContent className="p-4 grid gap-4">
                    <div className="text-xs">{product.brand}</div>
                    <Link href={`/product/${product.slug}`}>
                      <h2 className="text-sm font-medium">{product.name}</h2>
                    </Link>
                    <div className="flex-between gap-4">
                        <p>{product.rating} Stars</p>
                        { product.stock > 0 ? (
                            <ProductPrice value={Number(product.price)}/>
                        ) : (
                            <p className="text-destructive">Out Of Stock</p>
                        )}
                    </div>
                    { product.stock > 0 && (
                        <AddToCart item={{
                            productId: product.id,
                            name: product.name,
                            slug: product.slug,
                            qty: 1,
                            image: product.images[0],
                            price: product.price,
                        }} />
                    )}
                  </CardContent>
                </Card>);
}
 
export default ProductCard;