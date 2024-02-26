; variables
(identifier) @variable
(property_identifier) @property

; functions
(function_declaration
  name: (identifier) @function.method)
(call_expression
  function: (identifier) @function.method)

; types
(class_declaration
  name: (identifier) @type
  parent: (identifier) @type)
(enum_declaration
  name: (identifier) @type)
(struct_declaration
  name: (identifier) @type)
[
  (primitive_type)
  (native_type)
] @type.builtin

; literals
[
  (number)
  (uint)
] @number

(string) @string
(escape_sequence) @string.escape

[
  (true)
  (false)
  (none)
  "super"
	"default"
	"global"
	"self"
] @constant.builtin

; comments
(comment) @comment

; keywords
[
  (variable_modifier)
  (class_modifier)
  (state_modifier)
  (function_modifier)
  (parameter_modifier)
] @keyword

[
  "abstract"
  "assert"
  "break"
  "case"
  "class"
  "const"
  "continue"
  "default"
  "defaultproperties"
  "do"
  "else"
  "enum"
  "extends"
  "expands"
  "final"
  "for"
  "foreach"
  "if"
  "ignores"
  "local"
  "native"
  "new"
  "return"
  "state"
  "static"
  "struct"
  "switch"
  "until"
  "var"
  "while"
] @keyword
