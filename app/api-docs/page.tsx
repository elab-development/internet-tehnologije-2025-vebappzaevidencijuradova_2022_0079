'use client';

import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
    const [spec, setSpec] = useState(null);

    useEffect(() => {
        fetch('/api/swagger-spec')
            .then((res) => res.json())
            .then((data) => setSpec(data));
    }, []);

    if (!spec) return <div className="p-10">Učitavanje dokumentacije...</div>;

    return (
        <div className="bg-white min-h-screen">
            <SwaggerUI spec={spec} />
        </div>
    );
}