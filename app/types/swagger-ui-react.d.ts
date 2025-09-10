declare module 'swagger-ui-react' {
  import * as React from 'react';
  interface SwaggerUIProps {
    spec?: any;
    url?: string;
    docExpansion?: string;
    defaultModelsExpandDepth?: number;
    defaultModelExpandDepth?: number;
    tryItOutEnabled?: boolean;
    supportedSubmitMethods?: string[];
    deepLinking?: boolean;
    displayOperationId?: boolean;
    displayRequestDuration?: boolean;
    filter?: boolean;
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    [key: string]: any;
  }
  const SwaggerUI: React.FC<SwaggerUIProps>;
  export default SwaggerUI;
}
