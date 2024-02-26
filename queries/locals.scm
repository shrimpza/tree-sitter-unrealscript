(state_declaration) @local.scope
(function_declaration) @local.scope

(function_parameters (identifier) @local.definition)

(local_variable_declaration name:(identifier) @local.definition)

(identifier) @local.reference
