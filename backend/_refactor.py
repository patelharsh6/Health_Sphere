"""
Strip the boilerplate try/catch from controller handlers.

Only removes a catch block that does nothing but log and return a generic 500 —
exactly the boilerplate the global error handler now replaces. Any catch doing
real work (domain-specific 409s, the register() rollback) is left untouched and
reported so it can be handled deliberately.
"""
import io
import re
import glob
import sys

# A function-level catch that only logs and/or returns a generic 500.
# Nested try/catch sits at 4+ spaces of indent, so anchoring the catch at
# exactly 2 spaces keeps this from matching an inner block.
CATCH_TAIL = re.compile(
    r"\n  \} catch \((?:error|err)\) \{\n"
    r"(?P<catchbody>(?:[^\n]*\n)*?)"
    r"  \}\n\};",
)

ONLY_BOILERPLATE = re.compile(
    r"^(?:\s*console\.(?:error|log)\([^\n]*\);\n)?"
    r"\s*res\.status\(500\)\.json\(\{[^\n]*\}\);\n$"
)

TRY_OPEN = "\n  try {\n"


def dedent(block):
    out = []
    for line in block.split("\n"):
        out.append(line[2:] if line.startswith("  ") else line)
    return "\n".join(out)


def transform(src):
    stripped = 0
    skipped = []
    pos = 0
    while True:
        t = src.find(TRY_OPEN, pos)
        if t == -1:
            break
        m = CATCH_TAIL.search(src, t)
        if not m:
            pos = t + len(TRY_OPEN)
            continue

        body = src[t + len(TRY_OPEN):m.start()]
        catchbody = m.group("catchbody")

        if not ONLY_BOILERPLATE.match(catchbody):
            # Real logic in the catch — leave it alone.
            snippet = catchbody.strip().split("\n")[0][:70]
            skipped.append(snippet)
            pos = m.end()
            continue

        replacement = "\n" + dedent(body) + "\n};"
        src = src[:t] + replacement + src[m.end():]
        stripped += 1
        pos = t + len(replacement) - len("\n};")

    return src, stripped, skipped


def wrap_exports(src):
    """Wrap every exported handler in asyncHandler so rejections reach Express."""
    m = re.search(r"module\.exports = \{\n(?P<inner>(?:[^\n]*\n)*?)\};", src)
    if not m:
        return src, 0
    inner = m.group("inner")
    wrapped, count = [], 0
    for line in inner.rstrip("\n").split("\n"):
        stripped_line = line.strip()
        if not stripped_line or stripped_line.startswith("//"):
            wrapped.append(line)
            continue
        name = stripped_line.rstrip(",")
        if not re.fullmatch(r"[A-Za-z_$][\w$]*", name):
            wrapped.append(line)
            continue
        indent = line[: len(line) - len(line.lstrip())]
        wrapped.append(f"{indent}{name}: asyncHandler({name}),")
        count += 1
    new_inner = "\n".join(wrapped) + "\n"
    src = src[: m.start()] + "module.exports = {\n" + new_inner + "};" + src[m.end():]
    return src, count


def add_imports(src, need_apierror=False):
    if "require('../utils/asyncHandler')" in src:
        return src
    lines = src.split("\n")
    # Insert after the final top-of-file require.
    last = 0
    for i, line in enumerate(lines[:40]):
        if line.startswith("const ") and "require(" in line:
            last = i
    inject = ["const asyncHandler = require('../utils/asyncHandler');"]
    if need_apierror and "require('../utils/ApiError')" not in src:
        inject.append("const ApiError = require('../utils/ApiError');")
    lines[last + 1:last + 1] = inject
    return "\n".join(lines)


total_stripped = 0
total_wrapped = 0
for path in sorted(glob.glob("src/controllers/*.js")):
    original = io.open(path, encoding="utf-8").read()
    src, stripped, skipped = transform(original)
    src = add_imports(src)
    src, wrapped = wrap_exports(src)
    io.open(path, "w", encoding="utf-8", newline="\n").write(src)
    total_stripped += stripped
    total_wrapped += wrapped
    name = path.replace("\\", "/").split("/")[-1]
    print(f"{name:32} stripped={stripped:3} wrapped={wrapped:3} kept={len(skipped)}")
    for s in skipped:
        print(f"    KEPT: {s}")

print(f"\ntotal: stripped {total_stripped} try/catch blocks, wrapped {total_wrapped} handlers")
