import { getSwaggerSpec } from '../../../lib/swagger';

export async function GET() {
  const spec = getSwaggerSpec();
  return Response.json(spec);
}
