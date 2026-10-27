import ast
import re
import os
from typing import List, Dict, Optional, Tuple, Set
from app.models.schemas import (
    ParsedFileInfo, ClassInfo, FunctionInfo, ImportInfo,
    GraphNode, GraphEdge, DependencyGraph
)

class CodeParser:
    def parse_python_code(self, file_path: str, content: str) -> ParsedFileInfo:
        """Statically parses Python source code using the standard ast module."""
        loc = len([line for line in content.splitlines() if line.strip() and not line.strip().startswith("#")])
        classes: List[ClassInfo] = []
        functions: List[FunctionInfo] = []
        imports: List[ImportInfo] = []
        exports: List[str] = []
        is_entry_point = False
        entry_point_reason = None

        try:
            tree = ast.parse(content, filename=file_path)

            for node in ast.walk(tree):
                # Detect if __name__ == '__main__':
                if isinstance(node, ast.If):
                    test_str = ast.unparse(node.test) if hasattr(ast, "unparse") else ""
                    if "__name__" in test_str and "__main__" in test_str:
                        is_entry_point = True
                        entry_point_reason = "Contains `if __name__ == '__main__':` block"

            for node in tree.body:
                # Top-level Functions
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    fn_info = self._extract_py_function(node)
                    functions.append(fn_info)
                    if any("app." in dec or "router." in dec for dec in fn_info.decorators):
                        if not is_entry_point:
                            is_entry_point = True
                            entry_point_reason = "Contains web framework route decorator"

                # Top-level Classes
                elif isinstance(node, ast.ClassDef):
                    class_info = self._extract_py_class(node)
                    classes.append(class_info)

                # Imports
                elif isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.append(ImportInfo(
                            module=alias.name,
                            imported_names=[alias.name],
                            alias=alias.asname,
                            is_internal=not ("." in alias.name and alias.name.split(".")[0] in ("sys", "os", "math", "re", "json", "typing"))
                        ))

                elif isinstance(node, ast.ImportFrom):
                    mod_name = node.module or ""
                    names = [alias.name for alias in node.names]
                    imports.append(ImportInfo(
                        module=mod_name,
                        imported_names=names,
                        is_internal=node.level > 0 or not mod_name.startswith(("fastapi", "flask", "django", "pydantic", "httpx", "pytest"))
                    ))

                # __all__ exports
                elif isinstance(node, ast.Assign):
                    for target in node.targets:
                        if isinstance(target, ast.Name) and target.id == "__all__":
                            if isinstance(node.value, (ast.List, ast.Tuple)):
                                for elt in node.value.elts:
                                    if isinstance(elt, ast.Constant):
                                        exports.append(str(elt.value))

        except Exception:
            # Fallback regex if syntax is partial
            pass

        return ParsedFileInfo(
            path=file_path,
            language="Python",
            classes=classes,
            functions=functions,
            imports=imports,
            exports=exports,
            is_entry_point=is_entry_point,
            entry_point_reason=entry_point_reason,
            loc=loc
        )

    def _extract_py_function(self, node: ast.FunctionDef | ast.AsyncFunctionDef) -> FunctionInfo:
        args = [arg.arg for arg in node.args.args]
        return_type = ast.unparse(node.returns) if (hasattr(ast, "unparse") and node.returns) else None
        docstring = ast.get_docstring(node)
        decorators = []
        if hasattr(ast, "unparse"):
            decorators = [ast.unparse(dec) for dec in node.decorator_list]

        return FunctionInfo(
            name=node.name,
            line_number=node.lineno,
            arguments=args,
            return_type=return_type,
            docstring=docstring,
            decorators=decorators,
            is_async=isinstance(node, ast.AsyncFunctionDef)
        )

    def _extract_py_class(self, node: ast.ClassDef) -> ClassInfo:
        bases = []
        if hasattr(ast, "unparse"):
            bases = [ast.unparse(b) for b in node.bases]
        docstring = ast.get_docstring(node)
        methods = []

        for item in node.body:
            if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                methods.append(self._extract_py_function(item))

        return ClassInfo(
            name=node.name,
            line_number=node.lineno,
            base_classes=bases,
            methods=methods,
            docstring=docstring
        )

    def parse_js_ts_code(self, file_path: str, content: str) -> ParsedFileInfo:
        """Statically parses JS/TS code using regex and syntax pattern matching."""
        lines = content.splitlines()
        loc = len([l for l in lines if l.strip() and not l.strip().startswith("//")])
        classes: List[ClassInfo] = []
        functions: List[FunctionInfo] = []
        imports: List[ImportInfo] = []
        exports: List[str] = []
        is_entry_point = False
        entry_point_reason = None

        filename = os.path.basename(file_path).lower()
        if filename in ("index.ts", "index.js", "main.tsx", "main.ts", "server.js", "app.js", "server.ts"):
            is_entry_point = True
            entry_point_reason = f"Standard entry point file name ({filename})"

        # Check listen call
        if re.search(r"\.listen\s*\(\s*\d+", content):
            is_entry_point = True
            entry_point_reason = "Starts HTTP server listener (.listen(...))"

        # Regex for imports: import ... from '...';
        # Supports:
        # - import React from 'react'
        # - import { useState } from 'react'
        # - import React, { useState } from 'react'
        # - import * as React from 'react'
        import_pattern = re.compile(r"import\s+(?:([a-zA-Z0-9_$]+)\s*,\s*)?(?:\{([^}]+)\}|\*\s+as\s+([a-zA-Z0-9_$]+)|([a-zA-Z0-9_$]+))?\s*from\s*['\"]([^'\"]+)['\"]")
        for line_idx, line in enumerate(lines, 1):
            m = import_pattern.search(line)
            if m:
                lead_default = m.group(1)
                named_str = m.group(2)
                star_alias = m.group(3)
                single_default = m.group(4)
                module_path = m.group(5)

                imported_names = []
                if lead_default:
                    imported_names.append(lead_default.strip())
                if single_default:
                    imported_names.append(single_default.strip())
                if named_str:
                    imported_names.extend([n.strip().split(" as ")[0].strip() for n in named_str.split(",") if n.strip()])
                if star_alias:
                    imported_names.append(star_alias.strip())

                is_internal = module_path.startswith(".") or module_path.startswith("@/")
                imports.append(ImportInfo(
                    module=module_path,
                    imported_names=imported_names,
                    alias=star_alias,
                    is_internal=is_internal
                ))

        # Regex for require: const ... = require('...')
        require_pattern = re.compile(r"(?:const|let|var)\s+(?:\{([^}]+)\}|([a-zA-Z0-9_]+))\s*=\s*require\s*\(\s*['\"]([^'\"]+)['\"]\s*\)")
        for line in lines:
            m = require_pattern.search(line)
            if m:
                named = [n.strip() for n in m.group(1).split(",")] if m.group(1) else []
                default_name = m.group(2)
                module_path = m.group(3)
                imports.append(ImportInfo(
                    module=module_path,
                    imported_names=named + ([default_name] if default_name else []),
                    is_internal=module_path.startswith(".")
                ))

        # Functions: function foo(x, y)
        fn_pattern = re.compile(r"(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)")
        for line_idx, line in enumerate(lines, 1):
            m = fn_pattern.search(line)
            if m:
                name = m.group(1)
                args = [a.strip().split(":")[0] for a in m.group(2).split(",") if a.strip()]
                functions.append(FunctionInfo(
                    name=name,
                    line_number=line_idx,
                    arguments=args,
                    is_async="async" in line
                ))

        # Arrow functions: const foo = (x, y) => ...
        arrow_pattern = re.compile(r"(?:export\s+)?(?:const|let)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*(?::\s*[^=]+)?\s*=>")
        for line_idx, line in enumerate(lines, 1):
            m = arrow_pattern.search(line)
            if m:
                name = m.group(1)
                args = [a.strip().split(":")[0] for a in m.group(2).split(",") if a.strip()]
                functions.append(FunctionInfo(
                    name=name,
                    line_number=line_idx,
                    arguments=args,
                    is_async="async" in line
                ))

        # Classes: class Foo extends Bar
        class_pattern = re.compile(r"class\s+([a-zA-Z0-9_]+)(?:\s+extends\s+([a-zA-Z0-9_]+))?")
        for line_idx, line in enumerate(lines, 1):
            m = class_pattern.search(line)
            if m:
                cname = m.group(1)
                base = [m.group(2)] if m.group(2) else []
                classes.append(ClassInfo(
                    name=cname,
                    line_number=line_idx,
                    base_classes=base,
                    methods=[]
                ))

        # Exports
        export_pattern = re.compile(r"export\s+(?:default\s+)?(?:class|function|const|let|var)\s+([a-zA-Z0-9_]+)")
        for line in lines:
            m = export_pattern.search(line)
            if m:
                exports.append(m.group(1))

        return ParsedFileInfo(
            path=file_path,
            language="TypeScript" if file_path.endswith((".ts", ".tsx")) else "JavaScript",
            classes=classes,
            functions=functions,
            imports=imports,
            exports=exports,
            is_entry_point=is_entry_point,
            entry_point_reason=entry_point_reason,
            loc=loc
        )

    def parse_java_cpp_code(self, file_path: str, content: str) -> ParsedFileInfo:
        """Parses Java or C/C++ source code using pattern recognition."""
        lines = content.splitlines()
        loc = len([l for l in lines if l.strip() and not l.strip().startswith("//") and not l.strip().startswith("/*")])
        classes: List[ClassInfo] = []
        functions: List[FunctionInfo] = []
        imports: List[ImportInfo] = []
        is_entry_point = False
        entry_point_reason = None

        is_java = file_path.endswith(".java")
        lang = "Java" if is_java else "C++"

        # Check for main method
        if "public static void main" in content or "int main(" in content:
            is_entry_point = True
            entry_point_reason = "Defines main entry point method"

        # Java imports / C++ includes
        for line in lines:
            line_str = line.strip()
            if is_java and line_str.startswith("import "):
                mod = line_str.replace("import ", "").replace(";", "").strip()
                imports.append(ImportInfo(module=mod, imported_names=[mod.split(".")[-1]]))
            elif not is_java and line_str.startswith("#include"):
                inc = re.search(r"#include\s+[<\"']([^>\"']+)[\>\"']", line_str)
                if inc:
                    imports.append(ImportInfo(module=inc.group(1), imported_names=[inc.group(1)]))

        # Classes
        class_regex = re.compile(r"(?:public|private|protected)?\s*class\s+([a-zA-Z0-9_]+)(?:\s+extends\s+([a-zA-Z0-9_]+))?")
        for idx, line in enumerate(lines, 1):
            m = class_regex.search(line)
            if m:
                classes.append(ClassInfo(
                    name=m.group(1),
                    line_number=idx,
                    base_classes=[m.group(2)] if m.group(2) else [],
                    methods=[]
                ))

        return ParsedFileInfo(
            path=file_path,
            language=lang,
            classes=classes,
            functions=functions,
            imports=imports,
            exports=[],
            is_entry_point=is_entry_point,
            entry_point_reason=entry_point_reason,
            loc=loc
        )

    def parse_source_file(self, file_path: str, content: str) -> Optional[ParsedFileInfo]:
        """Routes file to appropriate parser based on extension."""
        lower = file_path.lower()
        if lower.endswith(".py"):
            return self.parse_python_code(file_path, content)
        elif lower.endswith((".js", ".jsx", ".ts", ".tsx")):
            return self.parse_js_ts_code(file_path, content)
        elif lower.endswith((".java", ".cpp", ".c", ".h", ".hpp")):
            return self.parse_java_cpp_code(file_path, content)
        return None

    def build_dependency_graph(self, parsed_files: List[ParsedFileInfo]) -> DependencyGraph:
        """
        Builds a module relationship graph connecting files that import each other.
        Categorizes each node into Controller, Service, Model, Component, Util, or Config.
        """
        nodes: List[GraphNode] = []
        edges: List[GraphEdge] = []
        existing_nodes: Set[str] = set()

        # Build path lookup
        path_to_info: Dict[str, ParsedFileInfo] = {p.path: p for p in parsed_files}

        for file_info in parsed_files:
            node_id = file_info.path
            filename = os.path.basename(node_id)
            lower = node_id.lower()

            # Determine category
            category = "Module"
            if any(term in lower for term in ["router", "controller", "api", "routes", "endpoint"]):
                category = "Controller / Route"
            elif any(term in lower for term in ["service", "logic", "usecase", "handler"]):
                category = "Service / Logic"
            elif any(term in lower for term in ["model", "schema", "entity", "dto", "type"]):
                category = "Model / Schema"
            elif any(term in lower for term in ["component", "view", "page", "screen", "ui"]):
                category = "Component / UI"
            elif any(term in lower for term in ["util", "helper", "common", "lib"]):
                category = "Utility / Helper"
            elif any(term in lower for term in ["config", "setting", "env", "constant"]):
                category = "Configuration"

            nodes.append(GraphNode(
                id=node_id,
                label=filename,
                category=category,
                language=file_info.language,
                functions_count=len(file_info.functions),
                classes_count=len(file_info.classes)
            ))
            existing_nodes.add(node_id)

        # Connect edges based on imports
        for file_info in parsed_files:
            src = file_info.path
            src_dir = os.path.dirname(src)

            for imp in file_info.imports:
                mod = imp.module
                # Match internal imports
                for target_path in existing_nodes:
                    if target_path == src:
                        continue
                    target_base, _ = os.path.splitext(target_path)
                    target_name = os.path.basename(target_base)

                    # Check direct relative path match or name match
                    if mod.endswith(target_name) or mod.lstrip("./").replace("/", ".").endswith(target_name):
                        edges.append(GraphEdge(
                            source=src,
                            target=target_path,
                            relationship="imports"
                        ))
                        break

        return DependencyGraph(nodes=nodes, edges=edges)

code_parser = CodeParser()
