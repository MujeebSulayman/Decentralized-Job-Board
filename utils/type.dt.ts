// Enums matching Solidity contract
export enum WorkMode {
   Remote = 'Remote',
   Onsite = 'Onsite',
   Hybrid = 'Hybrid'
 }
 
 export enum JobType {
   FullTime = 'FullTime',
   PartTime = 'PartTime',
   Internship = 'Internship',
   Freelance = 'Freelance',
   Contract = 'Contract'
 }
 
 export enum ApplicationState {
   Submitted = 'Submitted',
   Reviewed = 'Reviewed',
   EmailSent = 'EmailSent',
   Closed = 'Closed'
 }
 
 // Custom Field Type
 export interface CustomField {
   fieldName: string;
   isRequired: boolean;
 }
 
 // Job Struct Type
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
 
 // Application Struct Type
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
 
 // Job Posting Parameters
 export interface JobPostParams {
   orgName: string;
   title: string;
   description: string;
   orgEmail: string;
   logoCID: string;
   customField: CustomField[];
   jobType: JobType;
   workMode: WorkMode;
   minimumSalary: string;
   maximumSalary: string;
   expirationDays: number;
 }
 