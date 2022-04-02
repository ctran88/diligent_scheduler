import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

export function buildSwaggerOptions(): Omit<OpenAPIObject, 'paths'> {
  const swaggerOptions = new DocumentBuilder()
    .setTitle('Diligent Scheduler Service API')
    .setDescription('Diligent Scheduler Service API')
    .setVersion('1.0');

  return swaggerOptions.build();
}
