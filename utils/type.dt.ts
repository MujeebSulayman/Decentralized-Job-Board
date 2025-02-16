// Enums matching Solidity contract
export enum WorkMode {
  Remote = 0,
  Onsite = 1,
  Hybrid = 2
}

export enum JobType {
  FullTime = 0,
  PartTime = 1,
  Internship = 2,
  Freelance = 3,
  Contract = 4
}

export enum ApplicationState {
  Submitted = 0,
  Reviewed = 1,
  EmailSent = 2,
  Closed = 3
}

export interface CustomField {
  fieldName: string;
  isRequired: boolean;
}

export interface JobStruct {
  id?: number;
  employer: string;
  orgName: string;
  title: string;
  description: string;
  orgEmail: string;
  customField: CustomField[];
  logoCID: string;
  isOpen: boolean;
  deleted: boolean;
  startTime: number;
  endTime: number;
  expirationTime: number;
  expired: boolean;
  jobType: JobType;
  workMode: WorkMode;
  minimumSalary: string;
  maximumSalary: string;
}

export interface ApplicationStruct {
  jobId: number;
  applicant: string;
  name: string;
  email: string;
  phoneNumber: string;
  location: string;
  fieldResponse: string[];
  cvCID: string;
  workMode: WorkMode;
  jobType: JobType;
  minimumSalary: string;
  maximumSalary: string;
  applicationTimestamp: number;
  currentState: ApplicationState;
}

export interface JobPostParams {
  id?: number;
  orgName: string;
  title: string;
  description: string;
  orgEmail: string;
  logoCID: string;
  fieldName: string[];
  isRequired: boolean[];
  jobType: JobType;
  workMode: WorkMode;
  minimumSalary: string;
  maximumSalary: string;
  expirationDays: number;
}
