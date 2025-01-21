// Enums matching Solidity contract
export enum WorkMode {
  Remote = "Remote",
  Onsite = "Onsite",
  Hybrid = "Hybrid",
}

export enum JobType {
  FullTime = "FullTime",
  PartTime = "PartTime",
  Internship = "Internship",
  Freelance = "Freelance",
  Contract = "Contract",
}

export enum ApplicationState {
  Submitted = "Submitted",
  Reviewed = "Reviewed",
  EmailSent = "EmailSent",
  Closed = "Closed",
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
