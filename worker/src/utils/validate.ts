// ─── Input Validation Utilities ─────────────────────────────
// Lightweight validation without external dependencies

export interface ValidationError {
  field: string;
  message: string;
}

export type Validator<T> = (input: unknown) => { ok: true; data: T } | { ok: false; errors: ValidationError[] };

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// ─── Auth Validators ────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export const validateLogin: Validator<LoginInput> = (input) => {
  const errors: ValidationError[] = [];
  if (!isObject(input)) return { ok: false, errors: [{ field: 'body', message: 'Invalid request body' }] };

  const { email, password } = input;
  if (!isString(email) || !email.includes('@') || email.length > 255) {
    errors.push({ field: 'email', message: 'Valid email required' });
  }
  if (!isString(password) || password.length < 6 || password.length > 128) {
    errors.push({ field: 'password', message: 'Password must be 6-128 characters' });
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, data: { email: (email as string).toLowerCase().trim(), password: password as string } };
};

export interface RegisterInput {
  email: string;
  password: string;
  display_name: string;
}

export const validateRegister: Validator<RegisterInput> = (input) => {
  const errors: ValidationError[] = [];
  if (!isObject(input)) return { ok: false, errors: [{ field: 'body', message: 'Invalid request body' }] };

  const { email, password, display_name } = input;
  if (!isString(email) || !email.includes('@') || email.length > 255) {
    errors.push({ field: 'email', message: 'Valid email required' });
  }
  if (!isString(password) || password.length < 8 || password.length > 128) {
    errors.push({ field: 'password', message: 'Password must be 8-128 characters' });
  }
  if (!isString(display_name) || display_name.trim().length < 1 || display_name.length > 100) {
    errors.push({ field: 'display_name', message: 'Display name required (1-100 chars)' });
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: {
      email: (email as string).toLowerCase().trim(),
      password: password as string,
      display_name: (display_name as string).trim(),
    },
  };
};

// ─── Resource Validators ────────────────────────────────────

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export const validateCreateWorkspace: Validator<CreateWorkspaceInput> = (input) => {
  const errors: ValidationError[] = [];
  if (!isObject(input)) return { ok: false, errors: [{ field: 'body', message: 'Invalid request body' }] };

  const { name, description, icon, color } = input;
  if (!isString(name) || name.trim().length < 1 || name.length > 100) {
    errors.push({ field: 'name', message: 'Name required (1-100 chars)' });
  }
  if (description !== undefined && (!isString(description) || description.length > 500)) {
    errors.push({ field: 'description', message: 'Description max 500 chars' });
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: {
      name: (name as string).trim(),
      description: isString(description) ? description.trim() : undefined,
      icon: isString(icon) ? icon.slice(0, 4) : undefined,
      color: isString(color) && /^#[0-9a-fA-F]{6}$/.test(color) ? color : undefined,
    },
  };
};

export interface CreateTableInput {
  name: string;
  description?: string;
}

export const validateCreateTable: Validator<CreateTableInput> = (input) => {
  const errors: ValidationError[] = [];
  if (!isObject(input)) return { ok: false, errors: [{ field: 'body', message: 'Invalid request body' }] };

  const { name, description } = input;
  if (!isString(name) || name.trim().length < 1 || name.length > 100) {
    errors.push({ field: 'name', message: 'Name required (1-100 chars)' });
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: {
      name: (name as string).trim(),
      description: isString(description) ? description.trim() : undefined,
    },
  };
};

export interface CreateRecordInput {
  data: Record<string, unknown>;
}

export const validateCreateRecord: Validator<CreateRecordInput> = (input) => {
  const errors: ValidationError[] = [];
  if (!isObject(input)) return { ok: false, errors: [{ field: 'body', message: 'Invalid request body' }] };

  const { data } = input;
  if (!isObject(data)) {
    errors.push({ field: 'data', message: 'Record data must be an object' });
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, data: { data: data as Record<string, unknown> } };
};

export interface UpdateRecordInput {
  data: Record<string, unknown>;
}

export const validateUpdateRecord: Validator<UpdateRecordInput> = (input) => {
  return validateCreateRecord(input) as ReturnType<Validator<UpdateRecordInput>>;
};

// ─── Pagination ─────────────────────────────────────────────

export interface PaginationInput {
  page: number;
  limit: number;
}

export function parsePagination(url: URL): PaginationInput {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10) || 50));
  return { page, limit };
}
