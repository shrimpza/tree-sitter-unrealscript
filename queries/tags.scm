(class_declaration
  name: (identifier) @name) @definition.class

(function_declaration
  name: (identifier) @name) @definition.method

(call_expression
  function: (identifier) @name
  arguments: (arguments) @reference.call)

(reference
	(identifier)
	(name	(identifier) @name)) @reference.class
