# 🐛 AI Bug Hunter & Code Analyzer SaaS Platform

A comprehensive AI-powered code analysis platform that detects security vulnerabilities, bugs, and provides improvement suggestions for multiple programming languages.

## 🚀 Features

### **Code Analysis Engine**
- **18 Programming Languages Supported**: Python, JavaScript, TypeScript, Java, C++, C, C#, PHP, Ruby, Go, Rust, YAML, JSON, XML, HTML, CSS, Bash, SQL
- **Security Vulnerability Detection**: SQL injection, code injection, XSS, hardcoded credentials
- **Performance Analysis**: Bottlenecks, infinite loops, optimization opportunities  
- **Code Quality Assessment**: Style, maintainability, best practices
- **Real-time Analysis**: Instant feedback with detailed suggestions

### **SaaS Platform Features**
- **Multi-Tier Subscription System**: Free, Basic ($9/month), Pro ($19/month), Enterprise ($49/month)
- **Stripe Payment Integration**: Secure payment processing with direct payment links
- **Email Automation**: Welcome emails, trial notifications, subscription management via MailChimp
- **User Authentication**: Demo system with planned Firebase integration
- **Admin Dashboard**: User management, analytics, email testing tools
- **Responsive Design**: Mobile-friendly interface with modern UI/UX

### **Analysis Capabilities**
- **File Upload**: Drag-and-drop support for code files up to 10MB
- **Direct Code Input**: Paste code directly for instant analysis  
- **Security Scoring**: 0-100 security and quality ratings
- **Issue Categorization**: Critical, High, Medium, Low severity levels
- **Actionable Suggestions**: Specific recommendations for fixing detected issues
- **Analysis History**: Track previous analyses and improvements

## 🛠️ Technology Stack

### **Backend**
- **Framework**: FastAPI (Python)
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT tokens with planned Firebase integration
- **Payment Processing**: Stripe with webhook integration
- **Email Service**: MailChimp Marketing API
- **Analysis Engine**: Pattern-based detection with AI integration ready

### **Frontend**  
- **Framework**: React 18 with hooks
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives with shadcn/ui
- **Routing**: React Router DOM
- **State Management**: Context API with local state
- **Build Tool**: Create React App with Craco

### **Infrastructure**
- **Deployment**: Emergent platform ready
- **Process Management**: Supervisor for service orchestration
- **Environment**: Docker containerized
- **Monitoring**: Health check endpoints and logging

## 🔧 Quick Start

### **Prerequisites**
- Python 3.11+
- Node.js 18+
- MongoDB
- Yarn package manager

### **Installation**

1. **Clone the repository**
```bash
git clone <repository-url>
cd ai-bug-hunter
```

2. **Backend Setup**
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials
pip install -r requirements.txt
```

3. **Frontend Setup** 
```bash
cd frontend
cp .env.example .env
# Edit .env with backend URL
yarn install
```

4. **Start Services**
```bash
# Backend (from backend directory)
python server.py

# Frontend (from frontend directory) 
yarn start
```

### **Environment Configuration**

Create `.env` files based on the examples:

**Backend (.env)**:
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="ai_bug_hunter"
STRIPE_API_KEY="your_stripe_secret_key"
MAILCHIMP_API_KEY="your_mailchimp_key"
EMERGENT_LLM_KEY="your_llm_key"
```

**Frontend (.env)**:
```env
REACT_APP_BACKEND_URL="https://your-backend-url.com"
```

## 📊 API Documentation

### **Core Endpoints**

#### **Analysis**
- `POST /api/analyze/text` - Analyze code from text input
- `POST /api/analyze/upload` - Analyze uploaded code files
- `GET /api/analysis/result/{id}` - Get analysis results
- `GET /api/analysis/history` - Get user's analysis history

#### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

#### **Subscriptions**
- `GET /api/subscription/plans` - Get available subscription plans
- `GET /api/subscription/tiers` - Get subscription tiers for checkout
- `POST /api/subscription/checkout` - Create subscription checkout

#### **System**  
- `GET /api/supported-languages` - Get supported programming languages
- `GET /api/analysis-types` - Get available analysis types
- `GET /api/mailchimp/health` - Check email service health

### **Request/Response Examples**

**Text Analysis Request:**
```json
{
  "file_content": "def login(user, pwd): return eval(f\"SELECT * WHERE user='{user}'\")",
  "file_type": "python",
  "analysis_type": "comprehensive"
}
```

