'use client'
import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'



const ProductImages = ({images}: {images: string[]}) => {

    const validImages = images.filter(Boolean)
    const [current, setCurrent] = useState(0)

    if (!validImages.length) return null

    return (<>
        <div className="space-y-4">
            <Image src={validImages[current]}
                   alt='product image'
                   width={1000}
                   height={1000}
                   className="min-h-[300px] object-cover object-center" />
          <div className="flex">
            {validImages.map((image, index) => (
                <div key={image} 
                     onClick={() => setCurrent(index)} 
                     className={cn('border mr-2 cursor-pointer hover:border-orange-600', 
                       current === index && 'border-orange-500')}>
                    <Image src={image} alt='image' width={100} height={100}/>
                </div>
                
            )
        )}
          </div>
        </div>
    </> );
}
 
export default ProductImages;