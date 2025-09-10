
'use client';
import 'swagger-ui-react/swagger-ui.css';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';


// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocs() {
  const [swaggerSpec, setSwaggerSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    fetch('/api/swagger')
      .then(response => response.json())
      .then(data => {
        setSwaggerSpec(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Documentation</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {swaggerSpec && (
          <div className="swagger-ui-wrapper">
            <SwaggerUI 
              spec={swaggerSpec}
              docExpansion="list"
              defaultModelsExpandDepth={2}
              defaultModelExpandDepth={2}
              tryItOutEnabled={true}
              supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch']}
              deepLinking={true}
              displayOperationId={false}
              displayRequestDuration={true}
              filter={true}
              showExtensions={true}
              showCommonExtensions={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
