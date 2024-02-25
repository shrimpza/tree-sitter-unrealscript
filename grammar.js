// with pieces and references from:
//  - https://github.com/tree-sitter/tree-sitter-javascript/blob/master/grammar.js
//  - https://github.com/tree-sitter/tree-sitter-java/blob/master/grammar.js
//  - https://github.com/stadelmanma/tree-sitter-fortran/blob/master/grammar.js

module.exports = grammar({
	name: 'unrealscript',

	extras: $ => [
		$.comment,
		/\s/,
	],

	supertypes: $ => [
		$.statement,
		$.declaration,
		$.expression,
		$.primary_expression,
	],

	inline: $ => [
		$.statement,
		$._expressions,
		$._identifier,
		$._lhs_expression
	],

	precedences: $ => [
		[
			'member',
			'call',
			$.update_expression,
			'unary_void',
			'binary_exp',
			'binary_times',
			'binary_plus',
			'binary_shift',
			'binary_compare',
			'binary_relation',
			'binary_equality',
			'bitwise_and',
			'bitwise_xor',
			'bitwise_or',
			'logical_and',
			'logical_or',
			'concat',
			'vector_operation',
			$._statement
		],
		[$.reference, $.primary_expression],
		['assign', $.primary_expression],
		['member', 'new', 'call', $.expression],
		['declaration', 'literal'],
		[$.primary_expression, $.block],
		[$.struct_value, $.expression],
		[$.number, $.array_identifier, $._identifier],
		[$.primary_expression, $.nested_identifier, $.member_expression],
	],

	conflicts: $ => [
		[$.primary_expression, $.array_identifier],
		[$.state_modifier, $.function_modifier],
	],

	word: $ => $.identifier,

	rules: {
		program: $ => repeat(choice($.exec_directive, $.statement)),

		declaration: $ => choice(
			$.class_declaration,
			$.state_declaration,
			$.function_declaration,
			$.operator_declaration,
			$.variable_declaration,
			$.constant_declaration,
			$.enum_declaration,
			$.struct_declaration,
			$.replication_block,
			$.defaultproperties,
		),

		class_declaration: $ => seq(
			caseInsensitive('class'),
			field('name', $.identifier),
			optional($._declaration_heritage),
			field('modifiers', repeat($.class_modifier)),
			';',
		),

		exec_directive: $ => seq(
			field('directive', token(/#[^\s]+/)),
			field('kind', $.identifier),
			field('operation', $.identifier),
			field('arguments', /[^\n]+/),
			'\n'
		),

		state_declaration: $ => seq(
			field('modifiers', repeat($.state_modifier)),
			caseInsensitive('state'), optional(seq('(', ')')),
			field('name', $.identifier),
			optional($._declaration_heritage),
			field('body', $.state_body),
		),
		state_body: $ => prec.right(seq(
			'{',
			field('ignores', optional($._state_ignores)),
			repeat($._statement),
			'}'
		)),
		_state_ignores: $ => seq(
			caseInsensitive('ignores'),
			commaSep1($.identifier),
			';'
		),

		function_declaration: $ => seq(
			field('modifiers', repeat($.function_modifier)),
			choice(caseInsensitive('function'), caseInsensitive('event')),
			optional(field('return_type', $.type)),
			field('name', $.identifier),
			field('parameters', $.function_parameters),
			choice(field('body', $.block), ';'),
		),

		operator_declaration: $ => seq(
			field('modifiers', repeat($.function_modifier)),
			choice(
				seq(caseInsensitive('operator'), '(', optional(field('precedence', $.uint)),')',),
				caseInsensitive('preoperator'),
				caseInsensitive('postoperator'),
			),
			field('return_type', optional($.type)),
			field('operator', $.operator_name),
			field('parameters', $.function_parameters),
			choice(field('body', $.block), ';'),
		),
		operator_name: $ => choice(
			$.identifier,
			/[\^!$%&/?*+~@\-><|=]+/,
		),

		if_statement: $ => prec.right(seq(
			caseInsensitive('if'),
			field('condition', $.condition),
			field('consequence', $.statement),
			optional(seq(caseInsensitive('else'), field('alternative', $.statement))),
		)),

		condition: $ => seq('(', $.expression, ')'),

		replication_block: $ => seq(
			caseInsensitive('replication'),
			'{',
			repeat(seq(
				field('kind', choice(caseInsensitive('unreliable'), caseInsensitive('reliable'))),
				caseInsensitive('if'),
				field('condition', $.condition),
				field('consequence', commaSep1($.identifier)),
				';',
			)),
			'}',
		),

		defaultproperties: $ => seq(
			caseInsensitive('defaultproperties'),
			'{',
			repeat($._defaultproperties_properties),
			'}',
		),
		_defaultproperties_properties: $ => seq(
			$.default_property_assignment,
			'\n',
		),
		default_property_assignment: $ => prec.right('assign', seq(
			field('property', seq(
				$.identifier,
				field('index', optional(seq(choice('(', '['), $.uint, choice(']', ')')))),
			)),
			'=',
			field('value', $._default_property_value),
		)),
		_default_property_value: $ => choice(
			$.primary_expression,
			$.struct_value,
		),
		struct_value: $ => seq(
			'(',
				commaSep(seq(field('left', $.identifier),  '=', field('right', $.primary_expression))),
			')'
		),

		for_statement: $ => seq(
			caseInsensitive('for'), '(',
			field('init', $.assignment_expression), ';',
			field('condition', $.expression), ';',
			field('update', $.expression), ')',
			field('body', $.statement),
		),

		foreach_statement: $ => seq(
			caseInsensitive('foreach'),
			field('iterator', $.identifier),
			field('arguments', $.arguments),
			field('body', $.statement),
		),

		while_statement: $ => seq(
			caseInsensitive('while'), '(',
			field('condition', $.expression), ')',
			field('body', $.statement),
		),

		do_until_statement: $ => seq(
			caseInsensitive('do'),
			field('body', $.statement),
			caseInsensitive('until'), '(', field('condition', $.expression), ')',
			';',
		),

		switch_statement: $ => seq(
			caseInsensitive('switch'),
			'(', field('condition', $.expression), ')',
			field('rules', $.switch_body),
		),
		switch_body: $ => seq(
			'{',
				repeat($.switch_rule),
			'}',
		),
		switch_rule: $ => prec.left(seq(
			$.switch_condition,
			repeat($.statement),
		)),
		switch_condition: $ => seq(
			choice(
				seq(caseInsensitive('case'), $.expression),
				caseInsensitive('default'),
			),
			':',
		),

		return_statement: $ => seq(
			caseInsensitive('return'),
			optional($.expression),
			';'
		),

		continue_statement: _ => seq(
			caseInsensitive('continue'),
			';'
		),

		break_statement: _ => seq(
			caseInsensitive('break'),
			';'
		),

		assert_statement: $ => seq(
			caseInsensitive('assert'), '(', field('condition', $.expression), ')',
			';'
		),

		enum_declaration: $ => seq(
			$._enum_declaration,
			';'
		),
		_enum_declaration: $ => seq(
			caseInsensitive('enum'),
			field('name', $.identifier),
			field('body', $.enum_body),
		),
		enum_body: $ => seq(
			'{',
			commaSep1($.identifier),
			optional(','),
			'}',
		),

		struct_declaration: $ => seq(
			caseInsensitive('struct'),
			field('name', $.identifier),
			optional(seq(
				caseInsensitive('extends'),
				field('parent', $.identifier),
			)),
			field('body', $.struct_body),
			';',
		),
		struct_body: $ => seq(
			'{',
			repeat($.variable_declaration),
			'}',
		),

		constant_declaration: $ => seq(
			caseInsensitive('const'),
			$.assignment_expression,
			';',
		),

		variable_declaration: $ => seq(
			choice(
				$._class_variable_declaration,
				$._enum_variable_declaration,
			),
			';',
		),

		_class_variable_declaration: $ => prec.left(seq(
			caseInsensitive('var'),
			field('editgroups', optional(seq('(', commaSep($._identifier), ')'))),
			field('modifiers', repeat($.variable_modifier)),
			field('type', $.type),
			commaSep1(field('name', $._identifier)),
		)),

		_enum_variable_declaration: $ => seq(
			caseInsensitive('var'),
			field('editorgroups', optional(seq('(', commaSep($._identifier), ')'))),
			field('modifiers', repeat($.variable_modifier)),
			$._enum_declaration,
			commaSep1(field('name', $._identifier)),
		),

		local_variable_declaration: $ => seq(
			caseInsensitive('local'),
			field('type', $.type),
			commaSep1(field('name', $._identifier)),
			';',
		),

		_config_modifier: $ => seq(
			caseInsensitive('config'),
			optional(seq(
				'(',
				optional($.identifier),
				')'
			)),
		) ,
		_native_modifier: $ => seq(
			caseInsensitive('native'),
			optional(seq(
				'(',
				field('token', optional($.uint)),
				')'
			)),
		),

		_class_depends_modifier: $ => seq(
			caseInsensitive('dependson'),
			optional(seq(
				'(',
				$.identifier,
				')'
			)),
		),

		_class_within_modifier: $ => seq(
			caseInsensitive('within'),
			$.identifier,
		),

		_class_display_categories_modifier: $ => seq(
			choice(caseInsensitive('hidecategories'), caseInsensitive('showcategories')),
			optional(seq(
				'(',
				commaSep($.identifier),
				')'
			)),
		),

		class_modifier: $ => choice(
			caseInsensitive('abstract'),
			caseInsensitive('notplaceable'),
			caseInsensitive('native'),
			choice(caseInsensitive('nativereplication'), caseInsensitive('nonativereplication')),
			caseInsensitive('safereplace'),
			caseInsensitive('perobjectconfig'),
			caseInsensitive('transient'),
			caseInsensitive('noexport'),
			caseInsensitive('exportstructs'),
			caseInsensitive('cacheexempt'),
			caseInsensitive('hidedropdown'),
			caseInsensitive('parseconfig'),
			caseInsensitive('instanced'),
			choice(caseInsensitive('collapsecategories'), caseInsensitive('dontcollapsecategories')),
			choice(caseInsensitive('placeable'), caseInsensitive('notplaceable')),
			choice(caseInsensitive('editinlinenew'), caseInsensitive('noteditinlinenew')),
			$._config_modifier,
			$._class_depends_modifier,
			$._class_within_modifier,
			$._class_display_categories_modifier
		),

		variable_modifier: $ => choice(
			caseInsensitive('static'),
			caseInsensitive('private'),
			caseInsensitive('public'),
			caseInsensitive('protected'),
			caseInsensitive('const'),
			caseInsensitive('editconst'),
			caseInsensitive('transient'),
			caseInsensitive('deprecated'),
			caseInsensitive('input'),
			caseInsensitive('localized'),
			caseInsensitive('travel'),
			caseInsensitive('native'),
			caseInsensitive('export'),
			caseInsensitive('noexport'),
			caseInsensitive('globalconfig'),
			$._config_modifier,
		),

		state_modifier: _ => choice(
			caseInsensitive('auto'),
			caseInsensitive('simulated'),
		),

		function_modifier: $ => choice(
			caseInsensitive('static'),
			caseInsensitive('private'),
			caseInsensitive('protected'),
			caseInsensitive('simulated'),
			caseInsensitive('singular'),
			caseInsensitive('final'),
			caseInsensitive('latent'),
			caseInsensitive('iterator'),
			caseInsensitive('exec'),
			$._native_modifier,
		),

		parameter_modifier: _ => choice(
			caseInsensitive('out'),
			caseInsensitive('optional'),
			caseInsensitive('coerce'),
			caseInsensitive('skip'),
		),

		function_parameters: $ => seq(
			'(',
			commaSep(
				seq(
					optional($.parameter_modifier),
					field('type', $.type),
					field('name', $.identifier),
				)
			),
			')'
		),

		_declaration_heritage: $ => seq(
			choice(caseInsensitive('extends'), caseInsensitive('expands')),
			field('parent', $.identifier)
		),

		block: $ => prec.right(seq(
			'{',
			repeat($._statement),
			'}'
		)),

		label: $ => seq(
			$.identifier, ':',
		),
		_statement: $ => choice(
			$.local_variable_declaration,
			$.statement,
		),

		statement: $ => choice(
			$.block,
			$.declaration,
			$.expression_statement,
			$.if_statement,
			$.for_statement,
			$.foreach_statement,
			$.while_statement,
			$.do_until_statement,
			$.switch_statement,
			$.continue_statement,
			$.break_statement,
			$.assert_statement,
			$.return_statement,
			$.label,
		),

		expression_statement: $ => seq(
			$._expression,
			';',
		),

		arguments: $ => seq(
			'(',
			commaSep(optional($.expression)),
			')',
		),

		expression: $ => choice(
			$.primary_expression,
			$.assignment_expression,
			$.augmented_assignment_expression,
			$.unary_expression,
			$.binary_expression,
			$.update_expression,
			$.string_expression,
			$.call_expression,
			$.new_expression,
		),

		primary_expression: $ => choice(
			$.subscript_expression,
			$.member_expression,
			$.parenthesized_expression,
			$.self,
			$.super,
			$.default,
			$.global,
			$.number,
			$.string,
			$.boolean,
			$.name,
			$.none,
			$._identifier,
		),

		_expression: $ => choice(
			$.expression,
		),
		_lhs_expression: $ => choice(
			$.member_expression,
			$.subscript_expression,
			$._identifier,
		),
		assignment_expression: $ => prec.right('assign', seq(
			field('left', choice($.parenthesized_expression, $._lhs_expression)),
			'=',
			field('right', $.expression),
		)),
		_augmented_assignment_lhs: $ => choice(
			$.member_expression,
			$.subscript_expression,
			$.identifier,
			$.parenthesized_expression,
		),
		augmented_assignment_expression: $ => prec.right('assign', seq(
			field('left', $._augmented_assignment_lhs),
			field('operator', choice('+=', '-=', '*=', '/=', '%=', '^=', '&=', '|=', '>>=', '>>>=',
				'<<=', '**=', '&&=', '||=', '??=')),
			field('right', $.expression),
		)),
		new_expression: $ => prec.right('new', seq(
			'new',
			field('constructor', choice($.primary_expression, $.new_expression)),
			field('arguments', optional(prec.dynamic(1, $.arguments))),
		)),

		binary_expression: $ => choice(
			...[
				['&&', 'logical_and'],
				['||', 'logical_or'],
				['>>', 'binary_shift'],
				['<<', 'binary_shift'],
				['&', 'bitwise_and'],
				['^', 'bitwise_xor'],
				['|', 'bitwise_or'],
				['+', 'binary_plus'],
				['-', 'binary_plus'],
				['*', 'binary_times'],
				['/', 'binary_times'],
				['%', 'binary_times'],
				['**', 'binary_exp', 'right'],
				['<', 'binary_relation'],
				['<=', 'binary_relation'],
				['==', 'binary_equality'],
				['!=', 'binary_equality'],
				['~=', 'binary_equality'],
				['>=', 'binary_relation'],
				['>', 'binary_relation'],
				[caseInsensitive('dot'), 'vector_operation'],
				[caseInsensitive('cross'), 'vector_operation'],
			].map(([operator, precedence, associativity]) =>
				(associativity === 'right' ? prec.right : prec.left)(precedence, seq(
					field('left', $.expression),
					field('operator', operator),
					field('right', $.expression),
				)),
			),
		),

		unary_expression: $ => choice(...[
			['+', 10],
			['-', 10],
			['!', 10],
			['~', 10],
		].map(([operator, precedence]) =>
			prec.left(precedence, seq(
				field('operator', operator),
				field('operand', $.expression)
			))
		)),

		update_expression: $ => prec.left(choice(
			seq(
				field('argument', $.expression),
				field('operator', choice('++', '--')),
			),
			seq(
				field('operator', choice('++', '--')),
				field('argument', $.expression),
			),
		)),

		string_expression: $ => choice(
			...[
				['@', 'concat'],
				['$', 'concat'],
			].map(([operator, precedence]) =>
				prec.left(precedence, seq(
					field('left', $.expression),
					field('operator', operator),
					field('right', $.expression),
				)),
			),
		),

		type: $ => choice(
			$.primitive_type,
			$.native_type,
			$.dynamic_array,
			$.class,
			$.identifier,
		),

		dynamic_array: $ => prec.right(seq(
			caseInsensitive('array'),
			'<', $.type, optional(seq(',', $.uint)), '>',
		)),
		class: $ => prec.right(seq(
			caseInsensitive('class'),
			optional(seq('<', $.type, '>')),
		)),

		primitive_type: _ => choice(
			caseInsensitive('bool'),
			caseInsensitive('byte'),
			caseInsensitive('int'),
			caseInsensitive('float'),
			caseInsensitive('string'),
		),

		native_type: _$ => choice(
			caseInsensitive('vector'),
			caseInsensitive('rotator'),
		),

		_identifier: $ => choice(
			$.identifier,
			$.array_identifier,
			$.nested_identifier,
			$.reference,
			$.default,
			$.self,
			$.super,
		),

		identifier: _ => /[A-Za-z_]([A-Za-z0-9_]+)?/,

		array_identifier: $ => prec.right(seq(
			$._identifier,
			$.array_dimensions,
		)),

		array_dimensions: $ => prec.right(repeat1(
			seq('[', field('size', choice($.identifier, $.uint)), ']')
		)),

		self: _ => caseInsensitive('self'),
		super: _ => caseInsensitive('super'),
		global: _ => caseInsensitive('global'),
		default: _ => caseInsensitive('default'),
		true: _ => caseInsensitive('true'),
		false: _ => caseInsensitive('false'),
		none: _ => caseInsensitive('none'),
		boolean: $ => choice(
			$.true,
			$.false,
		),

		string: $ => seq(
			'"',
			repeat(choice(
				alias($.unescaped_double_string_fragment, $.string_fragment),
				$.escape_sequence,
			)),
			'"',
		),
		unescaped_double_string_fragment: _ => token.immediate(prec(1, /[^"\\\r\n]+/)),
		unescaped_single_string_fragment: _ => token.immediate(prec(1, /[^'\\\r\n]+/)),
		escape_sequence: _ => token.immediate('\\'),
		name: $ => prec.right(seq(
			'\'',
			$._identifier,
			'\'',
		)),
		reference: $ => seq(
			$.identifier,
			$.name,
		),

		uint: _ => token(/\d+/),

		number: _ => {
			const hex_literal = seq(
				choice('0x', '0X'),
				/[\da-fA-F](_?[\da-fA-F])*/,
			);
			const decimal_digits = /\d+/;
			const signed_integer = seq(optional(choice('-', '+')), decimal_digits);
			const exponent_part = seq(choice('e', 'E'));
			const decimal_integer_literal = choice(
				'0',
				seq(decimal_digits, optional(seq(optional('_'), decimal_digits))),
			);
			const decimal_literal = choice(
				seq(optional(choice('-', '+')), decimal_integer_literal, '.', optional(decimal_digits), optional(exponent_part)),
				seq('.', decimal_digits, optional(exponent_part)),
				seq(decimal_integer_literal, exponent_part),
				seq(decimal_digits),
			);
			return token(prec.left(choice(
				hex_literal,
				decimal_literal,
				signed_integer
			)));
		},

		member_expression: $ => prec('member', seq(
			field('object', choice($.expression, $.primary_expression)),
			'.',
			field('property', alias($.identifier, $.property_identifier)),
		)),
		nested_identifier: $ => prec('member', seq(
			field('object', choice($._identifier)),
			'.',
			field('property', alias($.identifier, $.property_identifier)),
		)),
		subscript_expression: $ => prec.right('member', seq(
			field('object', choice($.expression, $.primary_expression)),
			'[', field('index', $._expression), ']',
		)),
		parenthesized_expression: $ => seq(
			'(',
			$._expression,
			')',
		),
		call_expression: $ => choice(
			prec('call', seq(
				field('function', $.expression),
				field('arguments', $.arguments),
			)),
		),

		comment: _ => choice(
			token(choice(
				seq('//', /.*/),
				seq(
					'/*',
					/[^*]*\*+([^/*][^*]*\*+)*/,
					'/',
				),
			)),
		),
	}
});

/** stolen from FORTRAN xD */
function caseInsensitive (keyword, aliasAsWord = true) {
	let result = new RegExp(keyword
		.split('')
		.map(l => l !== l.toUpperCase() ? `[${l}${l.toUpperCase()}]` : l)
		.join('')
	)
	if (aliasAsWord) result = alias(result, keyword)
	return result
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @return {SeqRule}
 *
 */
function commaSep1(rule) {
	return seq(rule, repeat(seq(',', rule)));
}

/**
 * Creates a rule to optionally match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @return {ChoiceRule}
 *
 */
function commaSep(rule) {
	return optional(commaSep1(rule));
}