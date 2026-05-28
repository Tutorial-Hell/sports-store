import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingCart, UserIcon, EllipsisVertical } from 'lucide-react';
import ModeToggle from './mode-toggle';
import { Sheet, SheetTitle, SheetDescription, SheetTrigger, SheetContent} from '@/components/ui/sheet'

const Menu = () => {
    return ( <div className="flex justify-end gap-3">
                <nav className="hidden md:flex w-full max-w-xs gap-1">
                    <ModeToggle />
                        <Button asChild variant="ghost">
                            <Link href="/cart">
                                <ShoppingCart /> Cart
                            </Link>
                         </Button>
                         <Button asChild className="bg-black text-white hover:bg-black/80 dark:bg-primary dark:text-primary-foreground dark:[a]:hover:bg-primary/80">
                            <Link href="/sign-in">
                             <UserIcon /> Sign In
                             </Link>
                         </Button>
                </nav>
                <nav className="md:hidden">
                    <Sheet>
                        <SheetTrigger className="align-middle">
                            <EllipsisVertical />
                        </SheetTrigger>
                        <SheetContent className="flex flex-col items-start">
                            <SheetTitle>Menu</SheetTitle>
                            <ModeToggle />
                            <Button asChild variant="ghost">
                                <Link href="/cart">
                                  <ShoppingCart /> Cart
                                </Link>
                            </Button>
                            <Button asChild className="bg-black text-white hover:bg-black/80 dark:bg-primary dark:text-primary-foreground dark:[a]:hover:bg-primary/80">
                                <Link href="/sign-in">
                                    <UserIcon /> Sign In
                                </Link>
                            </Button>
                        </SheetContent>
                    </Sheet>
                </nav>
    </div> );
}
 
export default Menu;
