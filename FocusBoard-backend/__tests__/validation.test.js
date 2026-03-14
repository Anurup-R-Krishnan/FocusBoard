const { loginUserSchema, createTaskSchema } = require('../middleware/validation');

describe('validation schemas', () => {
  test('loginUserSchema accepts valid payload', () => {
    const result = loginUserSchema.parse({
      email_id: 'student@example.com',
      password: 'Password123!',
    });
    expect(result.email_id).toBe('student@example.com');
  });

  test('loginUserSchema rejects invalid email', () => {
    expect(() =>
      loginUserSchema.parse({ email_id: 'not-an-email', password: 'x' })
    ).toThrow();
  });

  test('createTaskSchema accepts optional fields', () => {
    const result = createTaskSchema.parse({
      title: 'Task',
      priority: 'HIGH',
      timeSpent: 15,
      billable: false,
    });
    expect(result.title).toBe('Task');
    expect(result.priority).toBe('HIGH');
  });
});
