'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

const AdminSearch = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const formActionUrl = pathname.includes('/admin/orders')
    ? '/admin/orders'
    : pathname.includes('/admin/users')
      ? '/admin/users'
      : '/admin/products';

  return (
    <form action={formActionUrl} method='GET'>
      <Input
        key={searchParams.get('query')}
        type='search'
        placeholder='Search...'
        name='query'
        defaultValue={searchParams.get('query') || ''}
        className='md:w-[100px] lg:w-[300px]'
      />
      <Button className='sr-only' type='submit'>
        Search
      </Button>
    </form>
  );
};

export default AdminSearch;