**Analysis Response:**
```json
{
  "id": "analysis-uuid",
  "security_score": 20,
  "code_quality_score": 80,
  "issues": [
    {
      "type": "security",
      "severity": "critical", 
      "description": "SQL Injection vulnerability detected",
      "suggestion": "Use parameterized queries"
    }
  ],
  "suggestions": [
    {
      "category": "Security",
      "description": "Always validate and sanitize user inputs",
      "impact": "High"
    }
  ]
}
```

## 🔐 Security Features

### **Vulnerability Detection**
- **SQL Injection**: Detects unsafe query construction
- **Code Injection**: Identifies eval/exec usage with user input
- **XSS Prevention**: Flags unsafe DOM manipulation
- **Credential Exposure**: Finds hardcoded passwords/API keys
- **Command Injection**: Catches unsafe system calls

### **Security Best Practices**
- Environment variable management
- Input validation and sanitization
- Secure error handling
- Rate limiting ready
- CORS configuration

## 💰 Subscription Plans

| Feature | Free | Basic ($9/mo) | Pro ($19/mo) | Enterprise ($49/mo) |
|---------|------|---------------|--------------|---------------------|
| **Monthly Analyses** | 5 | 50 | 200 | Unlimited |
| **File Upload** | ✅ | ✅ | ✅ | ✅ |
| **Security Scanning** | Basic | Advanced | Advanced | Advanced |
| **Languages Supported** | All 18 | All 18 | All 18 | All 18 |
| **Email Support** | ❌ | ✅ | ✅ | ✅ |
| **Priority Support** | ❌ | ❌ | ✅ | ✅ |
| **API Access** | ❌ | ❌ | ✅ | ✅ |
| **Team Features** | ❌ | ❌ | ❌ | ✅ |
| **Custom Integrations** | ❌ | ❌ | ❌ | ✅ |

## 🚀 Deployment

### **Emergent Platform** (Recommended)
1. Configure environment variables in dashboard
2. Click "Deploy Now" 
3. Access via provided URL
4. Configure custom domain (optional)

### **Manual Deployment**
```bash
# Build frontend
cd frontend && yarn build

# Start production services  
cd .. && python backend/server.py
```

### **Environment Variables for Production**
- Set all `.env` variables in your deployment platform
- Use production MongoDB connection string
- Configure production Stripe keys
- Set production email service credentials

## 🧪 Testing

### **Backend Testing**
```bash
cd backend
python -m pytest tests/
```

### **Frontend Testing**
```bash  
cd frontend
yarn test
```

### **API Testing**
```bash
# Health check
curl https://your-app.com/api/

# Test analysis
curl -X POST https://your-app.com/api/analyze/text \
  -H "Content-Type: application/json" \
  -d '{"file_content": "test code", "file_type": "python"}'
```

## 📈 Analytics & Monitoring

- **User Analytics**: Registration, subscription conversion rates
- **Analysis Metrics**: Most analyzed languages, common vulnerabilities
- **Performance Monitoring**: API response times, error rates
- **Health Checks**: Service availability, external integrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)  
5. Open a Pull Request

### **Development Guidelines**
- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure security best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and API docs
- **Issues**: Create GitHub issues for bugs/features
- **Email**: Contact support for subscription or technical issues
- **Community**: Join discussions in issues/discussions

## 🗺️ Roadmap

### **Upcoming Features**
- **Advanced AI Integration**: GPT-4/Claude integration for deeper analysis
- **IDE Integrations**: VS Code, IntelliJ plugins
- **Team Collaboration**: Shared projects, code reviews
- **CI/CD Integration**: GitHub Actions, Jenkins plugins
- **Advanced Reporting**: PDF exports, compliance reports
- **Custom Rules**: User-defined security patterns
- **Real-time Collaboration**: Live code review sessions

### **Platform Improvements**
- **Performance Optimization**: Faster analysis, caching
- **Mobile App**: Native iOS/Android applications
- **Enterprise SSO**: SAML, OAuth2 integration
- **Advanced Analytics**: Detailed reporting dashboards
- **API Rate Limiting**: Fair usage policies
- **Multi-language Support**: Internationalization

---

**Built with ❤️ for developers who care about code quality and security**

*AI Bug Hunter - Making code safer, one analysis at a time* 🛡️