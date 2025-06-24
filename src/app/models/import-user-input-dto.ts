export interface ImportUserInputDto {
  company:      string;  // exactly the “Company” column from Excel
  locationCode: string;  // 4-char code
  firstName:    string;
  lastName:     string;
  email:        string;
  employeeId:   string;
  role:         string;
  printer:      string;
  activate:     string;  // "true" or "false"
  comments:     string;
}
