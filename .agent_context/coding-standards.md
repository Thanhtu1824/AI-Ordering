# AI First Ordering Platform - Coding Standards

All AI-generated code and developer contributions MUST adhere to the following standards:

## 1. Explicit and Clear Code (Code Tường Minh)
- Code must be self-explanatory.
- Avoid overly clever or obscure "one-liners" that are hard to read.
- Use descriptive naming conventions for variables, functions, and classes. The name should reveal the intent.

## 2. Explanatory Comments (Comment Giải Thích)
- Write comments to explain the "WHY", not the "WHAT".
- Complex logic, business rules implementations, and workarounds must be thoroughly documented with comments.
- Maintain JSDoc/TSDoc for public functions, services, and components.

## 3. Idiomatic Code (Code Theo Chuẩn Ngôn Ngữ)
- Strictly follow the official style guides of the language and framework being used.
- For TypeScript/Next.js/NestJS: Follow strict typing rules. Do not use `any` unless absolutely necessary.
- Utilize modern language features appropriately (e.g., async/await, destructuring, optional chaining).

## 4. Clean Code
- Functions should do one thing and do it well (Single Responsibility Principle).
- Keep functions and files small and manageable.
- Avoid deep nesting (use early returns/guard clauses).
- Remove dead code, unused imports, and console logs before committing.

## 5. Clear Organization (Code Có Tổ Chức Rõ Ràng)
- Group related logic together.
- Separate concerns (e.g., keep business logic out of UI components, use services in backend).
- Follow the established directory structure of the Monorepo (Next.js App Router conventions for frontend, NestJS module architecture for backend).
