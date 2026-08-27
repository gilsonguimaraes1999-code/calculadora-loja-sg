export type ManualUserRole = "admin" | "member";

export type ManualUserForm = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  role: string;
};

export type ManualUserInput = {
  name: string;
  email: string;
  password: string;
  role: ManualUserRole;
};

export function validateManualUser(input: ManualUserForm): ManualUserInput;
