# Playwright Framework Prompts

## Create Framework

Uso: Build client starter framework.  
Prompt: Generate a Playwright + TypeScript framework with POM, fixtures, API client, env config, HTML report, traces/screenshots/videos on failure, and clean README.  
Resultado esperado: CI-ready framework.  
Notas: Keep architecture simple.

## Create POM

Uso: Create page objects.  
Prompt: Create a Page Object Model class for this page using stable locators in this order: getByRole, getByLabel, getByPlaceholder, data-testid, locator only if necessary. Include reusable methods and meaningful assertions.  
Resultado esperado: Maintainable page class.

## Create UI Tests

Uso: Add smoke tests.  
Prompt: Write Playwright TypeScript smoke tests using Arrange-Act-Assert and the existing POM classes. Avoid nth and brittle CSS selectors. Add meaningful assertions.  
Resultado esperado: Stable smoke suite.

## Create API Tests

Uso: Add API coverage.  
Prompt: Write Playwright API tests for these endpoints. Validate status, response shape, and key business fields. Keep tests independent and readable.  
Resultado esperado: API health/regression tests.

## Improve Locators

Uso: Debug brittle tests.  
Prompt: Review these Playwright locators and replace brittle selectors with stable getByRole/getByLabel/getByPlaceholder/data-testid locators. Explain each change briefly.  
Resultado esperado: More stable locator strategy.

## Debug Failures

Uso: Troubleshoot test run.  
Prompt: Analyze this Playwright failure by checking locator issues first, then timing issues, then assertion mismatches. Propose the smallest reliable fix.  
Resultado esperado: Focused debug plan.

## Create GitHub Actions

Uso: CI setup.  
Prompt: Create a GitHub Actions workflow for Playwright TypeScript with npm install, browser install, test run, typecheck, and HTML report artifact upload on failure.  
Resultado esperado: CI workflow YAML.

