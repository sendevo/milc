# E2E Tests

These Playwright e2e tests require a proper graphics environment to run.

## Requirements

- **X11 libraries** for graphics rendering
- **Chromium dependencies** (libc, libx11, etc.)
- A display server (X11) or equivalent graphics environment

## Troubleshooting SIGSEGV Crashes

If you see `signal=SIGSEGV` errors, the browser is crashing due to missing graphics support.

### On Linux Servers without Graphics:

1. **Option A: Use a CI/CD Environment**
   - Run e2e tests on GitHub Actions, GitLab CI, etc., which provide proper graphics environments

2. **Option B: Use Docker**
   - Run Playwright in a Docker container with proper dependencies:
   ```bash
   docker run --init --rm -v $(pwd):/workspace -w /workspace mcr.microsoft.com/playwright:v1.40.0 npm run test:e2e
   ```

3. **Option C: Install Graphics Libraries** (if using Linux desktop)
   ```bash
   # Ubuntu/Debian
   sudo apt install libx11-6 libx11-xcb1 libxcb1

   # RedHat/CentOS
   sudo yum install libX11 libX11-xcb libxcb
   ```

## Skipping E2E Tests Locally

To skip e2e tests during development:
```bash
# Run unit tests only
npm test

# Or set environment variable
SKIP_E2E=1 npm run test:e2e
```
