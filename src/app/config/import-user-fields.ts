import { ImportUserInputDto } from '../models/import-user-input-dto';

export interface ImportField {
  prop: keyof ImportUserInputDto;
  display: string;
  required: boolean;
}

export const IMPORT_USER_FIELDS: ImportField[] = [
  { prop: 'company',      display: 'Company',       required: true },
  { prop: 'locationCode', display: 'Location Code', required: false },
  { prop: 'firstName',    display: 'First Name',    required: true },
  { prop: 'lastName',     display: 'Last Name',     required: true },
  { prop: 'employeeId',   display: 'Employee Id',   required: false },
  { prop: 'email',        display: 'Email',         required: true },
  { prop: 'role',         display: 'Role',          required: true },
  { prop: 'printer',      display: 'Printer',       required: true },
  { prop: 'activate',     display: 'Activate Now',  required: false },
  { prop: 'comments',     display: 'Comments',      required: false }
];
