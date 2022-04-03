import { Priority, Status } from '@src/task/task.entity';

export const MUST_BE_STRING_MESSAGE = 'a string';
export const MUST_BE_INT_MESSAGE = 'an integer number';
export const MUST_BE_ENUM_MESSAGE = 'a valid enum value';
export type ExpectedType = 'string' | 'int' | 'enum';

export function getErrorMessages(
  value: string | number | boolean | Priority | Status | undefined | null,
  parameterName: string,
  expectedType: ExpectedType,
): string[] {
  const errorMessages: string[] = [];

  if (value === null || value === undefined || value === '') {
    errorMessages.push(`${parameterName} should not be empty`);
  }

  if (typeof value !== expectedType) {
    errorMessages.push(`${parameterName} must be ${getNotExpectedTypeMessage(expectedType)}`);
  }

  return errorMessages;
}

function getNotExpectedTypeMessage(
  expected: ExpectedType,
): typeof MUST_BE_STRING_MESSAGE | typeof MUST_BE_INT_MESSAGE | typeof MUST_BE_ENUM_MESSAGE {
  switch (expected) {
    case 'string':
      return MUST_BE_STRING_MESSAGE;
    case 'int':
      return MUST_BE_INT_MESSAGE;
    case 'enum':
      return MUST_BE_ENUM_MESSAGE;
  }
}
