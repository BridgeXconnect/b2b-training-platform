# 🔒 STABLE CONFIGURATION - DO NOT MODIFY

## ⚠️ CRITICAL: Frontend Stability Settings

**These configuration settings ensure reliable frontend startup and MUST NOT be changed during development.**

### Key Stable Dependencies (package.json)
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1", 
  "next": "^14.2.10",
  "@types/react": "^18.3.14",
  "@types/react-dom": "^18.3.1",
  "eslint-config-next": "^14.2.10"
}
```

### Critical Configuration Files

#### next.config.js (MUST remain .js, not .ts)
```javascript
const nextConfig = {
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
};
```

#### tsconfig.json - Key Settings
```json
{
  "target": "es5",
  "moduleResolution": "node",
  "baseUrl": "."
}
```

#### package.json - Scripts
```json
{
  "dev": "NODE_ENV=development next dev",
  "build": "NODE_ENV=production next build"
}
```

### React Hook Form Pattern (components/sales/ClientRequestForm.tsx)
```typescript
useFieldArray({
  control,
  name: 'fieldPath' as any,  // Use 'as any' for nested paths
});
```

### Font Configuration (app/layout.tsx)
```typescript
import { Inter } from "next/font/google";  // Use Inter, not Geist
```

### Temporarily Disabled
- CopilotKit integration (commented out in app/layout.tsx)
- Turbopack flag (not available in Next.js 14)

## 🚨 What NOT to Change

1. **React/Next.js versions** - Downgraded for stability
2. **next.config.js format** - Must be .js not .ts for Next.js 14
3. **TypeScript moduleResolution** - Must be "node" 
4. **Font imports** - Must use Inter, not Geist
5. **React Hook Form typing** - Use 'as any' for nested paths
6. **Dependency overrides** - Removed all conflict-causing overrides

## ✅ Verification

Frontend should start successfully with:
```bash
npm run dev
```

Expected output:
```
▲ Next.js 14.2.30
- Local:        http://localhost:3000
✓ Ready in ~1.4s
```

## 📊 Status

- **Frontend**: ✅ Stable (http://localhost:3000)
- **Backend**: ✅ Stable (http://localhost:8000)
- **Git**: ✅ Committed in e88d315
- **Last Updated**: 2025-07-20

---

**⚠️ BREAKING THESE SETTINGS WILL CAUSE ERR_CONNECTION_REFUSED ERRORS**

*Committed in: e88d315 - fix: stabilize frontend configuration for reliable startup*