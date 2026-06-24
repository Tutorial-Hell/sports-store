'use client';

import dynamic from 'next/dynamic';

const UpdateUserForm = dynamic(() => import('./update-user-form'), { ssr: false });

export default UpdateUserForm;
