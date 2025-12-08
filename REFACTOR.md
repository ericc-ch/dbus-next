# Modernize dbus-next Test Infrastructure and Decorator Support

## Goal

Remove legacy Babel decorators from dbus-next to enable native `bun test` execution without Jest/Babel transpilation.

## Understanding the Issues

### 1. Interface Class Name

The `Interface` class name potentially conflicts with TypeScript's `interface` keyword. However, they're in different namespaces (class vs type), so it's not a direct conflict - just potentially confusing in documentation/code.

**Decision**: Keep the `Interface` class name as-is for now.

### 2. Legacy Babel Decorators vs TC39 Stage 3 Decorators

The current implementation uses legacy Babel decorator syntax:

```javascript
// Legacy (Babel) - uses descriptor.key, descriptor.descriptor.value, descriptor.finisher
return function (descriptor) {
  options.name = options.name || descriptor.key;
  options.fn = descriptor.descriptor.value;
  descriptor.finisher = function (klass) { ... };
};
```

TC39 Stage 3 decorators (TypeScript 5.0+, Bun native) use a different API:

```typescript
// TC39 Stage 3 - receives (target, context) where context has name, addInitializer, etc.
function loggedMethod(target: Function, context: ClassMethodDecoratorContext) {
  const methodName = String(context.name);
  context.addInitializer(function() { ... });
  return replacementMethod;
}
```

**Decision**: Remove legacy decorators entirely (breaking change). No migration guide needed.

### 3. Test Compatibility

Tests need to work without Babel transpilation to enable native `bun test`.

**Decision**: Convert all tests to use `configureMembers()` (non-decorator API).

### 4. TypeScript Target

**Decision**: Target latest TypeScript for future TC39 decorator support.

---

## Phase 1: Convert Tests to configureMembers()

Convert all test files that use decorators to use `configureMembers()` instead.

### Files to Convert

1. `test/introspection.test.js`
2. `test/integration/methods.test.js`
3. `test/integration/signals.test.js`
4. `test/integration/properties.test.js`
5. `test/integration/service-errors.test.js`
6. `test/integration/service-options.test.js`
7. `test/integration/long.test.js`
8. `test/integration/long-compat.test.js`
9. `test/integration/disconnect.test.js`
10. `test/integration/fd-passing.test.js`
11. `test/integration/ay-buffer.test.js`
12. `test/integration/configured-service.test.js`
13. `test/integration/request-name.test.js`
14. `test/integration/monitor.test.js`

### Conversion Pattern

**Before (legacy decorators):**
```javascript
class TestInterface extends Interface {
  @method({ inSignature: 's', outSignature: 's' })
  Echo(what) {
    return what;
  }

  @property({ signature: 's' })
  MyProp = 'hello';

  @signal({ signature: 's' })
  MySignal(value) {
    return value;
  }
}
```

**After (configureMembers):**
```javascript
class TestInterface extends Interface {
  MyProp = 'hello';

  Echo(what) {
    return what;
  }

  MySignal(value) {
    return value;
  }
}

TestInterface.configureMembers({
  methods: {
    Echo: { inSignature: 's', outSignature: 's' }
  },
  properties: {
    MyProp: { signature: 's' }
  },
  signals: {
    MySignal: { signature: 's' }
  }
});
```

### Commit Strategy

- One commit per test file conversion to keep changes atomic and reviewable
- Format: `refactor: convert <filename> to configureMembers()`

---

## Phase 2: Remove Legacy Decorators

After all tests are converted, remove decorator implementations from `lib/service/interface.js`:

1. Remove `property()` decorator function
2. Remove `method()` decorator function
3. Remove `signal()` decorator function
4. Remove decorator exports from `index.js`

### Commit Strategy

- `refactor: remove legacy decorator implementations`

---

## Phase 3: Remove Babel Dependencies

1. Remove `.babelrc`
2. Remove Babel-related devDependencies from `package.json`:
   - `@babel/core`
   - `@babel/plugin-proposal-class-properties`
   - `@babel/plugin-proposal-decorators`
   - `babel-eslint`
3. Update Dockerfile to use `bun test` directly
4. Update `.eslintrc` to remove babel-eslint parser

### Commit Strategy

- `chore: remove babel dependencies`

---

## Phase 4: Update Documentation

1. Update `README.md` examples to use `configureMembers()`
2. Update `AGENTS.md` with new test commands

### Commit Strategy

- `docs: update readme to use configureMembers()`
- `docs: update agents.md with new test commands`

---

## Phase 5: Future Work - TC39 Decorators

**Not part of this refactoring** - to be done separately if desired.

Add optional TC39 Stage 3 decorator support for modern TypeScript/JavaScript:

```typescript
// TC39 Stage 3 decorator for methods
function method(options: MethodOptions) {
  return function(target: Function, context: ClassMethodDecoratorContext) {
    const methodName = String(context.name);
    context.addInitializer(function(this: any) {
      this.constructor.prototype.$methods = this.constructor.prototype.$methods || {};
      this.constructor.prototype.$methods[methodName] = {
        ...options,
        name: options.name || methodName,
        fn: target
      };
    });
    return target;
  };
}
```

This would allow users on TypeScript 5.0+ or modern runtimes to use:

```typescript
class MyInterface extends Interface {
  @method({ inSignature: 's', outSignature: 's' })
  Echo(what: string): string {
    return what;
  }
}
```

### Future Tasks

- Add TC39 Stage 3 decorator implementations
- Add TypeScript test file for TC39 decorators (`test/integration/tc39-decorators.test.ts`)
- Target latest TypeScript version

---

## Verification

After each phase, verify:

```bash
# Phase 1-2: Still works with Jest
bunx jest

# Phase 3+: Works with native bun
bun test
```

---

## Execution Order (Commits)

1. `refactor: convert test/introspection.test.js to configureMembers()`
2. `refactor: convert methods.test.js to configureMembers()`
3. `refactor: convert signals.test.js to configureMembers()`
4. `refactor: convert properties.test.js to configureMembers()`
5. `refactor: convert service-errors.test.js to configureMembers()`
6. `refactor: convert service-options.test.js to configureMembers()`
7. `refactor: convert long.test.js to configureMembers()`
8. `refactor: convert long-compat.test.js to configureMembers()`
9. `refactor: convert disconnect.test.js to configureMembers()`
10. `refactor: convert fd-passing.test.js to configureMembers()`
11. `refactor: convert ay-buffer.test.js to configureMembers()`
12. `refactor: convert configured-service.test.js to configureMembers()`
13. `refactor: convert request-name.test.js to configureMembers()`
14. `refactor: convert monitor.test.js to configureMembers()`
15. `refactor: remove legacy decorator implementations`
16. `chore: remove babel dependencies`
17. `docs: update readme to use configureMembers()`
18. `docs: update agents.md with new test commands`

---

## Estimated Effort

- Phase 1: ~2 hours (14 test files, straightforward conversion)
- Phase 2: ~30 minutes
- Phase 3: ~30 minutes
- Phase 4: ~30 minutes
- Phase 5: Future work, not estimated
