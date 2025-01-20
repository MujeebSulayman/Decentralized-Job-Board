# HemBoard: Decentralized Job Marketplace 🌐💼

## Overview
HemBoard is a cutting-edge, blockchain-powered job marketplace that revolutionizes how employers and job seekers connect, offering transparency, security, and efficiency through smart contract technology.

## 🚀 Key Features

### Smart Contract Capabilities
- **Flexible Job Posting**: Create detailed job listings with custom fields
- **Secure Application Management**: Track and manage job applications on-chain
- **Work Mode Flexibility**: Support for remote, onsite, and hybrid work modes
- **Comprehensive Job Types**: 
  - Full-time
  - Part-time
  - Internship
  - Freelance
  - Contract

### Technical Highlights
- Built on Solidity 0.8.28
- Leverages OpenZeppelin's security libraries
- Implements Ownable and ReentrancyGuard for enhanced security
- Supports IPFS integration for job logos and CVs (via Content Identifiers)

## 🛡️ Security Features
- Owner-controlled service fee management
- Job deletion and closure controls
- Application state tracking
- Reentrancy protection

## 🔐 Access Control and Role Management

### Roles
HemBoard implements a comprehensive role-based access control system with three primary roles:

1. **Admin Role**
   - Highest level of access
   - Automatically granted all roles upon contract deployment
   - Can perform all actions across the platform
   - Manages job postings, applications, and system settings

2. **Employer Role**
   - Can post and manage their own jobs
   - Track and update job applications
   - Modify job listings

3. **Job Manager Role**
   - Oversee job-related operations
   - Can manage applications and job statuses
   - Supports administrative workflows

### Role Assignment
- Admin is automatically granted Admin, Employer, and Job Manager roles
- Employers receive the Employer role when posting a job
- Job Managers can be explicitly granted their role by the Admin

### Access Control Principles
- Granular permission management
- Secure role-based access
- Flexible administrative controls
- Transparent role assignment

## 📋 Job Posting Attributes
- Unique job ID
- Employer address
- Organization details
- Job description
- Custom fields
- Salary range
- Work mode
- Job type

## 🔍 Application Workflow
1. Job Posting
2. Application Submission
3. Application State Management
   - Submitted
   - Reviewed
   - Email Sent
   - Closed

## 💻 Tech Stack
- Solidity
- Ethereum
- IPFS
- Next.js
- Hardhat
- Wagmi
- RainbowKit

## 🚧 Planned Enhancements
- Advanced job matching algorithms
- Reputation scoring system
- Enhanced communication tools
- Skill verification mechanisms

## 📦 Installation

### Prerequisites
- Node.js 16+
- Ethereum Wallet
- Hardhat

### Setup
```bash
# Clone the repository
git clone https://github.com/MujeebSulayman/Web3-Job-Board

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat run scripts/deploy.js
```

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## 📄 License
This project is licensed under [MIT] - see the LICENSE file for details.

## 💡 Contact
- Project Developer: Mujeeb Sulayman
- Email: Sulaymanmujeeb6@gmail.com
- Twitter: [@thehemjay](https://x.com/thehemjay)

---

**Disclaimer**: HemBoard is a decentralized application. Always do your own research and understand the risks involved in blockchain technologies.