'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLoading } from '../contexts/LoadingContext';

export default function NavigationLoader() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { setLoading } = useLoading();

    useEffect(() => {
        setLoading(false);
    }, [pathname, searchParams, setLoading]);

    return null;
} 