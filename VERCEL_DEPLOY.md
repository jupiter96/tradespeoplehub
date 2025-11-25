# Vercel 배포 가이드

이 프로젝트를 Vercel에 배포하기 위한 상세 가이드입니다.

## 필수 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수들을 설정해야 합니다:

### 필수 변수
- `MONGODB_URI` - MongoDB 연결 문자열
- `SESSION_SECRET` - 세션 암호화를 위한 시크릿 키 (랜덤 문자열 권장)
- `NODE_ENV` - `production`으로 설정

### 클라이언트 관련
- `CLIENT_ORIGIN` - 프론트엔드 도메인 (예: `https://your-domain.vercel.app`)
- `CLIENT_ORIGINS` - 여러 도메인 허용 시 (쉼표로 구분)
- `CLIENT_ORIGIN_WHITELIST` - 대체 옵션

### 소셜 로그인 (선택사항)
- `GOOGLE_CLIENT_ID` - Google OAuth 클라이언트 ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth 클라이언트 시크릿
- `GOOGLE_CALLBACK_URL` - Google OAuth 콜백 URL (예: `https://your-domain.vercel.app/api/auth/google/callback`)

- `FACEBOOK_CLIENT_ID` - Facebook OAuth 앱 ID
- `FACEBOOK_CLIENT_SECRET` - Facebook OAuth 앱 시크릿
- `FACEBOOK_CALLBACK_URL` - Facebook OAuth 콜백 URL (예: `https://your-domain.vercel.app/api/auth/facebook/callback`)

### 리다이렉트 URL (선택사항)
- `SOCIAL_SUCCESS_REDIRECT` - 소셜 로그인 성공 후 리다이렉트 URL
- `SOCIAL_FAILURE_REDIRECT` - 소셜 로그인 실패 후 리다이렉트 URL
- `SOCIAL_ONBOARDING_REDIRECT` - 소셜 로그인 온보딩 URL
- `PASSWORD_RESET_URL` - 비밀번호 재설정 URL

### 이메일/SMS (선택사항)
- `SMTP_HOST` - SMTP 서버 호스트
- `SMTP_PORT` - SMTP 포트
- `SMTP_USER` - SMTP 사용자명
- `SMTP_PASS` - SMTP 비밀번호
- `EMAIL_FROM` - 발신 이메일 주소
- `TWILIO_ACCOUNT_SID` - Twilio 계정 SID
- `TWILIO_AUTH_TOKEN` - Twilio 인증 토큰
- `TWILIO_FROM_NUMBER` - Twilio 발신 번호

## 배포 단계

### 1. Vercel CLI를 사용한 배포

```bash
# Vercel CLI 설치 (전역)
npm i -g vercel

# 프로젝트 루트에서 로그인
vercel login

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 2. GitHub 연동을 통한 배포

1. GitHub에 프로젝트 푸시
2. Vercel 대시보드에서 "New Project" 클릭
3. GitHub 저장소 선택
4. 프로젝트 설정:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (프로젝트 루트)
   - **Build Command**: `npm run build:client`
   - **Output Directory**: `client/build`
5. 환경 변수 설정 (위의 필수 환경 변수 섹션 참조)
6. "Deploy" 클릭

## 프로젝트 구조

```
server/
├── api/
│   └── index.js          # Vercel serverless function 진입점
├── client/
│   └── build/            # 빌드된 React 앱 (배포 시 생성)
├── routes/               # API 라우트
├── models/               # MongoDB 모델
├── services/             # 서비스 로직
├── server.js             # Express 앱
├── vercel.json           # Vercel 설정 파일
└── package.json
```

## 라우팅 구조

- `/api/*` → Express 서버리스 함수로 라우팅
- `/uploads/*` → Express 서버리스 함수로 라우팅 (파일 업로드)
- 정적 파일 (JS, CSS, 이미지 등) → `client/build`에서 제공
- 기타 모든 경로 → `client/build/index.html` (SPA 라우팅)

## 주의사항

### 파일 업로드
- Vercel의 서버리스 환경에서는 로컬 파일시스템에 파일을 저장할 수 없습니다.
- 프로덕션 환경에서는 다음 중 하나를 사용해야 합니다:
  - AWS S3
  - Cloudinary
  - Vercel Blob Storage
  - 기타 클라우드 스토리지 서비스

### MongoDB 연결
- MongoDB 연결은 서버리스 환경에 최적화되어 있습니다.
- 연결이 캐시되어 여러 함수 호출 간 재사용됩니다.

### 세션 관리
- 세션은 MongoDB에 저장됩니다 (`connect-mongo` 사용).
- 쿠키는 프로덕션 환경에서 `secure: true`, `sameSite: 'none'`으로 설정됩니다.

## 트러블슈팅

### 빌드 실패
- `client/build` 디렉토리가 생성되는지 확인
- `npm run build:client` 명령이 로컬에서 정상 작동하는지 확인

### API 요청 실패
- 환경 변수가 올바르게 설정되었는지 확인
- CORS 설정이 올바른지 확인 (`CLIENT_ORIGIN` 환경 변수)
- Vercel 함수 로그 확인 (Vercel 대시보드 > Functions > Logs)

### MongoDB 연결 실패
- `MONGODB_URI` 환경 변수가 올바른지 확인
- MongoDB Atlas의 경우 IP 화이트리스트에 Vercel IP 추가 (또는 0.0.0.0/0 허용)

### 정적 파일이 로드되지 않음
- `client/build` 디렉토리가 빌드되었는지 확인
- `vercel.json`의 라우팅 규칙 확인

## 로컬 테스트

Vercel 환경을 로컬에서 테스트하려면:

```bash
# Vercel CLI 설치
npm i -g vercel

# 로컬 개발 서버 실행
vercel dev
```

이 명령은 Vercel 환경을 시뮬레이션하여 로컬에서 테스트할 수 있게 해줍니다.

