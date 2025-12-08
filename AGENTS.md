# AGENTS.md

## Build/Test Commands
- `bun test` - Run all tests (requires dbus-run-session wrapper)
- `bun run unit` - Unit tests only: `jest ./test/*.test.js`
- `bun run integration` - Integration tests with DBus session
- `dbus-run-session -- bun test -- path/to/file.test.js` - Run single test file
- `bun run format` - Format code with semistandard --fix
- `docker build -t dbus-next-test . && docker run --rm dbus-next-test` - Run tests in Docker

## Code Style
- **Linting**: semistandard (standard + semicolons), babel-eslint parser, BigInt global
- **ESLint**: extends eslint:recommended + prettier; eqeqeq enforced
- **Modules**: CommonJS (require/module.exports), no ES modules
- **Classes**: JSDoc documentation, class-based architecture with EventEmitter
- **Async**: Use async/await patterns throughout; Promises for DBus operations
- **Types**: Variant class for DBus variants; BigInt for int64/uint64 (JSBI polyfill for Node <10.8)
- **Errors**: Use DBusError class for DBus errors; validator functions (assertBusNameValid, etc.)
- **Naming**: camelCase for variables/functions, PascalCase for classes, UPPER_SNAKE for constants
- **Decorators**: @method, @property, @signal for service interfaces (requires Babel)

## Commit Guidelines
- Break large changes into multiple small, focused commits
- Use conventional commits: `type: concise message`
- All lowercase, no period at end
- No commit body unless absolutely necessary
- Types: feat, fix, refactor, docs, test, chore, style
